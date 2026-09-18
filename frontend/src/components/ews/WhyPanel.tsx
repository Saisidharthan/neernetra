'use client';

import React from 'react';
import { ArrowDown, ArrowUp, Lightbulb } from 'lucide-react';
import type { Explanation, ExplanationFactor } from '@/lib/ews';
import { Card, CardHeader } from './ui';
import { EARS_C2_FLAG, EARS_C3_FLAG, pct } from './tiers';

function FactorRow({ f, maxShare }: { f: ExplanationFactor; maxShare: number }) {
  const up = f.contribution > 0;
  const width = `${Math.max(3, (f.share / maxShare) * 100)}%`;
  return (
    <div className="space-y-1">
      <div className="flex items-baseline justify-between gap-2 text-xs">
        <span className="font-bold text-slate-800 dark:text-slate-100">{f.label}</span>
        <span className="text-slate-500 dark:text-slate-400 text-right">{f.value}</span>
      </div>
      <div className="flex items-center gap-2">
        <div className="flex-1 grid grid-cols-2 items-center h-3">
          <div className="flex justify-end h-full border-r-2 border-slate-400 dark:border-slate-500">
            {!up && <div className="h-full rounded-l bg-emerald-500" style={{ width }} />}
          </div>
          <div className="flex h-full">{up && <div className="h-full rounded-r bg-red-500" style={{ width }} />}</div>
        </div>
        <span
          className={`w-16 inline-flex items-center justify-end gap-0.5 text-[11px] font-bold tabular-nums ${
            up ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'
          }`}
        >
          {up ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
          {pct(f.share)}
        </span>
      </div>
    </div>
  );
}

function Detector({
  title,
  triggered,
  value,
  mark,
  scaleMax,
  lines,
}: {
  title: string;
  triggered: boolean;
  value: number;
  mark: number;
  scaleMax: number;
  lines: string[];
}) {
  return (
    <div
      className={`rounded-xl border p-3 space-y-2 ${
        triggered ? 'border-red-300 dark:border-red-900 bg-red-50 dark:bg-red-950/40' : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50'
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-black text-slate-800 dark:text-slate-100">{title}</span>
        <span
          className={`rounded px-1.5 py-0.5 text-[10px] font-black uppercase ${
            triggered ? 'bg-red-600 text-white' : 'bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
          }`}
        >
          {triggered ? 'Firing' : 'Quiet'}
        </span>
      </div>
      <div className="relative h-2 rounded-full bg-slate-200 dark:bg-slate-800">
        <div
          className={`h-full rounded-full ${triggered ? 'bg-red-500' : 'bg-slate-400'}`}
          style={{ width: `${Math.min(100, Math.max(0, (value / scaleMax) * 100))}%` }}
        />
        <div className="absolute -top-1 h-4 w-0.5 bg-slate-900 dark:bg-white" style={{ left: `${(mark / scaleMax) * 100}%` }} />
      </div>
      {lines.map((l) => (
        <div key={l} className="text-[11px] font-mono text-slate-600 dark:text-slate-300">
          {l}
        </div>
      ))}
    </div>
  );
}

function verdict(ml: boolean, ears: boolean) {
  if (ml && !ears) return 'ML is warning before case counts move. EARS has not flagged yet: that gap is the lead time.';
  if (ml && ears) return 'Both detectors agree: the water and rain signals and a statistical spike in cases.';
  if (ears) return 'Cases have spiked statistically (EARS), but the ML model sees weak water and rain drivers.';
  return 'Neither detector is firing.';
}

export default function WhyPanel({ explanation }: { explanation: Explanation }) {
  const { risk, baseRisk, summary, factors, detectors } = explanation;
  const { ml, ears } = detectors;
  const maxShare = Math.max(...factors.map((f) => f.share), 0.01);
  const high = risk >= ml.threshold * 0.5;
  return (
    <Card>
      <CardHeader icon={Lightbulb} title={`Why is risk ${high ? 'high' : 'low'}?`} subtitle="TreeSHAP attribution of today's XGBoost prediction" />
      <div className="p-5 space-y-5">
        <div className="flex items-baseline gap-3">
          <span className="text-4xl font-black tabular-nums text-slate-900 dark:text-white">{pct(risk)}</span>
          <span className="text-xs text-slate-500 dark:text-slate-400">
            chance of an outbreak in the next 7 days · model baseline {pct(baseRisk)}
          </span>
        </div>
        <p className="text-sm font-medium text-slate-700 dark:text-slate-200 leading-relaxed">{summary}</p>

        <div className="space-y-3">
          <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider text-slate-400">
            <span>◀ lowers risk</span>
            <span>raises risk ▶</span>
          </div>
          {factors.map((f) => (
            <FactorRow key={f.key} f={f} maxShare={maxShare} />
          ))}
        </div>

        <div className="space-y-2">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Two detectors, side by side</div>
          <div className="grid grid-cols-2 gap-3">
            <Detector
              title="ML · XGBoost"
              triggered={ml.triggered}
              value={ml.risk}
              mark={ml.threshold}
              scaleMax={1}
              lines={[`risk ${ml.risk.toFixed(2)}`, `threshold ${ml.threshold.toFixed(2)}`]}
            />
            <Detector
              title="EARS · CDC"
              triggered={ears.triggered}
              value={ears.c2}
              mark={EARS_C2_FLAG}
              scaleMax={Math.max(EARS_C2_FLAG * 2, ears.c2)}
              lines={[`C2 ${ears.c2.toFixed(1)} (flag ≥ ${EARS_C2_FLAG})`, `C3 ${ears.c3.toFixed(1)} (flag ≥ ${EARS_C3_FLAG})`]}
            />
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-300">{verdict(ml.triggered, ears.triggered)}</p>
        </div>
      </div>
    </Card>
  );
}
