'use client';

import React, { useState } from 'react';
import { CheckCircle2, ClipboardList, LoaderCircle, Send, Truck } from 'lucide-react';
import { ews, type Intervention, type InterventionStatus, type InterventionType, type RecommendedAction } from '@/lib/ews';
import { Card, CardHeader } from './ui';
import { INTERVENTION_LABEL, INTERVENTION_STATUS_LABEL, NEXT_INTERVENTION_STATUS, fmtDate } from './tiers';

const errMsg = (e: unknown) => (e instanceof Error ? e.message : String(e));

const PRIORITY_STYLE: Record<RecommendedAction['priority'], string> = {
  high: 'bg-red-600 text-white',
  medium: 'bg-amber-500 text-slate-950',
  low: 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200',
};

export function RecommendedActions({ villageId, actions }: { villageId: string; actions: RecommendedAction[] }) {
  const [pending, setPending] = useState<InterventionType | null>(null);
  const [error, setError] = useState<string | null>(null);

  const dispatch = async (a: RecommendedAction) => {
    setPending(a.type);
    setError(null);
    try {
      await ews.createIntervention({ villageId, type: a.type, notes: a.reason });
    } catch (e) {
      setError(errMsg(e));
    } finally {
      setPending(null);
    }
  };

  return (
    <Card>
      <CardHeader icon={ClipboardList} title="Recommended actions" subtitle="Rules on today's explanation. Dispatching changes the simulation." />
      <div className="p-4 space-y-3">
        {actions.length === 0 && <p className="text-sm text-slate-500 dark:text-slate-400 py-4 text-center">No action needed today.</p>}
        {actions.map((a) => (
          <div key={a.type} className="flex items-start gap-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 p-3">
            <div className="flex-1 min-w-0 space-y-1">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className={`rounded px-1.5 py-0.5 text-[10px] font-black uppercase ${PRIORITY_STYLE[a.priority]}`}>{a.priority}</span>
                <span className="text-sm font-bold text-slate-900 dark:text-white">{a.title}</span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300">{a.reason}</p>
            </div>
            {a.alreadyActive ? (
              <span className="shrink-0 inline-flex items-center gap-1 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 px-2.5 py-1.5 text-xs font-bold">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Active
              </span>
            ) : (
              <button
                onClick={() => dispatch(a)}
                disabled={pending !== null}
                className="shrink-0 inline-flex items-center gap-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 text-xs font-bold disabled:opacity-40"
              >
                {pending === a.type ? <LoaderCircle className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                Dispatch
              </button>
            )}
          </div>
        ))}
        {error && <p className="text-xs text-red-600 dark:text-red-400 break-all">{error}</p>}
      </div>
    </Card>
  );
}

const STEPS: InterventionStatus[] = ['dispatched', 'in_progress', 'completed'];

function InterventionRow({ item }: { item: Intervention }) {
  const [verification, setVerification] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const next = NEXT_INTERVENTION_STATUS[item.status];
  const reached = STEPS.indexOf(item.status);

  const advance = async () => {
    if (!next) return;
    setBusy(true);
    setError(null);
    try {
      await ews.updateIntervention(item.id, {
        status: next,
        verification: next === 'completed' && verification.trim() ? verification.trim() : undefined,
      });
    } catch (e) {
      setError(errMsg(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <li className="relative pl-7">
      <span
        className={`absolute left-0 top-1 w-4 h-4 rounded-full border-2 ${
          item.status === 'completed' ? 'bg-emerald-500 border-emerald-500' : item.status === 'in_progress' ? 'bg-amber-400 border-amber-400' : 'bg-white dark:bg-slate-900 border-sky-500'
        }`}
      />
      <div className="space-y-1.5">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-bold text-slate-900 dark:text-white">{INTERVENTION_LABEL[item.type]}</span>
          <span className="text-[11px] text-slate-500 dark:text-slate-400">
            #{item.id} · {fmtDate(item.createdDate)} · {item.assignedTo}
          </span>
        </div>
        <div className="flex items-center gap-1">
          {STEPS.map((s, i) => (
            <React.Fragment key={s}>
              <span
                className={`rounded px-1.5 py-0.5 text-[10px] font-bold uppercase ${
                  i <= reached ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900' : 'bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500'
                }`}
              >
                {INTERVENTION_STATUS_LABEL[s]}
              </span>
              {i < STEPS.length - 1 && <span className="w-3 h-px bg-slate-300 dark:bg-slate-600" />}
            </React.Fragment>
          ))}
          {item.updatedDate !== item.createdDate && (
            <span className="ml-1 text-[11px] text-slate-400">updated {fmtDate(item.updatedDate)}</span>
          )}
        </div>
        {item.notes && <p className="text-xs text-slate-600 dark:text-slate-300">{item.notes}</p>}
        {item.verification && (
          <p className="inline-flex items-center gap-1 rounded-md bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-900 px-2 py-1 text-xs font-semibold text-emerald-800 dark:text-emerald-300">
            <CheckCircle2 className="w-3.5 h-3.5" />
            {item.verification}
          </p>
        )}
        {next && (
          <div className="flex flex-wrap items-center gap-2">
            {next === 'completed' && (
              <input
                value={verification}
                onChange={(e) => setVerification(e.target.value)}
                placeholder="Verification, e.g. residual chlorine 0.8 mg/L"
                className="flex-1 min-w-[12rem] rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-2 py-1.5 text-xs"
              />
            )}
            <button
              onClick={advance}
              disabled={busy}
              className="inline-flex items-center gap-1 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 px-2.5 py-1.5 text-xs font-bold text-slate-700 dark:text-slate-200 disabled:opacity-40"
            >
              {busy && <LoaderCircle className="w-3.5 h-3.5 animate-spin" />}
              Mark {INTERVENTION_STATUS_LABEL[next].toLowerCase()}
            </button>
          </div>
        )}
        {error && <p className="text-xs text-red-600 dark:text-red-400 break-all">{error}</p>}
      </div>
    </li>
  );
}

export function InterventionTimeline({ interventions }: { interventions: Intervention[] }) {
  return (
    <Card>
      <CardHeader
        icon={Truck}
        title="Interventions"
        subtitle="Dispatched → in progress on the next day → completed with verification. Chlorination cuts contamination."
      />
      <div className="p-5">
        {interventions.length === 0 ? (
          <p className="text-sm text-slate-500 dark:text-slate-400 py-4 text-center">No interventions yet.</p>
        ) : (
          <ol className="relative space-y-5 before:absolute before:left-[7px] before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-800">
            {interventions.map((i) => (
              <InterventionRow key={i.id} item={i} />
            ))}
          </ol>
        )}
      </div>
    </Card>
  );
}
