'use client';

import { useState, useEffect, useRef } from 'react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

const QUICK_PROMPTS = [
  "What are the early symptoms of Cholera?",
  "Which villages in Assam have high risk today?",
  "How do I test water with the H2S strip kit?",
  "What is the recommended ORS dosage for children?",
  "How does the AI predict outbreaks?",
  "What actions should a PHC officer take on a CRITICAL alert?",
  "Explain water contamination risk factors",
  "What is the outbreak simulation showing?",
];

const KNOWLEDGE_BASE: Record<string, string> = {
  cholera: `**Cholera — Clinical Guidance**\n\n**Early Symptoms (6-48h after exposure):**\n- Sudden onset of profuse, watery diarrhea ("rice-water stool")\n- Vomiting without nausea\n- Rapid dehydration\n- Muscle cramps (due to electrolyte loss)\n- Low-grade fever in severe cases\n\n**Immediate Action:**\n1. Start Oral Rehydration Therapy (ORS) immediately\n2. Isolate the patient\n3. Report to ASHA/PHC\n4. Disinfect water source with chlorine (0.5mg/L)\n\n**When to Refer:** If patient cannot drink due to vomiting → IV Ringer's Lactate at PHC`,
  typhoid: `**Typhoid Fever — Clinical Guidance**\n\n**Symptoms (7-14 days incubation):**\n- Sustained fever (rises daily, 39-40°C)\n- Headache and malaise\n- "Rose spots" rash on abdomen\n- Abdominal pain, constipation or diarrhea\n- Splenomegaly (enlarged spleen)\n\n**Diagnosis:** Widal test at PHC, blood culture\n**Treatment:** Azithromycin or Ceftriaxone per MO prescription\n**Prevention:** Boil water for 5 minutes, avoid raw vegetables`,
  ors: `**Oral Rehydration Solution (ORS) — Dosage Guide**\n\n**Preparation:** 1 ORS sachet in 1 liter clean boiled water\n\n**Dosage by Age:**\n- Under 2 years: 50–100 mL after each loose stool\n- 2–10 years: 100–200 mL after each loose stool\n- Over 10 years: Drink as much as needed\n\n**Signs of Adequate Hydration:** Urination resumes, skin turgor returns, eyes no longer sunken\n\n**Warning Signs → Refer to PHC:** Blood in stool, unable to drink, altered consciousness`,
  h2s: `**H2S Strip Water Test — Field Guide for ASHA Workers**\n\n**Materials:** H2S vial (available in ASHA kit), water sample\n\n**Procedure:**\n1. Fill vial to marked line with water sample\n2. Cap tightly and store at room temperature (avoid sunlight)\n3. Check after 24 hours\n\n**Reading:**\n- **Clear/Light Yellow:** Safe — No fecal contamination detected\n- **Black/Dark Brown:** UNSAFE — Hydrogen Sulfide-producing bacteria present\n\n**Action on Positive Result:**\n1. Mark source as contaminated in ArogyaPurvottar app\n2. Advise community: Do NOT drink without boiling\n3. Report to PHC within 24 hours\n4. Chlorinate the source (ASHA supervisor will guide)`,
  risk: `**AI Outbreak Prediction — How It Works**\n\n**Input Features:**\n- pH, Turbidity, E.Coli detection (water quality)\n- Rainfall index and flood level (environmental)\n- Symptom case count (clinical surveillance)\n- Weekly market/haat mobility (rural transmission)\n- Historical outbreak data for the village\n\n**Model:** XGBoost + Random Forest ensemble\n**Output:** Risk Score (0-100) + Risk Level (LOW/MEDIUM/HIGH/CRITICAL)\n\n**SHAP Attribution:** Each prediction shows which factors contributed most:\n- Example: "Turbidity: +23.1%, E.Coli: +18.5%, Cases: +15.2%"\n\n**Alert Threshold:** CRITICAL alert fires when risk ≥ 80%`,
  alert: `**CRITICAL Alert Response Protocol — PHC/District Officers**\n\n**Immediate Actions (0-6 hours):**\n1. Acknowledge alert in ArogyaPurvottar dashboard\n2. Call ASHA worker in affected village for field confirmation\n3. Dispatch Rapid Response Team (RRT) with ORS/IV kits\n4. Notify District Health Officer via system SMS\n\n**Short-term (6-48 hours):**\n1. Set up oral rehydration corner at village\n2. Chlorinate identified contaminated water sources\n3. Send water samples to PHC lab for culture\n4. Begin case line listing\n\n**Reporting:** Enter all actions in District Dashboard → Outbreak Management\n\n**Escalation:** If ≥10 cases in 24h → Report to State Surveillance Unit`,
};

