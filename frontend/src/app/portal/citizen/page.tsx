'use client';

import { useCallback, useState } from 'react';
import { AlertTriangle, Bell, CupSoda, Droplets, Phone, RefreshCw, Send, Stethoscope, Wind } from 'lucide-react';
import { ews, type Advisory, type OutboundNotification, type Symptoms, type VillageSummary, type WaterTestInput } from '@/lib/ews';
import { useEwsData } from '@/lib/useEws';
import { t, tf, toEngineLang } from '@/lib/i18n';
import { newClientId, pickVillage, useLanguage, useNotice, useStoredState } from '@/components/field/hooks';
import { LanguageSelect, VillageSelect } from '@/components/field/FieldSelects';
import AdvisoryCard, { ADVISORY_STYLE } from '@/components/field/AdvisoryCard';
import SymptomCounters, { EMPTY_SYMPTOMS, symptomTotal } from '@/components/field/SymptomCounters';
import EngineOffline from '@/components/field/EngineOffline';
import Toast from '@/components/field/Toast';
import NotificationCard, { whenLabel } from '@/components/field/NotificationCard';
import NotifyButton from '@/components/field/NotifyButton';
import { useDeviceNotifications } from '@/components/field/useDeviceNotifications';

type Look = NonNullable<WaterTestInput['appearance']>;

interface CitizenData {
  villages: VillageSummary[];
  advisory: Advisory | null;
  notifications: OutboundNotification[];
}

const LOOKS: { value: Look; key: string; swatch: string }[] = [
  { value: 'clear', key: 'look_clear', swatch: 'bg-sky-100 border-sky-300' },
  { value: 'cloudy', key: 'look_cloudy', swatch: 'bg-stone-300 border-stone-400' },
  { value: 'muddy', key: 'look_muddy', swatch: 'bg-amber-800 border-amber-900' },
];

const ORS_STEPS = ['ors_step1', 'ors_step2', 'ors_step3', 'ors_step4'];

