import { Droplet, Eye, Frown, Minus, Plus, Thermometer, Toilet, type LucideIcon } from 'lucide-react';
import type { Symptoms } from '@/lib/ews';

export const SYMPTOMS: { key: keyof Symptoms; labelKey: string; short: string; icon: LucideIcon; tone: string }[] = [
  { key: 'diarrhoea', labelKey: 'sym_diarrhoea', short: 'D', icon: Toilet, tone: 'bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300' },
  { key: 'vomiting', labelKey: 'sym_vomiting', short: 'V', icon: Frown, tone: 'bg-lime-100 text-lime-700 dark:bg-lime-950 dark:text-lime-300' },
  { key: 'fever', labelKey: 'sym_fever', short: 'F', icon: Thermometer, tone: 'bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300' },
  { key: 'jaundice', labelKey: 'sym_jaundice', short: 'J', icon: Eye, tone: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-300' },
  { key: 'bloodyStool', labelKey: 'sym_bloody_stool', short: 'B', icon: Droplet, tone: 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300' },
];

export const EMPTY_SYMPTOMS: Symptoms = { diarrhoea: 0, vomiting: 0, fever: 0, jaundice: 0, bloodyStool: 0 };

const MAX_COUNT = 99;

export function symptomTotal(s: Symptoms): number {
  return s.diarrhoea + s.vomiting + s.fever + s.jaundice + s.bloodyStool;
}

export default function SymptomCounters({
  value,
  onChange,
  label,
  size = 'lg',
}: {
  value: Symptoms;
  onChange: (next: Symptoms) => void;
  label: (key: string) => string;
  size?: 'lg' | 'md';
}) {
  const big = size === 'lg';
  const set = (key: keyof Symptoms, n: number) => onChange({ ...value, [key]: Math.max(0, Math.min(MAX_COUNT, n)) });

  return (
    <div className="space-y-2">
      {SYMPTOMS.map(({ key, labelKey, icon: Icon, tone }) => {
        const count = value[key];
        return (
          <div
            key={key}
            className={`flex items-center gap-3 rounded-2xl border transition-colors ${big ? 'p-2.5' : 'p-2'} ${
              count > 0
                ? 'border-teal-400 bg-teal-50 dark:border-teal-700 dark:bg-teal-950/40'
                : 'border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900'
            }`}
          >
            <div className={`${big ? 'w-12 h-12' : 'w-10 h-10'} shrink-0 rounded-xl flex items-center justify-center ${tone}`}>
              <Icon className={big ? 'w-7 h-7' : 'w-5 h-5'} />
            </div>
            <div className={`flex-1 min-w-0 font-bold text-slate-900 dark:text-white leading-tight ${big ? 'text-base' : 'text-sm'}`}>
              {label(labelKey)}
            </div>
            <button
              type="button"
              aria-label={`- ${label(labelKey)}`}
              onClick={() => set(key, count - 1)}
              disabled={count === 0}
              className={`${big ? 'w-12 h-12' : 'w-10 h-10'} shrink-0 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 flex items-center justify-center active:scale-95 transition disabled:opacity-30`}
            >
              <Minus className="w-5 h-5" />
            </button>
            <div className={`${big ? 'w-10 text-3xl' : 'w-8 text-2xl'} text-center font-black tabular-nums text-slate-900 dark:text-white`}>
              {count}
            </div>
            <button
              type="button"
              aria-label={`+ ${label(labelKey)}`}
              onClick={() => set(key, count + 1)}
              className={`${big ? 'w-12 h-12' : 'w-10 h-10'} shrink-0 rounded-xl bg-teal-600 hover:bg-teal-700 text-white flex items-center justify-center active:scale-95 transition`}
            >
              <Plus className="w-6 h-6" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
