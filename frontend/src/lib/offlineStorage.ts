/**
 * IndexedDB offline outbox for the ASHA field app.
 * Case reports and water tests captured without connectivity are stored here with their clientId,
 * then pushed to the NeerNetra engine on sync. The engine de-duplicates on clientId, so a retry
 * after a half-finished sync is safe.
 */

import { ews, type CaseReportInput, type WaterTestInput } from './ews';

const DB_NAME = 'neernetra_offline';
const DB_VERSION = 1;
const STORE_NAME = 'outbox';

export type QueuedItem =
  | { clientId: string; kind: 'report'; savedAt: string; payload: CaseReportInput }
  | { clientId: string; kind: 'water_test'; savedAt: string; payload: WaterTestInput };

export interface SyncResult {
  accepted: number;
  duplicates: number;
  waterTests: number;
  failed: number;
}

let dbPromise: Promise<IDBDatabase> | null = null;

function openDB(): Promise<IDBDatabase> {
  dbPromise ??= new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      if (!req.result.objectStoreNames.contains(STORE_NAME)) {
        req.result.createObjectStore(STORE_NAME, { keyPath: 'clientId' });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  return dbPromise;
}

async function transact<T>(mode: IDBTransactionMode, run: (store: IDBObjectStore) => IDBRequest<T> | void): Promise<T | undefined> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, mode);
    const req = run(tx.objectStore(STORE_NAME));
    tx.oncomplete = () => resolve(req ? req.result : undefined);
    tx.onerror = () => reject(tx.error);
  });
}

export async function queueReport(payload: CaseReportInput & { clientId: string }): Promise<void> {
  const item: QueuedItem = { clientId: payload.clientId, kind: 'report', savedAt: new Date().toISOString(), payload };
  await transact('readwrite', (store) => store.put(item));
}

export async function queueWaterTest(payload: WaterTestInput & { clientId: string }): Promise<void> {
  const item: QueuedItem = { clientId: payload.clientId, kind: 'water_test', savedAt: new Date().toISOString(), payload };
  await transact('readwrite', (store) => store.put(item));
}

export async function getQueued(): Promise<QueuedItem[]> {
  const items = (await transact<QueuedItem[]>('readonly', (store) => store.getAll())) ?? [];
  return items.sort((a, b) => a.savedAt.localeCompare(b.savedAt));
}

export async function countQueued(): Promise<number> {
  return (await transact<number>('readonly', (store) => store.count())) ?? 0;
}

async function removeQueued(clientIds: string[]): Promise<void> {
  if (clientIds.length === 0) return;
  await transact('readwrite', (store) => {
    clientIds.forEach((id) => store.delete(id));
  });
}

/** Sends reports in one batch (channel offline_sync) and water tests one by one. Anything that fails stays queued. */
export async function syncQueued(): Promise<SyncResult> {
  const items = await getQueued();
  const result: SyncResult = { accepted: 0, duplicates: 0, waterTests: 0, failed: 0 };
  const reports: CaseReportInput[] = [];
  const reportIds: string[] = [];
  const tests: { clientId: string; payload: WaterTestInput }[] = [];
  for (const item of items) {
    if (item.kind === 'report') {
      reports.push({ ...item.payload, channel: 'offline_sync' });
      reportIds.push(item.clientId);
    } else {
      tests.push(item);
    }
  }

  const sent: string[] = [];
  if (reports.length > 0) {
    try {
      const res = await ews.submitReports(reports);
      result.accepted = res.accepted;
      result.duplicates = res.duplicates;
      sent.push(...reportIds);
    } catch {
      result.failed += reports.length;
    }
  }
  for (const test of tests) {
    try {
      await ews.submitWaterTest(test.payload);
      result.waterTests += 1;
      sent.push(test.clientId);
    } catch {
      result.failed += 1;
    }
  }

  await removeQueued(sent);
  return result;
}
