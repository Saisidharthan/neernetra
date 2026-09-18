'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import {
  Activity, ArrowRight, BarChart3, Bell, BrainCircuit, ChevronRight, CloudRain, Droplets, FlaskConical, GitBranch, LayoutDashboard,
  Inbox, MapPin, PlayCircle, ShieldAlert, Sigma, Sparkles, Stethoscope, Truck, Users, WifiOff,
} from 'lucide-react';
import { useSim } from '@/components/ews/SimProvider';
import { EngineLoading, EngineOffline } from '@/components/ews/ui';
import { fmtInt } from '@/components/ews/tiers';

const OutbreakMap = dynamic(() => import('@/components/OutbreakMap'), {
  ssr: false,
  loading: () => <EngineLoading label="Loading map…" />,
});

const PIPELINE = [
  {
    step: 'Sense',
    tag: 'Field + sensors',
    title: 'Rain, water and symptoms',
    body: 'IoT turbidity sensors, ASHA H2S strips, and symptom reports from the ASHA and citizen apps, queued offline when there is no network.',
    icon: CloudRain,
    tone: 'text-sky-400 border-sky-500/40 bg-sky-950/40',
  },
  {
    step: 'Layer 1',
    tag: 'Statistics',
    title: 'CDC EARS C1 / C2 / C3',
    body: 'The standard aberration detector on daily syndromic counts. Transparent, but it only fires once people are already sick.',
    icon: Sigma,
    tone: 'text-violet-400 border-violet-500/40 bg-violet-950/40',
  },
  {
    step: 'Layer 2',
    tag: 'Machine learning',
    title: 'XGBoost + real TreeSHAP',
    body: 'Predicts the chance of an outbreak in the next 7 days from rain, turbidity, H2S, cases, season and the upstream village. Every score comes with its SHAP factors.',
    icon: BrainCircuit,
    tone: 'text-amber-400 border-amber-500/40 bg-amber-950/40',
  },
  {
    step: 'Spread',
    tag: 'River network',
    title: 'Upstream → downstream',
    body: 'Contamination travels with the river. Each village sees its upstream neighbour, so the next hotspot is flagged before its own water turns.',
    icon: GitBranch,
    tone: 'text-cyan-400 border-cyan-500/40 bg-cyan-950/40',
  },
  {
    step: 'Alert',
    tag: 'In local language',
    title: 'App notifications and advisories',
    body: 'ASHAs and citizens get push notifications on their phones, PHC and DHO in the dashboard, in Assamese, Hindi or English. A boil-water or do-not-drink advisory is set automatically.',
    icon: Bell,
    tone: 'text-rose-400 border-rose-500/40 bg-rose-950/40',
  },
  {
    step: 'Close the loop',
    tag: 'Interventions',
    title: 'Dispatch, verify, watch risk fall',
    body: 'Chlorination, medical camps and ORS are dispatched from the explanation, tracked to completion with verification, and feed back into the model.',
    icon: Truck,
    tone: 'text-emerald-400 border-emerald-500/40 bg-emerald-950/40',
  },
];

