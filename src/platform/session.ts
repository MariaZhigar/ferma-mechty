let activeScene = 'Boot';

export function setActiveScene(key: string): void {
  activeScene = key;
}

export function getActiveScene(): string {
  return activeScene;
}