export default function CitizenPortal() {
  const [lang, setLang] = useLanguage();
  const tr = useCallback((key: string) => t(lang, key), [lang]);
  const engineLang = toEngineLang(lang);
  const [storedVillage, setStoredVillage] = useStoredState('neernetra_citizen_village', '');

  const { data, error, loading, reload, simState } = useEwsData<CitizenData>(async () => {
    const villages = await ews.villages();
    const id = pickVillage(villages, storedVillage);
    if (!id) return { villages, advisory: null, notifications: [] };
    const [advisory, notifications] = await Promise.all([
      ews.advisory(id, engineLang),
      ews.notifications({ role: 'Citizens', villageId: id, limit: 10 }),
    ]);
    return { villages, advisory, notifications };
  }, `${storedVillage}:${engineLang}`);

  const villageId = pickVillage(data?.villages, storedVillage);
  const current = data?.advisory?.villageId === villageId ? data : null;
  const advisory = current?.advisory ?? null;
  const notifications = current?.notifications ?? null;
  const deviceNotify = useDeviceNotifications(notifications, villageId ? `Citizens:${villageId}` : '');
  const engineDown = !!error && !data;
  const [notice, flash] = useNotice();

  const [symptoms, setSymptoms] = useState<Symptoms>(EMPTY_SYMPTOMS);
  const [sendingReport, setSendingReport] = useState(false);
  const total = symptomTotal(symptoms);

  const submitReport = async () => {
    if (!villageId || total === 0) return;
    setSendingReport(true);
    try {
      await ews.submitReport({ villageId, reporterRole: 'citizen', channel: 'app', symptoms, clientId: newClientId() });
      setSymptoms(EMPTY_SYMPTOMS);
      flash({ tone: 'ok', text: tr('thanks_report') });
    } catch {
      flash({ tone: 'error', text: tr('send_failed') });
    } finally {
      setSendingReport(false);
    }
  };

  const [look, setLook] = useState<Look | null>(null);
  const [smellsBad, setSmellsBad] = useState(false);
  const [sendingWater, setSendingWater] = useState(false);

  const submitWater = async () => {
    if (!villageId || (look === null && !smellsBad)) return;
    setSendingWater(true);
    try {
      await ews.submitWaterTest({
        villageId,
        source: 'citizen',
        appearance: look,
        notes: smellsBad ? 'Bad smell reported by resident' : undefined,
        clientId: newClientId(),
      });
      setLook(null);
      setSmellsBad(false);
      flash({ tone: 'ok', text: tr('thanks_report') });
    } catch {
      flash({ tone: 'error', text: tr('send_failed') });
    } finally {
      setSendingWater(false);
    }
  };

  return (
    <div className="max-w-md mx-auto space-y-4 pb-24">
      <header className="space-y-3">
        <div>
          <div className="text-[11px] uppercase font-bold tracking-wider text-teal-700 dark:text-teal-400">{tr('nn_app')}</div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white leading-tight">{tr('citizen_title')}</h1>
        </div>
        <div className="grid grid-cols-[1fr_auto] gap-2">
          <VillageSelect villages={data?.villages ?? []} value={villageId} onChange={setStoredVillage} label={tr('village')} />
          <LanguageSelect value={lang} onChange={setLang} label={tr('language')} />
        </div>
      </header>

      {engineDown && (
        <EngineOffline title={tr('engine_offline')} detail={tr('engine_offline_desc')} retryLabel={tr('retry')} onRetry={reload} />
      )}

      {advisory ? (
        <AdvisoryCard
          advisory={advisory}
          statusLabel={tr(ADVISORY_STYLE[advisory.status].labelKey)}
          whatToDoLabel={tr('what_to_do')}
          footer={
            <>
              <span>{advisory.villageName}</span>
              <span className="px-2 py-0.5 rounded-full bg-white/20 uppercase tracking-wide">{tr(`tier_${advisory.tier}`)}</span>
              <span className="tabular-nums">{tf(lang, 'updated_on', { date: advisory.updatedDate })}</span>
            </>
          }
        />
      ) : (
        !engineDown && (
          <div className="h-80 rounded-3xl bg-slate-200/70 dark:bg-slate-900 animate-pulse" aria-label={loading ? tr('loading') : undefined} />
        )
      )}

      {notifications && (
        <section className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 space-y-3 shadow-sm">
          <div className="flex flex-wrap items-center gap-2">
            <Bell className="w-5 h-5 text-teal-600" />
            <h2 className="text-base font-black text-slate-900 dark:text-white">{tr('tab_notifications')}</h2>
            <NotifyButton status={deviceNotify.status} onEnable={deviceNotify.enable} label={tr} className="ml-auto" />
          </div>
          {notifications.length === 0 ? (
            <p className="text-sm text-slate-500 dark:text-slate-400">{tr('no_notifications')}</p>
          ) : (
            notifications.map((n) => (
              <NotificationCard key={n.id} notification={n} when={whenLabel(n.date, simState?.currentDate, lang)} urgentLabel={tr('high_priority')} />
            ))
          )}
        </section>
      )}

      <section className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 space-y-3 shadow-sm">
        <div className="flex items-center gap-2">
          <Stethoscope className="w-5 h-5 text-teal-600" />
          <h2 className="text-base font-black text-slate-900 dark:text-white">{tr('anyone_sick')}</h2>
          <span className="ml-auto text-sm font-bold text-teal-700 dark:text-teal-400 tabular-nums">{tf(lang, 'total_people', { n: total })}</span>
        </div>
        <SymptomCounters value={symptoms} onChange={setSymptoms} label={tr} size="md" />
        <ActionButton busy={sendingReport} disabled={total === 0 || !villageId} onClick={submitReport} label={tr('send_report')} />
      </section>

      <section className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 space-y-3 shadow-sm">
        <div className="flex items-center gap-2">
          <Droplets className="w-5 h-5 text-sky-600" />
          <h2 className="text-base font-black text-slate-900 dark:text-white">{tr('report_bad_water')}</h2>
        </div>
        <div className="text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">{tr('appearance')}</div>
        <div className="grid grid-cols-3 gap-2">
          {LOOKS.map(({ value, key, swatch }) => (
            <button
              key={value}
              type="button"
              aria-pressed={look === value}
              onClick={() => setLook(look === value ? null : value)}
              className={`p-3 rounded-2xl border-2 flex flex-col items-center gap-2 transition-colors ${
                look === value ? 'border-teal-500 bg-teal-50 dark:bg-teal-950/40' : 'border-slate-200 dark:border-slate-800'
              }`}
            >
              <span className={`w-10 h-10 rounded-full border-2 ${swatch}`} />
              <span className="text-sm font-bold text-slate-900 dark:text-white">{tr(key)}</span>
            </button>
          ))}
        </div>
        <button
          type="button"
          aria-pressed={smellsBad}
          onClick={() => setSmellsBad(!smellsBad)}
          className={`w-full p-3 rounded-2xl border-2 flex items-center gap-3 transition-colors ${
            smellsBad ? 'border-amber-500 bg-amber-50 dark:bg-amber-950/40' : 'border-slate-200 dark:border-slate-800'
          }`}
        >
          <span className="w-10 h-10 rounded-full bg-lime-100 text-lime-700 dark:bg-lime-950 dark:text-lime-300 flex items-center justify-center">
            <Wind className="w-5 h-5" />
          </span>
          <span className="text-sm font-bold text-slate-900 dark:text-white">{tr('smells_bad')}</span>
          <span className={`ml-auto w-6 h-6 rounded-md border-2 ${smellsBad ? 'bg-amber-500 border-amber-500' : 'border-slate-300 dark:border-slate-600'}`} />
        </button>
        <ActionButton busy={sendingWater} disabled={(look === null && !smellsBad) || !villageId} onClick={submitWater} label={tr('send')} />
      </section>

      <section className="rounded-3xl bg-sky-50 dark:bg-sky-950/30 border border-sky-200 dark:border-sky-900 p-4 space-y-3">
        <div className="flex items-center gap-2">
          <CupSoda className="w-5 h-5 text-sky-600" />
          <h2 className="text-base font-black text-slate-900 dark:text-white">{tr('ors_title')}</h2>
        </div>
        <ol className="space-y-2">
          {ORS_STEPS.map((key, i) => (
            <li key={key} className="flex items-start gap-3 text-sm text-slate-800 dark:text-slate-200 leading-snug">
              <span className="w-7 h-7 shrink-0 rounded-full bg-sky-600 text-white font-black flex items-center justify-center text-sm">{i + 1}</span>
              <span className="pt-0.5">{tr(key)}</span>
            </li>
          ))}
        </ol>
        <p className="text-sm rounded-2xl bg-white dark:bg-slate-900 p-3 text-slate-700 dark:text-slate-300 leading-snug">{tr('ors_home')}</p>
        <p className="text-sm rounded-2xl bg-red-100 dark:bg-red-950/50 text-red-800 dark:text-red-300 p-3 font-semibold flex items-start gap-2 leading-snug">
          <AlertTriangle className="w-5 h-5 shrink-0" />
          {tr('ors_danger')}
        </p>
      </section>

      <a
        href="tel:108"
        className="flex items-center justify-center gap-2 h-14 rounded-2xl bg-red-600 hover:bg-red-700 text-white text-base font-black shadow-lg shadow-red-600/30"
      >
        <Phone className="w-5 h-5" />
        {tr('emergency')}
      </a>

      <Toast notice={notice} />
    </div>
  );
}

function ActionButton({ busy, disabled, onClick, label }: { busy: boolean; disabled: boolean; onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || busy}
      className="w-full h-14 rounded-2xl bg-teal-600 hover:bg-teal-700 text-white text-base font-black flex items-center justify-center gap-2 shadow-lg shadow-teal-600/30 disabled:opacity-40 disabled:shadow-none transition-colors"
    >
      {busy ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
      {label}
    </button>
  );
}
