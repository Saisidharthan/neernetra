'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { CartesianGrid, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { ArrowUpRight, CheckSquare, Clapperboard, LoaderCircle, PlayCircle, ScrollText, Square, Timer, TrendingUp } from 'lucide-react';
import { ews, type ModelCard } from '@/lib/ews';
import { useSim, type RunLog } from '@/components/ews/SimProvider';
import { Card, CardHeader, EngineGate } from '@/components/ews/ui';
import { useTheme } from '@/lib/theme';
import { fmtDate, pct } from '@/components/ews/tiers';

const PALETTE = {
  light: ['#2a78d6', '#eb6834', '#1baf7a', '#eda100', '#e87ba4', '#4a3aa7'],
  dark: ['#3987e5', '#d95926', '#199e70', '#c98500', '#d55181', '#9085e9'],
};
const OTHER_HEX = '#94a3b8';

interface Beat {
  id: string;
  title: string;
  detail: string;
  href: (topId: string | null) => string;
  cta: string;
}

const BEATS: Beat[] = [
  { id: 'baseline', title: 'Baseline', detail: 'Day 0: every village green, KPIs near zero. Point at the river links on the map.', href: () => '/portal/district', cta: 'Command Center' },
  { id: 'cloudburst', title: 'Cloudburst upstream', detail: 'Step to day 2: heavy rain at the head of the catchment. Narration calls it out.', href: () => '/portal/district', cta: 'Command Center' },
  { id: 'water', title: 'Turbidity and H2S', detail: 'Upstream water turns turbid; H2S strips go positive before anyone is sick.', href: () => '/water-quality', cta: 'Water readings' },
  { id: 'ears-vs-ml', title: 'EARS vs ML: ML warns first', detail: 'Open the top village: ML is firing while EARS is still quiet. That gap is the lead time.', href: (t) => (t ? `/village/${encodeURIComponent(t)}` : '/portal/district'), cta: 'Top village' },
  { id: 'alert', title: 'Alert pushed to ASHA and citizen phones in Assamese', detail: 'Warning tier pushes a notification to the ASHA and a boil-water notice to citizens in the village language; PHC sees it in-app.', href: () => '/inbox', cta: 'Inbox' },
  { id: 'dispatch', title: 'Dispatch chlorination', detail: 'Dispatch at the first warning (day 2, before any cases) and the outbreak never happens; wait for the case spike and it arrives anyway, because people were already infected. It moves to in progress the next day.', href: (t) => (t ? `/village/${encodeURIComponent(t)}` : '/portal/district'), cta: 'Top village' },
  { id: 'recovery', title: 'Risk falls, advisory back to safe', detail: 'Keep stepping: chlorination cuts contamination, risk drops, the advisory returns to safe.', href: () => '/portal/district', cta: 'Command Center' },
  { id: 'model', title: 'Show the model card', detail: 'Backtest vs EARS and thresholds, lead-time histogram, and the synthetic-data disclaimer.', href: () => '/model', cta: 'Model card' },
];

function highlighted(log: RunLog): string[] {
  const firstSeen = new Map<string, number>();
  for (const d of log.days) {
    for (const [id, s] of Object.entries(d.villages)) {
      if (s.tier !== 'normal' && !firstSeen.has(id)) firstSeen.set(id, d.day);
    }
  }
  return [...firstSeen.entries()].sort((a, b) => a[1] - b[1]).slice(0, PALETTE.light.length).map(([id]) => id);
}

function leadTimes(log: RunLog, threshold: number) {
  const rows = new Map<string, { ml: number | null; ears: number | null }>();
  for (const d of log.days) {
    for (const [id, s] of Object.entries(d.villages)) {
      const r = rows.get(id) ?? { ml: null, ears: null };
      if (r.ml === null && s.risk >= threshold) r.ml = d.day;
      if (r.ears === null && s.earsFlagged) r.ears = d.day;
      rows.set(id, r);
    }
  }
  return [...rows.entries()].filter(([, r]) => r.ml !== null || r.ears !== null);
}

