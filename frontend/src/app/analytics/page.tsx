'use client';

import { useState, useEffect } from 'react';
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Cell, PieChart, Pie, Legend
} from 'recharts';

interface StateData {
  state: string;
  total_cases: number;
  active_cases: number;
  water_safety_score: number;
  risk_index: number;
  high_risk_villages: number;
}

const COLORS = ['#3b82f6', '#22c55e', '#ef4444', '#f59e0b', '#8b5cf6', '#06b6d4', '#ec4899', '#84cc16'];

const STATE_COORDS: Record<string, [number, number]> = {
  'Assam': [26.2, 92.9],
  'Meghalaya': [25.4, 91.4],
  'Tripura': [23.9, 91.9],
  'Manipur': [24.6, 93.9],
  'Nagaland': [26.1, 94.5],
  'Mizoram': [23.1, 92.9],
  'Arunachal Pradesh': [28.0, 94.7],
  'Sikkim': [27.5, 88.5],
};

export default function GovernmentAnalyticsPage() {
  const [stateData, setStateData] = useState<StateData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<StateData | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/v1/simulation/state-risk-matrix');
        if (!res.ok) throw new Error();
        const data = await res.json();
        setStateData(data.data);
        setSelected(data.data[0]);
      } catch {
        const fallback: StateData[] = [
          { state: 'Assam', total_cases: 145, active_cases: 38, water_safety_score: 62.4, risk_index: 78.5, high_risk_villages: 18 },
          { state: 'Meghalaya', total_cases: 28, active_cases: 7, water_safety_score: 84.1, risk_index: 42.0, high_risk_villages: 4 },
          { state: 'Tripura', total_cases: 46, active_cases: 14, water_safety_score: 71.0, risk_index: 58.3, high_risk_villages: 6 },
          { state: 'Manipur', total_cases: 63, active_cases: 21, water_safety_score: 68.5, risk_index: 69.0, high_risk_villages: 9 },
          { state: 'Nagaland', total_cases: 14, active_cases: 2, water_safety_score: 88.2, risk_index: 28.5, high_risk_villages: 2 },
          { state: 'Mizoram', total_cases: 9, active_cases: 1, water_safety_score: 91.5, risk_index: 31.0, high_risk_villages: 1 },
          { state: 'Arunachal Pradesh', total_cases: 22, active_cases: 6, water_safety_score: 79.0, risk_index: 35.2, high_risk_villages: 5 },
          { state: 'Sikkim', total_cases: 4, active_cases: 0, water_safety_score: 94.8, risk_index: 18.0, high_risk_villages: 0 },
        ];
        setStateData(fallback);
        setSelected(fallback[0]);
      } finally { setLoading(false); }
    })();
  }, []);

  const totalCases = stateData.reduce((s, d) => s + d.total_cases, 0);
  const activeCases = stateData.reduce((s, d) => s + d.active_cases, 0);
  const avgWaterSafety = stateData.length ? (stateData.reduce((s, d) => s + d.water_safety_score, 0) / stateData.length).toFixed(1) : '—';
  const highRiskTotal = stateData.reduce((s, d) => s + d.high_risk_villages, 0);

  const pieData = stateData.map(s => ({ name: s.state, value: s.total_cases }));

  const radarData = selected ? [
    { subject: 'Active Cases', A: selected.active_cases },
    { subject: 'Risk Index', A: selected.risk_index },
    { subject: 'Water Safety', A: selected.water_safety_score },
    { subject: 'Villages at Risk', A: selected.high_risk_villages * 5 },
    { subject: 'Total Cases', A: selected.total_cases / 2 },
  ] : [];

  const getRiskColor = (ri: number) =>
    ri >= 70 ? '#ef4444' : ri >= 50 ? '#f59e0b' : ri >= 30 ? '#22c55e' : '#3b82f6';

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-1">🏛 Government Analytics Dashboard</h1>
        <p className="text-gray-400 text-sm">Ministry of Health & Family Welfare — Northeast India Disease Surveillance Command Center</p>
      </div>

      {/* National KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { icon: '📋', label: 'Total Reported Cases', val: totalCases, color: 'text-yellow-400' },
          { icon: '🔴', label: 'Active Cases', val: activeCases, color: 'text-red-400' },
          { icon: '💧', label: 'Avg Water Safety Score', val: `${avgWaterSafety}%`, color: 'text-blue-400' },
          { icon: '⚠', label: 'High-Risk Villages', val: highRiskTotal, color: 'text-orange-400' },
        ].map(k => (
          <div key={k.label} className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <div className="text-2xl mb-1">{k.icon}</div>
            <div className={`text-2xl font-bold ${k.color}`}>{loading ? '…' : k.val}</div>
            <div className="text-xs text-gray-400 mt-1">{k.label}</div>
          </div>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-6 mb-6">
        {/* State Risk Bar Chart */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
          <h2 className="text-sm font-semibold text-gray-300 mb-4">State-wise Risk Index</h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={stateData} layout="vertical" onClick={(e: any) => e?.activePayload && setSelected(stateData.find(s => s.state === e.activePayload![0].payload.state) ?? null)}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" horizontal={false} />
              <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 10, fill: '#9ca3af' }} />
              <YAxis dataKey="state" type="category" tick={{ fontSize: 10, fill: '#9ca3af' }} width={100} />
              <Tooltip contentStyle={{ background: '#111827', border: '1px solid #374151', borderRadius: 8, fontSize: 12 }} />
              <Bar dataKey="risk_index" name="Risk Index" radius={[0, 4, 4, 0]}>
                {stateData.map((entry, i) => (
                  <Cell key={i} fill={getRiskColor(entry.risk_index)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Cases Pie Chart */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
          <h2 className="text-sm font-semibold text-gray-300 mb-4">Case Distribution by State</h2>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={85} paddingAngle={3} dataKey="value">
                {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip contentStyle={{ background: '#111827', border: '1px solid #374151', borderRadius: 8, fontSize: 12 }} />
              <Legend wrapperStyle={{ fontSize: 10 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6 mb-6">
        {/* State Table */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
          <h2 className="text-sm font-semibold text-gray-300 mb-3">State Dashboard — Click to Inspect</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-gray-400 border-b border-gray-700">
                  {['State', 'Cases', 'Active', 'Water Safety', 'Risk', 'Villages'].map(h => (
                    <th key={h} className="py-2 px-2 text-left font-semibold">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {stateData.map(s => (
                  <tr
                    key={s.state}
                    onClick={() => setSelected(s)}
                    className={`border-b border-gray-800 cursor-pointer transition-colors ${selected?.state === s.state ? 'bg-blue-900/20' : 'hover:bg-gray-800/50'}`}
                  >
                    <td className="py-2 px-2 font-medium text-gray-200">{s.state}</td>
                    <td className="py-2 px-2 text-yellow-400">{s.total_cases}</td>
                    <td className="py-2 px-2 text-red-400 font-semibold">{s.active_cases}</td>
                    <td className="py-2 px-2 text-blue-400">{s.water_safety_score}%</td>
                    <td className="py-2 px-2">
                      <span className="font-bold" style={{ color: getRiskColor(s.risk_index) }}>{s.risk_index}</span>
                    </td>
                    <td className="py-2 px-2 text-orange-400">{s.high_risk_villages}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Radar Chart for Selected State */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
          <h2 className="text-sm font-semibold text-gray-300 mb-1">
            State Health Radar — {selected?.state ?? 'Select a State'}
          </h2>
          <ResponsiveContainer width="100%" height={220}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="#374151" />
              <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10, fill: '#9ca3af' }} />
              <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 8, fill: '#6b7280' }} />
              <Radar name={selected?.state} dataKey="A" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.3} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Water Safety Bar */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
        <h2 className="text-sm font-semibold text-gray-300 mb-4">Water Safety Score by State (WHO safe threshold: 75%)</h2>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={stateData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis dataKey="state" tick={{ fontSize: 9, fill: '#9ca3af' }} />
            <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: '#9ca3af' }} />
            <Tooltip contentStyle={{ background: '#111827', border: '1px solid #374151', borderRadius: 8, fontSize: 12 }} />
            <Bar dataKey="water_safety_score" name="Water Safety %" radius={[4, 4, 0, 0]}>
              {stateData.map((entry, i) => (
                <Cell key={i} fill={entry.water_safety_score >= 75 ? '#22c55e' : entry.water_safety_score >= 60 ? '#f59e0b' : '#ef4444'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
