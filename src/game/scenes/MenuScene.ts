import Phaser from 'phaser';
import { translate } from '../../i18n';
import { applyPendingPwaUpdate } from '../../platform/pwa';
import type { LocaleId, Settings } from '../../platform/schema';
import { defaultSettings } from '../../platform/schema';
import { loadSettings, saveSettings } from '../../platform/settingsStorage';
import { setActiveScene } from '../../platform/session';
import { paintBackdrop } from '../view/backdrop';
import { theme } from '../view/theme';
import { createTextButton, type TextButton } from '../ui/textButton';

interface SafeArea {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

export class MenuScene extends Phaser.Scene {
  private settings: Settings = defaultSettings();
  private canPersist = true;
  private newerSave = false;
  private backdrop!: Phaser.GameObjects.Graphics;
  private panel!: Phaser.GameObjects.Graphics;
  private title!: Phaser.GameObjects.Text;
  private tagline!: Phaser.GameObjects.Text;
  private mode!: Phaser.GameObjects.Text;
  private hint!: Phaser.GameObjects.Text;
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
    this.mode = this.makeText(theme.ink, 'bold').setDepth(3);
    this.hint = this.makeText(theme.inkMuted, 'normal').setDepth(3);
    this.russianButton = createTextButton(this, '', () => {
      this.chooseLanguage('ru');
    });
    this.englishButton = createTextButton(this, '', () => {
      this.chooseLanguage('en');
    });

    this.applyCopy();
    this.layout();
    this.scale.on('resize', this.layout, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.scale.off('resize', this.layout, this);
      this.russianButton.destroy();
      this.englishButton.destroy();
    });
  }

  private readSettings(): void {
    const loaded = loadSettings();
    if (!loaded.ok) {
      this.settings = defaultSettings();
      this.canPersist = false;
      this.newerSave = true;
      return;
    }
    this.settings = loaded.value;
    this.canPersist = true;
    this.newerSave = false;
    document.documentElement.lang = loaded.value.language;
  }

  private chooseLanguage(language: LocaleId): void {
    if (this.settings.language === language) {
      return;
    }
    this.settings = { ...this.settings, language };
    document.documentElement.lang = language;
    if (this.canPersist) {
      saveSettings(this.settings);
    }
    this.applyCopy();
    this.layout();
  }

  private applyCopy(): void {
    const locale = this.settings.language;
    this.title.setText(translate(locale, 'menu.title'));
    this.tagline.setText(translate(locale, 'menu.tagline'));
    const modeKey = this.settings.contentMode === 'kids' ? 'menu.mode.kids' : 'menu.mode.regular';
    this.mode.setText(translate(locale, modeKey));
    this.hint.setText(translate(locale, this.newerSave ? 'save.newer' : 'menu.saved'));
    this.russianButton.setLabel(translate(locale, 'menu.language.ru'));
    this.englishButton.setLabel(translate(locale, 'menu.language.en'));
    this.russianButton.setSelected(locale === 'ru');
    this.englishButton.setSelected(locale === 'en');
  }

  private layout = (): void => {
    const width = this.scale.width;
    const height = this.scale.height;
    if (width < 2 || height < 2) {
      return;
    }
    const safe = readSafeArea();
    paintBackdrop(this.backdrop, width, height);

    const panelWidth = Math.min(640, width - safe.left - safe.right - 32);
    const panelHeight = Math.min(430, Math.max(300, height - safe.top - safe.bottom - 48));
    const panelX = safe.left + (width - safe.left - safe.right - panelWidth) / 2;
    const panelY = Math.max(
      safe.top + 16,
      Math.min(height * 0.14, height - safe.bottom - panelHeight - 16),
    );

    this.panel.clear();
    this.panel.fillStyle(0x000000, 0.06);
    this.panel.fillRoundedRect(panelX + 4, panelY + 8, panelWidth, panelHeight, 28);
    this.panel.fillStyle(theme.panelFill, 1);
    this.panel.lineStyle(4, theme.panelBorder, 1);
    this.panel.fillRoundedRect(panelX, panelY, panelWidth, panelHeight, 28);
    this.panel.strokeRoundedRect(panelX, panelY, panelWidth, panelHeight, 28);

    const centerX = panelX + panelWidth / 2;
    const titleSize = Math.round(Math.min(68, Math.max(34, panelWidth / 9)));
    const bodySize = Math.round(Math.min(26, Math.max(16, panelWidth / 24)));
    this.title.setFontSize(titleSize);
    this.tagline.setFontSize(bodySize);
    this.mode.setFontSize(bodySize);
    this.hint.setFontSize(Math.max(14, bodySize - 4));
    for (const line of [this.title, this.tagline, this.mode, this.hint]) {
      line.setWordWrapWidth(panelWidth - 48, true);
    }

    this.title.setPosition(centerX, panelY + panelHeight * 0.22);
    this.tagline.setPosition(centerX, panelY + panelHeight * 0.38);
    this.mode.setPosition(centerX, panelY + panelHeight * 0.74);
    this.hint.setPosition(centerX, panelY + panelHeight * 0.86);

    const gap = 16;
    const buttonWidth = Math.min(220, (panelWidth - 56 - gap) / 2);
    const buttonHeight = Math.max(64, Math.min(72, panelHeight * 0.16));
    const buttonFont = buttonWidth < 170 ? 20 : 24;
    const buttonY = panelY + panelHeight * 0.56;
    this.russianButton.layout(
      centerX - (buttonWidth + gap) / 2,
      buttonY,
      buttonWidth,
      buttonHeight,
      buttonFont,
    );
    this.englishButton.layout(
      centerX + (buttonWidth + gap) / 2,
      buttonY,
      buttonWidth,
      buttonHeight,
      buttonFont,
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
}

function readSafeArea(): SafeArea {
  const probe = document.createElement('div');
  probe.style.position = 'fixed';
  probe.style.left = '0';
  probe.style.top = '0';
  probe.style.visibility = 'hidden';
  probe.style.pointerEvents = 'none';
  probe.style.paddingTop = 'env(safe-area-inset-top)';
  probe.style.paddingRight = 'env(safe-area-inset-right)';
  probe.style.paddingBottom = 'env(safe-area-inset-bottom)';
  probe.style.paddingLeft = 'env(safe-area-inset-left)';
  document.body.append(probe);
  const style = getComputedStyle(probe);
  const area = {
    top: parseFloat(style.paddingTop) || 0,
    right: parseFloat(style.paddingRight) || 0,
    bottom: parseFloat(style.paddingBottom) || 0,
    left: parseFloat(style.paddingLeft) || 0,
  };
  probe.remove();
  return area;
}
