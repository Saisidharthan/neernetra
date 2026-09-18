import L from 'leaflet';
import type { VillageSummary } from '@/lib/ews';

const TILE_URL = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';

export const esc = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

export interface BaseMap {
  map: L.Map;
  setTheme: (theme: 'light' | 'dark') => void;
  fitOnce: (villages: VillageSummary[]) => void;
  destroy: () => void;
}

/** Leaflet map with themed tiles; `<a data-nav href>` inside popups navigates client-side. */
export function createBaseMap(el: HTMLElement, onNavigate: (href: string) => void): BaseMap {
  const map = L.map(el, { scrollWheelZoom: false }).setView([26.2, 92.6], 8);
  let tiles: L.TileLayer | null = null;
  let fitted = false;

  const onClick = (e: MouseEvent) => {
    const a = (e.target as HTMLElement).closest<HTMLAnchorElement>('a[data-nav]');
    if (!a) return;
    e.preventDefault();
    onNavigate(a.getAttribute('href')!);
  };
  el.addEventListener('click', onClick);

  return {
    map,
    setTheme(theme) {
      tiles?.remove();
      tiles = L.tileLayer(TILE_URL, {
        attribution: '&copy; OpenStreetMap contributors',
        className: theme === 'dark' ? 'nn-tiles-dark' : '',
        maxZoom: 18,
      }).addTo(map);
    },
    fitOnce(villages) {
      if (fitted || villages.length === 0) return;
      fitted = true;
      map.fitBounds(L.latLngBounds(villages.map((v) => [v.lat, v.lon] as L.LatLngTuple)), { padding: [40, 40], maxZoom: 11 });
    },
    destroy() {
      el.removeEventListener('click', onClick);
      map.remove();
    },
  };
}
