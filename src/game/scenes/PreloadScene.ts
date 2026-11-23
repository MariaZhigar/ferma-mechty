import Phaser from 'phaser';
import { setActiveScene } from '../../platform/session';

/** Asset loading will live here. M0 has no external art, so the menu opens at once. */
export class PreloadScene extends Phaser.Scene {
  constructor() {
    super('Preload');
  }

  create(): void {
    setActiveScene('Preload');
    this.scene.start('Menu');
  }
}
