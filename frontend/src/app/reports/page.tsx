'use client';

import { useState } from 'react';

interface ReportConfig {
  type: 'outbreak' | 'water_quality' | 'surveillance' | 'cost_benefit';
  format: 'pdf' | 'csv' | 'excel';
  state: string;
  dateFrom: string;
  dateTo: string;
  includeGIS: boolean;
  includeCharts: boolean;
  includeRawData: boolean;
}

const REPORT_TYPES = [
  { id: 'outbreak', icon: '🦠', label: 'Outbreak Surveillance Report', desc: 'Village-wise case counts, trend lines, AI predictions' },
  { id: 'water_quality', icon: '💧', label: 'Water Quality Assessment', desc: 'pH, Turbidity, E.Coli, TDS, contamination hotspots' },
  { id: 'surveillance', icon: '📋', label: 'Community Health Summary', desc: 'Citizen reports, ASHA field surveys, PHC case logs' },
  { id: 'cost_benefit', icon: '💰', label: 'Cost-Benefit Analysis', desc: 'Traditional vs ArogyaPurvottar approach, ROI metrics' },
];

const STATES = ['All NE States', 'Assam', 'Meghalaya', 'Tripura', 'Manipur', 'Nagaland', 'Mizoram', 'Arunachal Pradesh', 'Sikkim'];

function generateCSV(type: string, state: string): string {
  if (type === 'water_quality') {
    const headers = 'Source Name,Village,pH,Turbidity (NTU),E.Coli,TDS (ppm),Status,Tested By\n';
    const rows = [
      'Sonapur Stream Intake,Sonapur,5.6,22.3,YES,1280,UNSAFE,ASHA Field Kit',
      'Lakhipur Barak River,Lakhipur,6.8,8.1,NO,320,SAFE,IoT Sensor',
      'Chandrapur Tube Well #3,Chandrapur,5.9,16.7,YES,980,UNSAFE,PHC Lab Officer',
      'Chabua Dibru Stream,Chabua,7.2,3.4,NO,245,SAFE,ASHA Field Kit',
      'Khonoma Mountain Spring,Khonoma,7.4,1.8,NO,188,SAFE,IoT Sensor',
      'Jorhat Market Tap,Jorhat,6.1,14.2,YES,760,UNSAFE,H2S Strip Test',
    ];
    return headers + rows.join('\n');
  }
  if (type === 'cost_benefit') {
    return `Metric,Traditional Approach,ArogyaPurvottar,Savings (%)\nSetup Cost per Village (INR),850000,12500,98.5%\nSetup Time (Days),180,7,96.1%\nCoverage,Low,High (SMS+Web+Offline),—\nReal-time Monitoring,No,Yes,—\nHardware Cost (Arduino Kit INR),—,500,—\nAnnual Maintenance (INR),120000,8000,93.3%`;
  }
  if (type === 'surveillance') {
    return `Date,Village,Reporter Role,Symptom,Severity,Cases,Status\n2025-08-01,Sonapur,ASHA Worker,Diarrhea + Vomiting,Severe,14,Under Investigation\n2025-08-02,Lakhipur,Citizen,Fever + Abdominal Pain,Moderate,6,Resolved\n2025-08-03,Chandrapur,PHC Officer,Watery Diarrhea,Severe,22,CRITICAL\n2025-08-04,Chabua,ASHA Worker,Vomiting,Mild,3,Monitoring\n2025-08-05,Jorhat,Citizen,Fever + Fatigue,Moderate,8,Under Investigation`;
  }
  // Outbreak default
  return `State,Village,Risk Level,Active Cases,Water Safety Score,AI Risk Score,Alert Status\n${state === 'All NE States' ? 'Assam' : state},Sonapur,CRITICAL,22,62%,85,ALERT TRIGGERED\n${state === 'All NE States' ? 'Assam' : state},Lakhipur,HIGH,14,71%,65,ALERT TRIGGERED\n${state === 'All NE States' ? 'Assam' : state},Chandrapur,MEDIUM,7,79%,45,MONITORING\n${state === 'All NE States' ? 'Assam' : state},Chabua,LOW,2,91%,22,NORMAL`;
}

