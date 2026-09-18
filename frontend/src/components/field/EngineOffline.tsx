import { CloudOff, RefreshCw } from 'lucide-react';

export default function EngineOffline({
  title,
  detail,
  note,
  retryLabel,
  onRetry,
}: {
  title: string;
  detail: string;
  note?: string;
  retryLabel: string;
  onRetry: () => void;
}) {
  return (
    <div role="alert" className="p-4 rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-900 flex items-start gap-3">
      <div className="w-10 h-10 shrink-0 rounded-xl bg-slate-800 dark:bg-slate-700 text-white flex items-center justify-center">
        <CloudOff className="w-5 h-5" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-black text-slate-900 dark:text-white">{title}</div>
        <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">{detail}</p>
        {note && <p className="text-xs font-semibold text-teal-700 dark:text-teal-400 mt-1">{note}</p>}
      </div>
      <button
        onClick={onRetry}
        className="shrink-0 px-3 py-2 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-bold flex items-center gap-1.5"
      >
        <RefreshCw className="w-3.5 h-3.5" />
        {retryLabel}
      </button>
    </div>
  );
}
