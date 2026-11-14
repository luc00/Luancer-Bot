import { AutonomyLevel, BotFinishId, EmployeeModuleId } from '../types/index.ts';
import { calculateCustomBotOrderPricing, PRICING_PLANS } from './botEngine.ts';

const ALLOWED_EMPLOYEE_IDS = new Set<EmployeeModuleId>([
  'emp-1',
  'emp-2',
  'emp-3',
  'emp-4',
  'emp-5',
  'emp-6',
]);

const ALLOWED_FINISH_IDS = new Set<BotFinishId>([
  'sage_brass',
  'charcoal_titanium',
  'brushed_gold',
  'ivory_ceramic',
]);

const ALLOWED_AUTONOMY_LEVELS = new Set<AutonomyLevel>([
  'supervisionato',
  'semi-autonomo',
  'piena-autonomia',
]);

export interface SlidingWindowCheckResult {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
}

/**
 * Creates a memory-bounded sliding-window rate limiter keyed by IP/UID.
 */
export function createSlidingWindowLimiter(options: {
  maxRequests: number;
  windowMs: number;
  maxBuckets?: number;
}) {
  const { maxRequests, windowMs, maxBuckets = 2000 } = options;
  const buckets = new Map<string, number[]>();

  function check(key: string, nowMs: number = Date.now()): SlidingWindowCheckResult {
    const cutoff = nowMs - windowMs;
    const prev = buckets.get(key) ?? [];
    const active = prev.filter((ts) => ts > cutoff);

    if (active.length >= maxRequests) {
      const oldest = active[0];
      const retryAfterMs = Math.max(1000, oldest + windowMs - nowMs);
      buckets.set(key, active);
      return {
        allowed: false,
        remaining: 0,
        retryAfterSeconds: Math.ceil(retryAfterMs / 1000),
      };
    }

    active.push(nowMs);
    if (!buckets.has(key) && buckets.size >= maxBuckets) {
      const oldestKey = buckets.keys().next().value;
      if (oldestKey !== undefined) buckets.delete(oldestKey);
    }
    buckets.set(key, active);

    return {
      allowed: true,
      remaining: Math.max(0, maxRequests - active.length),
      retryAfterSeconds: 0,
    };
  }

  return { check };
}

export interface ValidatedBotPurchase {
  botCode: string;
  name: string;
  bundleType: 'all_in_one' | 'modular';
  billingCycle: 'monthly' | 'annual';
  authoritativePriceEur: number;
  autonomyLevel: AutonomyLevel;
  finishId: BotFinishId;
  selectedEmployees: EmployeeModuleId[];
  moduleConfigs: Record<string, unknown>;
  guardrails: {
    priorities: string;
    decisions: string;
    relationships: string;
    qualityControl: string;
  };
  customDirectives: string;
  connectedSoftware: string[];
}

