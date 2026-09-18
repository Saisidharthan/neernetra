'use client';

import React, { useState } from 'react';
import { queryAIBot } from '@/lib/mockApi';
import { Bot, X, Send, Mic, Sparkles, Shield, RefreshCw } from 'lucide-react';

export default function ArogyaBot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Array<{ sender: 'user' | 'bot'; text: string; actions?: string[] }>>([
    { sender: 'bot', text: 'Namaste! I am Arogya Northeast AI Assistant. How can I help you with water safety or health guidance today?', actions: ['Water safety tips', 'Nearby health center', 'Report cholera symptoms'] }
  ]);
  const [input, setInput] = useState('');
  const [lang, setLang] = useState('en');
  const [isListening, setIsListening] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSend = async (textToSend?: string) => {
    const queryText = textToSend || input;
    if (!queryText.trim()) return;

    const userMsg = { sender: 'user' as const, text: queryText };
    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInput('');
    setLoading(true);

    try {
      const res = await queryAIBot(queryText, lang);
      setMessages((prev) => [
        ...prev,
        { sender: 'bot', text: res.reply, actions: res.recommended_actions }
      ]);
    } catch (e) {
      setMessages((prev) => [
        ...prev,
        { sender: 'bot', text: 'Drink boiled water and administer ORS for immediate diarrhea management. Contact Sonapur PHC for emergency medical attention.' }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleVoiceSim = () => {
    setIsListening(true);
    setTimeout(() => {
      setInput('Where is the nearest health center with available cholera beds?');
      setIsListening(false);
    }, 1800);
  };

  return (
    <>
      {/* Floating Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-50 p-4 rounded-full bg-gradient-to-tr from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white shadow-2xl shadow-emerald-600/40 flex items-center justify-center group transition-all duration-300 transform hover:scale-110"
        aria-label="Open AI Health Assistant"
      >
        <Bot className="w-7 h-7 group-hover:rotate-12 transition-transform" />
        <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-rose-500 rounded-full border-2 border-slate-950 animate-ping" />
      </button>

      {/* Chat Window Modal */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 z-50 w-80 sm:w-96 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col h-[480px] overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-200">
          
          {/* Header */}
          <div className="bg-gradient-to-r from-emerald-600 to-teal-600 p-4 text-white flex items-center justify-between shadow-md">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-lg bg-white/20 backdrop-blur-md flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-amber-300" />
              </div>
              <div>
                <h4 className="font-bold text-sm leading-none">Arogya Northeast AI</h4>
                <p className="text-[10px] text-emerald-100 mt-0.5">Multilingual Health & Outbreak Assistant</p>
              </div>
            </div>
            <div className="flex items-center space-x-1">
              <select
                value={lang}
                onChange={(e) => setLang(e.target.value)}
                className="bg-emerald-700/80 text-white text-[11px] px-2 py-0.5 rounded outline-none border border-emerald-500"
              >
                <option value="en">English</option>
                <option value="as">অসমীয়া</option>
                <option value="bn">বাংলা</option>
                <option value="hi">हिंदी</option>
              </select>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 hover:bg-white/20 rounded-md transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Messages Container */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-slate-50 dark:bg-slate-950/50 text-xs">
            {messages.map((m, idx) => (
              <div
                key={idx}
                className={`flex flex-col ${m.sender === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 leading-relaxed shadow-sm ${
                    m.sender === 'user'
                      ? 'bg-emerald-600 text-white rounded-br-none'
                      : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700/60 rounded-bl-none'
                  }`}
                >
                  {m.text}
                </div>

                {m.actions && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {m.actions.map((act, aIdx) => (
                      <button
                        key={aIdx}
                        onClick={() => handleSend(act)}
                        className="px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-200 dark:hover:bg-emerald-900 border border-emerald-300 dark:border-emerald-800 text-[10px] font-semibold transition-colors"
                      >
                        ⚡ {act}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
            {loading && (
              <div className="flex items-center space-x-2 text-slate-400 italic text-[11px]">
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-emerald-500" />
                <span>Arogya AI is analyzing epidemic dataset...</span>
              </div>
            )}
          </div>

          {/* Input Controls */}
          <div className="p-3 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center space-x-2">
            <button
              onClick={handleVoiceSim}
              className={`p-2 rounded-xl border transition-colors ${
                isListening
                  ? 'bg-rose-500 text-white border-rose-600 animate-pulse'
                  : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
              }`}
              title="Simulate Voice Input"
            >
              <Mic className="w-4 h-4" />
            </button>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder={isListening ? 'Listening to voice...' : 'Type health question or symptom...'}
              className="flex-1 px-3 py-2 text-xs rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none text-slate-800 dark:text-slate-200 focus:border-emerald-500"
            />
            <button
              onClick={() => handleSend()}
              className="p-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-md transition-colors"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>

        </div>
      )}
    </>
  );
}
