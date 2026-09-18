'use client';

import React, { useEffect, useState } from 'react';
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { BookOpen, BrainCircuit, ChartColumn, FlaskConical, Layers, Scale, Timer, TriangleAlert } from 'lucide-react';
import { ews, type MethodMetrics, type ModelCard } from '@/lib/ews';
import { useSim } from '@/components/ews/SimProvider';
import { Card, CardHeader, EngineGate } from '@/components/ews/ui';
import { useTheme } from '@/lib/theme';
import { fmtInt, pct } from '@/components/ews/tiers';

const COLORS = {
  light: { ml: '#2a78d6', ears: '#eb6834', grid: '#e2e8f0', axis: '#64748b' },
  dark: { ml: '#3987e5', ears: '#d95926', grid: '#1e293b', axis: '#94a3b8' },
};

const oursOf = (methods: MethodMetrics[]) =>
  (methods.find((m) => /neernetra/i.test(m.method)) ?? methods.find((m) => /xgboost/i.test(m.method)))?.method;

type Col = { key: keyof MethodMetrics; label: string; better: 'high' | 'low'; fmt: (m: MethodMetrics) => string };

const COLS: Col[] = [
  { key: 'recall', label: 'Recall', better: 'high', fmt: (m) => pct(m.recall) },
  { key: 'precision', label: 'Precision', better: 'high', fmt: (m) => pct(m.precision) },
  { key: 'falseAlarmsPer100VillageDays', label: 'False alarms / 100 village-days', better: 'low', fmt: (m) => m.falseAlarmsPer100VillageDays.toFixed(2) },
  { key: 'medianLeadDays', label: 'Median lead (days)', better: 'high', fmt: (m) => (m.medianLeadDays === null ? '—' : `${m.medianLeadDays > 0 ? '+' : ''}${m.medianLeadDays}`) },
  { key: 'detectedEpisodes', label: 'Episodes detected', better: 'high', fmt: (m) => String(m.detectedEpisodes) },
];

function bestValue(methods: MethodMetrics[], col: Col) {
  const vals = methods.map((m) => m[col.key]).filter((v): v is number => typeof v === 'number');
  if (vals.length === 0) return null;
  return col.better === 'high' ? Math.max(...vals) : Math.min(...vals);
}

function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-md">
      <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">{label}</div>
      <div className="mt-1 text-3xl font-black tabular-nums text-slate-900 dark:text-white">{value}</div>
      {hint && <div className="text-[11px] text-slate-500 dark:text-slate-400">{hint}</div>}
    </div>
  );
}

