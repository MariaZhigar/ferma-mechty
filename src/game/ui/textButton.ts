import Phaser from 'phaser';
import { bindPress } from '../input/pointer';
import { theme } from '../view/theme';

export interface TextButton {
  setLabel(label: string): void;
  setSelected(selected: boolean): void;
  layout(centerX: number, centerY: number, width: number, height: number, fontSize: number): void;
  destroy(): void;
}

export function createTextButton(
  scene: Phaser.Scene,
  label: string,
  onPress: () => void,
): TextButton {
  const graphics = scene.add.graphics().setDepth(4);
  const text = scene.add
    .text(0, 0, label, {
      fontFamily: theme.fontFamily,
      fontSize: '24px',
      fontStyle: 'bold',
      color: theme.ink,
      align: 'center',
    })
    .setOrigin(0.5)
    .setDepth(5);
  const zone = scene.add.zone(0, 0, 10, 10).setDepth(6);
  bindPress(zone, onPress);

  let width = 160;
  let height = 64;
  let selected = false;

  const draw = (): void => {
    graphics.clear();
    graphics.fillStyle(selected ? theme.buttonSelected : theme.buttonFill, 1);
    graphics.lineStyle(3, selected ? theme.buttonSelectedBorder : theme.buttonBorder, 1);
    graphics.fillRoundedRect(-width / 2, -height / 2, width, height, 18);
    graphics.strokeRoundedRect(-width / 2, -height / 2, width, height, 18);
    text.setColor(selected ? theme.buttonSelectedText : theme.ink);
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
