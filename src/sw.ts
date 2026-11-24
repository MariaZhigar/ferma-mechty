/// <reference lib="webworker" />
import { cleanupOutdatedCaches, matchPrecache, precacheAndRoute } from 'workbox-precaching';
import { NavigationRoute, registerRoute } from 'workbox-routing';
import { NetworkFirst } from 'workbox-strategies';

declare const self: ServiceWorkerGlobalScope;

const UPDATE_MESSAGE = 'FERMA_UPDATE';
const ACK_MS = 400;

// Injected by vite-plugin-pwa. index.html is not in this list: navigations are network-first.
precacheAndRoute(self.__WB_MANIFEST);
cleanupOutdatedCaches();

const pages = new NetworkFirst({
  cacheName: 'ferma-pages',
  networkTimeoutSeconds: 3,
});

registerRoute(
  new NavigationRoute(async (options) => {
    try {
      return await pages.handle(options);
    } catch {
      const offline = await matchPrecache('offline.html');
      return offline ?? Response.error();
    }
  }),
);

self.addEventListener('install', () => {
  // Replace an already installed worker (M0/M1) without waiting for its tabs to close.
  void self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      await self.clients.claim();
      const windows = await self.clients.matchAll({
        type: 'window',
        includeUncontrolled: true,
      });
      await Promise.all(windows.map((client) => reloadIfUnaware(client)));
    })(),
  );
});

self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') {
    void self.skipWaiting();
  }
});

async function reloadIfUnaware(client: WindowClient): Promise<void> {
  const acknowledged = await waitForAck(client);
  if (acknowledged) {
    return;
  }
  // The open page is still the previous build and does not know this protocol.
  try {
    await client.navigate(client.url);
  } catch {
    // The page can still be refreshed by the visitor.
  }
}

function waitForAck(client: WindowClient): Promise<boolean> {
  return new Promise((resolve) => {
    const channel = new MessageChannel();
    const timer = setTimeout(() => resolve(false), ACK_MS);
    channel.port1.onmessage = (event: MessageEvent<{ ack?: boolean }>) => {
      if (event.data?.ack === true) {
        clearTimeout(timer);
        resolve(true);
      }
    };
    client.postMessage({ type: UPDATE_MESSAGE }, [channel.port2]);
  });
}
