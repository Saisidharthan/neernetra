'use client';

import React, { use, useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Activity, ArrowLeft, ArrowRight, CloudRain, Cpu, Droplets, FlaskConical, Globe, LineChart as LineChartIcon, MapPinOff, Radio, Users,
} from 'lucide-react';
import { ews, type NeighbourRef, type VillageDetail, type WeatherForecast } from '@/lib/ews';
import { useEwsData } from '@/lib/useEws';
import VillageChart from '@/components/ews/VillageChart';
import WhyPanel from '@/components/ews/WhyPanel';
import { InterventionTimeline, RecommendedActions } from '@/components/ews/Interventions';
import { AdvisoryBadge, Card, CardHeader, EngineGate, TierBadge } from '@/components/ews/ui';
import { TIER_BAR, WATER_SOURCE_LABEL, fmtDate, fmtInt, pct } from '@/components/ews/tiers';

function NeighbourChip({ n }: { n: NeighbourRef }) {
  return (
    <Link
      href={`/village/${encodeURIComponent(n.id)}`}
      className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 py-1 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:border-emerald-500"
    >
      <span className={`w-2 h-2 rounded-full ${TIER_BAR[n.tier]}`} />
      {n.name}
      <span className="text-slate-400 tabular-nums">{pct(n.risk)}</span>
    </Link>
  );
}

function RiverChain({ v }: { v: VillageDetail }) {
  return (
    <div className="flex flex-wrap items-center gap-2 text-xs">
      <span className="font-bold uppercase tracking-wider text-[10px] text-slate-400">River</span>
      {v.upstream ? <NeighbourChip n={v.upstream} /> : <span className="text-slate-400 italic">source</span>}
      <ArrowRight className="w-4 h-4 text-sky-500" />
      <span className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-2.5 py-1 font-bold">
        <span className={`w-2 h-2 rounded-full ${TIER_BAR[v.tier]}`} />
        {v.name}
      </span>
      <ArrowRight className="w-4 h-4 text-sky-500" />
      {v.downstream.length > 0 ? v.downstream.map((d) => <NeighbourChip key={d.id} n={d} />) : <span className="text-slate-400 italic">end of reach</span>}
    </div>
  );
}

