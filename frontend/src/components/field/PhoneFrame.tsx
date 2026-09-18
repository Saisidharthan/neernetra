import type { ReactNode } from 'react';
import { BatteryFull, Signal, Wifi } from 'lucide-react';

export default function PhoneFrame({
  label,
  controls,
  clock,
  children,
}: {
  label: string;
  controls?: ReactNode;
  clock: string;
  children: ReactNode;
}) {
  return (
    <figure className="w-full max-w-[360px] mx-auto">
      <figcaption className="mb-3 space-y-2">
        <div className="text-center text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">{label}</div>
        {controls}
      </figcaption>
      <div className="rounded-[2.75rem] bg-slate-900 p-2.5 shadow-2xl shadow-slate-900/30 ring-1 ring-slate-700">
        <div className="relative rounded-[2.2rem] overflow-hidden h-[640px] flex flex-col bg-gradient-to-b from-slate-800 via-teal-900 to-slate-950 text-white">
          <div className="relative flex items-center justify-between px-6 pt-2.5 pb-1.5 text-[11px] font-semibold">
            <span className="tabular-nums">{clock}</span>
            <span className="absolute left-1/2 -translate-x-1/2 top-2 w-20 h-5 rounded-full bg-black" />
            <span className="flex items-center gap-1">
              <Signal className="w-3.5 h-3.5" />
              <Wifi className="w-3.5 h-3.5" />
              <BatteryFull className="w-4 h-4" />
            </span>
          </div>
          {children}
        </div>
      </div>
    </figure>
  );
}
