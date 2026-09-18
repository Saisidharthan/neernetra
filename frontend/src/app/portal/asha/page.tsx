'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Bell, BellOff, CloudUpload, Droplets, RefreshCw, Save, Send, ShieldCheck, Siren, Stethoscope, TrendingDown, TrendingUp, Wifi, WifiOff,
} from 'lucide-react';
import {
  ews, type Alert, type CaseReportInput, type OutboundNotification, type Symptoms, type VillageSummary, type WaterTestInput,
} from '@/lib/ews';
import { useEwsData } from '@/lib/useEws';
import { t, tf } from '@/lib/i18n';
import { countQueued, queueReport, queueWaterTest, syncQueued, type SyncResult } from '@/lib/offlineStorage';
import { newClientId, pickVillage, useLanguage, useNetworkOnline, useNotice, useStoredState } from '@/components/field/hooks';
import { LanguageSelect, VillageSelect } from '@/components/field/FieldSelects';
import SymptomCounters, { EMPTY_SYMPTOMS, symptomTotal } from '@/components/field/SymptomCounters';
import TierBadge, { TIER_STYLE } from '@/components/field/TierBadge';
import { ADVISORY_STYLE, AdvisoryChip } from '@/components/field/AdvisoryCard';
import EngineOffline from '@/components/field/EngineOffline';
import NotificationCard, { whenLabel } from '@/components/field/NotificationCard';
import NotifyButton from '@/components/field/NotifyButton';
import { useDeviceNotifications } from '@/components/field/useDeviceNotifications';
import Toast from '@/components/field/Toast';

interface AshaData {
  villages: VillageSummary[];
  alerts: Alert[];
  villageId: string;
  notifications: OutboundNotification[];
}

type Tab = 'symptoms' | 'water' | 'notifications';
type Look = NonNullable<WaterTestInput['appearance']>;

const LOOKS: { value: Look; key: string; swatch: string }[] = [
  { value: 'clear', key: 'look_clear', swatch: 'bg-sky-100 border-sky-300' },
  { value: 'cloudy', key: 'look_cloudy', swatch: 'bg-stone-300 border-stone-400' },
  { value: 'muddy', key: 'look_muddy', swatch: 'bg-amber-800 border-amber-900' },
];