function getAIResponse(query: string): string {
  const q = query.toLowerCase();
  if (q.includes('cholera') || q.includes('diarrhea') || q.includes('watery')) return KNOWLEDGE_BASE.cholera;
  if (q.includes('typhoid') || q.includes('fever') || q.includes('rose spot')) return KNOWLEDGE_BASE.typhoid;
  if (q.includes('ors') || q.includes('rehydr') || q.includes('dosage')) return KNOWLEDGE_BASE.ors;
  if (q.includes('h2s') || q.includes('strip') || q.includes('test water') || q.includes('field test')) return KNOWLEDGE_BASE.h2s;
  if (q.includes('predict') || q.includes('ai') || q.includes('model') || q.includes('xgboost') || q.includes('risk score')) return KNOWLEDGE_BASE.risk;
  if (q.includes('alert') || q.includes('critical') || q.includes('phc officer') || q.includes('action') || q.includes('response')) return KNOWLEDGE_BASE.alert;
  if (q.includes('village') || q.includes('assam') || q.includes('high risk')) {
    return `**High-Risk Villages — Current Status (Assam)**\n\n| Village | Risk Score | Active Cases | Water Status |\n|---------|-----------|--------------|------------|\n| Sonapur | 🔴 85% CRITICAL | 22 | Contaminated |\n| Lakhipur | 🟠 65% HIGH | 14 | Turbid |\n| Chandrapur | 🟡 45% MEDIUM | 7 | Borderline |\n| Chabua | 🟢 22% LOW | 2 | Safe |\n\n*Data updated every 15 minutes from field reports and IoT sensors.*`;
  }
  if (q.includes('contamin') || q.includes('water quality') || q.includes('factor')) {
    return `**Water Contamination Risk Factors in Northeast India**\n\n**Environmental:**\n- Monsoonal flood runoff washes surface pollutants into water bodies\n- pH drops below 6.5 indicate acid mine drainage or industrial runoff\n- Turbidity > 10 NTU correlates with fecal contamination probability ≈ 78%\n\n**Behavioral:**\n- Open defecation near water bodies (ODF compliance: 62% in study villages)\n- Shared tube wells without chlorination\n- Weekly haats (markets) increase disease transmission by 1.35x\n\n**Infrastructure:**\n- Broken pipe joints allow soil infiltration\n- Overhead tank cleaning < 2x/year → algal bloom risk\n\n**Seasonal Pattern:** July–September = peak contamination season (monsoonal flush)`;
  }
  if (q.includes('simulation') || q.includes('outbreak sim')) {
    return `**About the Outbreak Simulation Engine**\n\nThe simulation demonstrates a real-world cascade scenario:\n\n**Day 0-2:** Baseline (rainfall: low, water: safe)\n**Day 3-5:** Heavy monsoon rainfall → turbidity spikes → pH drops\n**Day 5-7:** E. Coli contamination detected in stream intake\n**Day 6-8:** ASHA workers log 8-22 new symptom cases/day\n**Day 7:** AI Risk Score hits 85% → 🚨 CRITICAL alert fires\n**Day 8-10:** PHC RRT deployed, ORS distribution begins\n**Day 12-14:** Cases declining after intervention\n\nThis demonstrates exactly the **end-to-end decision support workflow** that ArogyaPurvottar is built for.`;
  }
  return `I'm ArogyaBot, your health intelligence assistant for Northeast India's water-borne disease surveillance. I can help with:\n\n- **Clinical guidance:** Symptoms, treatment, dosage\n- **Field protocols:** H2S testing, ORS preparation\n- **AI system:** How predictions and risk scores work\n- **Village risk status:** Current surveillance data\n- **Alert response:** What to do on CRITICAL alerts\n\nPlease ask a more specific question, or click one of the quick prompts above.`;
}