function LiveWeather({ villageId }: { villageId: string }) {
  const [weather, setWeather] = useState<WeatherForecast | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    ews.weather(villageId).then(
      (w) => !cancelled && setWeather(w),
      (e) => !cancelled && setError(e instanceof Error ? e.message : String(e)),
    );
    return () => {
      cancelled = true;
    };
  }, [villageId]);

  const unavailable = error || weather?.source === 'unavailable';
  return (
    <div className="rounded-xl border border-sky-200 dark:border-sky-900 bg-sky-50 dark:bg-sky-950/40 p-3 space-y-2">
      <div className="flex items-center gap-1.5 text-xs font-bold text-sky-800 dark:text-sky-300">
        <Globe className="w-3.5 h-3.5" />
        Live rainfall forecast (Open-Meteo, real world)
      </div>
      {unavailable ? (
        <p className="text-xs text-slate-600 dark:text-slate-300">
          Unavailable right now (no internet or Open-Meteo did not answer). The simulation does not depend on it.
        </p>
      ) : !weather ? (
        <p className="text-xs text-slate-500">Fetching…</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {weather.days.map((d) => (
            <div key={d.date} className="rounded-lg bg-white dark:bg-slate-900 border border-sky-200 dark:border-sky-900 px-2.5 py-1.5 text-center">
              <div className="text-[10px] font-semibold text-slate-500">{fmtDate(d.date)}</div>
              <div className="text-sm font-black tabular-nums text-slate-900 dark:text-white">{d.precipitationMm.toFixed(1)} mm</div>
              {d.precipitationProbability !== null && (
                <div className="text-[10px] text-sky-700 dark:text-sky-400">{Math.round(d.precipitationProbability)}% chance</div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function WaterTestsTable({ v }: { v: VillageDetail }) {
  return (
    <Card>
      <CardHeader icon={FlaskConical} title="Recent water tests" subtitle="Sensors, H2S strips, field kits and citizen reports" />
      <div className="overflow-x-auto">
        {v.waterTests.length === 0 ? (
          <p className="text-sm text-slate-500 dark:text-slate-400 py-6 text-center">No tests recorded.</p>
        ) : (
          <table className="w-full text-xs">
            <thead className="text-left text-[10px] uppercase tracking-wider text-slate-400">
              <tr className="border-b border-slate-100 dark:border-slate-800">
                <th className="px-4 py-2">Date</th>
                <th className="px-2 py-2">Source</th>
                <th className="px-2 py-2">H2S</th>
                <th className="px-2 py-2 text-right">Turbidity</th>
                <th className="px-2 py-2 text-right">pH</th>
                <th className="px-4 py-2">Look</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 tabular-nums">
              {v.waterTests.map((t) => (
                <tr key={t.id}>
                  <td className="px-4 py-1.5">{fmtDate(t.date)}</td>
                  <td className="px-2 py-1.5 capitalize">{t.source.replace('_', ' ')}</td>
                  <td className="px-2 py-1.5">
                    {t.h2sPositive === null ? (
                      '—'
                    ) : t.h2sPositive ? (
                      <span className="font-bold text-red-600 dark:text-red-400">POS</span>
                    ) : (
                      <span className="text-emerald-600 dark:text-emerald-400">neg</span>
                    )}
                  </td>
                  <td className="px-2 py-1.5 text-right">{t.turbidity === null ? '—' : `${t.turbidity.toFixed(1)} NTU`}</td>
                  <td className="px-2 py-1.5 text-right">{t.ph === null ? '—' : t.ph.toFixed(1)}</td>
                  <td className="px-4 py-1.5 capitalize">{t.appearance ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </Card>
  );
}

function CaseReportsTable({ v }: { v: VillageDetail }) {
  return (
    <Card>
      <CardHeader icon={Activity} title="Recent case reports" subtitle="D diarrhoea · V vomiting · F fever · J jaundice · B bloody stool" />
      <div className="overflow-x-auto">
        {v.reports.length === 0 ? (
          <p className="text-sm text-slate-500 dark:text-slate-400 py-6 text-center">No reports recorded.</p>
        ) : (
          <table className="w-full text-xs">
            <thead className="text-left text-[10px] uppercase tracking-wider text-slate-400">
              <tr className="border-b border-slate-100 dark:border-slate-800">
                <th className="px-4 py-2">Date</th>
                <th className="px-2 py-2">Reporter</th>
                <th className="px-2 py-2">Channel</th>
                <th className="px-2 py-2">Symptoms</th>
                <th className="px-4 py-2 text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 tabular-nums">
              {v.reports.map((r) => (
                <tr key={r.id}>
                  <td className="px-4 py-1.5">{fmtDate(r.date)}</td>
                  <td className="px-2 py-1.5">
                    <span className="uppercase font-semibold">{r.reporterRole}</span>
                    {r.reporterName && <span className="text-slate-400"> · {r.reporterName}</span>}
                  </td>
                  <td className="px-2 py-1.5 uppercase">{r.channel.replace('_', ' ')}</td>
                  <td className="px-2 py-1.5 font-mono text-[11px]">
                    D{r.symptoms.diarrhoea} V{r.symptoms.vomiting} F{r.symptoms.fever} J{r.symptoms.jaundice} B{r.symptoms.bloodyStool}
                  </td>
                  <td className="px-4 py-1.5 text-right font-bold">{r.total}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </Card>
  );
}

export default function VillagePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data: v, error } = useEwsData(() => ews.village(id), id);

  if (!v) {
    if (error?.includes('(404)')) {
      return (
        <div className="max-w-xl mx-auto my-16 text-center space-y-3">
          <MapPinOff className="w-10 h-10 mx-auto text-slate-400" />
          <h1 className="text-2xl font-black">No village with id “{id}”</h1>
          <Link href="/portal/district" className="text-sm font-bold text-emerald-600 dark:text-emerald-400 hover:underline">
            ← Back to the Command Center
          </Link>
        </div>
      );
    }
    return <EngineGate error={error} />;
  }

  const threshold = v.explanation.detectors.ml.threshold;

  return (
    <div className="space-y-6 py-2">
      <Link href="/portal/district" className="inline-flex items-center gap-1 text-xs font-bold text-slate-500 hover:text-emerald-600 dark:hover:text-emerald-400">
        <ArrowLeft className="w-3.5 h-3.5" />
        Command Center
      </Link>

      <Card className="p-5 space-y-4">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-3xl font-black text-slate-900 dark:text-white">{v.name}</h1>
              <span className="rounded-md bg-slate-100 dark:bg-slate-800 px-2 py-0.5 text-xs font-mono font-bold text-slate-600 dark:text-slate-300">{v.id}</span>
              <TierBadge tier={v.tier} size="lg" />
              <AdvisoryBadge status={v.advisory} />
            </div>
            <div className="flex flex-wrap gap-x-5 gap-y-1 text-sm text-slate-600 dark:text-slate-300">
              <span className="inline-flex items-center gap-1.5">
                <Users className="w-4 h-4 text-slate-400" />
                {fmtInt(v.population)} people
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Droplets className="w-4 h-4 text-slate-400" />
                {WATER_SOURCE_LABEL[v.waterSource]}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Radio className={`w-4 h-4 ${v.hasSensor ? 'text-emerald-500' : 'text-slate-400'}`} />
                {v.hasSensor ? 'IoT water sensor' : 'No sensor: manual tests only'}
              </span>
              <span className="text-slate-400">
                {v.district}, {v.state}
                {v.catchment && ` · ${v.catchment} catchment`}
              </span>
            </div>
          </div>
          <div className="text-right shrink-0">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Priority rank</div>
            <div className="text-4xl font-black text-slate-900 dark:text-white">#{v.rank}</div>
          </div>
        </div>
        <RiverChain v={v} />
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader icon={LineChartIcon} title="Last 30 days" subtitle="Rain and turbidity move first, then risk, then cases. Hover for daily values." />
          <div className="p-4 space-y-4">
            <VillageChart timeseries={v.timeseries} threshold={threshold} />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 p-3 space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-200">
                  <CloudRain className="w-3.5 h-3.5 text-sky-500" />
                  3-day rain forecast used by the model (simulated)
                </div>
                <div className="flex flex-wrap gap-2">
                  {v.forecast.map((f) => (
                    <div
                      key={f.date}
                      className={`rounded-lg border px-2.5 py-1.5 text-center ${
                        f.rainfallMm >= 50
                          ? 'border-sky-400 bg-sky-100 dark:bg-sky-950 dark:border-sky-700'
                          : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900'
                      }`}
                    >
                      <div className="text-[10px] font-semibold text-slate-500">{fmtDate(f.date)}</div>
                      <div className="text-sm font-black tabular-nums text-slate-900 dark:text-white">{f.rainfallMm.toFixed(0)} mm</div>
                    </div>
                  ))}
                </div>
              </div>
              <LiveWeather key={v.id} villageId={v.id} />
            </div>
          </div>
        </Card>

        <WhyPanel explanation={v.explanation} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RecommendedActions villageId={v.id} actions={v.actions} />
        <InterventionTimeline interventions={v.interventions} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <WaterTestsTable v={v} />
        <CaseReportsTable v={v} />
      </div>

      <p className="flex items-center gap-1.5 text-[11px] text-slate-400">
        <Cpu className="w-3.5 h-3.5" />
        Risk, tiers, explanations and actions are live engine output on simulated data. See the model card for how well it backtests.
      </p>
    </div>
  );
}
