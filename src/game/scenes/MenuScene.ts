import Phaser from 'phaser';
import { translate } from '../../i18n';
import { applyPendingPwaUpdate } from '../../platform/pwa';
import type { CampaignProgress, ContentMode, LocaleId, Settings } from '../../platform/schema';
import { defaultProgress, defaultSettings } from '../../platform/schema';
import { loadProgress, saveProgress } from '../../platform/progressStorage';
import { readSafeArea } from '../../platform/safeArea';
import { loadSettings, saveSettings } from '../../platform/settingsStorage';
import { setActiveScene } from '../../platform/session';
import { rememberLevel } from '../progress';
import { resumableLevel } from '../sim/persist';
import { createLevelState, type LevelState } from '../sim/state';
import { createTextButton, type TextButton } from '../ui/textButton';
import { paintBackdrop } from '../view/backdrop';
import { theme } from '../view/theme';

export class MenuScene extends Phaser.Scene {
  private settings: Settings = defaultSettings();
  private progress: CampaignProgress = defaultProgress();
  private canPersistSettings = true;
  private blockProgress = false;
  private confirmNew = false;
  private savedLevel: LevelState | null = null;
  private backdrop!: Phaser.GameObjects.Graphics;
  private panel!: Phaser.GameObjects.Graphics;
  private title!: Phaser.GameObjects.Text;
  private tagline!: Phaser.GameObjects.Text;
  private hint!: Phaser.GameObjects.Text;
  private continueButton!: TextButton;
  private newButton!: TextButton;
  private soundButton!: TextButton;
  private modeButton!: TextButton;
  private russianButton!: TextButton;
  private englishButton!: TextButton;

  constructor() {
    super('Menu');
  }

