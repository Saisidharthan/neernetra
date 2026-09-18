'use client';

import { useState, type FormEvent } from 'react';
import { Bell, Building2, ClipboardList, RefreshCw, Send, ShieldCheck, Siren } from 'lucide-react';
import {
  ews, type Alert, type CaseReport, type OutboundNotification, type ReportChannel, type ReporterRole, type Symptoms, type VillageSummary,
} from '@/lib/ews';
import { useEwsData } from '@/lib/useEws';
import { t } from '@/lib/i18n';
import { newClientId, pickVillage, useNotice, useStoredState } from '@/components/field/hooks';
import { VillageSelect } from '@/components/field/FieldSelects';
import SymptomCounters, { EMPTY_SYMPTOMS, SYMPTOMS, symptomTotal } from '@/components/field/SymptomCounters';
import TierBadge, { TIER_STYLE } from '@/components/field/TierBadge';
import NotificationCard, { whenLabel } from '@/components/field/NotificationCard';
import EngineOffline from '@/components/field/EngineOffline';
import Toast from '@/components/field/Toast';

interface PhcData {
  villages: VillageSummary[];
  alerts: Alert[];
  reports: CaseReport[];
  notifications: OutboundNotification[];
}

const ROLE_STYLE: Record<ReporterRole, string> = {
  asha: 'bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300',
  citizen: 'bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300',
  clinic: 'bg-violet-100 text-violet-800 dark:bg-violet-950 dark:text-violet-300',
};

const CHANNEL_STYLE: Record<ReportChannel, string> = {
  app: 'text-slate-600 dark:text-slate-300',
  offline_sync: 'text-amber-600 dark:text-amber-400',
};

const INPUT =
  'w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none text-sm text-slate-900 dark:text-white focus:border-teal-500';

const en = (key: string) => t('en', key);