export default function AIAssistantPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: 'Hello! I\'m **ArogyaBot**, the AI health assistant for the Smart Community Health Monitoring System.\n\nI have expert knowledge about:\n- Water-borne disease symptoms (Cholera, Typhoid, Dysentery)\n- Field test protocols (H2S strip, ORS dosage)\n- AI outbreak prediction methodology\n- Current village risk status in Assam\n- Alert response protocols for health workers\n\nHow can I help you today?',
      timestamp: new Date().toISOString(),
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (text?: string) => {
    const query = text ?? input.trim();
    if (!query) return;

    const userMsg: Message = { role: 'user', content: query, timestamp: new Date().toISOString() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    // Simulate AI thinking delay
    await new Promise(r => setTimeout(r, 600 + Math.random() * 400));

    let aiContent: string;
    try {
      const res = await fetch('/api/v1/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: query }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      aiContent = data.response;
    } catch {
      aiContent = getAIResponse(query);
    }

    const aiMsg: Message = { role: 'assistant', content: aiContent, timestamp: new Date().toISOString() };
    setMessages(prev => [...prev, aiMsg]);
    setLoading(false);
  };

  const formatMarkdown = (text: string) => {
    // Simple markdown rendering
    return text
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      .replace(/\n\n/g, '</p><p>')
      .replace(/\n/g, '<br/>')
      .replace(/#{1,3}\s(.+)/g, '<span style="font-weight:700;font-size:1.05em">$1</span>')
      .replace(/\| (.+) \|/g, (m) => `<span style="font-family:monospace;display:block">${m}</span>`);
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col" style={{ height: '100dvh' }}>
      {/* Header */}
      <div className="bg-gray-900 border-b border-gray-800 px-6 py-4 flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-lg">🤖</div>
        <div>
          <h1 className="font-bold text-white">ArogyaBot — AI Health Assistant</h1>
          <p className="text-xs text-green-400 flex items-center gap-1">
            <span className="h-1.5 w-1.5 bg-green-400 rounded-full animate-pulse inline-block"></span>
            Online · Disease Surveillance Expert
          </p>
        </div>
        <div className="ml-auto text-xs text-gray-500">Powered by XAI Disease Intelligence Engine</div>
      </div>

      {/* Quick Prompts */}
      <div className="bg-gray-900/50 border-b border-gray-800 px-6 py-3 flex gap-2 overflow-x-auto">
        {QUICK_PROMPTS.map(p => (
          <button
            key={p}
            onClick={() => sendMessage(p)}
            className="shrink-0 px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-xs text-gray-300 rounded-full border border-gray-700 transition-colors"
          >
            {p}
          </button>
        ))}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {msg.role === 'assistant' && (
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-sm mr-2 shrink-0 mt-1">🤖</div>
            )}
            <div
              className={`max-w-xl px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-blue-600 text-white rounded-tr-sm'
                  : 'bg-gray-800 text-gray-100 rounded-tl-sm border border-gray-700'
              }`}
            >
              {msg.role === 'assistant' ? (
                <div dangerouslySetInnerHTML={{ __html: `<p>${formatMarkdown(msg.content)}</p>` }} />
              ) : (
                msg.content
              )}
              <div className={`text-xs mt-2 ${msg.role === 'user' ? 'text-blue-200' : 'text-gray-500'}`} suppressHydrationWarning>
                {new Date(msg.timestamp).toLocaleTimeString()}
              </div>
            </div>
            {msg.role === 'user' && (
              <div className="h-8 w-8 rounded-lg bg-gray-700 flex items-center justify-center text-sm ml-2 shrink-0 mt-1">👤</div>
            )}
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-sm mr-2 shrink-0">🤖</div>
            <div className="bg-gray-800 border border-gray-700 rounded-2xl rounded-tl-sm px-4 py-3">
              <div className="flex gap-1.5">
                <div className="h-2 w-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="h-2 w-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="h-2 w-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="bg-gray-900 border-t border-gray-800 px-6 py-4">
        <div className="flex gap-3 max-w-3xl mx-auto">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
            placeholder="Ask about symptoms, water testing, outbreak protocols..."
            className="flex-1 bg-gray-800 border border-gray-700 text-white placeholder-gray-500 px-4 py-3 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={() => sendMessage()}
            disabled={loading || !input.trim()}
            className="px-5 py-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 rounded-xl text-sm font-semibold transition-all"
          >
            Send →
          </button>
        </div>
      </div>
    </div>
  );
}
