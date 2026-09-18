'use client';

import type { ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Ban, CircleCheck, CircleCheckBig, CookingPot, Flame, GlassWater } from 'lucide-react';
import type { Advisory, AdvisoryStatus } from '@/lib/ews';

export const ADVISORY_STYLE: Record<AdvisoryStatus, { labelKey: string; card: string; chip: string }> = {
  safe: {
    labelKey: 'advisory_safe',
    card: 'bg-gradient-to-br from-emerald-500 to-green-700 shadow-emerald-600/30',
    chip: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300',
  },
  boil: {
    labelKey: 'advisory_boil',
    card: 'bg-gradient-to-br from-amber-500 to-orange-600 shadow-amber-600/30',
    chip: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300',
  },
  do_not_drink: {
    labelKey: 'advisory_do_not_drink',
    card: 'bg-gradient-to-br from-red-600 to-rose-800 shadow-red-700/40',
    chip: 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300',
  },
};

const SMALL_GLYPH = { safe: CircleCheckBig, boil: CookingPot, do_not_drink: Ban };

export function AdvisoryGlyph({ status, size = 'lg' }: { status: AdvisoryStatus; size?: 'lg' | 'sm' }) {
  if (size === 'sm') {
    const Icon = SMALL_GLYPH[status];
    return <Icon className="w-4 h-4" strokeWidth={2.5} />;
  }
  if (status === 'safe') return <CircleCheckBig className="w-20 h-20" strokeWidth={2.25} />;
  if (status === 'boil') {
    return (
      <span className="relative inline-flex w-20 h-20">
        <CookingPot className="w-20 h-16" strokeWidth={2} />
        <Flame className="absolute left-1/2 -translate-x-1/2 bottom-0 w-8 h-8 text-yellow-200" strokeWidth={2.5} />
      </span>
    );
  }
  return (
    <span className="relative inline-flex items-center justify-center w-20 h-20">
      <GlassWater className="w-11 h-11" strokeWidth={2.25} />
      <Ban className="absolute inset-0 w-20 h-20" strokeWidth={2.5} />
    </span>
  );
}

export function AdvisoryChip({ status, label }: { status: AdvisoryStatus; label: string }) {
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${ADVISORY_STYLE[status].chip}`}>
      <AdvisoryGlyph status={status} size="sm" />
      {label}
    </span>
  );
}

export default function AdvisoryCard({
  advisory,
  statusLabel,
  whatToDoLabel,
  footer,
}: {
  advisory: Advisory;
  statusLabel: string;
  whatToDoLabel: string;
  footer: ReactNode;
}) {
  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.section
        key={advisory.status}
        initial={{ rotateX: -80, opacity: 0 }}
        animate={{ rotateX: 0, opacity: 1 }}
        exit={{ rotateX: 80, opacity: 0 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
        style={{ transformPerspective: 900 }}
        aria-live="polite"
        className={`rounded-3xl p-6 text-white shadow-2xl ${ADVISORY_STYLE[advisory.status].card}`}
      >
        <div className="flex flex-col items-center text-center gap-3">
          <div className={`w-32 h-32 rounded-full bg-white/20 ring-4 ring-white/30 flex items-center justify-center ${advisory.status === 'do_not_drink' ? 'animate-pulse' : ''}`}>
            <AdvisoryGlyph status={advisory.status} />
          </div>
          <h2 className="text-3xl font-black leading-tight">{statusLabel}</h2>
          <p className="text-lg font-semibold leading-snug text-white/95">{advisory.headline}</p>
        </div>

        {advisory.instructions.length > 0 && (
          <div className="mt-5 rounded-2xl bg-black/15 p-4">
            <div className="text-[11px] uppercase tracking-wider font-bold text-white/80 mb-2">{whatToDoLabel}</div>
            <ul className="space-y-2">
              {advisory.instructions.map((line) => (
                <li key={line} className="flex items-start gap-2 text-sm font-medium leading-snug">
                  <CircleCheck className="w-4 h-4 mt-0.5 shrink-0" />
                  <span>{line}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="mt-4 text-xs font-semibold text-white/85 flex flex-wrap items-center justify-between gap-2">{footer}</div>
      </motion.section>
    </AnimatePresence>
  );
}
