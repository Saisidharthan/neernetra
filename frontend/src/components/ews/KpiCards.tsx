'use client';

import React from 'react';
import { Activity, Bell, FlaskConical, ShieldAlert, Users } from 'lucide-react';
import type { Kpis } from '@/lib/ews';
import { fmtInt } from './tiers';

export default function KpiCards({ kpis }: { kpis: Kpis }) {
  const cards = [
    { label: 'Villages at risk', value: kpis.villagesAtRisk, hint: 'tier warning or outbreak', icon: ShieldAlert, hot: kpis.villagesAtRisk > 0, tone: 'text-orange-500' },
    { label: 'Active alerts', value: kpis.activeAlerts, hint: 'open or acknowledged', icon: Bell, hot: kpis.activeAlerts > 0, tone: 'text-red-500' },
    { label: 'Cases (7 days)', value: kpis.cases7d, hint: 'syndromic reports', icon: Activity, hot: false, tone: 'text-rose-500' },
    { label: 'Positive water tests (7d)', value: kpis.positiveWaterTests7d, hint: 'H2S strips + field kits', icon: FlaskConical, hot: kpis.positiveWaterTests7d > 0, tone: 'text-amber-500' },
    { label: 'Population covered', value: kpis.populationCovered, hint: 'across monitored villages', icon: Users, hot: false, tone: 'text-emerald-500' },
  ];
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
      {cards.map((c) => (
        <div
          key={c.label}
          className={`rounded-2xl border p-4 shadow-md bg-white dark:bg-slate-900 ${
            c.hot ? 'border-orange-300 dark:border-orange-900' : 'border-slate-200 dark:border-slate-800'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">{c.label}</span>
            <c.icon className={`w-5 h-5 ${c.tone}`} />
          </div>
          <div className="mt-2 text-3xl font-black tabular-nums text-slate-900 dark:text-white">{fmtInt(c.value)}</div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400">{c.hint}</div>
        </div>
      ))}
    </div>
  );
}
