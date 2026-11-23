import Phaser from 'phaser';

export function bindPress(target: Phaser.GameObjects.GameObject, onPress: () => void): void {
  target.on('pointerdown', () => {
    target.setData('pressed', true);
  });
  target.on('pointerup', () => {
    const pressed = target.getData('pressed') === true;
    target.setData('pressed', false);
    if (pressed) {
      onPress();
    }
  });
  target.on('pointerout', () => {
    target.setData('pressed', false);
  });
}
