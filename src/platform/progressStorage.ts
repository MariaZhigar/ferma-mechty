import { parseProgress, SCHEMA_VERSION, type CampaignProgress, type LoadResult } from './schema';

const DB_NAME = 'ferma-mechty';
const DB_VERSION = 1;
const STORE = 'progress';
const KEY = 'campaign';

export type ProgressResult =
  { ok: true; value: CampaignProgress } | { ok: false; error: 'newer-schema' | 'unavailable' };

export async function loadProgress(): Promise<ProgressResult> {
  try {
    const raw = await readRecord();
    return persistParsed(parseProgress(raw), raw == null);
  } catch {
    return { ok: false, error: 'unavailable' };
  }
}

export async function saveProgress(progress: CampaignProgress): Promise<ProgressResult> {
  const stored: CampaignProgress = { ...progress, schemaVersion: SCHEMA_VERSION };
  try {
    await writeRecord(stored);
    return { ok: true, value: stored };
  } catch {
    return { ok: false, error: 'unavailable' };
  }
}

async function persistParsed(
  parsed: LoadResult<CampaignProgress>,
  missing: boolean,
): Promise<ProgressResult> {
  if (!parsed.ok) {
    return parsed;
  }
  if (missing || parsed.migrated) {
    await writeRecord(parsed.value);
  }
  return { ok: true, value: parsed.value };
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('indexedDB.open failed'));
  });
}

async function readRecord(): Promise<unknown> {
  const db = await openDb();
  try {
    return await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, 'readonly');
      const request = tx.objectStore(STORE).get(KEY);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error ?? new Error('indexedDB.get failed'));
    });
  } finally {
    db.close();
  }
}

async function writeRecord(value: CampaignProgress): Promise<void> {
  const db = await openDb();
  try {
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE, 'readwrite');
      const request = tx.objectStore(STORE).put(value, KEY);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error ?? new Error('indexedDB.put failed'));
    });
  } finally {
    db.close();
  }
}
