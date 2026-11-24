import '@fontsource/nunito/cyrillic-400.css';
import '@fontsource/nunito/cyrillic-700.css';
import '@fontsource/nunito/latin-400.css';
import '@fontsource/nunito/latin-700.css';
import Phaser from 'phaser';
import { createGame } from './game/createGame';
import { installGameInputGuards } from './game/input/guards';
import { installUpdateListener, registerPwa } from './platform/pwa';
import { loadSettings } from './platform/settingsStorage';
import './styles/global.css';

declare global {
  interface Window {
    __FERMA_GAME__?: Phaser.Game;
  }
}

installUpdateListener();

async function start(): Promise<void> {
  installGameInputGuards();
  const loaded = loadSettings();
  document.documentElement.lang = loaded.ok ? loaded.value.language : 'ru';
  await Promise.all([
    document.fonts.load('400 16px Nunito'),
    document.fonts.load('700 16px Nunito'),
  ]).catch(() => undefined);
  await document.fonts.ready;
  registerPwa();
  window.__FERMA_GAME__ = createGame('game');
}

window.__FERMA_GAME__?.destroy(true);
void start();
