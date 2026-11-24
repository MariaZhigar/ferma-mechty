import { registerSW } from 'virtual:pwa-register';
import { getActiveScene } from './session';

let updateServiceWorker: (reloadPage?: boolean) => Promise<void> = async () => {};
let updatePending = false;

/** Register the service worker. A waiting update reloads only from the menu, between runs. */
export function registerPwa(): void {
  updateServiceWorker = registerSW({
    immediate: true,
    onNeedRefresh() {
      if (getActiveScene() === 'Menu') {
        void updateServiceWorker(true);
        return;
      }
      updatePending = true;
    },
  });
}

export function applyPendingPwaUpdate(): void {
  if (!updatePending || getActiveScene() !== 'Menu') {
    return;
  }
  updatePending = false;
  void updateServiceWorker(true);
}