export function validateBotPurchaseInput(rawBody: unknown):
  | { valid: true; data: ValidatedBotPurchase }
  | { valid: false; error: string } {
  if (!rawBody || typeof rawBody !== 'object') {
    return { valid: false, error: 'Payload ordine mancante o non valido.' };
  }

  const body = rawBody as Record<string, unknown>;
  const rawName = typeof body.name === 'string' ? body.name.trim() : '';
  if (rawName.length < 2 || rawName.length > 120) {
    return { valid: false, error: 'Specifica un nome valido per il bot (2-120 caratteri).' };
  }

  const rawEmployees = Array.isArray(body.selectedEmployees) ? body.selectedEmployees : [];
  const selectedEmployees: EmployeeModuleId[] = Array.from(
    new Set(
      rawEmployees.filter(
        (id): id is EmployeeModuleId =>
          typeof id === 'string' && ALLOWED_EMPLOYEE_IDS.has(id as EmployeeModuleId)
      )
    )
  ).slice(0, 6);

  if (selectedEmployees.length === 0) {
    return { valid: false, error: 'Seleziona almeno un modulo dipendente AI valido.' };
  }

  const bundleType: 'all_in_one' | 'modular' =
    body.bundleType === 'all_in_one' ? 'all_in_one' : 'modular';
  const billingCycle: 'monthly' | 'annual' =
    body.billingCycle === 'monthly' ? 'monthly' : 'annual';

  const rawCode =
    typeof body.botCode === 'string' && body.botCode.trim()
      ? body.botCode
          .trim()
          .replace(/[^a-zA-Z0-9_-]/g, '-')
          .slice(0, 40)
      : `BOT-${Date.now().toString().slice(-4)}`;

  // Server-authoritative pricing: check if this order maps to a named PricingPlan,
  // otherwise compute directly from the Six Employees catalog.
  let authoritativePriceEur = calculateCustomBotOrderPricing(
    bundleType,
    selectedEmployees,
    billingCycle
  ).monthlyUnitEur;

  if (rawCode.startsWith('PLAN-')) {
    const planSlug = rawCode.slice('PLAN-'.length).toLowerCase();
    const matchedPlan = PRICING_PLANS.find((p) => p.id === planSlug);
    if (matchedPlan && matchedPlan.monthlyPrice > 0) {
      authoritativePriceEur =
        billingCycle === 'annual' ? matchedPlan.annualMonthlyPrice : matchedPlan.monthlyPrice;
    }
  }

  const autonomyLevel: AutonomyLevel =
    typeof body.autonomyLevel === 'string' &&
    ALLOWED_AUTONOMY_LEVELS.has(body.autonomyLevel as AutonomyLevel)
      ? (body.autonomyLevel as AutonomyLevel)
      : 'semi-autonomo';

  const finishId: BotFinishId =
    typeof body.finishId === 'string' && ALLOWED_FINISH_IDS.has(body.finishId as BotFinishId)
      ? (body.finishId as BotFinishId)
      : 'sage_brass';

  const rawGuardrails =
    body.guardrails && typeof body.guardrails === 'object'
      ? (body.guardrails as Record<string, unknown>)
      : {};

  const guardrails = {
    priorities:
      typeof rawGuardrails.priorities === 'string' && rawGuardrails.priorities.trim()
        ? rawGuardrails.priorities.trim().slice(0, 400)
        : 'Conferma settimanale delle 3 priorità dal titolare',
    decisions:
      typeof rawGuardrails.decisions === 'string' && rawGuardrails.decisions.trim()
        ? rawGuardrails.decisions.trim().slice(0, 400)
        : 'Analisi AI preparata, scelta finale al titolare',
    relationships:
      typeof rawGuardrails.relationships === 'string' && rawGuardrails.relationships.trim()
        ? rawGuardrails.relationships.trim().slice(0, 400)
        : 'Trattative strategiche e reclami critici gestiti dal titolare',
    qualityControl:
      typeof rawGuardrails.qualityControl === 'string' && rawGuardrails.qualityControl.trim()
        ? rawGuardrails.qualityControl.trim().slice(0, 400)
        : 'Revisione rapida output prima della pubblicazione',
  };

  const connectedSoftware = Array.isArray(body.connectedSoftware)
    ? body.connectedSoftware
        .filter((s): s is string => typeof s === 'string' && s.trim().length > 0)
        .map((s) => s.trim().slice(0, 80))
        .slice(0, 12)
    : ['Zucchetti'];

  return {
    valid: true,
    data: {
      botCode: rawCode,
      name: rawName,
      bundleType,
      billingCycle,
      authoritativePriceEur,
      autonomyLevel,
      finishId,
      selectedEmployees,
      moduleConfigs:
        body.moduleConfigs && typeof body.moduleConfigs === 'object'
          ? (body.moduleConfigs as Record<string, unknown>)
          : {},
      guardrails,
      customDirectives:
        typeof body.customDirectives === 'string' ? body.customDirectives.trim().slice(0, 2000) : '',
      connectedSoftware,
    },
  };
}

export function sanitizeBotPatchInput(rawBody: unknown): Record<string, unknown> {
  if (!rawBody || typeof rawBody !== 'object') return {};
  const body = rawBody as Record<string, unknown>;
  const clean: Record<string, unknown> = {};

  if (typeof body.name === 'string' && body.name.trim().length >= 2) {
    clean.name = body.name.trim().slice(0, 120);
  }
  if (
    typeof body.autonomyLevel === 'string' &&
    ALLOWED_AUTONOMY_LEVELS.has(body.autonomyLevel as AutonomyLevel)
  ) {
    clean.autonomyLevel = body.autonomyLevel;
  }
  if (typeof body.finishId === 'string' && ALLOWED_FINISH_IDS.has(body.finishId as BotFinishId)) {
    clean.finishId = body.finishId;
  }
  if (Array.isArray(body.selectedEmployees)) {
    const validEmps = Array.from(
      new Set(
        body.selectedEmployees.filter(
          (id): id is EmployeeModuleId =>
            typeof id === 'string' && ALLOWED_EMPLOYEE_IDS.has(id as EmployeeModuleId)
        )
      )
    ).slice(0, 6);
    if (validEmps.length > 0) clean.selectedEmployees = validEmps;
  }
  if (body.moduleConfigs && typeof body.moduleConfigs === 'object' && !Array.isArray(body.moduleConfigs)) {
    clean.moduleConfigs = body.moduleConfigs;
  }
  if (body.guardrails && typeof body.guardrails === 'object' && !Array.isArray(body.guardrails)) {
    clean.guardrails = body.guardrails;
  }
  if (typeof body.customDirectives === 'string') {
    clean.customDirectives = body.customDirectives.trim().slice(0, 2000);
  }
  if (Array.isArray(body.connectedSoftware)) {
    clean.connectedSoftware = body.connectedSoftware
      .filter((s): s is string => typeof s === 'string' && s.trim().length > 0)
      .map((s) => s.trim().slice(0, 80))
      .slice(0, 12);
  }
  if (body.status === 'attivo' || body.status === 'in_pausa') {
    clean.status = body.status;
  }

  return clean;
}

export function resolveAuthoritativePlanMonthlyPrice(
  planId: string,
  billingCycle: 'monthly' | 'annual'
): number | null {
  const plan = PRICING_PLANS.find((p) => p.id === planId);
  if (!plan) return null;
  if (plan.monthlyPrice <= 0) return 0;
  return billingCycle === 'annual' ? plan.annualMonthlyPrice : plan.monthlyPrice;
}
