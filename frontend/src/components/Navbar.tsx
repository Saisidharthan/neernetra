'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useTheme } from '@/lib/theme';
import { useSim } from '@/components/ews/SimProvider';
import {
  Sun, Moon, Eye, Shield, ChevronDown, Bell, Menu, X, LayoutDashboard, PlayCircle, Droplets, BrainCircuit,
  Smartphone, MoreHorizontal, Inbox, Users, Stethoscope, ChartColumn, Bot, FileText,
} from 'lucide-react';
import { UserRole } from '@/lib/types';

interface NavItem {
  href: string;
  label: string;
  icon: typeof Bell;
  hint?: string;
}

const PRIMARY: NavItem[] = [
  { href: '/portal/district', label: 'Command Center', icon: LayoutDashboard },
  { href: '/simulation', label: 'Demo', icon: PlayCircle },
  { href: '/notifications', label: 'Alerts', icon: Bell },
  { href: '/water-quality', label: 'Water', icon: Droplets },
  { href: '/model', label: 'Model', icon: BrainCircuit },
];

const FIELD: NavItem[] = [
  { href: '/portal/asha', label: 'ASHA', icon: Stethoscope, hint: 'Offline field reporting' },
  { href: '/portal/citizen', label: 'Citizen', icon: Users, hint: 'Advisory + water report' },
  { href: '/inbox', label: 'Inbox', icon: Inbox, hint: 'Phones receiving alerts' },
];

const MORE: NavItem[] = [
  { href: '/analytics', label: 'Analytics', icon: ChartColumn },
  { href: '/ai-assistant', label: 'AI Assistant', icon: Bot },
  { href: '/reports', label: 'Reports', icon: FileText },
];

const ROLES: { role: UserRole; label: string; name: string; path: string; tag: string; tagClass: string }[] = [
  { role: 'CITIZEN', label: 'Citizen', name: 'Ramesh Das', path: '/portal/citizen', tag: 'Public', tagClass: 'text-slate-400' },
  { role: 'ASHA_WORKER', label: 'ASHA Worker', name: 'Anita Devi (ASHA)', path: '/portal/asha', tag: 'Field', tagClass: 'text-emerald-500' },
  { role: 'PHC_STAFF', label: 'PHC Staff', name: 'Dr. Prabal Das', path: '/portal/phc', tag: 'Medical', tagClass: 'text-teal-500' },
  { role: 'DISTRICT_OFFICER', label: 'District Officer', name: 'Dr. Hemanta Gogoi (DHO)', path: '/portal/district', tag: 'Command', tagClass: 'text-amber-500' },
  { role: 'GOVT_ADMIN', label: 'State / Govt', name: 'State Health Secretary', path: '/portal/government', tag: 'Executive', tagClass: 'text-purple-500' },
  { role: 'SYS_ADMIN', label: 'System Admin', name: 'System Administrator', path: '/portal/admin', tag: 'System', tagClass: 'text-rose-500' },
];

const isActive = (pathname: string, href: string) => pathname === href || pathname.startsWith(`${href}/`);

function useOutsideClose(open: boolean, close: () => void) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) close();
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [open, close]);
  return ref;
}