export default function AshaPortal() {
  const [lang, setLang] = useLanguage();
  const tr = useCallback((key: string) => t(lang, key), [lang]);
  const [storedVillage, setStoredVillage] = useStoredState('neernetra_asha_village', '');
  const networkOnline = useNetworkOnline();
  const [simOffline, setSimOffline] = useState(false);
  const online = networkOnline && !simOffline;

  const { data, error, loading, reload, simState } = useEwsData<AshaData>(async () => {
    const [villages, alerts] = await Promise.all([ews.villages(), ews.alerts('active')]);
    const id = pickVillage(villages, storedVillage);
    const notifications = id ? await ews.notifications({ role: 'ASHA', villageId: id }) : [];
    return { villages, alerts, villageId: id, notifications };
  }, `asha:${storedVillage}`);
  const [snapshot, setSnapshot] = useState<{ data: AshaData | null; date: string | null; day: number | null }>({ data: null, date: null, day: null });

  const view = simOffline ? snapshot.data : data;
  const simDate = simOffline ? snapshot.date : simState?.currentDate ?? null;
  const simDay = simOffline ? snapshot.day : simState?.dayOfScenario ?? null;
  const stale = simOffline || (!!error && !!data);
  const villageId = pickVillage(view?.villages, storedVillage);
  const village = view?.villages.find((v) => v.id === villageId);
  const alert = view?.alerts.find((a) => a.villageId === villageId);
  const myNotifications = view?.villageId === villageId ? view.notifications : null;
  const freshCount = (myNotifications ?? []).filter((n) => n.date === simDate).length;
  const deviceNotify = useDeviceNotifications(online ? myNotifications : null, villageId ? `ASHA:${villageId}` : '');

  const [tab, setTab] = useState<Tab>('symptoms');
  const [notice, flash] = useNotice();

  const [queueCount, setQueueCount] = useState(0);
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<SyncResult | null>(null);
  const syncingRef = useRef(false);

  const refreshQueue = useCallback(() => {
    countQueued().then(setQueueCount);
  }, []);

  const runSync = useCallback(() => {
    if (syncingRef.current) return;
    syncingRef.current = true;
    setSyncing(true);
    syncQueued()
      .then(setSyncResult)
      .finally(() => {
        syncingRef.current = false;
        setSyncing(false);
        refreshQueue();
      });
  }, [refreshQueue]);

  useEffect(() => {
    countQueued().then((n) => {
      setQueueCount(n);
      if (n > 0 && navigator.onLine) runSync();
    });
  }, [runSync]);

  useEffect(() => {
    if (simOffline) return;
    window.addEventListener('online', runSync);
    return () => window.removeEventListener('online', runSync);
  }, [simOffline, runSync]);

  const toggleSimOffline = () => {
    if (simOffline) {
      setSimOffline(false);
      if (networkOnline && queueCount > 0) runSync();
    } else {
      setSnapshot({ data, date: simState?.currentDate ?? null, day: simState?.dayOfScenario ?? null });
      setSyncResult(null);
      setSimOffline(true);
    }
  };

  const deliver = async (send: () => Promise<unknown>, queue: () => Promise<void>): Promise<'sent' | 'queued'> => {
    if (online) {
      try {
        await send();
        return 'sent';
      } catch {
        await queue();
        return 'queued';
      }
    }
    await queue();
    return 'queued';
  };

  const announce = (outcome: 'sent' | 'queued') => {
    if (outcome === 'queued') refreshQueue();
    flash(outcome === 'sent' ? { tone: 'ok', text: tr('sent_ok') } : { tone: 'queued', text: tr('saved_offline') });
  };

  const [symptoms, setSymptoms] = useState<Symptoms>(EMPTY_SYMPTOMS);
  const [sendingReport, setSendingReport] = useState(false);
  const total = symptomTotal(symptoms);

  const submitReport = async () => {
    if (!villageId || total === 0) return;
    const input: CaseReportInput & { clientId: string } = {
      villageId,
      reporterRole: 'asha',
      channel: 'app',
      symptoms,
      clientId: newClientId(),
    };
    setSendingReport(true);
    const outcome = await deliver(
      () => ews.submitReport(input),
      () => queueReport(simDate ? { ...input, date: simDate } : input),
    );
    setSendingReport(false);
    setSymptoms(EMPTY_SYMPTOMS);
    announce(outcome);
  };

  const [h2s, setH2s] = useState<boolean | null>(null);
  const [look, setLook] = useState<Look | null>(null);
  const [turbidity, setTurbidity] = useState('');
  const [sendingWater, setSendingWater] = useState(false);
  const turbidityValue = turbidity.trim() === '' ? null : Number(turbidity);
  const waterReady = h2s !== null || look !== null || turbidityValue !== null;

  const submitWater = async () => {
    if (!villageId || !waterReady) return;
    const input: WaterTestInput & { clientId: string } = {
      villageId,
      source: 'h2s_kit',
      h2sPositive: h2s,
      appearance: look,
      turbidity: turbidityValue,
      clientId: newClientId(),
    };
    setSendingWater(true);
    const outcome = await deliver(
      () => ews.submitWaterTest(input),
      () => queueWaterTest(simDate ? { ...input, date: simDate } : input),
    );
    setSendingWater(false);
    setH2s(null);
    setLook(null);
    setTurbidity('');
    announce(outcome);
  };

  const engineDown = !simOffline && !!error && !data;

  return (
    <div className="max-w-md mx-auto space-y-4 pb-24">
      <header className="rounded-3xl bg-gradient-to-br from-teal-600 to-emerald-700 text-white p-4 shadow-xl space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-[11px] uppercase font-bold tracking-wider text-teal-100">{tr('nn_app')}</div>
            <h1 className="text-xl font-black leading-tight">{tr('asha_app')}</h1>
            {simDay !== null && (
              <div className="text-xs text-teal-100 mt-0.5 tabular-nums">
                {tf(lang, 'day_n', { n: simDay })} · {simDate}
              </div>
            )}
          </div>
          <span
            className={`shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${
              online ? 'bg-emerald-950/40 text-emerald-100' : 'bg-amber-400 text-slate-950'
            }`}
          >
            {online ? <Wifi className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5 animate-pulse" />}
            {online ? tr('online') : tr('offline')}
          </span>
        </div>
        <div className="grid grid-cols-[1fr_auto] gap-2">
          <VillageSelect villages={view?.villages ?? []} value={villageId} onChange={setStoredVillage} label={tr('village')} />
          <LanguageSelect value={lang} onChange={setLang} label={tr('language')} />
        </div>
      </header>

      <section className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3 space-y-2">
        <div className="flex items-center gap-3">
          <button
            type="button"
            role="switch"
            aria-checked={simOffline}
            onClick={toggleSimOffline}
            className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-200"
          >
            <span className={`relative w-11 h-6 rounded-full transition-colors ${simOffline ? 'bg-amber-500' : 'bg-slate-300 dark:bg-slate-700'}`}>
              <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${simOffline ? 'translate-x-5' : ''}`} />
            </span>
            {tr('simulate_offline')}
          </button>
          <div className="ml-auto flex items-center gap-2">
            <div className="text-right leading-tight">
              <div className={`text-lg font-black tabular-nums ${queueCount > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-slate-400'}`}>{queueCount}</div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400">{tr('waiting_to_sync')}</div>
            </div>
            <button
              type="button"
              onClick={runSync}
              disabled={!online || queueCount === 0 || syncing}
              className="h-10 px-3 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold flex items-center gap-1.5 disabled:bg-slate-200 disabled:text-slate-400 dark:disabled:bg-slate-800 dark:disabled:text-slate-500 transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
              {syncing ? tr('syncing') : tr('sync_now')}
            </button>
          </div>
        </div>
        {syncResult && (syncResult.accepted + syncResult.duplicates + syncResult.waterTests + syncResult.failed > 0) && (
          <div className="flex flex-col gap-1 text-xs font-semibold">
            <div className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400">
              <CloudUpload className="w-4 h-4 shrink-0" />
              {tf(lang, 'sync_result', { accepted: syncResult.accepted, duplicates: syncResult.duplicates, tests: syncResult.waterTests })}
            </div>
            {syncResult.failed > 0 && (
              <div className="flex items-center gap-1.5 text-amber-700 dark:text-amber-400">
                <WifiOff className="w-4 h-4 shrink-0" />
                {tf(lang, 'sync_failed', { n: syncResult.failed })}
              </div>
            )}
          </div>
        )}
      </section>

      {engineDown && (
        <EngineOffline
          title={tr('engine_offline')}
          detail={tr('engine_offline_desc')}
          note={tr('engine_offline_queue')}
          retryLabel={tr('retry')}
          onRetry={reload}
        />
      )}

      {loading && !view && !engineDown && (
        <div className="h-44 rounded-2xl bg-slate-200/70 dark:bg-slate-900 animate-pulse" aria-label={tr('loading')} />
      )}

      {village && (
        <section
          className={`rounded-2xl border border-slate-200 dark:border-slate-800 border-l-8 ${TIER_STYLE[village.tier].bar} bg-white dark:bg-slate-900 p-4 space-y-3 shadow-sm`}
        >
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <div className="text-[11px] uppercase font-bold tracking-wider text-slate-500 dark:text-slate-400">{tr('village_status')}</div>
              <div className="text-lg font-black text-slate-900 dark:text-white truncate">{village.name}</div>
              <div className="text-xs text-slate-500 dark:text-slate-400">{village.district}</div>
            </div>
            <TierBadge tier={village.tier} label={tr(`tier_${village.tier}`)} />
          </div>

          <div className="flex items-end gap-3">
            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-black tabular-nums text-slate-900 dark:text-white">{Math.round(village.risk * 100)}%</span>
                {Math.round(village.riskDelta * 100) !== 0 && (
                  <span className={`flex items-center text-xs font-bold ${village.riskDelta > 0 ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                    {village.riskDelta > 0 ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                    {village.riskDelta > 0 ? '+' : ''}
                    {Math.round(village.riskDelta * 100)}
                  </span>
                )}
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400">{tr('risk_7d')}</div>
            </div>
            <div className="ml-auto">
              <AdvisoryChip status={village.advisory} label={tr(ADVISORY_STYLE[village.advisory].labelKey)} />
            </div>
          </div>
          <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
            <div className={`h-full rounded-full ${TIER_STYLE[village.tier].dot}`} style={{ width: `${Math.max(2, Math.round(village.risk * 100))}%` }} />
          </div>

          <div className="grid grid-cols-3 gap-2 text-center">
            <Stat label={tr('cases_7d')} value={String(village.latest.cases7d)} />
            <Stat label={tr('turbidity')} value={village.latest.turbidity === null ? '—' : `${village.latest.turbidity.toFixed(1)} NTU`} />
            <Stat
              label={tr('h2s')}
              value={village.latest.h2sPositive === null ? tr('not_tested') : village.latest.h2sPositive ? tr('positive') : tr('negative')}
              danger={village.latest.h2sPositive === true}
            />
          </div>

          {alert ? (
            <div className={`rounded-xl p-3 ${TIER_STYLE[alert.tier].soft}`}>
              <div className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wide text-slate-900 dark:text-white">
                <Siren className="w-4 h-4 text-red-600" />
                {tr('active_alert')}
                <TierBadge tier={alert.tier} label={tr(`tier_${alert.tier}`)} className="ml-auto" />
              </div>
              <div className="font-bold text-sm text-slate-900 dark:text-white mt-1.5">{alert.title}</div>
              <p className="text-xs text-slate-700 dark:text-slate-300 mt-0.5 leading-snug">{alert.message}</p>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
              <ShieldCheck className="w-4 h-4" />
              {tr('no_alert')}
            </div>
          )}

          {stale && (
            <div className="flex items-center gap-1.5 text-[11px] font-bold text-amber-700 dark:text-amber-400">
              <WifiOff className="w-3.5 h-3.5" />
              {tr('last_known')}
            </div>
          )}
        </section>
      )}

      <nav className="grid grid-cols-3 gap-1 p-1 rounded-2xl bg-slate-200/70 dark:bg-slate-900">
        {([
          ['symptoms', Stethoscope, tr('tab_symptoms')],
          ['water', Droplets, tr('tab_water')],
          ['notifications', Bell, tr('tab_notifications')],
        ] as const).map(([key, Icon, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            className={`relative py-2.5 rounded-xl text-xs font-bold flex flex-col items-center gap-1 transition-colors ${
              tab === key ? 'bg-white dark:bg-slate-800 text-teal-700 dark:text-teal-300 shadow' : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            <Icon className="w-5 h-5" />
            {label}
            {key === 'notifications' && freshCount > 0 && (
              <span className="absolute top-1 right-3 min-w-5 h-5 px-1 rounded-full bg-red-600 text-white text-[10px] font-black flex items-center justify-center">
                {freshCount}
              </span>
            )}
          </button>
        ))}
      </nav>

      {tab === 'symptoms' && (
        <section className="space-y-3">
          <div className="flex items-baseline justify-between">
            <h2 className="text-base font-black text-slate-900 dark:text-white">{tr('household_report')}</h2>
            <span className="text-sm font-bold text-teal-700 dark:text-teal-400 tabular-nums">{tf(lang, 'total_people', { n: total })}</span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">{tr('people_with_symptom')}</p>
          <SymptomCounters value={symptoms} onChange={setSymptoms} label={tr} />
          <div className="grid grid-cols-[auto_1fr] gap-2">
            <button
              type="button"
              onClick={() => setSymptoms(EMPTY_SYMPTOMS)}
              disabled={total === 0}
              className="h-14 px-4 rounded-2xl bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-sm font-bold disabled:opacity-40"
            >
              {tr('clear')}
            </button>
            <SubmitButton
              online={online}
              busy={sendingReport}
              disabled={total === 0 || !villageId}
              onClick={submitReport}
              label={online ? tr('send_report') : tr('save_offline')}
            />
          </div>
          {total === 0 && <p className="text-center text-xs text-slate-400">{tr('need_symptom')}</p>}
        </section>
      )}

      {tab === 'water' && (
        <section className="space-y-4">
          <h2 className="text-base font-black text-slate-900 dark:text-white">{tr('water_test_log')}</h2>

          <div className="space-y-2">
            <div className="text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">{tr('h2s')}</div>
            <div className="grid grid-cols-2 gap-2">
              {([
                [true, 'POS', tr('h2s_pos'), 'bg-slate-950 border-slate-700'],
                [false, 'NEG', tr('h2s_neg'), 'bg-yellow-300 border-yellow-500'],
              ] as const).map(([value, code, label, swatch]) => (
                <button
                  key={code}
                  type="button"
                  aria-pressed={h2s === value}
                  onClick={() => setH2s(h2s === value ? null : value)}
                  className={`p-3 rounded-2xl border-2 flex items-center gap-3 text-left transition-colors ${
                    h2s === value
                      ? value
                        ? 'border-red-500 bg-red-50 dark:bg-red-950/40'
                        : 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40'
                      : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900'
                  }`}
                >
                  <span className={`w-10 h-10 rounded-full border-4 shrink-0 ${swatch}`} />
                  <span>
                    <span className="block text-lg font-black text-slate-900 dark:text-white">{code}</span>
                    <span className="block text-[11px] text-slate-500 dark:text-slate-400 leading-tight">{label}</span>
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <div className="text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">{tr('appearance')}</div>
            <div className="grid grid-cols-3 gap-2">
              {LOOKS.map(({ value, key, swatch }) => (
                <button
                  key={value}
                  type="button"
                  aria-pressed={look === value}
                  onClick={() => setLook(look === value ? null : value)}
                  className={`p-3 rounded-2xl border-2 flex flex-col items-center gap-2 transition-colors ${
                    look === value ? 'border-teal-500 bg-teal-50 dark:bg-teal-950/40' : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900'
                  }`}
                >
                  <span className={`w-10 h-10 rounded-full border-2 ${swatch}`} />
                  <span className="text-sm font-bold text-slate-900 dark:text-white">{tr(key)}</span>
                </button>
              ))}
            </div>
          </div>

          <label className="block space-y-1.5">
            <span className="text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">{tr('turbidity_optional')}</span>
            <input
              type="number"
              inputMode="decimal"
              min={0}
              step={0.1}
              value={turbidity}
              onChange={(e) => setTurbidity(e.target.value)}
              className="w-full h-12 px-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-lg font-bold text-slate-900 dark:text-white outline-none focus:border-teal-500"
            />
          </label>

          <SubmitButton
            online={online}
            busy={sendingWater}
            disabled={!waterReady || !villageId}
            onClick={submitWater}
            label={online ? tr('save_water_test') : tr('save_offline')}
          />
          {!waterReady && <p className="text-center text-xs text-slate-400">{tr('need_water_input')}</p>}
        </section>
      )}

      {tab === 'notifications' && (
        <section className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-base font-black text-slate-900 dark:text-white">{tr('tab_notifications')}</h2>
            <NotifyButton status={deviceNotify.status} onEnable={deviceNotify.enable} label={tr} />
          </div>
          {myNotifications && myNotifications.length === 0 && (
            <div className="p-6 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 text-center text-sm text-slate-500 dark:text-slate-400">
              <BellOff className="w-8 h-8 mx-auto mb-2 opacity-50" />
              {tr('no_notifications')}
            </div>
          )}
          {myNotifications?.map((n) => (
            <NotificationCard key={n.id} notification={n} when={whenLabel(n.date, simDate, lang)} urgentLabel={tr('high_priority')} />
          ))}
        </section>
      )}

      <Toast notice={notice} />
    </div>
  );
}

function Stat({ label, value, danger = false }: { label: string; value: string; danger?: boolean }) {
  return (
    <div className="rounded-xl bg-slate-50 dark:bg-slate-800/60 p-2">
      <div className={`text-sm font-black tabular-nums ${danger ? 'text-red-600 dark:text-red-400' : 'text-slate-900 dark:text-white'}`}>{value}</div>
      <div className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight">{label}</div>
    </div>
  );
}

function SubmitButton({
  online,
  busy,
  disabled,
  onClick,
  label,
}: {
  online: boolean;
  busy: boolean;
  disabled: boolean;
  onClick: () => void;
  label: string;
}) {
  const Icon = busy ? RefreshCw : online ? Send : Save;
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || busy}
      className={`w-full h-14 rounded-2xl text-base font-black flex items-center justify-center gap-2 shadow-lg transition-colors disabled:opacity-40 disabled:shadow-none ${
        online ? 'bg-teal-600 hover:bg-teal-700 text-white shadow-teal-600/30' : 'bg-amber-500 hover:bg-amber-600 text-slate-950 shadow-amber-500/30'
      }`}
    >
      <Icon className={`w-5 h-5 ${busy ? 'animate-spin' : ''}`} />
      {label}
    </button>
  );
}
