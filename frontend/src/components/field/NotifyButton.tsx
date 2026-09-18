import { Bell, BellOff, BellRing } from 'lucide-react';
import type { DeviceNotifyStatus } from './useDeviceNotifications';

export default function NotifyButton({
  status,
  onEnable,
  label,
  className = '',
}: {
  status: DeviceNotifyStatus;
  onEnable: () => void;
  label: (key: string) => string;
  className?: string;
}) {
  if (status === 'granted') {
    return (
      <span className={`inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-400 ${className}`}>
        <BellRing className="w-4 h-4" />
        {label('notifications_on')}
      </span>
    );
  }
  if (status === 'denied' || status === 'unsupported') {
    return (
      <span className={`inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400 ${className}`}>
        <BellOff className="w-4 h-4 shrink-0" />
        {label(status === 'denied' ? 'notifications_blocked' : 'notifications_unsupported')}
      </span>
    );
  }
  return (
    <button
      type="button"
      onClick={onEnable}
      className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold transition-colors ${className}`}
    >
      <Bell className="w-4 h-4" />
      {label('enable_notifications')}
    </button>
  );
}