  create(): void {
    setActiveScene('Menu');
    applyPendingPwaUpdate();
    this.readSettings();
    this.backdrop = this.add.graphics().setDepth(0);
    this.panel = this.add.graphics().setDepth(2);
    this.title = this.makeText(theme.ink, 'bold').setDepth(3);
    this.tagline = this.makeText(theme.inkMuted, 'bold').setDepth(3);
    this.hint = this.makeText(theme.inkMuted, 'normal').setDepth(3);
    this.continueButton = createTextButton(this, '', () => {
      this.confirmNew = false;
      if (this.savedLevel) {
        this.scene.start('Level', { state: this.savedLevel });
      }
    });
    this.newButton = createTextButton(this, '', () => {
      void this.startNewGame();
    });
    this.soundButton = createTextButton(this, '', () => {
      this.confirmNew = false;
      this.settings = { ...this.settings, soundEnabled: !this.settings.soundEnabled };
      this.persistSettings();
      this.applyCopy();
    });
    this.modeButton = createTextButton(this, '', () => {
      this.confirmNew = false;
      const contentMode: ContentMode = this.settings.contentMode === 'kids' ? 'regular' : 'kids';
      this.settings = { ...this.settings, contentMode };
      this.persistSettings();
      this.applyCopy();
    });
    this.russianButton = createTextButton(this, '', () => {
      this.chooseLanguage('ru');
    });
    this.englishButton = createTextButton(this, '', () => {
      this.chooseLanguage('en');
    });
    this.applyCopy();
    this.layout();
    void this.readProgress();
    this.scale.on('resize', this.layout, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.scale.off('resize', this.layout, this);
      for (const button of this.buttons()) {
        button.destroy();
      }
    });
  }

  private readSettings(): void {
    const loaded = loadSettings();
    if (!loaded.ok) {
      this.settings = defaultSettings();
      this.canPersistSettings = false;
      return;
    }
    this.settings = loaded.value;
    this.canPersistSettings = true;
    document.documentElement.lang = loaded.value.language;
  }

  private async readProgress(): Promise<void> {
    const loaded = await loadProgress();
    if (!loaded.ok) {
      this.blockProgress = loaded.error === 'newer-schema';
      this.savedLevel = null;
      this.applyCopy();
      this.layout();
      return;
    }
    this.progress = loaded.value;
    this.savedLevel = loaded.value.activeLevel
      ? resumableLevel(loaded.value.activeLevel.state)
      : null;
    this.applyCopy();
    this.layout();
  }

  private async startNewGame(): Promise<void> {
    if (this.blockProgress) {
      return;
    }
    if (this.savedLevel && !this.confirmNew) {
      this.confirmNew = true;
      this.applyCopy();
      return;
    }
    const state = createLevelState(this.settings.contentMode);
    this.progress = rememberLevel(this.progress, state);
    await saveProgress(this.progress);
    this.scene.start('Level', { state });
  }

  private chooseLanguage(language: LocaleId): void {
    this.confirmNew = false;
    if (this.settings.language === language) {
      return;
    }
    this.settings = { ...this.settings, language };
    document.documentElement.lang = language;
    this.persistSettings();
    this.applyCopy();
    this.layout();
  }

  private persistSettings(): void {
    if (this.canPersistSettings) {
      saveSettings(this.settings);
    }
  }

  private applyCopy(): void {
    const locale = this.settings.language;
    this.title.setText(translate(locale, 'menu.title'));
    this.tagline.setText(translate(locale, 'menu.tagline'));
    this.hint.setText(
      translate(
        locale,
        this.blockProgress || !this.canPersistSettings
          ? 'save.newer'
          : this.confirmNew
            ? 'menu.confirmNew'
            : 'menu.saved',
      ),
    );
    this.continueButton.setLabel(translate(locale, 'menu.continue'));
    this.newButton.setLabel(translate(locale, 'menu.newGame'));
    this.soundButton.setLabel(
      translate(locale, this.settings.soundEnabled ? 'menu.sound.on' : 'menu.sound.off'),
    );
    this.modeButton.setLabel(
      translate(
        locale,
        this.settings.contentMode === 'kids' ? 'menu.mode.kids' : 'menu.mode.regular',
      ),
    );
    this.modeButton.setSelected(this.settings.contentMode === 'regular');
    this.russianButton.setLabel(translate(locale, 'menu.language.ru'));
    this.englishButton.setLabel(translate(locale, 'menu.language.en'));
    this.russianButton.setSelected(locale === 'ru');
    this.englishButton.setSelected(locale === 'en');
    this.continueButton.setEnabled(this.savedLevel !== null && !this.blockProgress);
    this.newButton.setEnabled(!this.blockProgress);
  }

  private layout = (): void => {
    const width = this.scale.width;
    const height = this.scale.height;
    if (width < 2 || height < 2) {
      return;
    }
    const safe = readSafeArea();
    paintBackdrop(this.backdrop, width, height);
    const compact = height < 640;
    const panelWidth = Math.min(compact ? 680 : 560, width - safe.left - safe.right - 24);
    const panelHeight = Math.min(compact ? height - 24 : 640, height - safe.top - safe.bottom - 24);
    const panelX = safe.left + (width - safe.left - safe.right - panelWidth) / 2;
    const panelY = Math.max(safe.top + 8, (height - panelHeight) / 2);
    this.panel.clear();
    this.panel.fillStyle(0x000000, 0.06);
    this.panel.fillRoundedRect(panelX + 4, panelY + 8, panelWidth, panelHeight, 28);
    this.panel.fillStyle(theme.panelFill, 1);
    this.panel.lineStyle(4, theme.panelBorder, 1);
    this.panel.fillRoundedRect(panelX, panelY, panelWidth, panelHeight, 28);
    this.panel.strokeRoundedRect(panelX, panelY, panelWidth, panelHeight, 28);

    const centerX = panelX + panelWidth / 2;
    const titleSize = compact ? 32 : Math.round(Math.min(64, panelWidth / 10));
    this.title.setFontSize(titleSize);
    this.tagline.setFontSize(compact ? 16 : 22);
    this.hint.setFontSize(compact ? 14 : 16);
    for (const line of [this.title, this.tagline, this.hint]) {
      line.setWordWrapWidth(panelWidth - 36, true);
    }
    this.title.setPosition(centerX, panelY + (compact ? 28 : 52));
    this.tagline.setPosition(centerX, panelY + (compact ? 58 : 100));
    this.hint.setPosition(centerX, panelY + panelHeight - (compact ? 22 : 28));

    const gap = 10;
    const buttonH = compact ? 48 : 56;
    const font = compact ? 16 : 20;
    const top = panelY + (compact ? 112 : 168);
    if (compact) {
      const buttonW = (panelWidth - 36 - gap) / 2;
      const left = centerX - (buttonW + gap) / 2;
      const right = centerX + (buttonW + gap) / 2;
      this.continueButton.layout(left, top, buttonW, buttonH, font);
      this.newButton.layout(right, top, buttonW, buttonH, font);
      this.soundButton.layout(left, top + buttonH + gap, buttonW, buttonH, font);
      this.modeButton.layout(right, top + buttonH + gap, buttonW, buttonH, font);
      this.russianButton.layout(left, top + (buttonH + gap) * 2, buttonW, buttonH, font);
      this.englishButton.layout(right, top + (buttonH + gap) * 2, buttonW, buttonH, font);
      return;
    }
    const buttonW = Math.min(320, panelWidth - 48);
    const stack = [this.continueButton, this.newButton, this.soundButton, this.modeButton];
    stack.forEach((button, index) => {
      button.layout(centerX, top + index * (buttonH + gap), buttonW, buttonH, font);
    });
    const langY = top + stack.length * (buttonH + gap);
    this.russianButton.layout(
      centerX - (buttonW / 2 + gap) / 2,
      langY,
      (buttonW - gap) / 2,
      buttonH,
      font,
    );
    this.englishButton.layout(
      centerX + (buttonW / 2 + gap) / 2,
      langY,
      (buttonW - gap) / 2,
      buttonH,
      font,
    );
  };

  private makeText(color: string, fontStyle: string): Phaser.GameObjects.Text {
    return this.add
      .text(0, 0, '', {
        fontFamily: theme.fontFamily,
        fontSize: '24px',
        fontStyle,
        color,
        align: 'center',
      })
      .setOrigin(0.5);
  }

  private buttons(): TextButton[] {
    return [
      this.continueButton,
      this.newButton,
      this.soundButton,
      this.modeButton,
      this.russianButton,
      this.englishButton,
    ];
  }
}
