'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { ews, onEwsChange, type SimState } from './ews';

const POLL_MS = 3000;

function message(e: unknown) {
  return e instanceof Error ? e.message : String(e);
}

/**
 * Polls /ews/state. Other tabs (e.g. an ASHA phone submitting a report) bump `version`,
 * which is how every open view learns it should refetch.
 */
export function useSimState() {
  const [state, setState] = useState<SimState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let active = true;
    const load = () =>
      ews.state().then(
        (s) => {
          if (!active) return;
          setState(s);
          setError(null);
        },
        (e) => {
          if (active) setError(message(e));
        },
      );
    load();
    const timer = setInterval(load, POLL_MS);
    const off = onEwsChange(load);
    return () => {
      active = false;
      clearInterval(timer);
      off();
    };
  }, [tick]);

  const reload = useCallback(() => setTick((t) => t + 1), []);
  return { state, error, reload };
}

/**
 * Fetches `fetcher` and refetches whenever the sim version changes or a local mutation happens.
 * `key` should change when the fetcher's inputs change (e.g. a village id).
 */
export function useEwsData<T>(fetcher: () => Promise<T>, key: string = '') {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [tick, setTick] = useState(0);
  const fetcherRef = useRef(fetcher);
  const { state } = useSimState();
  const version = state?.version;

  useEffect(() => {
    fetcherRef.current = fetcher;
  });

  useEffect(() => {
    let active = true;
    fetcherRef.current().then(
      (d) => {
        if (!active) return;
        setData(d);
        setError(null);
        setLoading(false);
      },
      (e) => {
        if (!active) return;
        setError(message(e));
        setLoading(false);
      },
    );
    return () => {
      active = false;
    };
  }, [key, version, tick]);

  useEffect(() => onEwsChange(() => setTick((t) => t + 1)), []);

  const reload = useCallback(() => setTick((t) => t + 1), []);
  return { data, error, loading, reload, simState: state };
}
