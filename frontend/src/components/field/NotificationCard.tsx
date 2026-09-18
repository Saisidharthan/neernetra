import { Eye, Siren } from 'lucide-react';
import type { OutboundNotification } from '@/lib/ews';
import { ENGINE_LANG_LABEL, t, tf, type Language } from '@/lib/i18n';

const LANG_TONE = {
  en: 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
  hi: 'bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-300',
  as: 'bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300',
};

export function whenLabel(date: string, today: string | null | undefined, lang: Language): string {
  if (!today) return date;
  const days = Math.round((Date.parse(today) - Date.parse(date)) / 86_400_000);
  return days <= 0 ? t(lang, 'today') : tf(lang, 'days_ago', { n: days });
}

export default function NotificationCard({
  notification: n,
  when,
  urgentLabel,
  variant = 'list',
  showRecipient = false,
}: {
  notification: OutboundNotification;
  when: string;
  urgentLabel: string;
  variant?: 'list' | 'lock';
  showRecipient?: boolean;
}) {
  const high = n.priority === 'high';
  const lock = variant === 'lock';
  return (
    <div
      className={`relative overflow-hidden rounded-2xl p-3 pl-4 border ${
        lock
          ? `bg-white/15 backdrop-blur-md text-white ${high ? 'border-red-400/70' : 'border-white/15'}`
          : `bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-sm ${high ? 'border-red-300 dark:border-red-800' : 'border-slate-200 dark:border-slate-800'}`
      }`}
    >
      {high && <span className="absolute left-0 inset-y-0 w-1.5 bg-red-500" />}
      <div className={`flex items-center gap-1.5 text-[11px] font-semibold ${lock ? 'text-white/75' : 'text-slate-500 dark:text-slate-400'}`}>
        <span className="w-5 h-5 rounded-md bg-gradient-to-tr from-cyan-600 to-emerald-400 text-white flex items-center justify-center">
          <Eye className="w-3 h-3" />
        </span>
        <span className="uppercase tracking-wide">NeerNetra</span>
        {high && (
          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-red-600 text-white text-[10px] font-black uppercase">
            <Siren className="w-3 h-3" />
            {urgentLabel}
          </span>
        )}
        <span className="ml-auto tabular-nums">{when}</span>
      </div>
      <div lang={n.language} className="mt-1.5 font-bold text-sm leading-snug">
        {n.title}
      </div>
      <p lang={n.language} className={`text-sm leading-snug mt-0.5 whitespace-pre-line ${lock ? 'text-white/90' : 'text-slate-700 dark:text-slate-300'}`}>
        {n.body}
      </p>
      <div className="mt-2 flex items-center gap-1.5 text-[10px] font-bold">
        <span className={`px-1.5 py-0.5 rounded ${lock ? 'bg-white/20 text-white' : LANG_TONE[n.language]}`}>{ENGINE_LANG_LABEL[n.language]}</span>
        <span className={`truncate ${lock ? 'text-white/60' : 'text-slate-400'}`}>{showRecipient ? n.to : n.villageId}</span>
      </div>
    </div>
  );
}
