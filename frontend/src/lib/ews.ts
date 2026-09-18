// NeerNetra early-warning engine: typed client for /api/v1/ews/*.
// These shapes are the contract with backend/app/api/v1/ews.py (see docs/ews-api.md).
// JSON is camelCase on the wire. Dates are ISO "yyyy-mm-dd" in simulated time.

export type Tier = 'normal' | 'watch' | 'warning' | 'outbreak';
export type AlertTier = Exclude<Tier, 'normal'>;
export type Lang = 'en' | 'hi' | 'as';
export type WaterSource = 'river' | 'tubewell' | 'spring' | 'pond' | 'piped';
export type AdvisoryStatus = 'safe' | 'boil' | 'do_not_drink';
export type InterventionType =
  | 'chlorination'
  | 'boil_advisory'
  | 'medical_camp'
  | 'ors_distribution'
  | 'source_testing'
  | 'awareness_drive';
export type InterventionStatus = 'dispatched' | 'in_progress' | 'completed';
export type AlertStatus = 'active' | 'acknowledged' | 'resolved';
export type InjectType = 'heavy_rain' | 'pipe_burst' | 'sewage_overflow';
export type ReporterRole = 'asha' | 'citizen' | 'clinic';
export type ReportChannel = 'app' | 'offline_sync';
export type WaterTestSource = 'sensor' | 'h2s_kit' | 'field_kit' | 'citizen';

export interface Kpis {
  villagesAtRisk: number; // villages at tier warning or outbreak
  activeAlerts: number;
  cases7d: number;
  positiveWaterTests7d: number;
  populationCovered: number;
}

export interface SimState {
  currentDate: string;
  scenario: string;
  scenarioLabel: string;
  dayOfScenario: number; // 0 right after reset
  version: number; // bumps on every mutation (step, report, intervention, ack...) so clients know to refetch
  narration: string | null; // one-line story beat for the demo
  kpis: Kpis;
}

export interface Scenario {
  id: string;
  label: string;
  description: string;
}

export interface EarsScores {
  c1: number;
  c2: number;
  c3: number;
  flagged: boolean;
}

export interface LatestReadings {
  turbidity: number | null; // NTU
  ph: number | null;
  tds: number | null; // mg/L
  h2sPositive: boolean | null; // most recent H2S strip result within 7 days
  rainfall24h: number; // mm
  cases24h: number;
  cases7d: number;
}

export interface VillageSummary {
  id: string; // short village code, e.g. "KMR04"
  name: string;
  district: string;
  state: string;
  lat: number;
  lon: number;
  population: number;
  language: Lang; // primary community language for citizen messages
  waterSource: WaterSource;
  catchment: string | null;
  upstreamId: string | null; // village immediately upstream on the same river
  hasSensor: boolean;
  risk: number; // 0..1, ML probability of an outbreak in the next 7 days
  riskDelta: number; // change vs previous sim day
  tier: Tier;
  rank: number; // 1 = highest priority
  ears: EarsScores;
  latest: LatestReadings;
  advisory: AdvisoryStatus;
}

export interface DayPoint {
  date: string;
  rainfall: number;
  turbidity: number | null;
  ph: number | null;
  h2sPositive: boolean | null;
  cases: number;
  risk: number;
  earsC2: number;
  tier: Tier;
}

export interface ExplanationFactor {
  key: string; // e.g. "turbidity", "rainfall", "h2s", "cases", "upstream", "season", "source"
  label: string; // human label, e.g. "Water turbidity"
  value: string; // human value, e.g. "24.5 NTU (5x safe limit)"
  contribution: number; // signed TreeSHAP contribution in log-odds
  share: number; // |contribution| / sum(|contributions|), 0..1
}

export interface Explanation {
  risk: number;
  baseRisk: number; // model expected value as a probability
  summary: string; // one plain-language sentence
  factors: ExplanationFactor[]; // grouped, sorted by |contribution| desc
  detectors: {
    ml: { risk: number; threshold: number; triggered: boolean };
    ears: { c2: number; c3: number; triggered: boolean };
  };
}