export default function PhcPortal() {
  const [filter, setFilter] = useState('');
  const { data, error, loading, reload, simState } = useEwsData<PhcData>(async () => {
    const [villages, alerts, reports, notifications] = await Promise.all([
      ews.villages(),
      ews.alerts('active'),
      ews.reports(filter || undefined, 50),
      ews.notifications({ role: 'PHC', limit: 30 }),
    ]);
    return { villages, alerts, reports, notifications };
  }, `phc:${filter}`);
  const villageNames = new Map((data?.villages ?? []).map((v) => [v.id, v.name]));

  const [storedVillage, setStoredVillage] = useStoredState('neernetra_phc_village', '');
  const [clinician, setClinician] = useState('');
  const villageId = pickVillage(data?.villages, storedVillage);
  const [symptoms, setSymptoms] = useState<Symptoms>(EMPTY_SYMPTOMS);
  const [notes, setNotes] = useState('');
  const [sending, setSending] = useState(false);
  const [notice, flash] = useNotice();
  const total = symptomTotal(symptoms);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!villageId || total === 0) return;
    setSending(true);
    try {
      const saved = await ews.submitReport({
        villageId,
        reporterRole: 'clinic',
        channel: 'app',
        reporterName: clinician.trim() || undefined,
        symptoms,
        notes: notes.trim() || undefined,
        clientId: newClientId(),
      });
      setSymptoms(EMPTY_SYMPTOMS);
      setNotes('');
      flash({ tone: 'ok', text: `Case entry #${saved.id} saved: ${saved.total} patients at ${villageNames.get(saved.villageId) ?? saved.villageId}` });
    } catch (err) {
      flash({ tone: 'error', text: `Not saved. ${err instanceof Error ? err.message : String(err)}` });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-6 py-2 pb-20">
      <div className="p-6 rounded-2xl bg-gradient-to-r from-teal-600 to-cyan-700 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-xs uppercase font-bold tracking-wider px-2.5 py-0.5 rounded bg-teal-950/60 text-teal-200 border border-teal-400/40">
            NeerNetra · Primary Health Centre
          </span>
          <h1 className="text-2xl sm:text-3xl font-black mt-1 flex items-center gap-2">
            <Building2 className="w-7 h-7" />
            PHC clinic desk
          </h1>
          <p className="text-xs text-teal-100 mt-1">
            Log water-borne cases seen at the clinic. Each entry feeds the village&apos;s outbreak model immediately.
          </p>
        </div>
        {simState && (
          <div className="flex gap-3 text-xs">
            <HeaderStat label={`Day ${simState.dayOfScenario}`} value={simState.currentDate} />
            <HeaderStat label="Active alerts" value={String(simState.kpis.activeAlerts)} />
            <HeaderStat label="Cases, 7 days" value={String(simState.kpis.cases7d)} />
          </div>
        )}
      </div>

      {error && !data && <EngineOffline title="Engine offline" detail="Cannot reach the NeerNetra engine on /api/v1/ews. Nothing is shown until it is back." retryLabel="Retry" onRetry={reload} />}

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <form
          onSubmit={submit}
          className="lg:col-span-2 p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4"
        >
          <h2 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-teal-500" />
            Clinic case entry
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">Patient&apos;s village</span>
              <VillageSelect villages={data?.villages ?? []} value={villageId} onChange={setStoredVillage} label="Village" />
            </div>
            <label className="space-y-1 block">
              <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">Clinician</span>
              <input value={clinician} onChange={(e) => setClinician(e.target.value)} placeholder="e.g. Dr. P. Das" className={INPUT} />
            </label>
          </div>
          <div className="space-y-1.5">
            <div className="flex items-baseline justify-between">
              <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">Patients presenting with</span>
              <span className="text-xs font-bold text-teal-700 dark:text-teal-400 tabular-nums">Total {total}</span>
            </div>
            <SymptomCounters value={symptoms} onChange={setSymptoms} label={en} size="md" />
          </div>
          <label className="space-y-1 block">
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">Notes (optional)</span>
            <textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="e.g. 2 children, severe dehydration, referred" className={INPUT} />
          </label>
          <button
            type="submit"
            disabled={sending || total === 0 || !villageId}
            className="w-full py-3 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold transition-colors flex items-center justify-center gap-2 disabled:opacity-40"
          >
            {sending ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            Save case entry
          </button>
        </form>

        <div className="lg:col-span-3 space-y-6">
          <section className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
            <h2 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
              <Siren className="w-5 h-5 text-red-500" />
              Active alerts
              {data && <span className="text-xs font-semibold text-slate-400">({data.alerts.length})</span>}
            </h2>
            {loading && !data && <div className="h-40 rounded-xl bg-slate-100 dark:bg-slate-800 animate-pulse" />}
            {data && data.alerts.length === 0 && (
              <div className="p-6 rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-800 text-center text-sm text-slate-500 flex items-center justify-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-500" />
                No active alerts in the district
              </div>
            )}
            <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
              {data?.alerts.map((a) => (
                <article key={a.id} className={`p-4 rounded-xl border border-slate-200 dark:border-slate-800 border-l-4 ${TIER_STYLE[a.tier].bar} ${TIER_STYLE[a.tier].soft}`}>
                  <div className="flex flex-wrap items-center gap-2">
                    <TierBadge tier={a.tier} label={a.tier} />
                    <span className="font-bold text-slate-900 dark:text-white">{a.title}</span>
                    <span className="ml-auto text-[11px] font-semibold text-slate-500 capitalize">{a.status}</span>
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    {a.villageName} · {a.villageId} · raised {a.createdDate}
                    {a.updatedDate !== a.createdDate && `, updated ${a.updatedDate}`}
                  </div>
                  <p className="text-sm text-slate-700 dark:text-slate-300 mt-2">{a.message}</p>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {a.triggers.map((tr) => (
                      <span key={tr} className="px-2 py-0.5 rounded-md bg-white/70 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-700 font-mono text-[11px] text-slate-700 dark:text-slate-300">
                        {tr}
                      </span>
                    ))}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-2">Notified: {a.audience.join(', ')}</div>
                </article>
              ))}
            </div>
          </section>

          <section className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
            <h2 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
              <Bell className="w-5 h-5 text-teal-500" />
              PHC notifications
              {data && <span className="text-xs font-semibold text-slate-400">({data.notifications.length})</span>}
            </h2>
            {data && data.notifications.length === 0 && (
              <div className="p-6 rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-800 text-center text-sm text-slate-500">
                No notifications for the PHC yet
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[420px] overflow-y-auto pr-1">
              {data?.notifications.map((n) => (
                <NotificationCard key={n.id} notification={n} when={whenLabel(n.date, simState?.currentDate, 'en')} urgentLabel="Urgent" showRecipient />
              ))}
            </div>
          </section>
        </div>
      </div>

      <section className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="font-bold text-base text-slate-900 dark:text-white">Recent case reports</h2>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="ml-auto px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white"
          >
            <option value="">All villages</option>
            {data?.villages.map((v) => (
              <option key={v.id} value={v.id}>
                {v.name} · {v.id}
              </option>
            ))}
          </select>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[11px] uppercase tracking-wide text-slate-500 border-b border-slate-200 dark:border-slate-800">
                <th className="py-2 pr-3 font-semibold">Date</th>
                <th className="py-2 pr-3 font-semibold">Village</th>
                <th className="py-2 pr-3 font-semibold">Reporter</th>
                <th className="py-2 pr-3 font-semibold">Channel</th>
                {SYMPTOMS.map((s) => (
                  <th key={s.key} className="py-2 px-1.5 font-semibold text-center" title={en(s.labelKey)}>
                    {s.short}
                  </th>
                ))}
                <th className="py-2 px-1.5 font-semibold text-center">Total</th>
                <th className="py-2 pl-3 font-semibold">Notes</th>
              </tr>
            </thead>
            <tbody>
              {data?.reports.map((r) => (
                <tr key={r.id} className="border-b border-slate-100 dark:border-slate-800/60 hover:bg-slate-50 dark:hover:bg-slate-800/40">
                  <td className="py-2 pr-3 tabular-nums whitespace-nowrap text-slate-600 dark:text-slate-400">{r.date}</td>
                  <td className="py-2 pr-3 whitespace-nowrap">
                    <span className="font-semibold text-slate-900 dark:text-white">{villageNames.get(r.villageId) ?? r.villageId}</span>
                    <span className="text-[11px] text-slate-400 ml-1">{r.villageId}</span>
                  </td>
                  <td className="py-2 pr-3 whitespace-nowrap">
                    <span className={`px-1.5 py-0.5 rounded text-[11px] font-bold uppercase ${ROLE_STYLE[r.reporterRole]}`}>{r.reporterRole}</span>
                    {r.reporterName && <span className="text-xs text-slate-500 ml-1.5">{r.reporterName}</span>}
                  </td>
                  <td className={`py-2 pr-3 text-xs font-semibold whitespace-nowrap ${CHANNEL_STYLE[r.channel]}`}>{r.channel.replace('_', ' ')}</td>
                  {SYMPTOMS.map((s) => (
                    <td
                      key={s.key}
                      className={`py-2 px-1.5 text-center tabular-nums ${
                        r.symptoms[s.key] === 0
                          ? 'text-slate-300 dark:text-slate-700'
                          : s.key === 'bloodyStool' || s.key === 'jaundice'
                            ? 'font-bold text-red-600 dark:text-red-400'
                            : 'font-semibold text-slate-900 dark:text-white'
                      }`}
                    >
                      {r.symptoms[s.key]}
                    </td>
                  ))}
                  <td className="py-2 px-1.5 text-center font-black tabular-nums text-slate-900 dark:text-white">{r.total}</td>
                  <td className="py-2 pl-3 text-xs text-slate-500 dark:text-slate-400 max-w-xs truncate" title={r.notes ?? undefined}>
                    {r.notes}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {data && data.reports.length === 0 && <div className="py-8 text-center text-sm text-slate-500">No case reports yet.</div>}
          {loading && !data && <div className="h-32 rounded-xl bg-slate-100 dark:bg-slate-800 animate-pulse mt-2" />}
        </div>
        <p className="text-[11px] text-slate-400">D diarrhoea · V vomiting · F fever · J jaundice · B blood in stool</p>
      </section>

      <Toast notice={notice} />
    </div>
  );
}

function HeaderStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-teal-950/60 px-3 py-2 rounded-xl border border-teal-700/60">
      <div className="text-[10px] text-teal-200 font-bold uppercase">{label}</div>
      <div className="text-lg font-black tabular-nums">{value}</div>
    </div>
  );
}
