import Phaser from 'phaser';
import { translate } from '../../i18n';
import type { ContentMode, Medal, Settings } from '../../platform/schema';
import { defaultProgress, defaultSettings } from '../../platform/schema';
import { loadProgress, saveProgress } from '../../platform/progressStorage';
import { readSafeArea } from '../../platform/safeArea';
import { loadSettings } from '../../platform/settingsStorage';
import { setActiveScene } from '../../platform/session';
import { rememberLevel } from '../progress';
import { createLevelState } from '../sim/state';
import { createTextButton, type TextButton } from '../ui/textButton';
import { paintBackdrop } from '../view/backdrop';
import { theme } from '../view/theme';

export interface ResultPayload {
  outcome: 'won' | 'lost';
  elapsedMs: number;
  medal: Medal | null;
  contentMode: ContentMode;
}

export class ResultScene extends Phaser.Scene {
  private payload: ResultPayload = {
    outcome: 'lost',
    elapsedMs: 0,
    medal: null,
    contentMode: 'kids',
  };
  private settings: Settings = defaultSettings();
  private backdrop!: Phaser.GameObjects.Graphics;
  private panel!: Phaser.GameObjects.Graphics;
  private title!: Phaser.GameObjects.Text;
  private detail!: Phaser.GameObjects.Text;
  private retryButton!: TextButton;
  private menuButton!: TextButton;

  constructor() {
    super('Result');
  }

  init(data: Partial<ResultPayload>): void {
    this.payload = {
      outcome: data.outcome === 'won' ? 'won' : 'lost',
      elapsedMs: data.elapsedMs ?? 0,
      medal: data.medal ?? null,
      contentMode: data.contentMode === 'regular' ? 'regular' : 'kids',
    };
  }

  create(): void {
    setActiveScene('Result');
    const settings = loadSettings();
    if (settings.ok) {
      this.settings = settings.value;
    }
    this.backdrop = this.add.graphics();
    this.panel = this.add.graphics().setDepth(2);
    this.title = this.add
      .text(0, 0, '', {
        fontFamily: theme.fontFamily,
        fontSize: '40px',
        fontStyle: 'bold',
        color: theme.ink,
        align: 'center',
      })
      .setOrigin(0.5)
      .setDepth(3);
    this.detail = this.add
      .text(0, 0, '', {
        fontFamily: theme.fontFamily,
        fontSize: '22px',
        color: theme.inkMuted,
        align: 'center',
      })
      .setOrigin(0.5)
      .setDepth(3);
    this.retryButton = createTextButton(this, '', () => {
      void this.retry();
    });
    this.menuButton = createTextButton(this, '', () => {
      this.scene.start('Menu');
    });
    this.layout();
    this.scale.on('resize', this.layout, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.scale.off('resize', this.layout, this);
      this.retryButton.destroy();
      this.menuButton.destroy();
    });
  }

  private async retry(): Promise<void> {
    const state = createLevelState(this.payload.contentMode);
    const loaded = await loadProgress();
    if (loaded.ok) {
      await saveProgress(rememberLevel(loaded.value, state));
    } else if (loaded.error !== 'newer-schema') {
      await saveProgress(rememberLevel(defaultProgress(), state));
    }
    this.scene.start('Level', { state });
  }

  private layout = (): void => {
    const width = this.scale.width;
    const height = this.scale.height;
    if (width < 2 || height < 2) {
      return;
    }
    const safe = readSafeArea();
    paintBackdrop(this.backdrop, width, height);
    const locale = this.settings.language;
    const panelW = Math.min(520, width - safe.left - safe.right - 32);
    const panelH = Math.min(380, height - safe.top - safe.bottom - 32);
    const panelX = (width - panelW) / 2;
    const panelY = (height - panelH) / 2;
    this.panel.clear();
    this.panel.fillStyle(theme.panelFill, 1);
    this.panel.lineStyle(4, theme.panelBorder, 1);
    this.panel.fillRoundedRect(panelX, panelY, panelW, panelH, 28);
    this.panel.strokeRoundedRect(panelX, panelY, panelW, panelH, 28);
    const medalKey =
      this.payload.medal === 'gold'
        ? 'result.medal.gold'
        : this.payload.medal === 'silver'
          ? 'result.medal.silver'
          : this.payload.medal === 'bronze'
            ? 'result.medal.bronze'
            : '';
    const medal = medalKey ? translate(locale, medalKey) : '';
    this.title.setText(
      translate(locale, this.payload.outcome === 'won' ? 'result.won' : 'result.lost'),
    );
    this.title.setFontSize(Math.min(42, panelW / 12));
    this.title.setWordWrapWidth(panelW - 32, true);
    this.title.setPosition(width / 2, panelY + panelH * 0.28);
    this.detail.setText(
      `${translate(locale, 'result.time', { time: formatClock(this.payload.elapsedMs) })}${medal ? `\n${medal}` : ''}`,
    );
    this.detail.setPosition(width / 2, panelY + panelH * 0.48);
    const buttonW = Math.min(240, panelW - 48);
    this.retryButton.setLabel(translate(locale, 'result.retry'));
    this.menuButton.setLabel(translate(locale, 'result.menu'));
    this.retryButton.layout(width / 2, panelY + panelH * 0.68, buttonW, 56, 20);
    this.menuButton.layout(width / 2, panelY + panelH * 0.86, buttonW, 56, 20);
  };
}

function formatClock(ms: number): string {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}
