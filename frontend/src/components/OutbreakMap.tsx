'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import L from 'leaflet';
import type { VillageSummary } from '@/lib/ews';
import { useTheme } from '@/lib/theme';
import { createBaseMap, esc, type BaseMap } from './ews/leafletBase';
import { ADVISORY_LABEL, TIER_HEX, TIER_LABEL, TIERS, WATER_SOURCE_LABEL, fmtInt, pct } from './ews/tiers';

const RIVER_HEX = '#0ea5e9';

const markerSize = (risk: number) => Math.round(18 + risk * 16);

function villageIcon(v: VillageSummary) {
  const size = markerSize(v.risk);
  const color = TIER_HEX[v.tier];
  const pulse =
    v.tier === 'outbreak'
      ? `<span class="absolute inset-0 rounded-full animate-ping" style="background:${color};opacity:.6"></span>`
      : '';
  return L.divIcon({
    className: '',
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2],
    tooltipAnchor: [size / 2, 0],
    html: `<div class="relative" style="width:${size}px;height:${size}px">${pulse}<span class="relative flex items-center justify-center w-full h-full rounded-full border-2 border-white text-white font-extrabold shadow-lg" style="background:${color};font-size:${size > 30 ? 13 : 11}px">${v.rank}</span></div>`,
  });
}

function arrowIcon(angle: number, color: string) {
  return L.divIcon({
    className: '',
    iconSize: [18, 18],
    iconAnchor: [9, 9],
    html: `<div style="width:18px;height:18px;transform:rotate(${angle}deg)"><svg viewBox="0 0 18 18" width="18" height="18"><path d="M3 2 L16 9 L3 16 L7 9 Z" fill="${color}" stroke="white" stroke-width="1.2" stroke-linejoin="round"/></svg></div>`,
  });
}

function popupHtml(v: VillageSummary) {
  const row = (k: string, val: string) =>
    `<tr><td style="color:#64748b;padding:1px 10px 1px 0">${k}</td><td style="font-weight:600">${val}</td></tr>`;
  const turb = v.latest.turbidity === null ? '—' : `${v.latest.turbidity.toFixed(1)} NTU`;
  const h2s = v.latest.h2sPositive === null ? '—' : v.latest.h2sPositive ? 'Positive' : 'Negative';
  return `<div style="font-family:system-ui,sans-serif;min-width:210px;color:#0f172a">
    <div style="font-weight:800;font-size:15px">${esc(v.name)} <span style="color:#64748b;font-weight:600;font-size:12px">${esc(v.id)}</span></div>
    <div style="display:inline-block;margin:4px 0 6px;padding:2px 8px;border-radius:5px;background:${TIER_HEX[v.tier]};color:#fff;font-size:11px;font-weight:700">${TIER_LABEL[v.tier].toUpperCase()} · risk ${pct(v.risk)} · #${v.rank}</div>
    <table style="font-size:12px">
      ${row('Population', fmtInt(v.population))}
      ${row('Water', WATER_SOURCE_LABEL[v.waterSource])}
      ${row('Advisory', ADVISORY_LABEL[v.advisory])}
      ${row('Cases (7d)', String(v.latest.cases7d))}
      ${row('Turbidity', turb)}
      ${row('H2S strip', h2s)}
      ${row('EARS', v.ears.flagged ? 'Flagged' : 'Quiet')}
    </table>
    <a data-nav href="/village/${encodeURIComponent(v.id)}" style="display:block;margin-top:8px;padding:6px 8px;border-radius:6px;background:#059669;color:#fff;text-align:center;font-weight:700;font-size:12px;text-decoration:none">Open village →</a>
  </div>`;
}

interface RiskMap {
  base: BaseMap;
  update: (villages: VillageSummary[]) => void;
}

