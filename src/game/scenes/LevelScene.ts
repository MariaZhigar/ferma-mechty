import Phaser from 'phaser';
import { balance } from '../../data/balance';
import { translate } from '../../i18n';
import { playBlip } from '../../platform/audio';
import type { CampaignProgress, Settings } from '../../platform/schema';
import { defaultProgress, defaultSettings } from '../../platform/schema';
import { loadProgress, saveProgress } from '../../platform/progressStorage';
import { readSafeArea } from '../../platform/safeArea';
import { loadSettings, saveSettings } from '../../platform/settingsStorage';
import { setActiveScene } from '../../platform/session';
import { clearLevel, recordWin, rememberLevel } from '../progress';
import { applyFieldTap, buyChicken, loadTruck, sendTruck } from '../sim/actions';
import { medalForWin } from '../sim/systems/goals';
import { createLevelState, truckCargo, warehouseUsed, type LevelState } from '../sim/state';
import { stepLevel } from '../sim/step';
import { createTextButton, type TextButton } from '../ui/textButton';
import { cellAt, layoutLevel, type LevelLayout } from '../view/levelLayout';
import { paintLevel } from '../view/levelView';
import { theme } from '../view/theme';

interface LevelBoot {
  state?: LevelState;
}

export class LevelScene extends Phaser.Scene {
  private state: LevelState = createLevelState();
  private settings: Settings = defaultSettings();
  private canPersistSettings = true;
  private progress: CampaignProgress = defaultProgress();
  private blockSave = false;
  private userPaused = false;
  private finished = false;
  private ready = false;
  private layoutData: LevelLayout | null = null;
  private fieldGfx!: Phaser.GameObjects.Graphics;
  private shade!: Phaser.GameObjects.Graphics;
  private blocker!: Phaser.GameObjects.Zone;
  private moneyText!: Phaser.GameObjects.Text;
  private timerText!: Phaser.GameObjects.Text;
  private goalText!: Phaser.GameObjects.Text;
  private warehouseText!: Phaser.GameObjects.Text;
  private chickenText!: Phaser.GameObjects.Text;
  private truckText!: Phaser.GameObjects.Text;
  private hintText!: Phaser.GameObjects.Text;
  private noticeText!: Phaser.GameObjects.Text;
  private pauseTitle!: Phaser.GameObjects.Text;
  private loadButton!: TextButton;
  private sendButton!: TextButton;
  private buyButton!: TextButton;
  private pauseButton!: TextButton;
  private resumeButton!: TextButton;
  private menuButton!: TextButton;
  private soundButton!: TextButton;
  private modeButton!: TextButton;
  private notice = '';
  private noticeUntil = 0;
  private lastSave = 0;

  constructor() {
    super('Level');
  }

  init(data: LevelBoot): void {
    this.state = data.state ?? createLevelState();
    this.userPaused = false;
    this.finished = false;
  }

