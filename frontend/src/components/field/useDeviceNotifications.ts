'use client';

import { useCallback, useEffect, useSyncExternalStore } from 'react';
import type { OutboundNotification } from '@/lib/ews';

export type DeviceNotifyStatus = 'unsupported' | NotificationPermission;

const PERMISSION_CHANGE = 'neernetra-notification-permission';
let constructorBlocked = false;

function subscribe(cb: () => void) {
  window.addEventListener(PERMISSION_CHANGE, cb);
  return () => window.removeEventListener(PERMISSION_CHANGE, cb);
}

function getStatus(): DeviceNotifyStatus {
  if (constructorBlocked || !('Notification' in window)) return 'unsupported';
  return Notification.permission;
}

function show(n: OutboundNotification) {
  try {
    new Notification(n.title, { body: n.body, tag: `neernetra-${n.id}`, lang: n.language });
  } catch {
    // Android Chrome refuses `new Notification` and only shows them via a service worker registration.
    constructorBlocked = true;
    window.dispatchEvent(new Event(PERMISSION_CHANGE));
  }
}

/**
 * Raises a device notification for each new `push` notification in `items` (newest first, as the API returns them).
 * The last id seen per `scope` is kept in localStorage, so a reload or a second tab does not repeat old ones.
 * The first time a scope is seen it only records a baseline; a sim reset (ids going backwards) re-baselines.
 */
export function useDeviceNotifications(items: OutboundNotification[] | null | undefined, scope: string) {
  const status = useSyncExternalStore<DeviceNotifyStatus>(subscribe, getStatus, () => 'default');

  const enable = useCallback(() => {
    Notification.requestPermission().then(() => window.dispatchEvent(new Event(PERMISSION_CHANGE)));
  }, []);

  useEffect(() => {
    if (status !== 'granted' || !items || !scope) return;
    const key = `neernetra_seen_notification:${scope}`;
    const stored = localStorage.getItem(key);
    const lastSeen = stored === null ? null : Number(stored);
    const maxId = items.reduce((max, n) => Math.max(max, n.id), 0);
    if (lastSeen !== null && maxId >= lastSeen) {
      items
        .filter((n) => n.channel === 'push' && n.id > lastSeen)
        .reverse()
        .forEach(show);
    }
    localStorage.setItem(key, String(maxId));
  }, [items, scope, status]);

  return { status, enable };
}