function LiveStats() {
  const { state, error, villages } = useSim();
  if (error) return <EngineOffline error={error} />;
  const k = state?.kpis;
  const stats = [
    { label: 'Villages monitored', value: villages ? fmtInt(villages.length) : '…', hint: k ? `${fmtInt(k.populationCovered)} people` : '', icon: MapPin, tone: 'text-emerald-500' },
    { label: 'Villages at risk', value: k ? fmtInt(k.villagesAtRisk) : '…', hint: 'tier warning or outbreak', icon: ShieldAlert, tone: 'text-orange-500' },
    { label: 'Active alerts', value: k ? fmtInt(k.activeAlerts) : '…', hint: 'notifications pushed', icon: Bell, tone: 'text-red-500' },
    { label: 'Cases (7 days)', value: k ? fmtInt(k.cases7d) : '…', hint: k ? `${k.positiveWaterTests7d} positive water tests` : '', icon: Activity, tone: 'text-rose-500' },
  ];
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {stats.map((s) => (
        <div key={s.label} className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-md flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">{s.label}</span>
            <s.icon className={`w-5 h-5 ${s.tone}`} />
          </div>
          <div className="mt-4">
            <div className="text-3xl font-black tabular-nums text-slate-900 dark:text-white">{s.value}</div>
            <div className="text-xs text-slate-500 dark:text-slate-400 font-semibold mt-1">{s.hint}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

function LiveMap() {
  const { villages, error } = useSim();
  if (!villages) return error ? null : <EngineLoading />;
  return <OutbreakMap villages={villages} heightClass="h-[480px]" />;
}

export default function LandingPage() {
  const { state } = useSim();

  return (
    <div className="space-y-16 py-4">
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-slate-900 via-slate-950 to-slate-900 border border-slate-800 p-8 sm:p-12 text-white shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl -z-0" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl -z-0" />

        <div className="relative z-10 max-w-4xl space-y-6">
          <div className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-full bg-emerald-950/80 border border-emerald-700/60 text-emerald-400 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>NeerNetra · नीर नेत्र · “the water eye”</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight bg-gradient-to-r from-white via-slate-100 to-slate-300 bg-clip-text text-transparent">
            See the outbreak in the water <span className="bg-gradient-to-r from-cyan-300 to-emerald-300 bg-clip-text text-transparent">before it reaches the clinic</span>
          </h1>

          <p className="text-slate-300 text-sm sm:text-base leading-relaxed max-w-3xl">
            Village-level early warning for cholera, typhoid and diarrhoeal disease. Two detection layers: CDC EARS statistics on case counts,
            and an XGBoost model on rain, water quality and the upstream village, explained with real TreeSHAP. It follows contamination
            downstream, pushes alerts to ASHA and citizen phones in their language, and closes the loop by tracking chlorination and medical camps
            until the risk falls.
          </p>

          <div className="flex flex-wrap gap-4 pt-2">
            <Link
              href="/portal/district"
              className="px-6 py-3.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-bold text-sm shadow-lg shadow-emerald-600/30 flex items-center space-x-2 transition-all transform hover:-translate-y-0.5"
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>Open the Command Center</span>
            </Link>
            <Link
              href="/simulation"
              className="px-6 py-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-sm border border-slate-700 flex items-center space-x-2 transition-all"
            >
              <PlayCircle className="w-4 h-4 text-emerald-400" />
              <span>Run the demo</span>
            </Link>
            <Link
              href="/model"
              className="px-6 py-3.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-300 font-bold text-sm border border-slate-700 flex items-center space-x-2 transition-all"
            >
              <BarChart3 className="w-4 h-4 text-violet-400" />
              <span>Model card</span>
            </Link>
          </div>

          {state && (
            <p className="text-xs text-slate-400">
              Engine live · simulated day {state.dayOfScenario} of “{state.scenarioLabel}”
            </p>
          )}
        </div>
      </section>

      <section className="p-8 rounded-3xl bg-slate-900 border border-slate-800 text-white shadow-2xl space-y-6">
        <div className="border-b border-slate-800 pb-4">
          <div className="inline-flex items-center space-x-1.5 text-xs font-bold text-emerald-400 uppercase tracking-wider">
            <Droplets className="w-4 h-4" />
            <span>How NeerNetra works</span>
          </div>
          <h2 className="text-2xl font-black text-white mt-1">From a muddy tap to a chlorinated tank in one loop</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs">
          {PIPELINE.map((p, i) => (
            <div key={p.title} className="p-5 rounded-2xl border border-slate-800 bg-slate-950 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-black text-slate-300 text-sm">
                  {i + 1}. {p.step}
                </span>
                <span className={`px-2 py-0.5 rounded border font-bold text-[10px] ${p.tone}`}>{p.tag}</span>
              </div>
              <h3 className="flex items-center gap-2 font-bold text-slate-100 text-sm">
                <p.icon className={`w-4 h-4 ${p.tone.split(' ')[0]}`} />
                {p.title}
              </h3>
              <p className="text-slate-400 text-[12px] leading-relaxed">{p.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Activity className="w-6 h-6 text-emerald-500" />
            Live from the engine
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Real engine output on a simulated district. No mock numbers: if the backend is down, this says so.
          </p>
        </div>
        <LiveStats />
      </section>

      <section id="map" className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
              <MapPin className="w-6 h-6 text-emerald-500" />
              Village risk along the river
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Marker colour is the alert tier, size is the 7-day outbreak risk, dashed arrows show which way the river carries contamination.
            </p>
          </div>
          <Link href="/portal/district" className="text-xs font-bold text-emerald-600 dark:text-emerald-400 inline-flex items-center gap-1 self-start">
            Full Command Center <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
        <LiveMap />
      </section>

      <section className="space-y-6">
        <div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Users className="w-6 h-6 text-teal-500" />
            Built for every level
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">The district officer sees the whole river; field workers report from wherever they are, with or without data.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              href: '/portal/district',
              title: 'District Command Center',
              body: 'Ranked next hotspots, a risk map with river links, alerts to acknowledge, and one-click dispatch of interventions.',
              cta: 'Open Command Center',
              icon: ShieldAlert,
              tone: 'bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-400',
            },
            {
              href: '/portal/asha',
              title: 'ASHA field app',
              body: 'Symptom counts and H2S strip results in a few taps. Works offline and syncs when the network returns.',
              cta: 'Open ASHA app',
              icon: Stethoscope,
              tone: 'bg-teal-100 dark:bg-teal-950 text-teal-600 dark:text-teal-400',
            },
            {
              href: '/inbox',
              title: 'Alerts on the phone',
              body: 'Watch an alert arrive as a push notification on an ASHA phone and a citizen phone, in Assamese, the moment the engine raises it.',
              cta: 'Open the Inbox',
              icon: Inbox,
              tone: 'bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400',
            },
          ].map((p) => (
            <div
              key={p.href}
              className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-emerald-500 dark:hover:border-emerald-500 transition-all shadow-md group flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform ${p.tone}`}>
                  <p.icon className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">{p.title}</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{p.body}</p>
              </div>
              <Link href={p.href} className="mt-6 inline-flex items-center text-xs font-bold text-emerald-600 dark:text-emerald-400 group-hover:translate-x-1 transition-transform">
                <span>{p.cta}</span>
                <ChevronRight className="w-4 h-4 ml-1" />
              </Link>
            </div>
          ))}
        </div>
      </section>

      <section className="p-8 rounded-3xl bg-slate-900 text-white border border-slate-800 space-y-6 shadow-xl">
        <div className="max-w-3xl space-y-2">
          <div className="inline-flex items-center space-x-1 text-xs font-bold text-emerald-400 uppercase tracking-wider">
            <BrainCircuit className="w-4 h-4" />
            <span>Explainable, and honest about it</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black">Why two layers beat one</h2>
          <p className="text-sm text-slate-300 leading-relaxed">
            EARS is what health departments already trust, but it is reactive. The ML layer reads the water and the weather, so it can warn days
            earlier, and TreeSHAP shows which signals pushed each village up. The model card compares both on a held-out year.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 pt-2">
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
            <div className="text-violet-400 font-bold text-sm">EARS C2 / C3</div>
            <p className="text-[12px] text-slate-400">7-day baseline with a 2-day guard band; flags a statistical spike in case counts.</p>
          </div>
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
            <div className="text-amber-400 font-bold text-sm">XGBoost risk</div>
            <p className="text-[12px] text-slate-400">P(outbreak in the next 7 days) from 14 days of rain, turbidity, H2S, cases and the upstream signal.</p>
          </div>
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
            <div className="text-cyan-400 font-bold text-sm">TreeSHAP factors</div>
            <p className="text-[12px] text-slate-400">Exact per-prediction contributions, grouped into plain-language reasons on every village page.</p>
          </div>
          <div className="p-4 rounded-xl bg-slate-950 border border-amber-700/60 space-y-2">
            <div className="flex items-center gap-1.5 text-amber-300 font-bold text-sm">
              <FlaskConical className="w-4 h-4" />
              Synthetic data
            </div>
            <p className="text-[12px] text-slate-400">
              The district and its history are simulated. We say so on the model card; the numbers there are a method check, not a field result.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400">
          <WifiOff className="w-4 h-4 text-emerald-400" />
          Field reporting works offline and syncs when the network returns, so the villages most at risk are not the ones left out.
          <Link href="/model" className="font-bold text-emerald-400 inline-flex items-center gap-1">
            Read the model card <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </section>
    </div>
  );
}
