'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { Bell, BellRing, ListOrdered, MapPin, Radar } from 'lucide-react';
import { ews } from '@/lib/ews';
import { useEwsData } from '@/lib/useEws';
import KpiCards from '@/components/ews/KpiCards';
import HotspotList from '@/components/ews/HotspotList';
import { AlertItem, NotificationItem } from '@/components/ews/feeds';
import { Card, CardHeader, EngineGate, EngineLoading } from '@/components/ews/ui';
import { fmtDateLong } from '@/components/ews/tiers';

const OutbreakMap = dynamic(() => import('@/components/OutbreakMap'), {
  ssr: false,
  loading: () => <EngineLoading label="Loading map…" />,
});

export default function CommandCenter() {
  const { data, error, simState } = useEwsData(
    () => Promise.all([ews.villages(), ews.alerts('active'), ews.notifications({ limit: 8 })]),
    'command-center',
  );

  if (!data || !simState) return <EngineGate error={error} />;
  const [villages, alerts, notifications] = data;
  const district = villages[0]?.district;

  return (
    <div className="space-y-6 py-2">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-3">
        <div>
          <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
            <Radar className="w-4 h-4" />
            District command center
          </span>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white">
            {district ? `${district} District` : 'Command Center'}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {villages.length} villages monitored · {fmtDateLong(simState.currentDate)} · scenario: {simState.scenarioLabel}
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/simulation" className="px-4 py-2 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-bold">
            Demo run-sheet
          </Link>
          <Link href="/model" className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200">
            How the model works
          </Link>
        </div>
      </div>

      <KpiCards kpis={simState.kpis} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 overflow-hidden">
          <CardHeader
            icon={MapPin}
            title="Risk map"
            subtitle="Colour = tier, size = 7-day outbreak risk. Dashed lines follow the river downstream."
          />
          <div className="p-3">
            <OutbreakMap villages={villages} />
          </div>
        </Card>

        <Card className="flex flex-col">
          <CardHeader
            icon={ListOrdered}
            title="Next hotspots"
            subtitle="Ranked by ML risk; arrow = change since yesterday"
          />
          <div className="flex-1 overflow-y-auto max-h-[600px]">
            <HotspotList villages={villages} />
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader
            icon={Bell}
            title="Active alerts"
            subtitle="One open alert per village; escalations upgrade it"
            right={
              <Link href="/notifications" className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline shrink-0">
                All alerts →
              </Link>
            }
          />
          <div className="p-4 space-y-3 max-h-[560px] overflow-y-auto">
            {alerts.length === 0 ? (
              <p className="text-sm text-slate-500 dark:text-slate-400 py-6 text-center">No active alerts. All villages below alert tiers.</p>
            ) : (
              alerts.map((a) => <AlertItem key={a.id} alert={a} />)
            )}
          </div>
        </Card>

        <Card>
          <CardHeader
            icon={BellRing}
            title="Notifications sent"
            subtitle="App notifications raised automatically by alerts, in each village's language"
            right={
              <Link href="/notifications#notifications" className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline shrink-0">
                Notification log →
              </Link>
            }
          />
          <div className="p-4 space-y-3 max-h-[560px] overflow-y-auto">
            {notifications.length === 0 ? (
              <p className="text-sm text-slate-500 dark:text-slate-400 py-6 text-center">Nothing sent yet.</p>
            ) : (
              notifications.map((n) => <NotificationItem key={n.id} notification={n} />)
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
