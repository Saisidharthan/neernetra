'use client';

import React, { createContext, useCallback, useContext, useState } from 'react';
import { ews, type Scenario, type SimState, type Tier, type VillageSummary } from '@/lib/ews';
import { useEwsData, useSimState } from '@/lib/useEws';

export interface DayRecord {
  day: number;
  date: string;
  narration: string | null;
  villages: Record<string, { risk: number; tier: Tier; earsFlagged: boolean }>;
}

export interface RunLog {
  scenario: string;
  scenarioLabel: string;
  days: DayRecord[];
}

interface SimContextValue {
  state: SimState | null;
  error: string | null;
  dataError: string | null;
  villages: VillageSummary[] | null;
  scenarios: Scenario[] | null;
  log: RunLog | null;
  beats: Record<string, boolean>;
  toggleBeat: (id: string) => void;
  clearBeats: () => void;
}

const SimContext = createContext<SimContextValue | null>(null);

function recordDay(log: RunLog | null, state: SimState, villages: VillageSummary[]): RunLog {
  const record: DayRecord = {
    day: state.dayOfScenario,
    date: state.currentDate,
    narration: state.narration,
    villages: Object.fromEntries(
      villages.map((v) => [v.id, { risk: v.risk, tier: v.tier, earsFlagged: v.ears.flagged }]),
    ),
  };
  const last = log?.days[log.days.length - 1];
  if (!log || !last || log.scenario !== state.scenario || state.dayOfScenario < last.day) {
    return { scenario: state.scenario, scenarioLabel: state.scenarioLabel, days: [record] };
  }
  return {
    ...log,
    days: [...log.days.filter((d) => d.day !== record.day), record].sort((a, b) => a.day - b.day),
  };
}

export function SimProvider({ children }: { children: React.ReactNode }) {
  const { state, error } = useSimState();
  const [log, setLog] = useState<RunLog | null>(null);
  const [beats, setBeats] = useState<Record<string, boolean>>({});

  const { data, error: dataError } = useEwsData(async () => {
    const [snapshot, villages, scenarios] = await Promise.all([ews.state(), ews.villages(), ews.scenarios()]);
    setLog((prev) => recordDay(prev, snapshot, villages));
    return { villages, scenarios };
  }, 'sim-provider');

  const toggleBeat = useCallback((id: string) => setBeats((b) => ({ ...b, [id]: !b[id] })), []);
  const clearBeats = useCallback(() => setBeats({}), []);

  return (
    <SimContext.Provider
      value={{
        state,
        error,
        dataError,
        villages: data?.villages ?? null,
        scenarios: data?.scenarios ?? null,
        log,
        beats,
        toggleBeat,
        clearBeats,
      }}
    >
      {children}
    </SimContext.Provider>
  );
}

export function useSim(): SimContextValue {
  const ctx = useContext(SimContext);
  if (!ctx) throw new Error('useSim must be used inside <SimProvider>');
  return ctx;
}