function createRiskMap(el: HTMLElement, onNavigate: (href: string) => void): RiskMap {
  const base = createBaseMap(el, onNavigate);
  const { map } = base;
  const markers = new Map<string, L.Marker>();
  const links = new Map<string, { line: L.Polyline; arrow: L.Marker }>();

  return {
    base,
    update(villages) {
      const byId = new Map(villages.map((v) => [v.id, v]));

      for (const [id, m] of markers) {
        if (!byId.has(id)) {
          m.remove();
          markers.delete(id);
        }
      }
      for (const [id, l] of links) {
        const v = byId.get(id);
        if (!v || !v.upstreamId || !byId.has(v.upstreamId)) {
          l.line.remove();
          l.arrow.remove();
          links.delete(id);
        }
      }

      for (const v of villages) {
        const up = v.upstreamId ? byId.get(v.upstreamId) : undefined;
        if (up) {
          const color = up.tier === 'normal' ? RIVER_HEX : TIER_HEX[up.tier];
          const a = map.project([up.lat, up.lon], 0);
          const b = map.project([v.lat, v.lon], 0);
          const angle = (Math.atan2(b.y - a.y, b.x - a.x) * 180) / Math.PI;
          const mid: L.LatLngTuple = [up.lat + (v.lat - up.lat) * 0.55, up.lon + (v.lon - up.lon) * 0.55];
          const existing = links.get(v.id);
          if (existing) {
            existing.line.setStyle({ color });
            existing.arrow.setIcon(arrowIcon(angle, color));
          } else {
            const line = L.polyline(
              [
                [up.lat, up.lon],
                [v.lat, v.lon],
              ],
              { color, weight: 3, opacity: 0.75, dashArray: '8 6', interactive: false },
            ).addTo(map);
            const arrow = L.marker(mid, { icon: arrowIcon(angle, color), interactive: false, keyboard: false }).addTo(map);
            links.set(v.id, { line, arrow });
          }
        }

        const label = `${v.name} · ${pct(v.risk)}`;
        let marker = markers.get(v.id);
        if (marker) {
          marker.setIcon(villageIcon(v));
          marker.setPopupContent(popupHtml(v));
          marker.setZIndexOffset(Math.round(v.risk * 1000));
        } else {
          marker = L.marker([v.lat, v.lon], { icon: villageIcon(v), zIndexOffset: Math.round(v.risk * 1000), title: v.name })
            .bindPopup(popupHtml(v))
            .addTo(map);
          markers.set(v.id, marker);
        }
        marker.unbindTooltip();
        marker.bindTooltip(label, { direction: 'right', offset: [4, 0], permanent: v.tier !== 'normal' && v.rank <= 3, opacity: 0.95 });
      }

      base.fitOnce(villages);
    },
  };
}

interface OutbreakMapProps {
  villages: VillageSummary[];
  heightClass?: string;
}

export default function OutbreakMap({ villages, heightClass = 'h-[520px]' }: OutbreakMapProps) {
  const elRef = useRef<HTMLDivElement>(null);
  const ctrlRef = useRef<RiskMap | null>(null);
  const router = useRouter();
  const { theme } = useTheme();

  useEffect(() => {
    const ctrl = createRiskMap(elRef.current!, (href) => router.push(href));
    ctrlRef.current = ctrl;
    return () => {
      ctrl.base.destroy();
      ctrlRef.current = null;
    };
  }, [router]);

  useEffect(() => {
    ctrlRef.current?.base.setTheme(theme);
  }, [theme, router]);

  useEffect(() => {
    ctrlRef.current?.update(villages);
  }, [villages, router]);

  return (
    <div className="relative isolate w-full rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-950">
      <div ref={elRef} className={`w-full ${heightClass}`} />
      <div className="absolute bottom-3 left-3 z-[1000] rounded-xl bg-white/90 dark:bg-slate-950/90 backdrop-blur border border-slate-200 dark:border-slate-800 px-3 py-2 text-[11px] space-y-1 shadow-lg">
        {TIERS.map((t) => (
          <div key={t} className="flex items-center gap-2 text-slate-700 dark:text-slate-200">
            <span className="w-3 h-3 rounded-full border border-white" style={{ background: TIER_HEX[t] }} />
            {TIER_LABEL[t]}
          </div>
        ))}
        <div className="flex items-center gap-2 pt-1 border-t border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200">
          <span className="w-4 border-t-2 border-dashed" style={{ borderColor: RIVER_HEX }} />
          River flow ▸ downstream
        </div>
        <div className="text-slate-500 dark:text-slate-400">Size = risk · number = rank</div>
      </div>
    </div>
  );
}
