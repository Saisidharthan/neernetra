'use client';

import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid, Legend } from 'recharts';
import { Building2, TrendingUp, Droplets, DollarSign, ShieldCheck, MapPin } from 'lucide-react';

const stateData = [
  { state: "Assam", high_risk: 18, water_safety: 62.4, cases: 142 },
  { state: "Meghalaya", high_risk: 4, water_safety: 84.1, cases: 28 },
  { state: "Tripura", high_risk: 6, water_safety: 71.0, cases: 45 },
  { state: "Manipur", high_risk: 9, water_safety: 68.5, cases: 62 },
  { state: "Nagaland", high_risk: 2, water_safety: 88.2, cases: 14 },
  { state: "Mizoram", high_risk: 1, water_safety: 91.5, cases: 9 },
  { state: "Arunachal", high_risk: 5, water_safety: 79.0, cases: 22 },
  { state: "Sikkim", high_risk: 0, water_safety: 94.8, cases: 4 },
];

const seasonalTrend = [
  { month: "Jan", Cholera: 12, Typhoid: 24, Diarrhea: 85 },
  { month: "Feb", Cholera: 8, Typhoid: 19, Diarrhea: 70 },
  { month: "Mar", Cholera: 15, Typhoid: 28, Diarrhea: 92 },
  { month: "Apr", Cholera: 29, Typhoid: 42, Diarrhea: 140 },
  { month: "May (Monsoon)", Cholera: 68, Typhoid: 84, Diarrhea: 280 },
  { month: "Jun (Floods)", Cholera: 145, Typhoid: 162, Diarrhea: 450 },
  { month: "Jul", Cholera: 132, Typhoid: 148, Diarrhea: 410 },
  { month: "Aug", Cholera: 98, Typhoid: 115, Diarrhea: 320 },
];

export default function GovernmentPortal() {
  return (
    <div className="space-y-8 py-2">

      {/* Header */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-purple-700 to-indigo-700 text-white shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs uppercase font-bold tracking-wider px-2.5 py-0.5 rounded bg-purple-950/60 text-purple-200 border border-purple-400/40">
            Ministry of Development of North Eastern Region (MDoNER)
          </span>
          <h1 className="text-2xl sm:text-3xl font-black mt-1">Northeast Regional Macro Analytics & Budget Surveillance</h1>
        </div>

        <div className="flex items-center space-x-2 bg-purple-950/80 p-3 rounded-xl border border-purple-700/60 text-xs">
          <div>
            <div className="text-[10px] text-slate-300 font-bold uppercase">Budget Allocated</div>
            <div className="text-xl font-black text-amber-400">₹ 48.5 Crore</div>
          </div>
        </div>
      </div>

      {/* State Breakdown Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-md">
          <div className="text-slate-500 font-bold uppercase">States Monitored</div>
          <div className="text-2xl font-black text-purple-500 mt-1">All 8 NE States</div>
          <div className="text-[10px] text-purple-400 mt-0.5">128 Total Districts</div>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-md">
          <div className="text-slate-500 font-bold uppercase">Monitored Population</div>
          <div className="text-2xl font-black text-emerald-500 mt-1">4.5 Million</div>
          <div className="text-[10px] text-emerald-400 mt-0.5">Rural & Tribal Belts</div>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-md">
          <div className="text-slate-500 font-bold uppercase">Water Kits Distributed</div>
          <div className="text-2xl font-black text-cyan-500 mt-1">14,500 Kits</div>
          <div className="text-[10px] text-cyan-400 mt-0.5">ASHA Field Distribution</div>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-md">
          <div className="text-slate-500 font-bold uppercase">Average Regional Safety</div>
          <div className="text-2xl font-black text-teal-500 mt-[1px]">78.7%</div>
          <div className="text-[10px] text-teal-400 mt-0.5">Water Safety Score</div>
        </div>
      </div>

      {/* Recharts Analytics Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Chart 1: State Water Safety Index */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl space-y-4">
          <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
            <Droplets className="w-5 h-5 text-cyan-500" />
            Water Quality Safety Index by NE State (%)
          </h3>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stateData}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                <XAxis dataKey="state" stroke="#94a3b8" fontSize={10} />
                <YAxis stroke="#94a3b8" fontSize={10} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', color: '#fff', fontSize: '11px' }} />
                <Bar dataKey="water_safety" fill="#06b6d4" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Monsoonal Outbreak Seasonal Trends */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl space-y-4">
          <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-rose-500" />
            Monsoonal Epidemiological Outbreak Trends (Jan - Aug)
          </h3>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={seasonalTrend}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                <XAxis dataKey="month" stroke="#94a3b8" fontSize={10} />
                <YAxis stroke="#94a3b8" fontSize={10} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', color: '#fff', fontSize: '11px' }} />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
                <Line type="monotone" dataKey="Cholera" stroke="#ef4444" strokeWidth={2.5} />
                <Line type="monotone" dataKey="Typhoid" stroke="#f59e0b" strokeWidth={2.5} />
                <Line type="monotone" dataKey="Diarrhea" stroke="#10b981" strokeWidth={2.5} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

    </div>
  );
}
