export type UpdateAction = 'ignore' | 'reload' | 'banner';

/** A new worker reloads the shell between runs and waits during a level. */
export function updateAction(scene: string, hadPreviousWorker: boolean): UpdateAction {
  if (!hadPreviousWorker) {
    return 'ignore';
  }
  if (scene === 'Level') {
    return 'banner';
  }
  return 'reload';
}

export function formatBuildLabel(version: string, commit: string): string {
  const short = commit.replace(/^v/, '').slice(0, 7);
  return `${version} · ${short}`;
}
