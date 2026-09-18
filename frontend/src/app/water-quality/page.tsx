'use client';

import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { Bar, BarChart, CartesianGrid, Cell, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { ChartColumn, Droplets, FlaskConical, MapPin, Radio, Table2 } from 'lucide-react';
import { ews, type VillageSummary } from '@/lib/ews';
import { useEwsData } from '@/lib/useEws';
import { useTheme } from '@/lib/theme';
import { AdvisoryBadge, Card, CardHeader, EngineGate, EngineLoading, TierBadge } from '@/components/ews/ui';
import {
  TURBIDITY_ANOMALY_NTU, TURBIDITY_BIS_NTU, WATER_SOURCE_LABEL, WATER_STATUS_HEX, WATER_STATUS_LABEL, waterStatus,
} from '@/components/ews/tiers';

const WaterMap = dynamic(() => import('@/components/WaterQualityMap'), {
  ssr: false,
  loading: () => <EngineLoading label="Loading map…" />,
});

type Filter = 'all' | 'flagged' | 'ok';

const phOff = (ph: number | null) => ph !== null && (ph < 6.5 || ph > 8.5);
const tdsTone = (tds: number | null) =>
  tds === null ? '' : tds > 2000 ? 'text-red-600 dark:text-red-400 font-bold' : tds > 500 ? 'text-amber-600 dark:text-amber-400 font-semibold' : '';

function Readings({ v }: { v: VillageSummary }) {
  const l = v.latest;
  const rows: { label: string; value: string; warn?: boolean }[] = [
    { label: 'Turbidity', value: l.turbidity === null ? '—' : `${l.turbidity.toFixed(1)} NTU`, warn: l.turbidity !== null && l.turbidity > TURBIDITY_BIS_NTU },
    { label: 'pH', value: l.ph === null ? '—' : l.ph.toFixed(1), warn: phOff(l.ph) },
    { label: 'TDS', value: l.tds === null ? '—' : `${Math.round(l.tds)} mg/L`, warn: l.tds !== null && l.tds > 500 },
    { label: 'H2S strip (7d)', value: l.h2sPositive === null ? 'not tested' : l.h2sPositive ? 'POSITIVE' : 'negative', warn: !!l.h2sPositive },
    { label: 'Rain (24h)', value: `${l.rainfall24h.toFixed(0)} mm` },
    { label: 'Cases (7d)', value: String(l.cases7d) },
  ];
  return (
    <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
      {rows.map((r) => (
        <div key={r.label} className="flex justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-1">
          <dt className="text-slate-500 dark:text-slate-400">{r.label}</dt>
          <dd className={`tabular-nums ${r.warn ? 'text-red-600 dark:text-red-400 font-bold' : 'font-semibold text-slate-800 dark:text-slate-100'}`}>{r.value}</dd>
        </div>
      ))}
    </dl>
  );
}

export default function WaterQualityPage() {
  const { data: villages, error } = useEwsData(ews.villages, 'water');
  const { theme } = useTheme();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>('all');

  if (!villages) return <EngineGate error={error} />;

  const statuses = villages.map((v) => waterStatus(v.latest));
  const count = (s: ReturnType<typeof waterStatus>) => statuses.filter((x) => x === s).length;
  const selected = villages.find((v) => v.id === selectedId) ?? null;
  const rows = villages
    .filter((v) => {
      const s = waterStatus(v.latest);
      return filter === 'all' || (filter === 'flagged' ? s === 'h2s' || s === 'turbid' : s === 'ok');
    })
    .sort((a, b) => (b.latest.turbidity ?? -1) - (a.latest.turbidity ?? -1));
  const chartData = villages
    .filter((v) => v.latest.turbidity !== null)
    .map((v) => ({ id: v.id, name: v.name, turbidity: v.latest.turbidity as number, status: waterStatus(v.latest) }))
    .sort((a, b) => b.turbidity - a.turbidity);
  const axis = theme === 'dark' ? '#94a3b8' : '#64748b';
  const grid = theme === 'dark' ? '#1e293b' : '#e2e8f0';

  const tiles = [
    { label: WATER_STATUS_LABEL.h2s, value: count('h2s'), color: WATER_STATUS_HEX.h2s },
    { label: WATER_STATUS_LABEL.turbid, value: count('turbid'), color: WATER_STATUS_HEX.turbid },
    { label: WATER_STATUS_LABEL.ok, value: count('ok'), color: WATER_STATUS_HEX.ok },
    { label: 'Villages with a sensor', value: villages.filter((v) => v.hasSensor).length, color: '#10b981' },
  ];

  return (
    <div className="space-y-6 py-2">
      <div>
        <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
          <Droplets className="w-4 h-4" />
          Water
        </span>
        <h1 className="text-3xl font-black text-slate-900 dark:text-white">Latest water readings</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Most recent sensor, H2S strip and field-kit results per village, as the engine sees them today. Water usually turns before people fall sick.
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {tiles.map((t) => (
          <div key={t.label} className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-md">
            <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              <span className="w-2.5 h-2.5 rounded-full" style={{ background: t.color }} />
              {t.label}
            </div>
            <div className="mt-1 text-3xl font-black tabular-nums text-slate-900 dark:text-white">{t.value}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 overflow-hidden">
          <CardHeader icon={MapPin} title="Water map" subtitle="Colour = latest water status. Click a village for its readings." />
          <div className="p-3">
            <WaterMap villages={villages} selectedId={selectedId} onSelect={setSelectedId} />
          </div>
        </Card>

        <Card>
          <CardHeader icon={FlaskConical} title={selected ? selected.name : 'Selected village'} subtitle={selected ? `${selected.id} · ${WATER_SOURCE_LABEL[selected.waterSource]}` : undefined} />
          <div className="p-5 space-y-4">
            {selected ? (
              <>
                <div className="flex flex-wrap gap-2">
                  <span
                    className="rounded-md px-2 py-1 text-xs font-bold text-white"
                    style={{ background: WATER_STATUS_HEX[waterStatus(selected.latest)] }}
                  >
                    {WATER_STATUS_LABEL[waterStatus(selected.latest)]}
                  </span>
                  <TierBadge tier={selected.tier} size="lg" />
                  <AdvisoryBadge status={selected.advisory} />
                </div>
                <Readings v={selected} />
                <p className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                  <Radio className="w-3.5 h-3.5" />
                  {selected.hasSensor ? 'Continuous IoT sensor' : 'No sensor: readings come from ASHA kits and reports'}
                </p>
                <Link
                  href={`/village/${encodeURIComponent(selected.id)}`}
                  className="block text-center rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold py-2"
                >
                  Open village detail →
                </Link>
              </>
            ) : (
              <p className="text-sm text-slate-500 dark:text-slate-400 py-10 text-center">Click a village on the map or in the table.</p>
            )}
          </div>
        </Card>
      </div>

      <Card>
        <CardHeader
          icon={ChartColumn}
          title="Turbidity by village"
          subtitle={`Dashed lines: ${TURBIDITY_BIS_NTU} NTU (BIS 10500 permissible) and ${TURBIDITY_ANOMALY_NTU} NTU (engine's water-anomaly trigger)`}
        />
        <div className="p-4">
          {chartData.length === 0 ? (
            <p className="text-sm text-slate-500 dark:text-slate-400 py-10 text-center">No turbidity readings yet.</p>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={chartData} margin={{ top: 10, right: 8, bottom: 0, left: -12 }}>
                <CartesianGrid stroke={grid} vertical={false} />
                <XAxis dataKey="name" tick={{ fill: axis, fontSize: 11 }} stroke={grid} interval={0} angle={-30} textAnchor="end" height={60} />
                <YAxis tick={{ fill: axis, fontSize: 11 }} stroke={grid} unit=" NTU" width={70} />
                <Tooltip
                  formatter={(v) => [`${Number(v).toFixed(1)} NTU`, 'Turbidity']}
                  contentStyle={{ fontSize: 12, borderRadius: 8 }}
                  cursor={{ fill: theme === 'dark' ? 'rgba(148,163,184,0.08)' : 'rgba(15,23,42,0.05)' }}
                />
                <ReferenceLine y={TURBIDITY_BIS_NTU} stroke={axis} strokeDasharray="4 4" />
                <ReferenceLine y={TURBIDITY_ANOMALY_NTU} stroke={WATER_STATUS_HEX.turbid} strokeDasharray="6 4" />
                <Bar dataKey="turbidity" radius={[4, 4, 0, 0]} onClick={(d) => setSelectedId((d.payload as { id: string }).id)} cursor="pointer">
                  {chartData.map((d) => (
                    <Cell key={d.id} fill={WATER_STATUS_HEX[d.status]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </Card>

      <Card>
        <CardHeader
          icon={Table2}
          title="All villages"
          subtitle="pH outside 6.5–8.5 and TDS above 500 mg/L (BIS acceptable) are highlighted"
          right={
            <div className="inline-flex rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-900 p-0.5 text-xs font-bold shrink-0">
              {(['all', 'flagged', 'ok'] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-2.5 py-1 rounded-md capitalize ${
                    filter === f ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow' : 'text-slate-500'
                  }`}
                >
                  {f === 'ok' ? 'within limits' : f}
                </button>
              ))}
            </div>
          }
        />
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="text-left text-[10px] uppercase tracking-wider text-slate-400">
              <tr className="border-b border-slate-100 dark:border-slate-800">
                <th className="px-4 py-2">Village</th>
                <th className="px-2 py-2">Source</th>
                <th className="px-2 py-2">Status</th>
                <th className="px-2 py-2 text-right">Turbidity</th>
                <th className="px-2 py-2 text-right">pH</th>
                <th className="px-2 py-2 text-right">TDS</th>
                <th className="px-2 py-2">H2S</th>
                <th className="px-2 py-2 text-right">Rain 24h</th>
                <th className="px-2 py-2">Tier</th>
                <th className="px-4 py-2">Advisory</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 tabular-nums">
              {rows.map((v) => {
                const s = waterStatus(v.latest);
                const l = v.latest;
                return (
                  <tr
                    key={v.id}
                    onClick={() => setSelectedId(v.id)}
                    className={`cursor-pointer ${v.id === selectedId ? 'bg-emerald-50 dark:bg-emerald-950/40' : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'}`}
                  >
                    <td className="px-4 py-2 font-bold text-slate-900 dark:text-white">
                      {v.name} <span className="font-mono font-normal text-slate-400">{v.id}</span>
                    </td>
                    <td className="px-2 py-2">
                      {WATER_SOURCE_LABEL[v.waterSource]}
                      {v.hasSensor && <Radio className="inline w-3 h-3 ml-1 text-emerald-500" />}
                    </td>
                    <td className="px-2 py-2">
                      <span className="inline-flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full" style={{ background: WATER_STATUS_HEX[s] }} />
                        {WATER_STATUS_LABEL[s]}
                      </span>
                    </td>
                    <td className={`px-2 py-2 text-right ${l.turbidity !== null && l.turbidity > TURBIDITY_ANOMALY_NTU ? 'text-amber-600 dark:text-amber-400 font-bold' : ''}`}>
                      {l.turbidity === null ? '—' : l.turbidity.toFixed(1)}
                    </td>
                    <td className={`px-2 py-2 text-right ${phOff(l.ph) ? 'text-amber-600 dark:text-amber-400 font-bold' : ''}`}>{l.ph === null ? '—' : l.ph.toFixed(1)}</td>
                    <td className={`px-2 py-2 text-right ${tdsTone(l.tds)}`}>{l.tds === null ? '—' : Math.round(l.tds)}</td>
                    <td className="px-2 py-2">
                      {l.h2sPositive === null ? '—' : l.h2sPositive ? <span className="font-bold text-red-600 dark:text-red-400">POS</span> : 'neg'}
                    </td>
                    <td className="px-2 py-2 text-right">{l.rainfall24h.toFixed(0)} mm</td>
                    <td className="px-2 py-2">
                      <TierBadge tier={v.tier} />
                    </td>
                    <td className="px-4 py-2">
                      <AdvisoryBadge status={v.advisory} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