  create(): void {
    setActiveScene('Level');
    const settings = loadSettings();
    if (settings.ok) {
      this.settings = settings.value;
      this.canPersistSettings = true;
    } else {
      this.settings = defaultSettings();
      this.canPersistSettings = false;
    }
    document.documentElement.lang = this.settings.language;
    void this.bootstrapProgress();

    this.cameras.main.setBackgroundColor('#7ec8ea');
    this.fieldGfx = this.add.graphics().setDepth(1);
    this.shade = this.add.graphics().setDepth(20);
    this.blocker = this.add.zone(0, 0, 10, 10).setDepth(25);
    this.blocker.disableInteractive();
    this.moneyText = this.makeText(12, 0, 0);
    this.timerText = this.makeText(12, 1, 0);
    this.goalText = this.makeText(11, 0, 0);
    this.warehouseText = this.makeText(11, 0, 0);
    this.chickenText = this.makeText(11, 0.5, 0);
    this.truckText = this.makeText(11, 1, 0);
    this.hintText = this.makeText(11, 0.5, 0.5);
    this.noticeText = this.makeText(14, 0.5, 0.5).setDepth(15);
    this.pauseTitle = this.makeText(18, 0.5, 0.5).setDepth(30);

    this.loadButton = createTextButton(this, '', () => this.runAction(loadTruck(this.state)), 10);
    this.sendButton = createTextButton(this, '', () => this.runAction(sendTruck(this.state)), 10);
    this.buyButton = createTextButton(this, '', () => this.runAction(buyChicken(this.state)), 10);
    this.pauseButton = createTextButton(this, '', () => this.setPaused(true), 10);
    this.resumeButton = createTextButton(this, '', () => this.setPaused(false), 30);
    this.menuButton = createTextButton(this, '', () => this.exitToMenu(), 30);
    this.soundButton = createTextButton(this, '', () => this.toggleSound(), 30);
    this.modeButton = createTextButton(this, '', () => this.toggleMode(), 30);

    this.layoutAll();
    this.sync();
    this.scale.on('resize', this.layoutAll, this);
    this.input.on('pointerdown', this.onPointer, this);
    document.addEventListener('visibilitychange', this.onVisibility);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.scale.off('resize', this.layoutAll, this);
      this.input.off('pointerdown', this.onPointer, this);
      document.removeEventListener('visibilitychange', this.onVisibility);
      for (const button of this.allButtons()) {
        button.destroy();
      }
    });
  }

  override update(time: number, delta: number): void {
    if (!this.ready || this.finished) {
      return;
    }
    if (!document.hidden && !this.userPaused) {
      const before = this.state.status;
      const hens = this.state.chickens.length;
      this.state = stepLevel(this.state, delta);
      if (this.state.chickens.length < hens) {
        this.notice = translate(this.settings.language, 'notice.chicken.died');
        this.noticeUntil = time + 2200;
      }
      if (before === 'playing' && this.state.status !== 'playing') {
        this.finish();
        return;
      }
      if (time - this.lastSave > 800) {
        this.persist();
        this.lastSave = time;
      }
    }
    if (time > this.noticeUntil) {
      this.notice = '';
    }
    this.sync();
  }

  private async bootstrapProgress(): Promise<void> {
    const loaded = await loadProgress();
    if (!loaded.ok && loaded.error === 'newer-schema') {
      this.blockSave = true;
      this.notice = translate(this.settings.language, 'save.newer');
      this.noticeUntil = Number.POSITIVE_INFINITY;
      this.ready = true;
      return;
    }
    if (loaded.ok) {
      this.progress = loaded.value;
    }
    this.ready = true;
  }

  private onPointer(pointer: Phaser.Input.Pointer, objects: Phaser.GameObjects.GameObject[]): void {
    if (!this.ready || this.userPaused || this.finished || !this.layoutData || objects.length > 0) {
      return;
    }
    const cell = cellAt(this.layoutData, pointer.x, pointer.y);
    if (!cell) {
      return;
    }
    this.runAction(applyFieldTap(this.state, cell.x, cell.y));
  }

  private runAction(result: { state: LevelState; notice?: string }): void {
    if (!this.ready || this.finished) {
      return;
    }
    const changed = result.state !== this.state;
    this.state = result.state;
    if (result.notice) {
      this.notice = translate(this.settings.language, result.notice);
      this.noticeUntil = this.time.now + 1400;
      if (changed && this.settings.soundEnabled) {
        playBlip(true);
      }
    }
    if (changed) {
      this.persist();
    }
    this.sync();
  }

  private setPaused(paused: boolean): void {
    this.userPaused = paused;
    this.state = { ...this.state, paused };
    if (paused) {
      this.persist();
    }
    this.sync();
  }

  private exitToMenu(): void {
    this.persist();
    this.scene.start('Menu');
  }

  private toggleSound(): void {
    this.settings = { ...this.settings, soundEnabled: !this.settings.soundEnabled };
    if (this.canPersistSettings) {
      saveSettings(this.settings);
    }
    this.sync();
  }

  private toggleMode(): void {
    this.settings = {
      ...this.settings,
      contentMode: this.settings.contentMode === 'kids' ? 'regular' : 'kids',
    };
    if (this.canPersistSettings) {
      saveSettings(this.settings);
    }
    this.notice = translate(this.settings.language, 'menu.mode.next');
    this.noticeUntil = this.time.now + 1800;
    this.sync();
  }

  private finish(): void {
    if (this.finished) {
      return;
    }
    this.finished = true;
    const medal = this.state.status === 'won' ? medalForWin(this.state.elapsedMs) : null;
    if (!this.blockSave) {
      this.progress =
        this.state.status === 'won' && medal
          ? recordWin(this.progress, this.state.levelId, medal)
          : clearLevel(this.progress);
      void saveProgress(this.progress);
    }
    this.scene.start('Result', {
      outcome: this.state.status,
      elapsedMs: this.state.elapsedMs,
      medal,
      contentMode: this.state.contentMode,
    });
  }

  private persist(): void {
    if (!this.ready || this.blockSave || this.state.status !== 'playing') {
      return;
    }
    this.progress = rememberLevel(this.progress, { ...this.state, paused: false });
    void saveProgress(this.progress);
  }

  private onVisibility = (): void => {
    if (document.hidden) {
      this.persist();
    }
  };

  private layoutAll = (): void => {
    const width = this.scale.width;
    const height = this.scale.height;
    if (width < 2 || height < 2) {
      return;
    }
    const layout = layoutLevel(width, height, readSafeArea(), this.state.cols, this.state.rows);
    this.layoutData = layout;
    const place = (button: TextButton, slot: LevelLayout['load'], font: number): void => {
      button.layout(slot.x, slot.y, slot.w, slot.h, font);
    };
    const font = layout.portrait ? 18 : 16;
    place(this.loadButton, layout.load, font);
    place(this.sendButton, layout.send, font);
    place(this.buyButton, layout.buy, font);
    place(this.pauseButton, layout.pause, font);
    this.moneyText.setPosition(layout.money.x, layout.money.y);
    this.timerText.setPosition(layout.timer.x, layout.timer.y);
    this.goalText.setPosition(layout.goal.x, layout.goal.y);
    this.warehouseText.setPosition(layout.warehouse.x, layout.warehouse.y);
    this.chickenText.setPosition(layout.chickens.x, layout.chickens.y);
    this.truckText.setPosition(layout.truck.x, layout.truck.y);
    this.hintText.setPosition(layout.hint.x, layout.hint.y);
    this.noticeText.setPosition(width / 2, layout.fieldY + layout.fieldH / 2);
    this.pauseTitle.setPosition(width / 2, height * 0.28);
    const pauseW = Math.min(280, width - 32);
    const pauseH = 52;
    const pauseX = width / 2;
    const pauseTop = height * 0.38;
    this.resumeButton.layout(pauseX, pauseTop, pauseW, pauseH, 20);
    this.menuButton.layout(pauseX, pauseTop + 62, pauseW, pauseH, 20);
    this.soundButton.layout(pauseX, pauseTop + 124, pauseW, pauseH, 18);
    this.modeButton.layout(pauseX, pauseTop + 186, pauseW, pauseH, 18);
    this.blocker.setPosition(width / 2, height / 2);
    this.blocker.setSize(width, height);
    this.sync();
  };

  private sync(): void {
    if (!this.layoutData) {
      return;
    }
    const locale = this.settings.language;
    paintLevel(this.fieldGfx, this.layoutData, this.state);
    const remaining = Math.max(0, balance.levelTimeMs - this.state.elapsedMs);
    this.moneyText.setText(translate(locale, 'hud.money', { amount: this.state.money }));
    this.timerText.setText(formatClock(remaining));
    this.goalText.setText(
      translate(locale, 'hud.goal', { sold: this.state.soldEggs, need: balance.goalSoldEggs }),
    );
    this.warehouseText.setText(
      translate(locale, 'hud.warehouse', {
        used: warehouseUsed(this.state),
        cap: balance.warehouseCapacity,
      }),
    );
    this.chickenText.setText(
      translate(locale, 'hud.chickens', { count: this.state.chickens.length }),
    );
    this.truckText.setText(
      this.state.truck.phase === 'away'
        ? translate(locale, 'hud.truck.away', {
            seconds: Math.ceil(this.state.truck.returnMs / 1000),
          })
        : translate(locale, 'hud.truck.idle', {
            cargo: truckCargo(this.state.truck),
            cap: balance.truckCapacity,
          }),
    );
    const gridBottom = this.layoutData.originY + this.layoutData.cell * this.layoutData.rows;
    const hintY = this.layoutData.originY - 16;
    const showHint =
      this.state.grass.length === 0 &&
      this.state.elapsedMs < 12000 &&
      hintY > this.layoutData.goal.y + 28 &&
      gridBottom < this.scale.height;
    this.hintText.setOrigin(0.5, 1);
    this.hintText.setPosition(
      this.layoutData.originX + (this.layoutData.cell * this.layoutData.cols) / 2,
      hintY,
    );
    this.hintText.setText(showHint ? translate(locale, 'hud.hint') : '');
    this.noticeText.setText(this.notice);
    this.loadButton.setLabel(translate(locale, 'hud.load'));
    this.sendButton.setLabel(translate(locale, 'hud.send'));
    this.buyButton.setLabel(translate(locale, 'hud.buy', { price: balance.chickenPrice }));
    this.pauseButton.setLabel(translate(locale, 'hud.pause'));
    this.resumeButton.setLabel(translate(locale, 'pause.resume'));
    this.menuButton.setLabel(translate(locale, 'pause.menu'));
    this.soundButton.setLabel(
      translate(locale, this.settings.soundEnabled ? 'menu.sound.on' : 'menu.sound.off'),
    );
    this.modeButton.setLabel(
      translate(
        locale,
        this.settings.contentMode === 'kids' ? 'menu.mode.kids' : 'menu.mode.regular',
      ),
    );
    this.pauseTitle.setText(translate(locale, 'pause.title'));
    const paused = this.userPaused;
    for (const button of [this.loadButton, this.sendButton, this.buyButton, this.pauseButton]) {
      button.setVisible(!paused);
    }
    for (const button of [this.resumeButton, this.menuButton, this.soundButton, this.modeButton]) {
      button.setVisible(paused);
    }
    this.pauseTitle.setVisible(paused);
    this.shade.clear();
    if (paused) {
      this.shade.fillStyle(0x3e2723, 0.45);
      this.shade.fillRect(0, 0, this.scale.width, this.scale.height);
      this.blocker.setInteractive();
      this.blocker.setVisible(true);
    } else {
      this.blocker.disableInteractive();
      this.blocker.setVisible(false);
    }
    const alignRight = this.layoutData.portrait;
    this.timerText.setOrigin(alignRight ? 1 : 1, 0);
    this.truckText.setOrigin(alignRight ? 1 : 0, 0);
    this.chickenText.setOrigin(alignRight ? 0.5 : 0, 0);
  }

  private makeText(size: number, originX: number, originY: number): Phaser.GameObjects.Text {
    return this.add
      .text(0, 0, '', {
        fontFamily: theme.fontFamily,
        fontSize: `${size}px`,
        fontStyle: 'bold',
        color: theme.ink,
      })
      .setOrigin(originX, originY)
      .setDepth(12);
  }

  private allButtons(): TextButton[] {
    return [
      this.loadButton,
      this.sendButton,
      this.buyButton,
      this.pauseButton,
      this.resumeButton,
      this.menuButton,
      this.soundButton,
      this.modeButton,
    ];
  }
}

function formatClock(ms: number): string {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}
