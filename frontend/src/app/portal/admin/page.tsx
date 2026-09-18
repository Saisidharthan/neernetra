'use client';

import React, { useState } from 'react';
import { Shield, Users, Database, Activity, Lock, Cpu, Server, CheckCircle2 } from 'lucide-react';

export default function AdminPortal() {
  const [logs] = useState([
    { action: "USER_LOGIN", user: "dho@arogya.gov.in", role: "DISTRICT_OFFICER", ip: "10.24.8.12", time: "12:44:10 IST" },
    { action: "ALERT_BROADCAST", user: "dho@arogya.gov.in", role: "DISTRICT_OFFICER", details: "Cholera warning for Sonapur sector", time: "12:30:15 IST" },
    { action: "WATER_TEST_SUBMIT", user: "asha@arogya.gov.in", role: "ASHA_WORKER", details: "Sonapur stream pH 5.8, E.Coli POSITIVE", time: "11:15:22 IST" },
    { action: "ML_PREDICTION_EXEC", user: "citizen@arogya.gov.in", role: "CITIZEN", details: "Score 86.4 (CRITICAL) calculated for Sonapur", time: "10:45:00 IST" }
  ]);

  return (
    <div className="space-y-8 py-2">

      {/* Header */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-800 to-slate-900 text-white border border-slate-700 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs uppercase font-bold tracking-wider px-2.5 py-0.5 rounded bg-slate-950/80 text-rose-400 border border-rose-500/40">
            System Administration & Security
          </span>
          <h1 className="text-2xl sm:text-3xl font-black mt-1">Platform RBAC & Security Audit Desk</h1>
        </div>

        <div className="flex items-center space-x-2 text-xs text-emerald-400 font-bold">
          <CheckCircle2 className="w-4 h-4" />
          <span>System Status: 100% Operational</span>
        </div>
      </div>

      {/* Admin Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs">
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
              <Server className="w-4 h-4 text-emerald-500" />
              API Server Uptime
            </h3>
            <span className="text-emerald-500 font-bold">99.98%</span>
          </div>
          <p className="text-slate-500 dark:text-slate-400 text-[11px]">FastAPI Async Engine running on Port 8000 with CORS & JWT middleware enabled.</p>
        </div>

        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
              <Cpu className="w-4 h-4 text-teal-500" />
              ML Inference Latency
            </h3>
            <span className="text-teal-500 font-bold">14 ms</span>
          </div>
          <p className="text-slate-500 dark:text-slate-400 text-[11px]">Scikit-Learn Random Forest & XGBoost risk predictor pipelines loaded in RAM.</p>
        </div>

        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
              <Lock className="w-4 h-4 text-rose-500" />
              Active User Sessions
            </h3>
            <span className="text-rose-500 font-bold">6 Active Roles</span>
          </div>
          <p className="text-slate-500 dark:text-slate-400 text-[11px]">Role-Based Access Control (RBAC) enforced with JWT authentication tokens.</p>
        </div>
      </div>

      {/* Security Audit Log Table */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl space-y-4 text-xs">
        <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
          <Shield className="w-5 h-5 text-indigo-500" />
          Real-Time Platform Audit Log Registry
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 text-[11px] uppercase">
                <th className="py-2.5 px-3 font-bold">Action Event</th>
                <th className="py-2.5 px-3 font-bold">User Email</th>
                <th className="py-2.5 px-3 font-bold">Role</th>
                <th className="py-2.5 px-3 font-bold">Details</th>
                <th className="py-2.5 px-3 font-bold">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {logs.map((l, i) => (
                <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                  <td className="py-3 px-3 font-bold text-emerald-600 dark:text-emerald-400">{l.action}</td>
                  <td className="py-3 px-3 text-slate-900 dark:text-slate-200">{l.user}</td>
                  <td className="py-3 px-3"><span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 font-bold text-[10px]">{l.role}</span></td>
                  <td className="py-3 px-3 text-slate-500 dark:text-slate-400">{l.details || `IP: ${l.ip}`}</td>
                  <td className="py-3 px-3 text-slate-400 text-[10px]">{l.time}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