function NavDropdown({ label, icon: Icon, items, pathname }: { label: string; icon: typeof Bell; items: NavItem[]; pathname: string }) {
  const [open, setOpen] = useState(false);
  const ref = useOutsideClose(open, () => setOpen(false));
  const active = items.some((i) => isActive(pathname, i.href));
  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg transition-colors hover:text-emerald-600 dark:hover:text-emerald-400 ${
          active ? 'text-emerald-600 dark:text-emerald-400 font-bold' : ''
        }`}
      >
        <Icon className="w-4 h-4" />
        {label}
        <ChevronDown className="w-3 h-3" />
      </button>
      {open && (
        <div className="absolute left-0 mt-2 w-60 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl py-1.5 z-50">
          {items.map((i) => (
            <Link
              key={i.href}
              href={i.href}
              onClick={() => setOpen(false)}
              className={`flex items-center gap-2.5 px-3.5 py-2 text-sm hover:bg-emerald-50 dark:hover:bg-emerald-950/50 ${
                isActive(pathname, i.href) ? 'text-emerald-600 dark:text-emerald-400 font-bold' : 'text-slate-700 dark:text-slate-200'
              }`}
            >
              <i.icon className="w-4 h-4 shrink-0" />
              <span className="flex-1">{i.label}</span>
              {i.hint && <span className="text-[10px] text-slate-400">{i.hint}</span>}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export default function Navbar() {
  const { theme, toggleTheme } = useTheme();
  const { state } = useSim();
  const [activeRole, setActiveRole] = useState<UserRole | null>(null);
  const [roleOpen, setRoleOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const roleRef = useOutsideClose(roleOpen, () => setRoleOpen(false));
  const router = useRouter();
  const pathname = usePathname();
  const activeAlerts = state?.kpis.activeAlerts ?? 0;

  const handleRoleSelect = (r: (typeof ROLES)[number]) => {
    setActiveRole(r.role);
    setRoleOpen(false);
    localStorage.setItem(
      'arogya_user',
      JSON.stringify({
        id: 101,
        full_name: r.name,
        email: `${r.role.toLowerCase()}@neernetra.demo`,
        role: r.role,
        state: 'Assam',
        district: 'Kamrup',
      }),
    );
    router.push(r.path);
  };

  const linkClass = (href: string) =>
    `flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg transition-colors hover:text-emerald-600 dark:hover:text-emerald-400 ${
      isActive(pathname, href) ? 'text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-950/50' : ''
    }`;

  return (
    <header className="w-full backdrop-blur-md bg-white/85 dark:bg-slate-950/85 border-b border-slate-200 dark:border-slate-800 transition-colors duration-200">
      <div className="w-full bg-gradient-to-r from-cyan-700 via-emerald-700 to-teal-700 text-[11px] font-semibold text-white px-4 py-1 flex items-center justify-between">
        <span className="flex items-center gap-2">
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-300 animate-ping" />
          Community water-borne illness early warning · demo runs on a simulated district with synthetic data
        </span>
        <span className="hidden md:inline">Emergency: 108 / 104</span>
      </div>

      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        <Link href="/" className="flex items-center space-x-3 group shrink-0">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-600 to-emerald-400 flex items-center justify-center text-white shadow-md shadow-emerald-500/20 group-hover:scale-105 transition-transform">
            <Eye className="w-6 h-6" />
          </div>
          <div>
            <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-cyan-600 to-emerald-500 dark:from-cyan-400 dark:to-emerald-300 bg-clip-text text-transparent">
              NeerNetra
            </span>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium hidden sm:block">नीर नेत्र · the water eye</p>
          </div>
        </Link>

        <div className="hidden lg:flex items-center gap-0.5 text-sm font-medium text-slate-700 dark:text-slate-200">
          {PRIMARY.map((i) => (
            <Link key={i.href} href={i.href} className={linkClass(i.href)}>
              <i.icon className="w-4 h-4" />
              {i.label}
              {i.href === '/notifications' && activeAlerts > 0 && (
                <span className="ml-0.5 min-w-5 h-5 px-1 rounded-full bg-red-600 text-white text-[11px] font-black flex items-center justify-center">
                  {activeAlerts}
                </span>
              )}
            </Link>
          ))}
          <NavDropdown key={`field-${pathname}`} label="Field" icon={Smartphone} items={FIELD} pathname={pathname} />
          <NavDropdown key={`more-${pathname}`} label="More" icon={MoreHorizontal} items={MORE} pathname={pathname} />
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={toggleTheme}
            aria-label="Toggle dark / light theme"
            className="p-2 rounded-lg bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-600" />}
          </button>

          <div ref={roleRef} className="relative hidden sm:block">
            <button
              onClick={() => setRoleOpen((o) => !o)}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs shadow-md shadow-emerald-600/20 transition-colors"
            >
              <Shield className="w-3.5 h-3.5" />
              <span className="hidden xl:inline">{activeRole ? ROLES.find((r) => r.role === activeRole)?.label : 'Demo role'}</span>
              <ChevronDown className="w-3 h-3" />
            </button>
            {roleOpen && (
              <div className="absolute right-0 mt-2 w-64 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl py-2 z-50">
                <div className="px-3 py-1.5 border-b border-slate-100 dark:border-slate-800 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Switch demo role
                </div>
                {ROLES.map((r) => (
                  <button
                    key={r.role}
                    onClick={() => handleRoleSelect(r)}
                    className="w-full text-left px-4 py-2 text-xs hover:bg-emerald-50 dark:hover:bg-emerald-950/50 flex items-center justify-between text-slate-700 dark:text-slate-200"
                  >
                    <span className="font-semibold">{r.label}</span>
                    <span className={`text-[10px] ${r.tagClass}`}>{r.tag}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={() => setMobileOpen((o) => !o)}
            aria-label="Open menu"
            className="lg:hidden p-2 rounded-lg bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200"
          >
            {mobileOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>
      </nav>

      {mobileOpen && (
        <div className="lg:hidden border-t border-slate-200 dark:border-slate-800 px-4 py-3 grid grid-cols-2 sm:grid-cols-3 gap-1 text-sm font-medium text-slate-700 dark:text-slate-200">
          {[...PRIMARY, ...FIELD, ...MORE].map((i) => (
            <Link key={i.href} href={i.href} onClick={() => setMobileOpen(false)} className={linkClass(i.href)}>
              <i.icon className="w-4 h-4" />
              {i.label}
            </Link>
          ))}
        </div>
      )}
    </header>
  );
}
