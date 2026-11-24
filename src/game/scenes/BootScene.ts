import Phaser from 'phaser';
import { setActiveScene } from '../../platform/session';

export class BootScene extends Phaser.Scene {
  constructor() {
    super('Boot');
  }

  create(): void {
    setActiveScene('Boot');
    this.scene.start('Preload');
  }
}
