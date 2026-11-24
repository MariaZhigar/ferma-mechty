import Phaser from 'phaser';
import { BootScene } from './scenes/BootScene';
import { CampaignScene } from './scenes/CampaignScene';
import { LevelScene } from './scenes/LevelScene';
import { MenuScene } from './scenes/MenuScene';
import { PauseScene } from './scenes/PauseScene';
import { PreloadScene } from './scenes/PreloadScene';
import { ResultScene } from './scenes/ResultScene';
import { SettingsScene } from './scenes/SettingsScene';

export function createGame(parent: string): Phaser.Game {
  return new Phaser.Game({
    type: Phaser.AUTO,
    parent,
    backgroundColor: '#7ec8ea',
    banner: false,
    scale: {
      mode: Phaser.Scale.RESIZE,
      autoCenter: Phaser.Scale.CENTER_BOTH,
      width: window.innerWidth,
      height: window.innerHeight,
    },
    input: {
      activePointers: 2,
    },
    scene: [
      BootScene,
      PreloadScene,
      MenuScene,
      CampaignScene,
      LevelScene,
      PauseScene,
      ResultScene,
      SettingsScene,
    ],
  });
}
