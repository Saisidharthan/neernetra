'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Shield, Lock, Mail, Activity, ArrowRight, KeyRound, CheckCircle2 } from 'lucide-react';
import { UserRole } from '@/lib/types';

export default function LoginPage() {
  const [email, setEmail] = useState('citizen@arogya.gov.in');
  const [password, setPassword] = useState('citizen123');
  const [role, setRole] = useState<UserRole>('CITIZEN');
  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSent, setForgotSent] = useState(false);
  const router = useRouter();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const demoUser = {
      id: 101,
      full_name: email.split('@')[0].toUpperCase(),
      email,
      role,
      state: 'Assam',
      district: 'Kamrup Metropolitan'
    };
    localStorage.setItem('arogya_user', JSON.stringify(demoUser));

    if (role === 'CITIZEN') router.push('/portal/citizen');
    else if (role === 'ASHA_WORKER') router.push('/portal/asha');
    else if (role === 'PHC_STAFF') router.push('/portal/phc');
    else if (role === 'DISTRICT_OFFICER') router.push('/portal/district');
    else if (role === 'GOVT_ADMIN') router.push('/portal/government');
    else router.push('/portal/admin');
  };

  const handleDemoSelect = (selectedRole: UserRole, targetEmail: string, targetPath: string) => {
    setRole(selectedRole);
    setEmail(targetEmail);
    setPassword('demo123');
    const demoUser = {
      id: 101,
      full_name: `${selectedRole} User`,
      email: targetEmail,
      role: selectedRole,
      state: 'Assam',
      district: 'Kamrup Metropolitan'
    };
    localStorage.setItem('arogya_user', JSON.stringify(demoUser));
    router.push(targetPath);
  };

  const handleForgotSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setForgotSent(true);
    setTimeout(() => {
      setForgotSent(false);
      setIsForgotModalOpen(false);
    }, 2500);
  };

  return (
    <div className="max-w-md mx-auto py-12 space-y-6">

      <div className="text-center space-y-2">
        <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center mx-auto shadow-lg shadow-emerald-600/30">
          <Activity className="w-7 h-7" />
        </div>
        <h1 className="text-2xl font-black text-slate-900 dark:text-white">Portal Sign In</h1>
        <p className="text-xs text-slate-500 dark:text-slate-400">Arogya-Purvottar Government Health Surveillance Platform</p>
      </div>

      <div className="p-8 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl space-y-4 text-xs">
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="font-semibold text-slate-700 dark:text-slate-300">Select Role</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as UserRole)}
              className="w-full mt-1 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none text-slate-900 dark:text-white"
            >
              <option value="CITIZEN">Citizen (Public Reporting)</option>
              <option value="ASHA_WORKER">ASHA Worker (Field Surveys & Offline Sync)</option>
              <option value="PHC_STAFF">PHC Medical Officer (Clinical & Beds)</option>
              <option value="DISTRICT_OFFICER">District Health Officer (Command & Alerts)</option>
              <option value="GOVT_ADMIN">Government Administrator (MDoNER Macro)</option>
              <option value="SYS_ADMIN">System Administrator (Security Logs)</option>
            </select>
          </div>

          <div>
            <label className="font-semibold text-slate-700 dark:text-slate-300">Email Address</label>
            <div className="relative mt-1">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between">
              <label className="font-semibold text-slate-700 dark:text-slate-300">Password</label>
              <button
                type="button"
                onClick={() => setIsForgotModalOpen(true)}
                className="text-[11px] text-emerald-600 dark:text-emerald-400 hover:underline"
              >
                Forgot Password?
              </button>
            </div>
            <div className="relative mt-1">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition-colors flex items-center justify-center gap-2"
          >
            <span>Sign In to Portal</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="pt-4 border-t border-slate-200 dark:border-slate-800 text-center">
          <p className="text-slate-500 dark:text-slate-400">
            Don't have an account?{' '}
            <Link href="/register" className="text-emerald-600 dark:text-emerald-400 font-bold hover:underline">
              Register New Account
            </Link>
          </p>
        </div>
      </div>

      {/* Quick Demo Login Switcher */}
      <div className="p-6 rounded-2xl bg-slate-900 text-white border border-slate-800 shadow-xl space-y-3 text-xs">
        <div className="font-bold text-slate-300 flex items-center gap-1.5">
          <Shield className="w-4 h-4 text-emerald-400" />
          <span>Quick Demo Login Buttons (SIH Evaluation Mode)</span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <button onClick={() => handleDemoSelect('CITIZEN', 'citizen@arogya.gov.in', '/portal/citizen')} className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-left">👤 Citizen</button>
          <button onClick={() => handleDemoSelect('ASHA_WORKER', 'asha@arogya.gov.in', '/portal/asha')} className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-left">🏥 ASHA Worker</button>
          <button onClick={() => handleDemoSelect('PHC_STAFF', 'phc@arogya.gov.in', '/portal/phc')} className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-left">🩺 PHC Officer</button>
          <button onClick={() => handleDemoSelect('DISTRICT_OFFICER', 'dho@arogya.gov.in', '/portal/district')} className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-left">🛡️ District Officer</button>
          <button onClick={() => handleDemoSelect('GOVT_ADMIN', 'govt@arogya.gov.in', '/portal/government')} className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-left">🏛️ Govt Admin</button>
          <button onClick={() => handleDemoSelect('SYS_ADMIN', 'admin@arogya.gov.in', '/portal/admin')} className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-left">⚙️ System Admin</button>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {isForgotModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl max-w-sm w-full space-y-4 text-xs">
            <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
              <KeyRound className="w-5 h-5 text-emerald-500" />
              Reset Password Request
            </h3>
            {forgotSent ? (
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                <span>Password reset link dispatched to email!</span>
              </div>
            ) : (
              <form onSubmit={handleForgotSubmit} className="space-y-3">
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300">Enter Registered Email</label>
                  <input
                    type="email"
                    required
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    placeholder="e.g. user@arogya.gov.in"
                    className="w-full mt-1 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none text-slate-900 dark:text-white"
                  />
                </div>
                <div className="flex items-center justify-end space-x-2 pt-2">
                  <button type="button" onClick={() => setIsForgotModalOpen(false)} className="px-3 py-2 rounded-lg bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">Cancel</button>
                  <button type="submit" className="px-4 py-2 rounded-lg bg-emerald-600 text-white font-bold">Send Reset Link</button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
