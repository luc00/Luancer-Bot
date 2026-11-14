export type Department = 
  | 'amministrazione' 
  | 'assistenza' 
  | 'vendite' 
  | 'magazzino' 
  | 'hr' 
  | 'operations';

export type AutonomyLevel = 'supervisionato' | 'semi-autonomo' | 'piena-autonomia';

export type BotStatus = 'attivo' | 'in_pausa' | 'apprendimento' | 'bozza';

export interface BotTrigger {
  id: string;
  source: string; // e.g., 'Fattura in scadenza', 'Nuova email ordine', 'Giacenza sotto soglia', 'Ticket cliente irrisolto > 2h'
  condition: string;
  type: 'evento' | 'schedulato' | 'webhook';
}

export interface BotAction {
  id: string;
  title: string;
  targetSoftware: string; // e.g., 'Zucchetti', 'SAP', 'Salesforce', 'Fatture in Cloud'
  requiresApproval: boolean;
  description: string;
}

export interface BotInstance {
  id: string;
  name: string;
  code: string; // e.g., 'BOT-REC-01'
  department: Department;
  description: string;
  autonomyLevel: AutonomyLevel;
  status: BotStatus;
  primarySoftware: string[];
  triggers: BotTrigger[];
  actions: BotAction[];
  systemDirectives: string;
  metrics: {
    actionsExecuted: number;
    hoursSavedMonth: number;
    accuracyPercent: number;
    lastActive: string;
  };
  createdAt: string;
}

export interface ActivityLogEntry {
  id: string;
  timestamp: string;
  botId: string;
  botName: string;
  department: Department;
  actionTaken: string;
  targetSoftware: string;
  status: 'completato_autonomo' | 'approvato_supervisore' | 'in_attesa_approvazione' | 'anomalia_segnalata';
  confidenceScore: number; // 0 - 100
  timeSavedMinutes: number;
  details: string;
}

export interface SoftwareIntegration {
  id: string;
  name: string;
  category: 'ERP & Contabilità' | 'CRM & Vendite' | 'Supply Chain' | 'Comunicazione & Task';
  logoText: string;
  description: string;
  supportedSync: string[];
  connected: boolean;
  apiKeyMasked?: string;
  syncFrequency: 'realtime' | '15min' | 'orario' | 'giornaliero';
  lastSync?: string;
  recordsSyncedCount: number;
}

export interface PricingPlan {
  id: 'artigiano' | 'atelier' | 'corporate' | 'su_misura';
  name: string;
  tagline: string;
  monthlyPrice: number; // in EUR
  annualMonthlyPrice: number; // in EUR (billed annually)
  targetAudience: string;
  isPopular?: boolean;
  features: {
    activeBots: string;
    autonomousCalls: string;
    erpIntegrations: string;
    reporting: string;
    support: string;
    customRules: string;
  };
}

export interface ExecutiveReport {
  generatedAt: string;
  companyName: string;
  period: string;
  totalHoursSaved: number;
  estimatedCostSavingsEur: number;
  autonomousResolutionRate: number;
  totalOperations: number;
  departmentBreakdown: {
    department: Department;
    label: string;
    hoursSaved: number;
    operationsCount: number;
    efficiencyIndex: number;
  }[];
  keyInsights: string[];
  recommendations: string[];
}

export type FinancialRecordType = 
  | 'fattura_attiva' 
  | 'fattura_passiva' 
  | 'incasso_pagamento' 
  | 'spesa' 
  | 'abbonamento';

export type FinancialStatus = 'saldato' | 'in_attesa' | 'scaduto';

export interface FinancialRecord {
  id: string;
  date: string; // YYYY-MM-DD
  type: FinancialRecordType;
  docNumber: string; // e.g. FT-2026/088, SP-441
  clientOrVendor: string;
  description: string;
  category: string;
  amountGrossEur: number;
  amountNetEur: number;
  vatRatePercent: number;
  direction: 'entrata' | 'uscita';
  status: FinancialStatus;
  paymentMethod: string;
  dueDate: string;
  handledByBot: boolean;
  botNote?: string;
}

export interface ClientProfile {
  id: string;
  name: string;
  vatNumber: string;
  sector: string;
  email: string;
  activePlan: string;
  totalVolumeEur: number;
}

export interface OmniBotFinancialSettings {
  autoInvoiceGeneration: boolean;
  autoPaymentReconciliation: boolean;
  autoExpenseAlertLimitEur: number;
  autoSubscriptionRenewal: boolean;
  autoReminderDaysOverdue: number;
  customClientDirectives: string;
}

export type DomainVerificationMethod = 'dns_txt' | 'meta_tag' | 'well_known_file';

export type DomainVerificationStatus = 'non_verificato' | 'in_attesa' | 'verificato';

export interface BusinessProfile {
  companyName: string;
  sector: string;
  vatNumber: string;
  ownerName: string;
  websiteUrl: string;
  verifiedDomain: string;
  verificationStatus: DomainVerificationStatus;
  verificationMethod: DomainVerificationMethod;
  verificationToken: string;
  verifiedAt?: string;
  siteAutomationScopes: string[];
}

export type BotFinishId =
  | 'sage_brass'
  | 'charcoal_titanium'
  | 'brushed_gold'
  | 'ivory_ceramic';

export type EmployeeModuleId =
  | 'emp-1'
  | 'emp-2'
  | 'emp-3'
  | 'emp-4'
  | 'emp-5'
  | 'emp-6';

export interface EmployeeSkillModule {
  id: EmployeeModuleId;
  order: number;
  code: string;
  roleTitle: string;
  shortLabel: string;
  department: Department;
  subtitle: string;
  pluginStack: string[];
  connectors: string[];
  defaultPrompt: string;
  scheduleNote: string;
  monthlyStandaloneEur: number;
  annualMonthlyStandaloneEur: number;
}

export interface EmployeeModuleCustomConfig {
  enabled: boolean;
  directives: string;
  schedule: string;
  channel: string;
}

export interface NonDelegableGuardrails {
  priorities: string;
  decisions: string;
  relationships: string;
  qualityControl: string;
}

export interface PurchasedBotConfig {
  id: string;
  dbId?: number;
  botCode: string;
  name: string;
  ownerFullName?: string;
  boundDomain?: string;
  bundleType: 'all_in_one' | 'modular';
  billingCycle: 'monthly' | 'annual';
  priceEur: number;
  autonomyLevel: AutonomyLevel;
  finishId: BotFinishId;
  selectedEmployees: EmployeeModuleId[];
  moduleConfigs: Record<EmployeeModuleId, EmployeeModuleCustomConfig>;
  guardrails: NonDelegableGuardrails;
  customDirectives: string;
  connectedSoftware: string[];
  status: 'attivo' | 'in_pausa';
  isPaid: boolean;
  paidAt: string;
}

export interface MarketResearchSource {
  title: string;
  uri: string;
}

export interface MarketResearchResult {
  sector: string;
  focus: string;
  reportMarkdown: string;
  sources: MarketResearchSource[];
  model: string;
  generatedAt: string;
}

