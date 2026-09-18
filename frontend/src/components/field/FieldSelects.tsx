import { Globe, MapPin } from 'lucide-react';
import { LANGUAGES, type Language } from '@/lib/i18n';

const SELECT =
  'w-full appearance-none bg-transparent outline-none cursor-pointer font-semibold text-slate-900 dark:text-white text-sm py-2 pr-2';
const WRAP =
  'flex items-center gap-2 px-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm min-w-0';

export function VillageSelect({
  villages,
  value,
  onChange,
  label,
  className = '',
}: {
  villages: { id: string; name: string }[];
  value: string;
  onChange: (id: string) => void;
  label: string;
  className?: string;
}) {
  const options = villages.length > 0 ? villages : value ? [{ id: value, name: value }] : [];
  return (
    <label className={`${WRAP} ${className}`}>
      <MapPin className="w-4 h-4 shrink-0 text-teal-600" />
      <span className="sr-only">{label}</span>
      <select value={value} onChange={(e) => onChange(e.target.value)} className={SELECT} disabled={options.length === 0}>
        {options.map((v) => (
          <option key={v.id} value={v.id} className="bg-white dark:bg-slate-900">
            {v.name === v.id ? v.id : `${v.name} · ${v.id}`}
          </option>
        ))}
      </select>
    </label>
  );
}

export function LanguageSelect({
  value,
  onChange,
  label,
  className = '',
}: {
  value: Language;
  onChange: (lang: Language) => void;
  label: string;
  className?: string;
}) {
  return (
    <label className={`${WRAP} ${className}`}>
      <Globe className="w-4 h-4 shrink-0 text-teal-600" />
      <span className="sr-only">{label}</span>
      <select value={value} onChange={(e) => onChange(e.target.value as Language)} className={SELECT}>
        {LANGUAGES.map((l) => (
          <option key={l.code} value={l.code} className="bg-white dark:bg-slate-900">
            {l.nativeName}
          </option>
        ))}
      </select>
    </label>
  );
}
