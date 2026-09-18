'use client';

import React from 'react';
import Link from 'next/link';
import type { VillageSummary } from '@/lib/ews';
import { AdvisoryIcon, DeltaArrow, EarsChip, RiskBar, TierBadge } from './ui';

export default function HotspotList({ villages, limit }: { villages: VillageSummary[]; limit?: number }) {
  const rows = [...villages].sort((a, b) => a.rank - b.rank).slice(0, limit);
  return (
    <ol className="divide-y divide-slate-100 dark:divide-slate-800">
      {rows.map((v) => (
        <li key={v.id}>
          <Link
            href={`/village/${encodeURIComponent(v.id)}`}
            className="flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors"
          >
            <span
              className={`w-7 h-7 shrink-0 rounded-lg flex items-center justify-center text-xs font-black ${
                v.rank <= 3 ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
              }`}
            >
              {v.rank}
            </span>
            <div className="flex-1 min-w-0 space-y-1">
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="font-bold text-sm text-slate-900 dark:text-white truncate">{v.name}</span>
                <TierBadge tier={v.tier} />
                <EarsChip flagged={v.ears.flagged} />
              </div>
              <RiskBar risk={v.risk} tier={v.tier} />
            </div>
            <DeltaArrow delta={v.riskDelta} />
            <AdvisoryIcon status={v.advisory} />
          </Link>
        </li>
      ))}
    </ol>
  );
}
