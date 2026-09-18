'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import L from 'leaflet';
import type { VillageSummary } from '@/lib/ews';
import { useTheme } from '@/lib/theme';
import { createBaseMap, esc, type BaseMap } from './ews/leafletBase';
import { WATER_SOURCE_LABEL, WATER_STATUS_HEX, WATER_STATUS_LABEL, waterStatus, type WaterStatus } from './ews/tiers';

const STATUSES: WaterStatus[] = ['h2s', 'turbid', 'ok', 'nodata'];

function waterIcon(v: VillageSummary, selected: boolean) {
  const color = WATER_STATUS_HEX[waterStatus(v.latest)];
  const size = selected ? 26 : 20;
  const shape = v.hasSensor ? 'rounded-md' : 'rounded-full';
  return L.divIcon({
    className: '',
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2],
    html: `<span class="block w-full h-full ${shape} border-2 ${selected ? 'border-slate-900' : 'border-white'} shadow-lg" style="width:${size}px;height:${size}px;background:${color}"></span>`,
  });
}

function popupHtml(v: VillageSummary) {
  const l = v.latest;
  const status = waterStatus(l);
  const row = (k: string, val: string) =>
    `<tr><td style="color:#64748b;padding:1px 10px 1px 0">${k}</td><td style="font-weight:600">${val}</td></tr>`;
  return `<div style="font-family:system-ui,sans-serif;min-width:200px;color:#0f172a">
    <div style="font-weight:800;font-size:14px">${esc(v.name)} <span style="color:#64748b;font-weight:600;font-size:12px">${esc(v.id)}</span></div>
    <div style="margin:3px 0 6px;font-size:11px;font-weight:700;color:${WATER_STATUS_HEX[status]}">${WATER_STATUS_LABEL[status]}</div>
    <table style="font-size:12px">
      ${row('Source', `${WATER_SOURCE_LABEL[v.waterSource]}${v.hasSensor ? ' · sensor' : ''}`)}
      ${row('Turbidity', l.turbidity === null ? '—' : `${l.turbidity.toFixed(1)} NTU`)}
      ${row('pH', l.ph === null ? '—' : l.ph.toFixed(1))}
      ${row('TDS', l.tds === null ? '—' : `${Math.round(l.tds)} mg/L`)}
      ${row('H2S strip', l.h2sPositive === null ? '—' : l.h2sPositive ? 'Positive' : 'Negative')}
      ${row('Rain (24h)', `${l.rainfall24h.toFixed(0)} mm`)}
    </table>
    <a data-nav href="/village/${encodeURIComponent(v.id)}" style="display:block;margin-top:8px;padding:6px 8px;border-radius:6px;background:#0891b2;color:#fff;text-align:center;font-weight:700;font-size:12px;text-decoration:none">Open village →</a>
  </div>`;
}

interface WaterMap {
  base: BaseMap;
  update: (villages: VillageSummary[], selectedId: string | null) => void;
}

function createWaterMap(el: HTMLElement, onNavigate: (href: string) => void, onSelect: (id: string) => void): WaterMap {
  const base = createBaseMap(el, onNavigate);
  const markers = new Map<string, L.Marker>();
  return {
    base,
    update(villages, selectedId) {
      const ids = new Set(villages.map((v) => v.id));
      for (const [id, m] of markers) {
        if (!ids.has(id)) {
          m.remove();
          markers.delete(id);
        }
      }
      for (const v of villages) {
        const selected = v.id === selectedId;
        const existing = markers.get(v.id);
        if (existing) {
          existing.setIcon(waterIcon(v, selected));
          existing.setPopupContent(popupHtml(v));
        } else {
          const m = L.marker([v.lat, v.lon], { icon: waterIcon(v, selected), title: v.name })
            .bindPopup(popupHtml(v))
            .bindTooltip(v.name, { direction: 'right', offset: [10, 0] })
            .on('click', () => onSelect(v.id))
            .addTo(base.map);
          markers.set(v.id, m);
        }
      }
      base.fitOnce(villages);
    },
  };
}

interface Props {
  villages: VillageSummary[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

export default function WaterQualityMap({ villages, selectedId, onSelect }: Props) {
  const elRef = useRef<HTMLDivElement>(null);
  const ctrlRef = useRef<WaterMap | null>(null);
  const router = useRouter();
  const { theme } = useTheme();

  useEffect(() => {
    const ctrl = createWaterMap(elRef.current!, (href) => router.push(href), onSelect);
    ctrlRef.current = ctrl;
    return () => {
      ctrl.base.destroy();
      ctrlRef.current = null;
    };
  }, [router, onSelect]);

  useEffect(() => {
    ctrlRef.current?.base.setTheme(theme);
  }, [theme, router, onSelect]);

  useEffect(() => {
    ctrlRef.current?.update(villages, selectedId);
  }, [villages, selectedId, router, onSelect]);

  return (
    <div className="relative isolate w-full rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-950">
      <div ref={elRef} className="w-full h-[440px]" />
      <div className="absolute bottom-3 left-3 z-[1000] rounded-xl bg-white/90 dark:bg-slate-950/90 backdrop-blur border border-slate-200 dark:border-slate-800 px-3 py-2 text-[11px] space-y-1 shadow-lg">
        {STATUSES.map((s) => (
          <div key={s} className="flex items-center gap-2 text-slate-700 dark:text-slate-200">
            <span className="w-3 h-3 rounded-full border border-white" style={{ background: WATER_STATUS_HEX[s] }} />
            {WATER_STATUS_LABEL[s]}
          </div>
        ))}
        <div className="pt-1 border-t border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400">■ sensor · ● manual testing</div>
      </div>
    </div>
  );
}