export interface RecommendedAction {
  type: InterventionType;
  title: string;
  reason: string;
  priority: 'high' | 'medium' | 'low';
  alreadyActive: boolean;
}

export interface Intervention {
  id: number;
  villageId: string;
  villageName: string;
  type: InterventionType;
  status: InterventionStatus;
  createdDate: string;
  updatedDate: string;
  assignedTo: string;
  notes: string | null;
  verification: string | null; // e.g. "Residual chlorine 0.8 mg/L"
}

export interface WaterTestInput {
  villageId: string;
  source: WaterTestSource;
  date?: string; // defaults to current sim date
  h2sPositive?: boolean | null;
  turbidity?: number | null;
  ph?: number | null;
  appearance?: 'clear' | 'cloudy' | 'muddy' | null;
  notes?: string;
  clientId?: string; // offline de-duplication
}

export interface WaterTest {
  id: number;
  villageId: string;
  date: string;
  source: WaterTestSource;
  h2sPositive: boolean | null;
  turbidity: number | null;
  ph: number | null;
  appearance: 'clear' | 'cloudy' | 'muddy' | null;
  notes: string | null;
}

export interface Symptoms {
  diarrhoea: number;
  vomiting: number;
  fever: number;
  jaundice: number;
  bloodyStool: number;
}

export interface CaseReportInput {
  villageId: string;
  reporterRole: ReporterRole;
  reporterName?: string;
  channel: ReportChannel;
  date?: string; // defaults to current sim date
  symptoms: Symptoms;
  notes?: string;
  clientId?: string; // offline de-duplication
}

export interface CaseReport {
  id: number;
  villageId: string;
  reporterRole: ReporterRole;
  reporterName: string | null;
  channel: ReportChannel;
  date: string;
  symptoms: Symptoms;
  total: number;
  notes: string | null;
}

export interface NeighbourRef {
  id: string;
  name: string;
  tier: Tier;
  risk: number;
}

export interface VillageDetail extends VillageSummary {
  timeseries: DayPoint[]; // last 30 sim days incl. today, ascending
  forecast: { date: string; rainfallMm: number }[]; // next 3 days' rainfall forecast the model used
  explanation: Explanation;
  actions: RecommendedAction[];
  interventions: Intervention[];
  waterTests: WaterTest[]; // newest first, max 20
  reports: CaseReport[]; // newest first, max 20
  upstream: NeighbourRef | null;
  downstream: NeighbourRef[];
}

export interface Alert {
  id: number;
  villageId: string;
  villageName: string;
  tier: AlertTier;
  status: AlertStatus;
  createdDate: string;
  updatedDate: string;
  title: string;
  message: string;
  triggers: string[]; // e.g. ["ML risk 0.72 >= 0.60", "EARS C2 = 3.4"]
  audience: string[]; // e.g. ["ASHA", "PHC", "Citizens"]
}

export type NotificationRole = 'ASHA' | 'PHC' | 'DHO' | 'Citizens';

// No SMS/IVR (no DLT registration): alerts reach people as app notifications only.
export interface OutboundNotification {
  id: number;
  date: string;
  channel: 'push' | 'in_app'; // push = shown as a device notification by the field app; in_app = dashboard inbox only
  role: NotificationRole;
  to: string; // e.g. "ASHA Rina Das (NeerNetra app)" or "Citizens of Chaygaon (NeerNetra app)"
  language: Lang;
  priority: 'normal' | 'high';
  title: string;
  body: string;
  villageId: string;
  alertId: number | null;
}

export interface Advisory {
  villageId: string;
  villageName: string;
  status: AdvisoryStatus;
  tier: Tier;
  headline: string;
  instructions: string[];
  updatedDate: string;
  language: Lang;
}

export interface MethodMetrics {
  method: string;
  recall: number;
  precision: number;
  falseAlarmsPer100VillageDays: number;
  medianLeadDays: number | null; // positive = warned before outbreak onset
  detectedEpisodes: number;
}

