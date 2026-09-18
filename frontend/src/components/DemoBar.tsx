'use client';

import React, { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { CalendarDays, ChevronDown, LoaderCircle, Pause, Play, RotateCcw, ServerOff, StepForward, Zap } from 'lucide-react';
import { ews, type InjectType } from '@/lib/ews';
import { useSim } from '@/components/ews/SimProvider';
import { BACKEND_CMD, BACKEND_ONLY_CMD } from '@/components/ews/ui';
import { INJECT_LABEL, fmtDateLong } from '@/components/ews/tiers';

const PLAY_MS = 2500;
const HIDDEN_PREFIXES = ['/portal/asha', '/portal/citizen', '/inbox'];
const INJECT_TYPES = Object.keys(INJECT_LABEL) as InjectType[];

const errMsg = (e: unknown) => (e instanceof Error ? e.message : String(e));

function Popover({
  label,
  icon: Icon,
  disabled,
  children,
}: {
  label: string;
  icon: typeof Play;
  disabled?: boolean;
  children: (close: () => void) => React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        disabled={disabled}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-100 text-xs font-bold disabled:opacity-40 transition-colors"
      >
        <Icon className="w-3.5 h-3.5" />
        {label}
        <ChevronDown className="w-3 h-3" />
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-80 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-2xl p-2 z-50 text-slate-800 dark:text-slate-100">
          {children(() => setOpen(false))}
        </div>
      )}
    </div>
  );
}

function DemoBarInner() {
  const { state, error, scenarios, villages } = useSim();
  const [playing, setPlaying] = useState(false);
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [injectType, setInjectType] = useState<InjectType>('heavy_rain');
  const [injectVillage, setInjectVillage] = useState('');

  const offline = !!error;

  useEffect(() => {
    if (!playing) return;
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const tick = async () => {
      try {
        await ews.step();
      } catch (e) {
        if (!cancelled) {
          setPlaying(false);
          setActionError(errMsg(e));
        }
        return;
      }
      if (!cancelled) timer = setTimeout(tick, PLAY_MS);
    };
    tick();
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [playing]);

  const run = async (fn: () => Promise<unknown>) => {
    setBusy(true);
    setActionError(null);
    try {
      await fn();
    } catch (e) {
      setActionError(errMsg(e));
    } finally {
      setBusy(false);
    }
  };

  const villageOptions = villages ? [...villages].sort((a, b) => a.name.localeCompare(b.name)) : [];
  const targetVillage = injectVillage || villageOptions[0]?.id || '';

  if (offline || !state) {
    return (
      <div className="w-full bg-red-950 text-red-100 border-b border-red-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
          {offline ? <ServerOff className="w-4 h-4 text-red-400" /> : <LoaderCircle className="w-4 h-4 animate-spin" />}
          <span className="font-bold">{offline ? 'Engine offline — start the backend' : 'Connecting to engine…'}</span>
          {offline && (
            <span className="text-[11px] text-red-300">
              run <code className="font-mono">{BACKEND_CMD}</code> or <code className="font-mono">{BACKEND_ONLY_CMD}</code>
            </span>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full bg-slate-900 dark:bg-slate-900/95 text-slate-100 border-b border-slate-800 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 flex flex-wrap items-center gap-x-4 gap-y-2">
        <div className="flex items-center gap-2 shrink-0">
          <span className="flex items-center gap-1.5 rounded-md bg-emerald-600 px-2 py-1 text-[10px] font-black uppercase tracking-wider">
            <span className={`w-1.5 h-1.5 rounded-full bg-white ${playing ? 'animate-pulse' : ''}`} />
            Sim
          </span>
          <span className="flex items-center gap-1.5 text-sm font-bold tabular-nums">
            <CalendarDays className="w-4 h-4 text-emerald-400" />
            Day {state.dayOfScenario} · {fmtDateLong(state.currentDate)}
          </span>
          <span className="hidden md:inline rounded-md border border-slate-700 bg-slate-800 px-2 py-0.5 text-[11px] font-semibold text-slate-300">
            {state.scenarioLabel}
          </span>
        </div>

        <p className="flex-1 min-w-[12rem] text-sm text-amber-200 font-medium truncate" title={state.narration ?? undefined}>
          {state.narration ?? <span className="text-slate-500">No event today.</span>}
        </p>

        <div className="flex items-center gap-2 shrink-0">
          {actionError && (
            <span className="max-w-[14rem] truncate text-[11px] text-red-400" title={actionError}>
              {actionError}
            </span>
          )}
          <button
            onClick={() => run(() => ews.step())}
            disabled={busy || playing}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold disabled:opacity-40 transition-colors"
          >
            {busy ? <LoaderCircle className="w-3.5 h-3.5 animate-spin" /> : <StepForward className="w-3.5 h-3.5" />}
            +1 day
          </button>
          <button
            onClick={() => {
              setActionError(null);
              setPlaying((p) => !p);
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
              playing ? 'bg-amber-500 hover:bg-amber-400 text-slate-950' : 'bg-slate-800 hover:bg-slate-700 border border-slate-700'
            }`}
          >
            {playing ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            {playing ? 'Pause' : 'Play'}
          </button>

          <Popover label="Reset" icon={RotateCcw} disabled={busy || playing}>
            {(close) => (
              <div className="space-y-1">
                <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">Reset into scenario</div>
                {(scenarios ?? []).map((s) => (
                  <button
                    key={s.id}
                    onClick={() => {
                      close();
                      run(() => ews.reset(s.id));
                    }}
                    className={`w-full text-left rounded-lg px-2 py-2 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 ${
                      s.id === state.scenario ? 'ring-1 ring-emerald-500' : ''
                    }`}
                  >
                    <div className="text-xs font-bold">{s.label}</div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">{s.description}</div>
                  </button>
                ))}
              </div>
            )}
          </Popover>

          <Popover label="Inject" icon={Zap} disabled={busy}>
            {(close) => (
              <div className="space-y-2 p-1">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Inject an event today</div>
                <select
                  value={injectType}
                  onChange={(e) => setInjectType(e.target.value as InjectType)}
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-2 py-1.5 text-xs"
                >
                  {INJECT_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {INJECT_LABEL[t]}
                    </option>
                  ))}
                </select>
                <select
                  value={targetVillage}
                  onChange={(e) => setInjectVillage(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-2 py-1.5 text-xs"
                >
                  {villageOptions.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.name} ({v.id})
                    </option>
                  ))}
                </select>
                <button
                  onClick={() => {
                    close();
                    run(() => ews.inject(injectType, targetVillage));
                  }}
                  disabled={!targetVillage}
                  className="w-full rounded-lg bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold py-2 disabled:opacity-40"
                >
                  Inject {INJECT_LABEL[injectType].toLowerCase()}
                </button>
              </div>
            )}
          </Popover>
        </div>
      </div>
    </div>
  );
}

export default function DemoBar() {
  const pathname = usePathname();
  if (HIDDEN_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`))) return null;
  return <DemoBarInner />;
}
