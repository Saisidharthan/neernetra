'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { AlertTriangle, CheckCircle2, Save } from 'lucide-react';
import type { Notice } from './hooks';

const TONE = {
  ok: { className: 'bg-emerald-600 text-white', icon: CheckCircle2 },
  queued: { className: 'bg-amber-500 text-slate-950', icon: Save },
  error: { className: 'bg-red-600 text-white', icon: AlertTriangle },
};

export default function Toast({ notice }: { notice: Notice | null }) {
  const tone = notice ? TONE[notice.tone] : null;
  return (
    <div className="fixed inset-x-0 bottom-4 z-50 flex justify-center px-4 pointer-events-none">
      <AnimatePresence>
        {notice && tone && (
          <motion.div
            key={notice.text}
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 40, opacity: 0 }}
            role="status"
            className={`w-full max-w-md rounded-2xl px-4 py-3 shadow-2xl text-sm font-bold flex items-center gap-2 ${tone.className}`}
          >
            <tone.icon className="w-5 h-5 shrink-0" />
            <span>{notice.text}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
