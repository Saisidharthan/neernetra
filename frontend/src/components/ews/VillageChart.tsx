'use client';

import React from 'react';
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  type TooltipContentProps,
} from 'recharts';
import type { DayPoint } from '@/lib/ews';
import { useTheme } from '@/lib/theme';
import { TIER_LABEL, fmtDate, pct } from './tiers';

export const SERIES = {
  light: { rain: '#2a78d6', cases: '#eb6834', turbidity: '#c98500', risk: '#4a3aa7', threshold: '#e34948', grid: '#e2e8f0', axis: '#64748b' },
  dark: { rain: '#3987e5', cases: '#d95926', turbidity: '#eda100', risk: '#9085e9', threshold: '#e66767', grid: '#1e293b', axis: '#94a3b8' },
};

function DayTooltip({ active, payload }: TooltipContentProps) {
  const d = payload?.[0]?.payload as DayPoint | undefined;
  if (!active || !d) return null;
  const rows: [string, string][] = [
    ['Risk', pct(d.risk)],
    ['Tier', TIER_LABEL[d.tier]],
    ['Cases', String(d.cases)],
    ['Rainfall', `${d.rainfall.toFixed(0)} mm`],
    ['Turbidity', d.turbidity === null ? '—' : `${d.turbidity.toFixed(1)} NTU`],
    ['H2S strip', d.h2sPositive === null ? 'not tested' : d.h2sPositive ? 'positive' : 'negative'],
    ['EARS C2', d.earsC2.toFixed(1)],
  ];
  return (
    <div className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-xs shadow-xl">
      <div className="font-bold text-slate-900 dark:text-white mb-1">{fmtDate(d.date)}</div>
      <table>
        <tbody>
          {rows.map(([k, v]) => (
            <tr key={k}>
              <td className="pr-3 text-slate-500 dark:text-slate-400">{k}</td>
              <td className="font-semibold tabular-nums text-slate-800 dark:text-slate-100">{v}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function VillageChart({ timeseries, threshold }: { timeseries: DayPoint[]; threshold: number }) {
  const { theme } = useTheme();
  const c = SERIES[theme];
  const tick = { fill: c.axis, fontSize: 11 };
  return (
    <ResponsiveContainer width="100%" height={340}>
      <ComposedChart data={timeseries} margin={{ top: 10, right: 8, bottom: 0, left: -8 }} barGap={1} barCategoryGap="18%">
        <CartesianGrid stroke={c.grid} vertical={false} />
        <XAxis dataKey="date" tickFormatter={fmtDate} tick={tick} minTickGap={24} stroke={c.grid} />
        <YAxis yAxisId="cases" allowDecimals={false} tick={tick} stroke={c.grid} label={{ value: 'cases', angle: -90, position: 'insideLeft', offset: 18, fill: c.axis, fontSize: 11 }} />
        <YAxis yAxisId="rain" hide />
        <YAxis yAxisId="ntu" hide />
        <YAxis
          yAxisId="risk"
          orientation="right"
          domain={[0, 1]}
          ticks={[0, 0.25, 0.5, 0.75, 1]}
          tickFormatter={(v: number) => pct(v)}
          tick={tick}
          stroke={c.grid}
        />
        <Tooltip content={DayTooltip} cursor={{ fill: theme === 'dark' ? 'rgba(148,163,184,0.08)' : 'rgba(15,23,42,0.05)' }} />
        <Legend wrapperStyle={{ fontSize: 12, paddingTop: 4 }} />
        <Bar yAxisId="rain" dataKey="rainfall" name="Rainfall (mm)" fill={c.rain} fillOpacity={0.45} radius={[3, 3, 0, 0]} />
        <Bar yAxisId="cases" dataKey="cases" name="Cases" fill={c.cases} radius={[3, 3, 0, 0]} />
        <Line yAxisId="ntu" type="monotone" dataKey="turbidity" name="Turbidity (NTU)" stroke={c.turbidity} strokeWidth={2} dot={false} connectNulls />
        <Line yAxisId="risk" type="monotone" dataKey="risk" name="Outbreak risk" stroke={c.risk} strokeWidth={3} dot={false} />
        <ReferenceLine
          yAxisId="risk"
          y={threshold}
          stroke={c.threshold}
          strokeDasharray="6 4"
          label={{ value: `alert threshold ${pct(threshold)}`, position: 'insideTopRight', fill: c.threshold, fontSize: 11 }}
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
}
