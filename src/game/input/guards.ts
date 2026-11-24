/** Block browser gestures that would scroll or zoom the page under the game. */
export function installGameInputGuards(): void {
  window.addEventListener('contextmenu', (event) => {
    event.preventDefault();
  });
  document.addEventListener(
    'touchmove',
    (event) => {
      event.preventDefault();
    },
    { passive: false },
  );
  document.addEventListener('gesturestart', (event) => {
    event.preventDefault();
  });
}