function RiskOverTime({ log, names, threshold }: { log: RunLog; names: Record<string, string>; threshold: number | null }) {
  const { theme } = useTheme();
  const colors = PALETTE[theme];
  const focus = highlighted(log);
  const all = Object.keys(log.days[log.days.length - 1].villages);
  const others = all.filter((id) => !focus.includes(id));
  const data = log.days.map((d) => ({
    day: d.day,
    date: d.date,
    ...Object.fromEntries(Object.entries(d.villages).map(([id, s]) => [id, s.risk])),
  }));
  const axis = theme === 'dark' ? '#94a3b8' : '#64748b';
  const grid = theme === 'dark' ? '#1e293b' : '#e2e8f0';

  return (
    <div className="space-y-2">
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data} margin={{ top: 10, right: 16, bottom: 0, left: -12 }}>
          <CartesianGrid stroke={grid} vertical={false} />
          <XAxis dataKey="day" tickFormatter={(d: number) => `D${d}`} tick={{ fill: axis, fontSize: 11 }} stroke={grid} />
          <YAxis domain={[0, 1]} ticks={[0, 0.25, 0.5, 0.75, 1]} tickFormatter={(v: number) => pct(v)} tick={{ fill: axis, fontSize: 11 }} stroke={grid} />
          <Tooltip
            formatter={(v, name) => [pct(Number(v)), names[String(name)] ?? String(name)]}
            labelFormatter={(d) => {
              const row = data.find((r) => r.day === d);
              return row ? `Day ${d} · ${fmtDate(row.date)}` : `Day ${d}`;
            }}
            itemSorter={(item) => -Number(item.value)}
            contentStyle={{ fontSize: 12, borderRadius: 8 }}
          />
          {threshold !== null && (
            <ReferenceLine y={threshold} stroke="#e34948" strokeDasharray="6 4" label={{ value: 'threshold', position: 'insideTopLeft', fill: '#e34948', fontSize: 11 }} />
          )}
          {others.map((id) => (
            <Line key={id} dataKey={id} name={id} stroke={OTHER_HEX} strokeOpacity={0.45} strokeWidth={1} dot={false} isAnimationActive={false} />
          ))}
          {focus.map((id, i) => (
            <Line key={id} dataKey={id} name={id} stroke={colors[i]} strokeWidth={2.5} dot={{ r: 3 }} isAnimationActive={false} />
          ))}
        </LineChart>
      </ResponsiveContainer>
      <div className="flex flex-wrap gap-x-4 gap-y-1 px-2 text-xs text-slate-700 dark:text-slate-200">
        {focus.map((id, i) => (
          <span key={id} className="inline-flex items-center gap-1.5">
            <span className="w-4 h-1 rounded-full" style={{ background: colors[i] }} />
            {names[id] ?? id}
          </span>
        ))}
        {others.length > 0 && (
          <span className="inline-flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
            <span className="w-4 h-0.5 rounded-full" style={{ background: OTHER_HEX }} />
            {others.length} other villages
          </span>
        )}
      </div>
    </div>
  );
}

