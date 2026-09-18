'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { BellOff, MapPin } from 'lucide-react';
import { ews, type NotificationRole, type OutboundNotification, type VillageSummary } from '@/lib/ews';
import { useEwsData } from '@/lib/useEws';
import { t } from '@/lib/i18n';
import { pickVillage, useStoredState } from '@/components/field/hooks';
import { VillageSelect } from '@/components/field/FieldSelects';
import { useDeviceNotifications } from '@/components/field/useDeviceNotifications';
import NotifyButton from '@/components/field/NotifyButton';
import NotificationCard, { whenLabel } from '@/components/field/NotificationCard';
import EngineOffline from '@/components/field/EngineOffline';
import PhoneFrame from '@/components/field/PhoneFrame';

interface Feed {
  villageId: string;
  items: OutboundNotification[];
}

interface InboxData {
  villages: VillageSummary[];
  asha: Feed;
  citizens: Feed;
}

const en = (key: string) => t('en', key);

async function feed(role: NotificationRole, villageId: string): Promise<Feed> {
  return { villageId, items: villageId ? await ews.notifications({ role, villageId, limit: 30 }) : [] };
}

export default function NotificationInbox() {
  const [ashaDefault] = useStoredState('neernetra_asha_village', '');
  const [citizenDefault] = useStoredState('neernetra_citizen_village', '');
  const [ashaStored, setAshaStored] = useStoredState('neernetra_inbox_asha_village', '');
  const [citizenStored, setCitizenStored] = useStoredState('neernetra_inbox_citizen_village', '');
  const ashaWanted = ashaStored || ashaDefault;
  const citizenWanted = citizenStored || citizenDefault;

  const { data, error, reload, simState } = useEwsData<InboxData>(async () => {
    const villages = await ews.villages();
    const [asha, citizens] = await Promise.all([
      feed('ASHA', pickVillage(villages, ashaWanted)),
      feed('Citizens', pickVillage(villages, citizenWanted)),
    ]);
    return { villages, asha, citizens };
  }, `${ashaWanted}|${citizenWanted}`);

  const villages = data?.villages ?? [];
  const ashaVillage = pickVillage(data?.villages, ashaWanted);
  const citizenVillage = pickVillage(data?.villages, citizenWanted);
  const ashaItems = data?.asha.villageId === ashaVillage ? data.asha.items : null;
  const citizenItems = data?.citizens.villageId === citizenVillage ? data.citizens.items : null;

  const ashaNotify = useDeviceNotifications(ashaItems, ashaVillage ? `ASHA:${ashaVillage}` : '');
  useDeviceNotifications(citizenItems, citizenVillage ? `Citizens:${citizenVillage}` : '');

  const clock = simState ? `Day ${simState.dayOfScenario}` : '--';
  const today = simState?.currentDate ?? null;

  const phones = [
    { key: 'asha', label: 'ASHA phone', village: ashaVillage, setVillage: setAshaStored, items: ashaItems },
    { key: 'citizen', label: 'Citizen phone', village: citizenVillage, setVillage: setCitizenStored, items: citizenItems },
  ];

  return (
    <div className="space-y-6 py-2 pb-16">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <div>
          <span className="text-xs uppercase font-bold tracking-wider text-teal-700 dark:text-teal-400">NeerNetra · app notifications</span>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mt-1">What reaches people&apos;s phones</h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1 max-w-2xl">
            When a village crosses a risk tier, the engine pushes a notification to the ASHA and to the village&apos;s residents in their own
            language. Step the demo and watch them land.
          </p>
        </div>
        <NotifyButton status={ashaNotify.status} onEnable={ashaNotify.enable} label={en} />
      </div>

      {error && !data && (
        <EngineOffline
          title="Engine offline"
          detail="Cannot reach the NeerNetra engine on /api/v1/ews. No notifications to show."
          retryLabel="Retry"
          onRetry={reload}
        />
      )}

      <div className="flex flex-wrap justify-center items-start gap-10">
        {phones.map((p) => {
          const village = villages.find((v) => v.id === p.village);
          return (
            <PhoneFrame
              key={p.key}
              label={p.label}
              clock={clock}
              controls={<VillageSelect villages={villages} value={p.village} onChange={p.setVillage} label={`${p.label} village`} />}
            >
              <div className="text-center pt-5 pb-4 px-4">
                <div className="text-xs font-semibold text-white/70 tabular-nums">{today ?? ''}</div>
                <div className="text-6xl font-extralight tracking-tight tabular-nums">{clock}</div>
                {village && (
                  <div className="mt-1 text-xs text-white/70 flex items-center justify-center gap-1">
                    <MapPin className="w-3 h-3" />
                    {village.name} · {village.district}
                  </div>
                )}
              </div>
              <div className="flex-1 overflow-y-auto px-3 pb-6 space-y-2">
                {p.items && p.items.length === 0 && (
                  <div className="mt-10 text-center text-xs text-white/60">
                    <BellOff className="w-6 h-6 mx-auto mb-1.5 opacity-70" />
                    No notifications for this village yet.
                  </div>
                )}
                <AnimatePresence initial={false}>
                  {p.items?.map((n) => (
                    <motion.div
                      key={n.id}
                      layout
                      initial={{ opacity: 0, y: -24, scale: 0.96 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                    >
                      <NotificationCard notification={n} when={whenLabel(n.date, today, 'en')} urgentLabel="Urgent" variant="lock" />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
              <div className="mx-auto mb-2 w-28 h-1 rounded-full bg-white/60" />
            </PhoneFrame>
          );
        })}
      </div>
    </div>
  );
}
