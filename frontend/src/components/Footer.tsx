'use client';

import React from 'react';
import Link from 'next/link';
import { Eye, FlaskConical, Phone, Scale } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="w-full bg-slate-900 text-slate-300 border-t border-slate-800 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-cyan-500 to-emerald-400 flex items-center justify-center text-slate-950">
              <Eye className="w-5 h-5" />
            </div>
            <span className="text-xl font-black text-white tracking-wide">NeerNetra</span>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Community early warning for water-borne illness. CDC EARS statistics and an XGBoost risk model with TreeSHAP
            explanations watch rain, water quality and case reports village by village, and follow contamination downstream.
          </p>
          <div className="flex items-start space-x-2 text-xs text-amber-300 font-medium">
            <FlaskConical className="w-4 h-4 shrink-0" />
            <span>Hackathon prototype. The district, villages and history are simulated; the model is trained on synthetic data.</span>
          </div>
        </div>

        <div className="space-y-3 text-xs">
          <h4 className="text-sm font-bold text-white uppercase tracking-wider">Command</h4>
          <ul className="space-y-2">
            <li><Link href="/portal/district" className="hover:text-emerald-400 transition-colors">Command Center</Link></li>
            <li><Link href="/simulation" className="hover:text-emerald-400 transition-colors">Demo run-sheet</Link></li>
            <li><Link href="/notifications" className="hover:text-emerald-400 transition-colors">Alerts &amp; notifications</Link></li>
            <li><Link href="/water-quality" className="hover:text-emerald-400 transition-colors">Water readings</Link></li>
            <li><Link href="/model" className="hover:text-emerald-400 transition-colors">Model card</Link></li>
          </ul>
        </div>

        <div className="space-y-3 text-xs">
          <h4 className="text-sm font-bold text-white uppercase tracking-wider">Field</h4>
          <ul className="space-y-2">
            <li><Link href="/portal/asha" className="hover:text-emerald-400 transition-colors">ASHA reporting (works offline)</Link></li>
            <li><Link href="/portal/citizen" className="hover:text-emerald-400 transition-colors">Citizen advisory &amp; water report</Link></li>
            <li><Link href="/inbox" className="hover:text-emerald-400 transition-colors">Inbox: alerts arriving on ASHA and citizen phones</Link></li>
          </ul>
        </div>

        <div className="space-y-3 text-xs">
          <h4 className="text-sm font-bold text-white uppercase tracking-wider">Emergency</h4>
          <div className="flex items-center space-x-2 text-slate-300">
            <Phone className="w-4 h-4 text-emerald-400" />
            <span>Ambulance / health helpline: <strong>108 / 104</strong></span>
          </div>
          <p className="text-[11px] text-slate-500 leading-relaxed">
            Live rainfall forecasts on village pages come from Open-Meteo. Everything else on screen is produced by the
            NeerNetra engine running on simulated data.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto mt-8 pt-6 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500">
        <div className="flex items-center gap-1.5">
          <Scale className="w-3.5 h-3.5" />
          <span>
            Built on{' '}
            <a
              href="https://github.com/HARISHPG21/-Arogya-Purvottar"
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-slate-300 hover:text-emerald-400 underline underline-offset-2"
            >
              ArogyaPurvottar
            </a>{' '}
            (MIT)
          </span>
        </div>
        <div>NeerNetra · Social Impact track · Community water-borne illness &amp; outbreak early warning</div>
      </div>
    </footer>
  );
}
