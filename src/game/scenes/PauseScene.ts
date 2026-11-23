import Phaser from 'phaser';

/** Pause freezes the simulation clock. Content-mode changes apply on the next attempt. Built in M1. */
export class PauseScene extends Phaser.Scene {
  constructor() {
    super('Pause');
  }
}
