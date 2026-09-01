export type AccountType = 'Personal' | 'PropFirm' | 'Funded' | 'Demo' | 'Backtest' | 'Other';
export type AccountStatus = 'Active' | 'Archived' | 'Closed';

export interface Account {
  id: string;
  name: string;
  brokerOrFirm: string;
  accountType: AccountType;
  currency: string;
  initialBalance: number;
  currentBalance: number;
  defaultRiskPercent?: number;
  dailyLossLimitPercent: number;
  maxDrawdownPercent: number;
  consistencyRatePercent?: number;
  tradingStyle: string;
  status: AccountStatus;
  notes: string;
  createdAt: string;
  updatedAt: string;
  isArchived?: boolean;
}

export interface SetupChecklistItem {
  id: string;
  setupId: string;
  name: string;
  description: string;
  required: boolean;
  order: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Setup {
  id: string;
  name: string;
  description: string;
  market: string;
  instrument: string;
  timeframes: string[];
  sessions: string[];
  direction?: 'Long' | 'Short' | 'Both';
  entryModel: string;
  stopLossModel: string;
  takeProfitModel: string;
  minimumRR?: number;
  defaultRiskPercent?: number;
  rules: string[];
  invalidConditions: string[];
  checklist: SetupChecklistItem[];
  notes: string;
  status: 'Active' | 'Archived';
  createdAt: string;
  updatedAt: string;
  isArchived?: boolean;
}

export interface TradeChecklistSnapshotItem {
  id: string;
  name: string;
  description: string;
  required: boolean;
  checked: boolean;
  order: number;
}

export interface TradeChecklistSnapshot {
  total: number;
  completed: number;
  adherencePercent: number;
  items: TradeChecklistSnapshotItem[];
}

export interface TradeExit {
  id: string;
  levelName: string; // e.g. "TP1", "TP2", "Manual Exit", "SL"
  exitPrice: number;
  sizePercent: number; // 0 - 100
  sizeQuantity?: number;
  realizedPL: number;
  realizedR: number;
  exitReason: string;
  timestamp: string;
}

export interface TradePlanned {
  entry: number;
  stopLoss: number;
  takeProfit: number; // primary TP or weighted TP target
  riskPercent: number;
  riskAmount: number; // $ value
  plannedRR: number;
  positionSize: number; // lots or units
  lotSize?: number; // User-entered lot size
  pointValue?: number;
  contractSize?: number;
  leverage?: number;
}

export interface TradeActual {
  entry: number;
  exit: number; // weighted average exit price across exits
  positionSize: number;
  lotSize?: number;
  fees: number;
  commission: number;
  swap: number;
  slippage: number;
  exitReason: string;
}

export type TradeOutcome = 'Win' | 'Loss' | 'Breakeven' | 'Partial Win' | 'Partial Loss' | 'Custom';
export type TradeStatus = 'Draft' | 'Planned' | 'Open' | 'Closed' | 'Cancelled' | 'Invalidated';

export interface TradeResult {
  status: TradeOutcome;
  netPL: number;
  grossPL: number;
  rMultiple: number;
  holdingTimeMinutes?: number;
}

export type EmotionType = 
  | 'Calm' | 'Confident' | 'Neutral' | 'Nervous' | 'Fearful' 
  | 'Greedy' | 'Angry' | 'Frustrated' | 'Excited' | 'FOMO' 
  | 'Revenge' | 'Bored' | 'Overconfident' | 'Tired' | 'Distracted' | 'Other';

export interface TradePsychology {
  preTradeEmotion: EmotionType;
  confidenceRating: number; // 1-10
  focusRating: number; // 1-10
  stressRating: number; // 1-10
  patienceRating: number; // 1-10
  energyRating: number; // 1-10
  postTradeEmotion?: EmotionType;
}

export interface TradeQualityScores {
  setup: number; // 1-10
  execution: number; // 1-10
  riskManagement: number; // 1-10
  psychology: number; // 1-10
  discipline: number; // 1-10
  overall: number; // 1-10 calculated average
}

export type ScreenshotCategory = 'HTF' | 'Before Entry' | 'During Trade' | 'Exit' | 'After Entry' | 'Other';

export interface TradeScreenshot {
  id: string;
  tradeId: string;
  category: ScreenshotCategory;
  caption: string;
  storageKey: string; // reference to IndexedDB blob key
  previewUrl?: string; // transient object URL
  order: number;
  createdAt: string;
}

export interface TradeJournal {
  thesis: string; // Long-form why trade taken
  whatWentWell: string;
  whatWentWrong: string;
  followedPlan: 'Yes' | 'No' | 'Partially';
  interferedDuringTrade: boolean;
  movedStopLoss: boolean;
  closedEarly: boolean;
  hesitatedOnEntry: boolean;
  revengeOrOvertraded: boolean;
  lessonsLearned: string;
  whatToDoDifferently: string;
}

export interface TradeTimelineEvent {
  id: string;
  timestamp: string;
  type: 'Created' | 'Planned' | 'Entered' | 'Modified' | 'Partial Exit' | 'SL/TP Changed' | 'Closed' | 'Reviewed';
  description: string;
}

export interface Trade {
  id: string;
  accountId: string;
  setupId: string;
  symbol: string;
  direction: 'Long' | 'Short';
  status: TradeStatus;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  session: 'Asian' | 'London' | 'New York (AM)' | 'New York (PM)' | 'Overlap' | 'Off-Hours';
  timeframe: string;
  marketCondition: string;
  tags: string[];
  
