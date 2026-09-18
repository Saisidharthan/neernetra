import type {
  AdvisoryStatus,
  InterventionStatus,
  InterventionType,
  InjectType,
  Lang,
  LatestReadings,
  NotificationRole,
  OutboundNotification,
  Tier,
  WaterSource,
} from '@/lib/ews';

export const TIERS: Tier[] = ['normal', 'watch', 'warning', 'outbreak'];

export const TIER_HEX: Record<Tier, string> = {
  normal: '#10b981',
  watch: '#f59e0b',
  warning: '#f97316',
  outbreak: '#ef4444',
};

export const TIER_LABEL: Record<Tier, string> = {
  normal: 'Normal',
  watch: 'Watch',
  warning: 'Warning',
  outbreak: 'Outbreak',
};

export const TIER_BADGE: Record<Tier, string> = {
  normal: 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950/70 dark:text-emerald-300 dark:border-emerald-800',
  watch: 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950/70 dark:text-amber-300 dark:border-amber-800',
  warning: 'bg-orange-100 text-orange-800 border-orange-300 dark:bg-orange-950/70 dark:text-orange-300 dark:border-orange-800',
  outbreak: 'bg-red-100 text-red-800 border-red-300 dark:bg-red-950/70 dark:text-red-300 dark:border-red-800',
};

export const TIER_BAR: Record<Tier, string> = {
  normal: 'bg-emerald-500',
  watch: 'bg-amber-500',
  warning: 'bg-orange-500',
  outbreak: 'bg-red-500',
};

export const TIER_BORDER: Record<Tier, string> = {
  normal: 'border-l-emerald-500',
  watch: 'border-l-amber-500',
  warning: 'border-l-orange-500',
  outbreak: 'border-l-red-500',
};

export const ADVISORY_LABEL: Record<AdvisoryStatus, string> = {
  safe: 'Water safe',
  boil: 'Boil water',
  do_not_drink: 'Do not drink',
};

export const INTERVENTION_LABEL: Record<InterventionType, string> = {
  chlorination: 'Chlorination',
  boil_advisory: 'Boil-water advisory',
  medical_camp: 'Medical camp',
  ors_distribution: 'ORS distribution',
  source_testing: 'Source testing',
  awareness_drive: 'Awareness drive',
};

export const INTERVENTION_STATUS_LABEL: Record<InterventionStatus, string> = {
  dispatched: 'Dispatched',
  in_progress: 'In progress',
  completed: 'Completed',
};

export const NEXT_INTERVENTION_STATUS: Record<InterventionStatus, InterventionStatus | null> = {
  dispatched: 'in_progress',
  in_progress: 'completed',
  completed: null,
};

export const INJECT_LABEL: Record<InjectType, string> = {
  heavy_rain: 'Heavy rain',
  pipe_burst: 'Pipe burst',
  sewage_overflow: 'Sewage overflow',
};

export const WATER_SOURCE_LABEL: Record<WaterSource, string> = {
  river: 'River',
  tubewell: 'Tubewell',
  spring: 'Spring',
  pond: 'Pond',
  piped: 'Piped supply',
};

export const LANG_LABEL: Record<Lang, string> = {
  en: 'EN',
  hi: 'हिन्दी',
  as: 'অসমীয়া',
};

export const CHANNEL_LABEL: Record<OutboundNotification['channel'], string> = {
  push: 'Push',
  in_app: 'In-app',
};

export const NOTIFICATION_ROLES: NotificationRole[] = ['ASHA', 'PHC', 'DHO', 'Citizens'];

export const EARS_C2_FLAG = 3;
export const EARS_C3_FLAG = 2;
export const TURBIDITY_ANOMALY_NTU = 10;
export const TURBIDITY_BIS_NTU = 5;

export type WaterStatus = 'h2s' | 'turbid' | 'ok' | 'nodata';

export function waterStatus(l: LatestReadings): WaterStatus {
  if (l.h2sPositive) return 'h2s';
  if (l.turbidity !== null && l.turbidity > TURBIDITY_ANOMALY_NTU) return 'turbid';
  if (l.turbidity === null && l.ph === null && l.h2sPositive === null) return 'nodata';
  return 'ok';
}

export const WATER_STATUS_HEX: Record<WaterStatus, string> = {
  h2s: '#dc2626',
  turbid: '#d97706',
  ok: '#0891b2',
  nodata: '#94a3b8',
};

export const WATER_STATUS_LABEL: Record<WaterStatus, string> = {
  h2s: 'H2S strip positive',
  turbid: `Turbid (> ${TURBIDITY_ANOMALY_NTU} NTU)`,
  ok: 'Within limits',
  nodata: 'No recent reading',
};

export const pct = (x: number) => `${Math.round(x * 100)}%`;

export const fmtDate = (iso: string) =>
  new Date(`${iso}T00:00:00`).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });

export const fmtDateLong = (iso: string) =>
  new Date(`${iso}T00:00:00`).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });

export const fmtInt = (n: number) => n.toLocaleString('en-IN');
