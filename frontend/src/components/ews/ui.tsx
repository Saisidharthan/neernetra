'use client';

import React from 'react';
import { Ban, Droplet, Flame, LoaderCircle, Minus, ServerOff, TrendingDown, TrendingUp, TriangleAlert } from 'lucide-react';
import type { AdvisoryStatus, Tier } from '@/lib/ews';
import { ADVISORY_LABEL, TIER_BADGE, TIER_BAR, TIER_LABEL, pct } from './tiers';
import { useSim } from './SimProvider';

export function TierBadge({ tier, size = 'sm' }: { tier: Tier; size?: 'sm' | 'lg' }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-md border font-bold uppercase tracking-wide ${TIER_BADGE[tier]} ${
        size === 'lg' ? 'px-2.5 py-1 text-xs' : 'px-1.5 py-0.5 text-[10px]'
      }`}
    >
      <span className={`inline-block rounded-full ${TIER_BAR[tier]} ${size === 'lg' ? 'w-2 h-2' : 'w-1.5 h-1.5'}`} />
      {TIER_LABEL[tier]}
    </span>
  );
}

const ADVISORY_STYLE: Record<AdvisoryStatus, { icon: typeof Droplet; className: string }> = {
  safe: { icon: Droplet, className: 'text-cyan-600 dark:text-cyan-400 bg-cyan-50 dark:bg-cyan-950/60 border-cyan-200 dark:border-cyan-900' },
  boil: { icon: Flame, className: 'text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60 border-amber-200 dark:border-amber-900' },
  do_not_drink: { icon: Ban, className: 'text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-950/60 border-red-200 dark:border-red-900' },
};

export function AdvisoryIcon({ status, className = 'w-4 h-4' }: { status: AdvisoryStatus; className?: string }) {
  const { icon: Icon, className: tone } = ADVISORY_STYLE[status];
  return (
    <span title={ADVISORY_LABEL[status]} className={`inline-flex items-center justify-center rounded-md border p-1 ${tone}`}>
      <Icon className={className} aria-label={ADVISORY_LABEL[status]} />
    </span>
  );
}

export function AdvisoryBadge({ status }: { status: AdvisoryStatus }) {
  const { icon: Icon, className } = ADVISORY_STYLE[status];
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-bold ${className}`}>
      <Icon className="w-3.5 h-3.5" />
      {ADVISORY_LABEL[status]}
    </span>
  );
}

export function EarsChip({ flagged }: { flagged: boolean }) {
  if (!flagged) return null;
  return (
    <span
      title="CDC EARS statistical detector flagged a case-count aberration"
      className="rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide bg-violet-100 text-violet-800 border border-violet-300 dark:bg-violet-950/70 dark:text-violet-300 dark:border-violet-800"
    >
      EARS
    </span>
  );
}

export function RiskBar({ risk, tier, className = '' }: { risk: number; tier: Tier; className?: string }) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="flex-1 h-2 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
        <div className={`h-full rounded-full ${TIER_BAR[tier]}`} style={{ width: `${Math.max(2, risk * 100)}%` }} />
      </div>
      <span className="w-10 text-right text-xs font-bold tabular-nums text-slate-800 dark:text-slate-100">{pct(risk)}</span>
    </div>
  );
}

export function DeltaArrow({ delta }: { delta: number }) {
  const pts = Math.round(delta * 100);
  if (pts === 0) {
    return (
      <span className="inline-flex items-center gap-0.5 text-[11px] font-semibold text-slate-400 w-12 justify-end" title="No change since yesterday">
        <Minus className="w-3.5 h-3.5" />0
      </span>
    );
  }
  const up = pts > 0;
  const Icon = up ? TrendingUp : TrendingDown;
  return (
    <span
      className={`inline-flex items-center gap-0.5 text-[11px] font-bold tabular-nums w-12 justify-end ${
        up ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'
      }`}
      title={`${up ? '+' : ''}${pts} points since yesterday`}
    >
      <Icon className="w-3.5 h-3.5" />
      {up ? '+' : ''}
      {pts}
    </span>
  );
}

export function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <section className={`rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-md ${className}`}>
      {children}
    </section>
  );
}

export function CardHeader({
  icon: Icon,
  title,
  subtitle,
  right,
}: {
  icon: typeof Droplet;
  title: string;
  subtitle?: React.ReactNode;
  right?: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-3 px-5 pt-4 pb-3 border-b border-slate-100 dark:border-slate-800">
      <div className="min-w-0">
        <h2 className="flex items-center gap-2 text-base font-bold text-slate-900 dark:text-white">
          <Icon className="w-4.5 h-4.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
          {title}
        </h2>
        {subtitle && <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{subtitle}</p>}
      </div>
      {right}
    </div>
  );
}

export const BACKEND_CMD = './dev.sh';
export const BACKEND_ONLY_CMD = 'cd backend && .venv/bin/uvicorn app.main:app --port 8000';

export function EngineOffline({ error }: { error?: string | null }) {
  return (
    <div className="mx-auto max-w-2xl my-10 rounded-2xl border border-red-300 dark:border-red-900 bg-red-50 dark:bg-red-950/40 p-8 text-center space-y-4">
      <ServerOff className="w-10 h-10 mx-auto text-red-500" />
      <h2 className="text-2xl font-black text-red-700 dark:text-red-300">Engine offline — start the backend</h2>
      <p className="text-sm text-slate-700 dark:text-slate-300">
        NeerNetra shows only real engine output. There is no mock fallback, so nothing is displayed until the early-warning
        engine answers on <code className="font-mono">:8000</code>.
      </p>
      <div className="space-y-1 text-xs text-slate-600 dark:text-slate-400">
        <div>
          From the repo root (starts backend + frontend):{' '}
          <code className="rounded bg-slate-900 text-emerald-300 px-2 py-1 font-mono">{BACKEND_CMD}</code>
        </div>
        <div>
          Backend alone: <code className="rounded bg-slate-900 text-emerald-300 px-2 py-1 font-mono">{BACKEND_ONLY_CMD}</code>
        </div>
      </div>
      {error && <p className="text-[11px] font-mono text-slate-500 break-all">{error}</p>}
    </div>
  );
}

export function EngineLoading({ label = 'Connecting to the early-warning engine…' }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-2 py-24 text-sm text-slate-500 dark:text-slate-400">
      <LoaderCircle className="w-5 h-5 animate-spin text-emerald-500" />
      {label}
    </div>
  );
}

export function EngineGate({ error }: { error: string | null }) {
  const { state, error: simError } = useSim();
  if (!error) return <EngineLoading />;
  if (state && !simError) {
    return (
      <div className="mx-auto max-w-2xl my-10 rounded-2xl border border-amber-300 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/40 p-8 text-center space-y-3">
        <TriangleAlert className="w-10 h-10 mx-auto text-amber-500" />
        <h2 className="text-xl font-black text-amber-800 dark:text-amber-200">The engine is up, but this request failed</h2>
        <p className="text-[11px] font-mono text-slate-600 dark:text-slate-400 break-all">{error}</p>
      </div>
    );
  }
  return <EngineOffline error={error} />;
}