export interface ModelCard {
  model: string;
  trainPeriod: string;
  testPeriod: string;
  villages: number;
  trainRows: number;
  testRows: number;
  outbreakDefinition: string;
  syntheticDisclaimer: string;
  auc: number;
  threshold: number;
  testEpisodes: number;
  methods: MethodMetrics[];
  leadTimeHistogram: { leadDays: number; ml: number; ears: number }[];
  featureImportance: { feature: string; label: string; importance: number }[]; // mean |SHAP|, sums to 1
}

export interface WeatherForecast {
  villageId: string;
  source: 'open-meteo' | 'unavailable';
  days: { date: string; precipitationMm: number; precipitationProbability: number | null }[];
}

const BASE = '/api/v1/ews';

type Listener = () => void;
const listeners = new Set<Listener>();

/** Subscribe to local mutations (step, report, ack...) so views can refetch immediately. */
export function onEwsChange(cb: Listener): () => void {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

function emitChange() {
  listeners.forEach((cb) => cb());
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...(init?.headers ?? {}) },
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`${init?.method ?? 'GET'} ${path} failed (${res.status}): ${body}`);
  }
  return res.json() as Promise<T>;
}

async function mutate<T>(path: string, method: 'POST' | 'PATCH', body?: unknown): Promise<T> {
  const result = await request<T>(path, { method, body: body === undefined ? undefined : JSON.stringify(body) });
  emitChange();
  return result;
}

export const ews = {
  state: () => request<SimState>('/state'),
  scenarios: () => request<Scenario[]>('/scenarios'),
  reset: (scenario?: string) => mutate<SimState>('/sim/reset', 'POST', { scenario }),
  step: (days = 1) => mutate<SimState>('/sim/step', 'POST', { days }),
  inject: (type: InjectType, villageId: string) => mutate<SimState>('/sim/inject', 'POST', { type, villageId }),

  villages: () => request<VillageSummary[]>('/villages'),
  village: (id: string) => request<VillageDetail>(`/villages/${encodeURIComponent(id)}`),

  alerts: (status: 'active' | 'all' = 'active') => request<Alert[]>(`/alerts?status=${status}`),
  ackAlert: (id: number) => mutate<Alert>(`/alerts/${id}/ack`, 'POST'),
  resolveAlert: (id: number) => mutate<Alert>(`/alerts/${id}/resolve`, 'POST'),
  notifications: (opts: { limit?: number; role?: NotificationRole; villageId?: string } = {}) => {
    const q = new URLSearchParams({ limit: String(opts.limit ?? 50) });
    if (opts.role) q.set('role', opts.role);
    if (opts.villageId) q.set('villageId', opts.villageId);
    return request<OutboundNotification[]>(`/notifications?${q}`);
  },

  interventions: (villageId?: string) =>
    request<Intervention[]>(`/interventions${villageId ? `?villageId=${encodeURIComponent(villageId)}` : ''}`),
  createIntervention: (input: { villageId: string; type: InterventionType; assignedTo?: string; notes?: string }) =>
    mutate<Intervention>('/interventions', 'POST', input),
  updateIntervention: (id: number, input: { status: InterventionStatus; verification?: string }) =>
    mutate<Intervention>(`/interventions/${id}`, 'PATCH', input),

  submitReport: (input: CaseReportInput) => mutate<CaseReport>('/reports', 'POST', input),
  submitReports: (reports: CaseReportInput[]) =>
    mutate<{ accepted: number; duplicates: number }>('/reports/batch', 'POST', { reports }),
  reports: (villageId?: string, limit = 50) =>
    request<CaseReport[]>(`/reports?limit=${limit}${villageId ? `&villageId=${encodeURIComponent(villageId)}` : ''}`),
  submitWaterTest: (input: WaterTestInput) => mutate<WaterTest>('/water-tests', 'POST', input),

  advisory: (villageId: string, lang: Lang = 'en') =>
    request<Advisory>(`/advisory/${encodeURIComponent(villageId)}?lang=${lang}`),
  modelCard: () => request<ModelCard>('/model-card'),
  weather: (villageId: string) => request<WeatherForecast>(`/weather/${encodeURIComponent(villageId)}`),
};

export const TIER_ORDER: Record<Tier, number> = { normal: 0, watch: 1, warning: 2, outbreak: 3 };
