import Phaser from 'phaser';
import { bindPress } from '../input/pointer';
import { theme } from '../view/theme';

export interface TextButton {
  setLabel(label: string): void;
  setSelected(selected: boolean): void;
  setEnabled(enabled: boolean): void;
  setVisible(visible: boolean): void;
  layout(centerX: number, centerY: number, width: number, height: number, fontSize: number): void;
  destroy(): void;
}

export function createTextButton(
  scene: Phaser.Scene,
  label: string,
  onPress: () => void,
  depth = 4,
): TextButton {
  const graphics = scene.add.graphics().setDepth(depth);
  const text = scene.add
    .text(0, 0, label, {
      fontFamily: theme.fontFamily,
      fontSize: '24px',
      fontStyle: 'bold',
      color: theme.ink,
      align: 'center',
    })
    .setOrigin(0.5)
    .setDepth(depth + 1);
  const zone = scene.add.zone(0, 0, 10, 10).setDepth(depth + 2);
  bindPress(zone, () => {
    if (enabled && visible) {
      onPress();
    }
  });

  let width = 160;
  let height = 64;
  let selected = false;
  let enabled = true;
  let visible = true;

  const draw = (): void => {
    graphics.clear();
    const fill = !enabled ? 0xe7e0d6 : selected ? theme.buttonSelected : theme.buttonFill;
    const border = !enabled ? 0xc8bfb2 : selected ? theme.buttonSelectedBorder : theme.buttonBorder;
    graphics.fillStyle(fill, 1);
    graphics.lineStyle(3, border, 1);
    graphics.fillRoundedRect(-width / 2, -height / 2, width, height, 18);
    graphics.strokeRoundedRect(-width / 2, -height / 2, width, height, 18);
    text.setColor(!enabled ? '#a89888' : selected ? theme.buttonSelectedText : theme.ink);
    zone.setPosition(graphics.x, graphics.y);
    // The zone origin is its center. Phaser adds that origin before the hit test,
    // so the default rectangle (0, 0, width, height) covers the whole button.
    zone.setSize(width, height);
    if (!zone.input) {
      zone.setInteractive({ useHandCursor: true });
    }
  };

  return {
    setLabel(next: string): void {
      text.setText(next);
    },
    setSelected(next: boolean): void {
      selected = next;
      draw();
    },
    setEnabled(next: boolean): void {
      enabled = next;
      draw();
    },
    setVisible(next: boolean): void {
      visible = next;
      graphics.setVisible(next);
      text.setVisible(next);
      zone.setVisible(next);
      if (next) {
        zone.setInteractive({ useHandCursor: true });
      } else {
        zone.disableInteractive();
      }
    },
    layout(
      centerX: number,
      centerY: number,
      nextWidth: number,
      nextHeight: number,
      fontSize: number,
    ): void {
      width = nextWidth;
      height = nextHeight;
      graphics.setPosition(centerX, centerY);
      text.setPosition(centerX, centerY);
      text.setFontSize(fontSize);
      text.setWordWrapWidth(nextWidth - 16, true);
      draw();
    },
    destroy(): void {
      graphics.destroy();
      text.destroy();
      zone.destroy();
    },
  };
}
