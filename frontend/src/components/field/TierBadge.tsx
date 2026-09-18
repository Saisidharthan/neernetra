import type { Tier } from '@/lib/ews';

export const TIER_STYLE: Record<Tier, { badge: string; dot: string; bar: string; soft: string }> = {
  normal: {
    badge: 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800',
    dot: 'bg-emerald-500',
    bar: 'border-l-emerald-500',
    soft: 'bg-emerald-50 dark:bg-emerald-950/40',
  },
  watch: {
    badge: 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800',
    dot: 'bg-amber-500',
    bar: 'border-l-amber-500',
    soft: 'bg-amber-50 dark:bg-amber-950/40',
  },
  warning: {
    badge: 'bg-orange-100 text-orange-800 border-orange-300 dark:bg-orange-950 dark:text-orange-300 dark:border-orange-800',
    dot: 'bg-orange-500',
    bar: 'border-l-orange-500',
    soft: 'bg-orange-50 dark:bg-orange-950/40',
  },
  outbreak: {
    badge: 'bg-red-100 text-red-800 border-red-300 dark:bg-red-950 dark:text-red-300 dark:border-red-800',
    dot: 'bg-red-600',
    bar: 'border-l-red-600',
    soft: 'bg-red-50 dark:bg-red-950/40',
  },
};

export default function TierBadge({ tier, label, className = '' }: { tier: Tier; label: string; className?: string }) {
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border text-[11px] font-bold uppercase tracking-wide ${TIER_STYLE[tier].badge} ${className}`}>
      <span className={`w-2 h-2 rounded-full ${TIER_STYLE[tier].dot} ${tier === 'outbreak' ? 'animate-pulse' : ''}`} />
      {label}
    </span>
  );
}
