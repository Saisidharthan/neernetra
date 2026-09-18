'use client';

import React, { useState } from 'react';
import { Bell, BellRing } from 'lucide-react';
import { ews, type AlertTier, type Lang, type NotificationRole, type OutboundNotification } from '@/lib/ews';
import { useEwsData } from '@/lib/useEws';
import { AlertItem, NotificationItem } from '@/components/ews/feeds';
import { Card, CardHeader, EngineGate } from '@/components/ews/ui';
import { CHANNEL_LABEL, LANG_LABEL, NOTIFICATION_ROLES, TIER_BAR, TIER_LABEL } from '@/components/ews/tiers';

const ALERT_TIERS: AlertTier[] = ['watch', 'warning', 'outbreak'];

function Toggle<T extends string>({ value, options, onChange }: { value: T; options: { id: T; label: React.ReactNode }[]; onChange: (v: T) => void }) {
  return (
    <div className="inline-flex rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-900 p-0.5 text-xs font-bold">
      {options.map((o) => (
        <button
          key={o.id}
          onClick={() => onChange(o.id)}
          className={`px-2.5 py-1 rounded-md transition-colors ${
            value === o.id ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export default function AlertsPage() {
  const [status, setStatus] = useState<'active' | 'all'>('active');
  const [tier, setTier] = useState<AlertTier | 'any'>('any');
  const [role, setRole] = useState<NotificationRole | 'any'>('any');
  const [channel, setChannel] = useState<OutboundNotification['channel'] | 'any'>('any');
  const [lang, setLang] = useState<Lang | 'any'>('any');

  const { data, error } = useEwsData(
    () => Promise.all([ews.alerts(status), ews.notifications({ limit: 100, role: role === 'any' ? undefined : role })]),
    `alerts-${status}-${role}`,
  );

  if (!data) return <EngineGate error={error} />;
  const [alerts, notifications] = data;
  const shownAlerts = alerts.filter((a) => tier === 'any' || a.tier === tier);
  const shownNotifications = notifications.filter(
    (n) => (channel === 'any' || n.channel === channel) && (lang === 'any' || n.language === lang),
  );

  return (
    <div className="space-y-6 py-2">
      <div>
        <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
          <Bell className="w-4 h-4" />
          Alerts &amp; notifications
        </span>
        <h1 className="text-3xl font-black text-slate-900 dark:text-white">Alerts</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Watch → ASHA. Warning → ASHA, PHC and a citizen boil-water notice. Outbreak → adds the DHO, and citizen notices go out as
          high priority. ASHAs and citizens get push notifications on their phones; PHC and DHO see them in-app. Alerts auto-resolve
          after 3 normal days.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        <Card>
          <CardHeader
            icon={Bell}
            title={`${shownAlerts.length} alert${shownAlerts.length === 1 ? '' : 's'}`}
            subtitle="Ack to show the district has seen it; resolve when the village is safe"
          />
          <div className="flex flex-wrap items-center gap-2 px-4 pt-3">
            <Toggle
              value={status}
              onChange={setStatus}
              options={[
                { id: 'active', label: 'Active' },
                { id: 'all', label: 'All' },
              ]}
            />
            <Toggle
              value={tier}
              onChange={setTier}
              options={[
                { id: 'any', label: 'Any tier' },
                ...ALERT_TIERS.map((t) => ({
                  id: t,
                  label: (
                    <span className="inline-flex items-center gap-1">
                      <span className={`w-2 h-2 rounded-full ${TIER_BAR[t]}`} />
                      {TIER_LABEL[t]}
                    </span>
                  ),
                })),
              ]}
            />
          </div>
          <div className="p-4 space-y-3 max-h-[75vh] overflow-y-auto">
            {shownAlerts.length === 0 ? (
              <p className="text-sm text-slate-500 dark:text-slate-400 py-8 text-center">No alerts match.</p>
            ) : (
              shownAlerts.map((a) => <AlertItem key={a.id} alert={a} allowResolve />)
            )}
          </div>
        </Card>

        <Card>
          <div id="notifications" className="scroll-mt-40" />
          <CardHeader
            icon={BellRing}
            title="Notification log"
            subtitle="Exactly what was pushed. Assamese and Hindi texts are shown as sent."
          />
          <div className="flex flex-wrap items-center gap-2 px-4 pt-3">
            <Toggle
              value={role}
              onChange={setRole}
              options={[{ id: 'any', label: 'All roles' }, ...NOTIFICATION_ROLES.map((r) => ({ id: r, label: r }))]}
            />
            <Toggle
              value={channel}
              onChange={setChannel}
              options={[
                { id: 'any', label: 'All channels' },
                ...(Object.keys(CHANNEL_LABEL) as OutboundNotification['channel'][]).map((c) => ({ id: c, label: CHANNEL_LABEL[c] })),
              ]}
            />
            <Toggle
              value={lang}
              onChange={setLang}
              options={[
                { id: 'any', label: 'All languages' },
                ...(Object.keys(LANG_LABEL) as Lang[]).map((l) => ({ id: l, label: LANG_LABEL[l] })),
              ]}
            />
          </div>
          <div className="p-4 space-y-3 max-h-[75vh] overflow-y-auto">
            {shownNotifications.length === 0 ? (
              <p className="text-sm text-slate-500 dark:text-slate-400 py-8 text-center">No notifications match.</p>
            ) : (
              shownNotifications.map((n) => <NotificationItem key={n.id} notification={n} />)
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
