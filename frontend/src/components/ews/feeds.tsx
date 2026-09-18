'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { BellRing, Check, CheckCheck, Inbox, LoaderCircle, Smartphone } from 'lucide-react';
import { ews, type Alert, type NotificationRole, type OutboundNotification } from '@/lib/ews';
import { TierBadge } from './ui';
import { CHANNEL_LABEL, LANG_LABEL, TIER_BORDER, fmtDate } from './tiers';

const STATUS_STYLE: Record<Alert['status'], string> = {
  active: 'bg-red-600 text-white',
  acknowledged: 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200',
  resolved: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300',
};

export function AlertItem({ alert, allowResolve = false }: { alert: Alert; allowResolve?: boolean }) {
  const [busy, setBusy] = useState<'ack' | 'resolve' | null>(null);
  const [error, setError] = useState<string | null>(null);

  const act = async (kind: 'ack' | 'resolve') => {
    setBusy(kind);
    setError(null);
    try {
      await (kind === 'ack' ? ews.ackAlert(alert.id) : ews.resolveAlert(alert.id));
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(null);
    }
  };

  return (
    <article className={`rounded-xl border border-slate-200 dark:border-slate-800 border-l-4 ${TIER_BORDER[alert.tier]} bg-slate-50 dark:bg-slate-950/60 p-3.5 space-y-2`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <TierBadge tier={alert.tier} />
            <span className={`rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${STATUS_STYLE[alert.status]}`}>
              {alert.status}
            </span>
            <span className="text-[11px] text-slate-500 dark:text-slate-400">
              {fmtDate(alert.createdDate)}
              {alert.updatedDate !== alert.createdDate && ` · updated ${fmtDate(alert.updatedDate)}`}
            </span>
          </div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white leading-snug">{alert.title}</h3>
          <Link href={`/village/${encodeURIComponent(alert.villageId)}`} className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 hover:underline">
            {alert.villageName} ({alert.villageId}) →
          </Link>
        </div>
        <div className="flex flex-col gap-1.5 shrink-0">
          {alert.status === 'active' && (
            <button
              onClick={() => act('ack')}
              disabled={busy !== null}
              className="flex items-center gap-1 rounded-lg bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-2.5 py-1.5 text-xs font-bold hover:opacity-90 disabled:opacity-40"
            >
              {busy === 'ack' ? <LoaderCircle className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
              Ack
            </button>
          )}
          {allowResolve && alert.status !== 'resolved' && (
            <button
              onClick={() => act('resolve')}
              disabled={busy !== null}
              className="flex items-center gap-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white px-2.5 py-1.5 text-xs font-bold disabled:opacity-40"
            >
              {busy === 'resolve' ? <LoaderCircle className="w-3.5 h-3.5 animate-spin" /> : <CheckCheck className="w-3.5 h-3.5" />}
              Resolve
            </button>
          )}
        </div>
      </div>
      <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">{alert.message}</p>
      {alert.triggers.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {alert.triggers.map((t) => (
            <span key={t} className="rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 py-0.5 text-[11px] font-mono text-slate-700 dark:text-slate-200">
              {t}
            </span>
          ))}
        </div>
      )}
      {alert.audience.length > 0 && (
        <div className="text-[11px] text-slate-500 dark:text-slate-400">Notified: {alert.audience.join(' · ')}</div>
      )}
      {error && <p className="text-[11px] text-red-600 dark:text-red-400 break-all">{error}</p>}
    </article>
  );
}

const CHANNEL_ICON: Record<OutboundNotification['channel'], typeof Smartphone> = {
  push: Smartphone,
  in_app: Inbox,
};

const ROLE_STYLE: Record<NotificationRole, string> = {
  ASHA: 'bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300',
  PHC: 'bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300',
  DHO: 'bg-violet-100 text-violet-800 dark:bg-violet-950 dark:text-violet-300',
  Citizens: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300',
};

export function NotificationItem({ notification: n }: { notification: OutboundNotification }) {
  const Icon = CHANNEL_ICON[n.channel];
  const high = n.priority === 'high';
  return (
    <article
      className={`rounded-xl border p-3 space-y-1.5 ${
        high ? 'border-red-300 dark:border-red-900 bg-red-50 dark:bg-red-950/30' : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60'
      }`}
    >
      <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
        <span className="inline-flex items-center gap-1 rounded bg-slate-900 dark:bg-slate-700 text-white px-1.5 py-0.5 font-bold">
          <Icon className="w-3 h-3" />
          {CHANNEL_LABEL[n.channel]}
        </span>
        <span className={`rounded px-1.5 py-0.5 font-bold ${ROLE_STYLE[n.role]}`}>{n.role}</span>
        <span className="rounded border border-slate-300 dark:border-slate-700 px-1.5 py-0.5 font-semibold text-slate-600 dark:text-slate-300">
          {LANG_LABEL[n.language]}
        </span>
        {high && (
          <span className="inline-flex items-center gap-1 rounded bg-red-600 text-white px-1.5 py-0.5 font-bold uppercase">
            <BellRing className="w-3 h-3" />
            High priority
          </span>
        )}
        <span className="text-slate-500 dark:text-slate-400 truncate">→ {n.to}</span>
        <span className="ml-auto text-slate-400 tabular-nums">{fmtDate(n.date)}</span>
      </div>
      <div lang={n.language} className="space-y-0.5">
        <p className="text-sm font-bold text-slate-900 dark:text-white leading-snug">{n.title}</p>
        <p className="text-sm text-slate-700 dark:text-slate-200 leading-relaxed whitespace-pre-line">{n.body}</p>
      </div>
    </article>
  );
}