export default function ModelCardPage() {
  const { state, error: simError } = useSim();
  const { theme } = useTheme();
  const [card, setCard] = useState<ModelCard | null>(null);
  const [error, setError] = useState<string | null>(null);
  const online = state !== null && !simError;

  useEffect(() => {
    if (!online) return;
    let cancelled = false;
    ews.modelCard().then(
      (c) => {
        if (cancelled) return;
        setCard(c);
        setError(null);
      },
      (e) => !cancelled && setError(e instanceof Error ? e.message : String(e)),
    );
    return () => {
      cancelled = true;
    };
  }, [online]);

  if (!card) return <EngineGate error={error ?? simError} />;

  const c = COLORS[theme];
  const tick = { fill: c.axis, fontSize: 11 };
  const features = [...card.featureImportance].sort((a, b) => b.importance - a.importance);
  const maxImp = Math.max(...features.map((f) => f.importance), 0.01);
  const ours = oursOf(card.methods);

  return (
    <div className="space-y-6 py-2">
      <div>
        <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
          <BrainCircuit className="w-4 h-4" />
          Model card
        </span>
        <h1 className="text-3xl font-black text-slate-900 dark:text-white">How well the model backtests</h1>
        <p className="mt-2 text-sm font-medium text-slate-700 dark:text-slate-300">{card.model}</p>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Every number on this page is computed by the backend from a held-out backtest. Nothing is typed in by hand.
        </p>
      </div>

      <div className="rounded-2xl border-2 border-amber-400 dark:border-amber-600 bg-amber-50 dark:bg-amber-950/40 p-5 flex gap-4">
        <TriangleAlert className="w-8 h-8 shrink-0 text-amber-600 dark:text-amber-400" />
        <div className="space-y-1">
          <h2 className="text-lg font-black text-amber-900 dark:text-amber-200">Synthetic data: read these numbers as a method check, not a field result</h2>
          <p className="text-sm text-amber-900 dark:text-amber-100 leading-relaxed">{card.syntheticDisclaimer}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        <Stat label="ROC AUC" value={card.auc.toFixed(3)} hint="held-out test year" />
        <Stat label="Alert threshold" value={card.threshold.toFixed(2)} hint="ML risk that raises a warning" />
        <Stat label="Test outbreak episodes" value={fmtInt(card.testEpisodes)} />
        <Stat label="Villages" value={fmtInt(card.villages)} />
        <Stat label="Rows (train / test)" value={`${fmtInt(card.trainRows)} / ${fmtInt(card.testRows)}`} hint="village-days" />
      </div>

      <Card>
        <CardHeader icon={Scale} title="Methods compared on the same test year" subtitle="Best value in each column is bold. NeerNetra's row is highlighted." />
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-[11px] uppercase tracking-wider text-slate-400">
              <tr className="border-b border-slate-100 dark:border-slate-800">
                <th className="px-5 py-3">Method</th>
                {COLS.map((col) => (
                  <th key={col.key} className="px-3 py-3 text-right">
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 tabular-nums">
              {card.methods.map((m) => (
                <tr key={m.method} className={m.method === ours ? 'bg-emerald-50 dark:bg-emerald-950/40' : ''}>
                  <td className="px-5 py-3 font-bold text-slate-900 dark:text-white">
                    {m.method}
                    {m.method === ours && (
                      <span className="ml-2 rounded bg-emerald-600 text-white px-1.5 py-0.5 text-[10px] font-black uppercase align-middle">NeerNetra</span>
                    )}
                  </td>
                  {COLS.map((col) => {
                    const best = bestValue(card.methods, col);
                    return (
                      <td
                        key={col.key}
                        className={`px-3 py-3 text-right ${
                          best !== null && m[col.key] === best ? 'font-black text-slate-900 dark:text-white' : 'text-slate-600 dark:text-slate-300'
                        }`}
                      >
                        {col.fmt(m)}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader icon={Timer} title="Lead time: ML vs EARS" subtitle="Days of warning before outbreak onset, per detected episode (negative = after onset)" />
          <div className="p-4">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={card.leadTimeHistogram} margin={{ top: 10, right: 8, bottom: 16, left: -12 }} barGap={2}>
                <CartesianGrid stroke={c.grid} vertical={false} />
                <XAxis
                  dataKey="leadDays"
                  tick={tick}
                  stroke={c.grid}
                  tickFormatter={(d: number) => `${d > 0 ? '+' : ''}${d}`}
                  label={{ value: 'days before onset', position: 'insideBottom', offset: -8, fill: c.axis, fontSize: 11 }}
                />
                <YAxis allowDecimals={false} tick={tick} stroke={c.grid} />
                <Tooltip
                  labelFormatter={(d) => `${Number(d) > 0 ? '+' : ''}${d} days`}
                  contentStyle={{ fontSize: 12, borderRadius: 8 }}
                  cursor={{ fill: theme === 'dark' ? 'rgba(148,163,184,0.08)' : 'rgba(15,23,42,0.05)' }}
                />
                <Legend wrapperStyle={{ fontSize: 12, paddingTop: 12 }} />
                <Bar dataKey="ml" name="NeerNetra ML" fill={c.ml} radius={[4, 4, 0, 0]} />
                <Bar dataKey="ears" name="EARS C2/C3" fill={c.ears} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card>
          <CardHeader icon={ChartColumn} title="What the model relies on" subtitle="Mean |TreeSHAP| share across the test year" />
          <div className="p-5 space-y-2.5">
            {features.map((f) => (
              <div key={f.feature} className="grid grid-cols-[minmax(0,11rem)_1fr_3rem] items-center gap-3 text-xs">
                <span className="font-semibold text-slate-700 dark:text-slate-200 truncate" title={f.feature}>
                  {f.label}
                </span>
                <div className="h-3 rounded-r bg-slate-100 dark:bg-slate-800">
                  <div className="h-full rounded-r" style={{ width: `${(f.importance / maxImp) * 100}%`, background: c.ml }} />
                </div>
                <span className="text-right font-bold tabular-nums text-slate-800 dark:text-slate-100">{pct(f.importance)}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card>
        <CardHeader icon={BookOpen} title="Definitions and data" />
        <dl className="p-5 grid grid-cols-1 md:grid-cols-3 gap-5 text-sm">
          <div className="md:col-span-3 space-y-1">
            <dt className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400">
              <FlaskConical className="w-3.5 h-3.5" />
              Outbreak definition (the label)
            </dt>
            <dd className="text-slate-800 dark:text-slate-100 leading-relaxed">{card.outbreakDefinition}</dd>
          </div>
          <div className="space-y-1">
            <dt className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Train period</dt>
            <dd className="font-semibold text-slate-800 dark:text-slate-100">{card.trainPeriod}</dd>
          </div>
          <div className="space-y-1">
            <dt className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Test period (held out)</dt>
            <dd className="font-semibold text-slate-800 dark:text-slate-100">{card.testPeriod}</dd>
          </div>
          <div className="space-y-1">
            <dt className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400">
              <Layers className="w-3.5 h-3.5" />
              Detection layers
            </dt>
            <dd className="text-slate-800 dark:text-slate-100">
              EARS C1–C3 on daily syndromic counts, plus XGBoost on rain, water quality, cases, upstream signal and season.
            </dd>
          </div>
        </dl>
      </Card>
    </div>
  );
}