export default function DemoPage() {
  const { state, error, dataError, scenarios, villages, log, beats, toggleBeat, clearBeats } = useSim();
  const [resetting, setResetting] = useState<string | null>(null);
  const [resetError, setResetError] = useState<string | null>(null);
  const [card, setCard] = useState<ModelCard | null>(null);
  const [cardError, setCardError] = useState<string | null>(null);
  const online = state !== null && !error;

  useEffect(() => {
    if (!online) return;
    let cancelled = false;
    ews.modelCard().then(
      (c) => !cancelled && setCard(c),
      (e) => !cancelled && setCardError(e instanceof Error ? e.message : String(e)),
    );
    return () => {
      cancelled = true;
    };
  }, [online]);

  if (!state || !scenarios || !villages || !log) return <EngineGate error={error ?? dataError} />;

  const reset = async (id: string) => {
    setResetting(id);
    setResetError(null);
    try {
      await ews.reset(id);
    } catch (e) {
      setResetError(e instanceof Error ? e.message : String(e));
    } finally {
      setResetting(null);
    }
  };

  const names = Object.fromEntries(villages.map((v) => [v.id, v.name]));
  const topId = [...villages].sort((a, b) => a.rank - b.rank)[0]?.id ?? null;
  const threshold = card?.threshold ?? null;
  const leads = threshold === null ? [] : leadTimes(log, threshold);
  const narrations = [...log.days].reverse().filter((d) => d.narration);
  const done = BEATS.filter((b) => beats[b.id]).length;

  return (
    <div className="space-y-6 py-2">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-3">
        <div>
          <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
            <Clapperboard className="w-4 h-4" />
            3-minute pitch
          </span>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white">Demo run-sheet</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Pick a scenario, then drive time with the bar above (+1 day / Play). Everything below is recorded from the live engine as days advance.
          </p>
        </div>
        <div className="text-right">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Now</div>
          <div className="text-lg font-black text-slate-900 dark:text-white">
            Day {state.dayOfScenario} · {state.scenarioLabel}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {scenarios.map((s) => {
          const active = s.id === state.scenario;
          return (
            <button
              key={s.id}
              onClick={() => reset(s.id)}
              disabled={resetting !== null}
              className={`text-left rounded-2xl border-2 p-5 shadow-md transition-all hover:-translate-y-0.5 disabled:opacity-60 ${
                active
                  ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40'
                  : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-emerald-400'
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-base font-black text-slate-900 dark:text-white">{s.label}</span>
                {resetting === s.id ? (
                  <LoaderCircle className="w-4 h-4 animate-spin text-emerald-500" />
                ) : active ? (
                  <span className="rounded bg-emerald-600 text-white px-1.5 py-0.5 text-[10px] font-black uppercase">Running</span>
                ) : (
                  <PlayCircle className="w-5 h-5 text-slate-400" />
                )}
              </div>
              <p className="mt-2 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">{s.description}</p>
              <p className="mt-3 text-[11px] font-bold text-emerald-700 dark:text-emerald-400">{active ? 'Click to restart from day 0' : 'Click to reset into this scenario'}</p>
            </button>
          );
        })}
      </div>
      {resetError && <p className="text-xs text-red-600 dark:text-red-400 break-all">{resetError}</p>}
      {cardError && (
        <p className="text-xs text-amber-700 dark:text-amber-400 break-all">
          Model card unavailable, so the threshold line and ML-vs-EARS table are hidden: {cardError}
        </p>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader
              icon={TrendingUp}
              title="Risk over time, this run"
              subtitle={`Built client-side from day ${log.days[0].day}. Coloured = villages that left 'normal', in the order they did.`}
            />
            <div className="p-4">
              {log.days.length < 2 ? (
                <p className="text-sm text-slate-500 dark:text-slate-400 py-16 text-center">Step a day or press Play to start drawing.</p>
              ) : (
                <RiskOverTime log={log} names={names} threshold={threshold} />
              )}
            </div>
          </Card>

          {leads.length > 0 && (
            <Card>
              <CardHeader icon={Timer} title="ML vs EARS in this run" subtitle="First day each detector fired per village. Positive lead = ML warned earlier." />
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="text-left text-[10px] uppercase tracking-wider text-slate-400">
                    <tr className="border-b border-slate-100 dark:border-slate-800">
                      <th className="px-5 py-2">Village</th>
                      <th className="px-3 py-2">ML ≥ {pct(threshold ?? 0)}</th>
                      <th className="px-3 py-2">EARS flag</th>
                      <th className="px-5 py-2 text-right">Lead</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 tabular-nums">
                    {leads.map(([id, r]) => {
                      const lead = r.ml !== null && r.ears !== null ? r.ears - r.ml : null;
                      return (
                        <tr key={id}>
                          <td className="px-5 py-2 font-semibold">
                            <Link href={`/village/${encodeURIComponent(id)}`} className="hover:underline">{names[id] ?? id}</Link>
                          </td>
                          <td className="px-3 py-2">{r.ml === null ? '—' : `Day ${r.ml}`}</td>
                          <td className="px-3 py-2">{r.ears === null ? 'not yet' : `Day ${r.ears}`}</td>
                          <td className={`px-5 py-2 text-right font-black ${lead !== null && lead > 0 ? 'text-emerald-600 dark:text-emerald-400' : ''}`}>
                            {lead === null ? (r.ml !== null ? 'ML only so far' : '—') : `${lead > 0 ? '+' : ''}${lead} d`}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </Card>
          )}

          <Card>
            <CardHeader icon={ScrollText} title="Narration log" subtitle="Each day's story beat from the engine, newest first" />
            <ol className="p-4 space-y-2 max-h-[360px] overflow-y-auto">
              {narrations.length === 0 && <li className="text-sm text-slate-500 dark:text-slate-400 py-4 text-center">No narration yet.</li>}
              {narrations.map((d) => (
                <li key={d.day} className="flex gap-3 rounded-lg bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 px-3 py-2">
                  <span className="shrink-0 w-14 text-xs font-black text-emerald-700 dark:text-emerald-400 tabular-nums">
                    Day {d.day}
                    <span className="block text-[10px] font-semibold text-slate-400">{fmtDate(d.date)}</span>
                  </span>
                  <span className="text-sm text-slate-800 dark:text-slate-100">{d.narration}</span>
                </li>
              ))}
            </ol>
          </Card>
        </div>

        <Card className="self-start lg:sticky lg:top-40">
          <CardHeader
            icon={CheckSquare}
            title="Presenter checklist"
            subtitle={`${done} of ${BEATS.length} beats shown`}
            right={
              <button onClick={clearBeats} className="text-[11px] font-bold text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 shrink-0">
                Clear
              </button>
            }
          />
          <ol className="p-3 space-y-1">
            {BEATS.map((b, i) => (
              <li key={b.id} className={`rounded-xl px-2 py-2 ${beats[b.id] ? 'opacity-60' : ''}`}>
                <div className="flex items-start gap-2">
                  <button onClick={() => toggleBeat(b.id)} aria-label={`Mark "${b.title}" done`} className="mt-0.5 shrink-0 text-emerald-600 dark:text-emerald-400">
                    {beats[b.id] ? <CheckSquare className="w-5 h-5" /> : <Square className="w-5 h-5" />}
                  </button>
                  <div className="min-w-0 space-y-0.5">
                    <div className={`text-sm font-bold text-slate-900 dark:text-white ${beats[b.id] ? 'line-through' : ''}`}>
                      {i + 1}. {b.title}
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-snug">{b.detail}</p>
                    <Link
                      href={b.href(topId)}
                      className="inline-flex items-center gap-0.5 text-[11px] font-bold text-emerald-700 dark:text-emerald-400 hover:underline"
                    >
                      {b.cta}
                      <ArrowUpRight className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              </li>
            ))}
          </ol>
        </Card>
      </div>
    </div>
  );
}