function downloadCSV(content: string, filename: string) {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function downloadPDF(type: string, state: string) {
  // Build a simple HTML-based PDF using the print API
  const now = new Date().toLocaleString();
  const typeLabel = REPORT_TYPES.find(t => t.id === type)?.label ?? 'Report';
  const csvContent = generateCSV(type, state);
  const rows = csvContent.split('\n');
  const headers = rows[0].split(',');
  const dataRows = rows.slice(1);

  const htmlContent = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>${typeLabel}</title>
<style>
  body { font-family: Arial, sans-serif; color: #1f2937; padding: 40px; }
  .header { text-align: center; margin-bottom: 30px; border-bottom: 3px solid #1d4ed8; padding-bottom: 20px; }
  .logo { font-size: 24px; font-weight: bold; color: #1d4ed8; }
  .subtitle { color: #6b7280; font-size: 14px; margin-top: 4px; }
  h2 { color: #1d4ed8; font-size: 18px; }
  table { width: 100%; border-collapse: collapse; margin-top: 20px; }
  th { background: #1d4ed8; color: white; padding: 10px 12px; text-align: left; font-size: 12px; }
  td { padding: 8px 12px; border-bottom: 1px solid #e5e7eb; font-size: 12px; }
  tr:nth-child(even) { background: #f9fafb; }
  .meta { display: flex; justify-content: space-between; margin-bottom: 20px; font-size: 13px; color: #6b7280; }
  .footer { margin-top: 40px; text-align: center; font-size: 11px; color: #9ca3af; border-top: 1px solid #e5e7eb; padding-top: 10px; }
</style>
</head>
<body>
<div class="header">
  <div class="logo">🩺 ArogyaPurvottar — Smart Health Monitoring System</div>
  <div class="subtitle">Smart India Hackathon 2025 | SIH25001 | Northeast India Disease Surveillance</div>
</div>
<div class="meta">
  <span>Report Type: <strong>${typeLabel}</strong></span>
  <span>State/Region: <strong>${state}</strong></span>
  <span>Generated: <strong>${now}</strong></span>
</div>
<h2>${typeLabel}</h2>
<table>
  <thead><tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr></thead>
  <tbody>${dataRows.map(r => `<tr>${r.split(',').map(c => `<td>${c}</td>`).join('')}</tr>`).join('')}</tbody>
</table>
<div class="footer">
  ArogyaPurvottar — Government of India | Ministry of Health & Family Welfare | Northeast Region Health Command<br/>
  Confidential — For Official Use Only
</div>
</body>
</html>`;

  const newWin = window.open('', '_blank');
  if (!newWin) { alert('Please allow popups to download the PDF.'); return; }
  newWin.document.write(htmlContent);
  newWin.document.close();
  setTimeout(() => newWin.print(), 500);
}

export default function ReportsPage() {
  const today = new Date().toISOString().split('T')[0];
  const monthAgo = new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0];

  const [config, setConfig] = useState<ReportConfig>({
    type: 'outbreak',
    format: 'pdf',
    state: 'Assam',
    dateFrom: monthAgo,
    dateTo: today,
    includeGIS: true,
    includeCharts: true,
    includeRawData: true,
  });
  const [generating, setGenerating] = useState(false);
  const [generated, setGenerated] = useState(false);

  const handleGenerate = async () => {
    setGenerating(true);
    setGenerated(false);
    await new Promise(r => setTimeout(r, 1200));
    const filename = `ArogyaPurvottar_${config.type}_${config.state}_${config.dateTo}`;
    if (config.format === 'csv' || config.format === 'excel') {
      downloadCSV(generateCSV(config.type, config.state), `${filename}.csv`);
    } else {
      downloadPDF(config.type, config.state);
    }
    setGenerating(false);
    setGenerated(true);
    setTimeout(() => setGenerated(false), 4000);
  };

  const selectedType = REPORT_TYPES.find(t => t.id === config.type);

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-1">📊 Report Generator</h1>
        <p className="text-gray-400 text-sm">Export surveillance data as PDF, CSV, or Excel for government, NGO, and health authority use</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Config Panel */}
        <div className="space-y-5">
          {/* Report Type */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <h2 className="text-sm font-semibold text-gray-300 mb-3">Report Type</h2>
            <div className="space-y-2">
              {REPORT_TYPES.map(t => (
                <button
                  key={t.id}
                  onClick={() => setConfig(c => ({ ...c, type: t.id as any }))}
                  className={`w-full text-left px-4 py-3 rounded-lg border transition-all ${config.type === t.id ? 'border-blue-500 bg-blue-900/20' : 'border-gray-700 bg-gray-800 hover:bg-gray-700'}`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{t.icon}</span>
                    <div>
                      <div className="text-sm font-medium text-white">{t.label}</div>
                      <div className="text-xs text-gray-400">{t.desc}</div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Parameters */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 space-y-4">
            <h2 className="text-sm font-semibold text-gray-300">Report Parameters</h2>
            <div>
              <label className="text-xs text-gray-400 block mb-1">State / Region</label>
              <select
                value={config.state}
                onChange={e => setConfig(c => ({ ...c, state: e.target.value }))}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {STATES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-gray-400 block mb-1">Date From</label>
                <input type="date" value={config.dateFrom} onChange={e => setConfig(c => ({ ...c, dateFrom: e.target.value }))}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="text-xs text-gray-400 block mb-1">Date To</label>
                <input type="date" value={config.dateTo} onChange={e => setConfig(c => ({ ...c, dateTo: e.target.value }))}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>
            <div>
              <label className="text-xs text-gray-400 block mb-1">Output Format</label>
              <div className="flex gap-2">
                {(['pdf', 'csv', 'excel'] as const).map(f => (
                  <button
                    key={f}
                    onClick={() => setConfig(c => ({ ...c, format: f }))}
                    className={`flex-1 py-2 text-xs font-semibold rounded-lg uppercase transition-all ${config.format === f ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400 border border-gray-700 hover:bg-gray-700'}`}
                  >
                    {f === 'pdf' ? '📄 PDF' : f === 'csv' ? '📊 CSV' : '📋 Excel'}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              {[
                { key: 'includeGIS', label: 'Include GIS Map Data' },
                { key: 'includeCharts', label: 'Include Statistical Charts' },
                { key: 'includeRawData', label: 'Include Raw Data Tables' },
              ].map(opt => (
                <label key={opt.key} className="flex items-center gap-3 cursor-pointer">
                  <div
                    onClick={() => setConfig(c => ({ ...c, [opt.key]: !(c as any)[opt.key] }))}
                    className={`h-5 w-9 rounded-full transition-all relative ${(config as any)[opt.key] ? 'bg-blue-600' : 'bg-gray-700'}`}
                  >
                    <div className={`absolute top-0.5 h-4 w-4 bg-white rounded-full shadow transition-all ${(config as any)[opt.key] ? 'left-4' : 'left-0.5'}`} />
                  </div>
                  <span className="text-sm text-gray-300">{opt.label}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Preview + Generate */}
        <div className="space-y-5">
          {/* Preview Card */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <h2 className="text-sm font-semibold text-gray-300 mb-4">Report Preview</h2>
            <div className="bg-gradient-to-br from-blue-900/20 to-gray-800 border border-blue-800/30 rounded-xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-2xl">{selectedType?.icon}</span>
                <div>
                  <div className="text-base font-bold text-white">{selectedType?.label}</div>
                  <div className="text-xs text-gray-400">{selectedType?.desc}</div>
                </div>
              </div>
              {[
                { l: 'Region', v: config.state },
                { l: 'Period', v: `${config.dateFrom} → ${config.dateTo}` },
                { l: 'Format', v: config.format.toUpperCase() },
                { l: 'GIS Data', v: config.includeGIS ? '✅ Included' : '❌ Excluded' },
                { l: 'Charts', v: config.includeCharts ? '✅ Included' : '❌ Excluded' },
                { l: 'Raw Data', v: config.includeRawData ? '✅ Included' : '❌ Excluded' },
              ].map(r => (
                <div key={r.l} className="flex justify-between text-sm mb-2">
                  <span className="text-gray-400">{r.l}</span>
                  <span className="text-white font-medium">{r.v}</span>
                </div>
              ))}
              <div className="mt-4 pt-4 border-t border-gray-700 text-xs text-gray-500">
                ArogyaPurvottar | Ministry of Health & Family Welfare | Confidential
              </div>
            </div>
          </div>

          {/* Generate Button */}
          <button
            onClick={handleGenerate}
            disabled={generating}
            className={`w-full py-4 rounded-xl font-bold text-base transition-all flex items-center justify-center gap-2 ${
              generated ? 'bg-green-600 text-white' :
              generating ? 'bg-blue-800 text-white cursor-wait' :
              'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-lg'
            }`}
          >
            {generating ? (
              <><span className="animate-spin">⟳</span> Generating Report...</>
            ) : generated ? (
              <>✅ Report Downloaded!</>
            ) : (
              <>⬇ Generate & Download {config.format.toUpperCase()} Report</>
            )}
          </button>

          {/* Recent Reports */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <h2 className="text-sm font-semibold text-gray-300 mb-3">Recent Reports</h2>
            {[
              { type: '🦠 Outbreak Report', state: 'Assam', date: 'Today 09:14', fmt: 'PDF' },
              { type: '💧 Water Quality', state: 'Manipur', date: 'Yesterday 15:30', fmt: 'CSV' },
              { type: '📋 Surveillance', state: 'All NE States', date: '03 Aug 2025', fmt: 'Excel' },
              { type: '💰 Cost-Benefit', state: 'All NE States', date: '01 Aug 2025', fmt: 'PDF' },
            ].map((r, i) => (
              <div key={i} className="flex items-center justify-between py-2 border-b border-gray-800 last:border-0">
                <div>
                  <div className="text-sm text-gray-200">{r.type} — {r.state}</div>
                  <div className="text-xs text-gray-500">{r.date}</div>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded font-bold ${r.fmt === 'PDF' ? 'bg-red-900/40 text-red-400' : r.fmt === 'CSV' ? 'bg-green-900/40 text-green-400' : 'bg-blue-900/40 text-blue-400'}`}>
                  {r.fmt}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
