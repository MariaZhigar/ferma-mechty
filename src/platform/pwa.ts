import { translate } from '../i18n';
import type { LocaleId } from './schema';
import { getActiveScene } from './session';
import { updateAction } from './updatePolicy';

const UPDATE_MESSAGE = 'FERMA_UPDATE';

let hadPreviousWorker = false;
let reloadStarted = false;
let banner: HTMLElement | null = null;

/** Listen before the worker is registered, so the first update message is not missed. */
export function installUpdateListener(): void {
  if (!('serviceWorker' in navigator)) {
    return;
  }
  hadPreviousWorker = navigator.serviceWorker.controller !== null;
  navigator.serviceWorker.addEventListener('message', (event: MessageEvent<{ type?: string }>) => {
    if (event.data?.type !== UPDATE_MESSAGE) {
      return;
    }
    const port = event.ports[0];
    port?.postMessage({ ack: true });
    applyUpdate();
  });
}

export function registerPwa(): void {
  if (!('serviceWorker' in navigator)) {
    return;
  }
  const base = import.meta.env.BASE_URL;
  void navigator.serviceWorker.register(`${base}sw.js`, { scope: base }).catch(() => undefined);
}

/** When the player returns to the menu, apply an update that waited out the level. */
export function applyPendingPwaUpdate(): void {
  if (banner && updateAction(getActiveScene(), true) === 'reload') {
    reloadPage();
  }
}

function applyUpdate(): void {
  const action = updateAction(getActiveScene(), hadPreviousWorker);
  if (action === 'reload') {
    reloadPage();
    return;
  }
  if (action === 'banner') {
    showBanner();
  }
}

function showBanner(): void {
  banner ??= createBanner();
  const locale = bannerLocale(document.documentElement.lang);
  const text = banner.querySelector('p');
  const button = banner.querySelector('button');
  if (text) {
    text.textContent = translate(locale, 'update.available');
  }
  if (button) {
    button.textContent = translate(locale, 'update.action');
  }
  banner.hidden = false;
}

function createBanner(): HTMLElement {
  const element = document.createElement('div');
  element.id = 'update-banner';
  element.hidden = true;
  const text = document.createElement('p');
  const button = document.createElement('button');
  button.type = 'button';
  button.addEventListener('click', () => {
    reloadPage();
  });
  element.append(text, button);
  document.body.append(element);
  return element;
}

function reloadPage(): void {
  if (reloadStarted) {
    return;
  }
  reloadStarted = true;
  window.location.reload();
}

export function bannerLocale(lang: string): LocaleId {
  return lang === 'en' ? 'en' : 'ru';
}
