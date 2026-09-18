'use client';

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { isLanguage, type Language } from '@/lib/i18n';

const LOCAL_CHANGE = 'neernetra-local-storage';

function subscribeStorage(cb: () => void) {
  window.addEventListener('storage', cb);
  window.addEventListener(LOCAL_CHANGE, cb);
  return () => {
    window.removeEventListener('storage', cb);
    window.removeEventListener(LOCAL_CHANGE, cb);
  };
}

export function useStoredState(key: string, fallback: string): [string, (value: string) => void] {
  const value = useSyncExternalStore(
    subscribeStorage,
    () => localStorage.getItem(key) ?? fallback,
    () => fallback,
  );
  const set = useCallback(
    (next: string) => {
      localStorage.setItem(key, next);
      window.dispatchEvent(new Event(LOCAL_CHANGE));
    },
    [key],
  );
  return [value, set];
}

export function useLanguage(): [Language, (lang: Language) => void] {
  const [stored, setStored] = useStoredState('neernetra_lang', 'en');
  return [isLanguage(stored) ? stored : 'en', setStored];
}

function subscribeOnline(cb: () => void) {
  window.addEventListener('online', cb);
  window.addEventListener('offline', cb);
  return () => {
    window.removeEventListener('online', cb);
    window.removeEventListener('offline', cb);
  };
}

export function useNetworkOnline(): boolean {
  return useSyncExternalStore(subscribeOnline, () => navigator.onLine, () => true);
}

export function newClientId(): string {
  // randomUUID only exists in secure contexts; a phone hitting the dev server over LAN http has getRandomValues but not randomUUID.
  if (typeof crypto.randomUUID === 'function') return crypto.randomUUID();
  return Array.from(crypto.getRandomValues(new Uint8Array(16)), (b) => b.toString(16).padStart(2, '0')).join('');
}

export function pickVillage<T extends { id: string }>(villages: T[] | null | undefined, stored: string): string {
  if (!villages || villages.length === 0) return stored;
  return villages.some((v) => v.id === stored) ? stored : villages[0].id;
}

export type Notice = { tone: 'ok' | 'queued' | 'error'; text: string };

export function useNotice(ms = 4000): [Notice | null, (notice: Notice) => void] {
  const [notice, setNotice] = useState<Notice | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const flash = useCallback(
    (next: Notice) => {
      clearTimeout(timer.current);
      setNotice(next);
      timer.current = setTimeout(() => setNotice(null), ms);
    },
    [ms],
  );
  useEffect(() => () => clearTimeout(timer.current), []);
  return [notice, flash];
}