  planned: TradePlanned;
  actual: TradeActual;
  exits: TradeExit[];
  result: TradeResult;
  
  checklistSnapshot: TradeChecklistSnapshot;
  psychology: TradePsychology;
  qualityScores: TradeQualityScores;
  violations: string[];
  screenshots: TradeScreenshot[];
  journal: TradeJournal;
  timeline: TradeTimelineEvent[];
  
  createdAt: string;
  updatedAt: string;
  isArchived?: boolean;
}

export type NoTradeReason = 
  | 'No Valid Setup'
  | 'Didn\'t Trigger'
  | 'Poor Market Conditions'
  | 'Risk/Daily Loss Limit Reached'
  | 'Emotional State'
  | 'Personal / Schedule'
  | 'Didn\'t Monitor'
  | 'Chose Not To Trade'
  | 'Other';

export interface TradingDay {
  id: string; // YYYY-MM-DD
  date: string;
  didTrade: boolean;
  tradeCount: number;
  dailyPL: number;
  dailyR: number;
  noTradeReason?: NoTradeReason;
  noTradeNotes?: string;
  emotionalState?: EmotionType;
  energyRating?: number; // 1-10
  focusRating?: number; // 1-10
  disciplineScore?: number; // 1-10
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface Tag {
  id: string;
  name: string;
  color: string;
}

export interface Settings {
  theme: 'Light';
  currency: string;
  dateFormat: string;
  timezone: string;
  defaultAccountId: string;
  defaultSetupId: string;
  defaultRiskPercent: number;
  
  // Risk thresholds
  normalRiskMaxPercent: number;
  warningRiskMaxPercent: number;
  criticalRiskMaxPercent: number;
  
  // Journal options
  autosaveIntervalMs: number;
  autosaveEnabled: boolean;
  hardChecklistEnforcement: boolean;
  hardRiskWarnings: boolean;
  noTradeReminders: boolean;
  
  storagePersisted?: boolean;
}

export interface FilterState {
  accountId: string;
  setupId: string;
  startDate: string;
  endDate: string;
  symbol: string;
  direction: string;
  status: string;
  outcome: string;
  session: string;
  minAdherence: number;
  minRisk: number;
  maxRisk: number;
  emotion: string;
  violation: string;
  tag: string;
  searchQuery: string;
}
