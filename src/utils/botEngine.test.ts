import test from 'node:test';
import assert from 'node:assert/strict';
import {
  DEFAULT_BUSINESS_PROFILE,
  calculateSavings,
  calculatePlanPricing,
  computeAutonomyEfficiency,
  generateBotDraftFromPrompt,
  PRICING_PLANS,
  calculateFinancialTotals,
  executeBotFinancialCommand,
  SIX_EMPLOYEES_CATALOG,
  calculateCustomBotOrderPricing,
  ALL_IN_ONE_BOT_MONTHLY_EUR,
  ALL_IN_ONE_BOT_ANNUAL_MONTHLY_EUR,
  createDefaultModuleConfigs,
  createDefaultGuardrails,
  buildBotDraftFromPricingPlan,
  deriveOperationalBotsFromPurchased
} from './botEngine.ts';
import { ActivityLogEntry } from '../types/index.ts';

test('calculateSavings returns correct estimated cost savings in EUR', () => {
  assert.equal(calculateSavings(10, 35), 350);
  assert.equal(calculateSavings(0, 35), 0);
  assert.equal(calculateSavings(-5, 35), 0);
  assert.equal(calculateSavings(100.5, 40), 4020);
});

test('calculatePlanPricing calculates monthly vs annual pricing with accurate discount and savings', () => {
  const atelierPlan = PRICING_PLANS.find(p => p.id === 'atelier')!;
  assert.ok(atelierPlan);

  const monthlyCalc = calculatePlanPricing(atelierPlan, 'monthly');
  assert.equal(monthlyCalc.monthlyRate, 249);
  assert.equal(monthlyCalc.totalAnnualBilled, 249 * 12);
  assert.equal(monthlyCalc.annualSavingsEur, 0);

  const annualCalc = calculatePlanPricing(atelierPlan, 'annual');
  assert.equal(annualCalc.monthlyRate, 199);
  assert.equal(annualCalc.totalAnnualBilled, 199 * 12);
  assert.equal(annualCalc.annualSavingsEur, (249 - 199) * 12);
  assert.equal(annualCalc.discountPercentage, 20);
});

test('computeAutonomyEfficiency handles empty and populated activity logs', () => {
  const empty = computeAutonomyEfficiency([]);
  assert.equal(empty.totalActions, 0);
  assert.equal(empty.resolutionRate, 0);

  const sampleLogs: ActivityLogEntry[] = [
    {
      id: '1',
      timestamp: '10:00',
      botId: 'b1',
      botName: 'Bot 1',
      department: 'amministrazione',
      actionTaken: 'A1',
      targetSoftware: 'Zucchetti',
      status: 'completato_autonomo',
      confidenceScore: 98,
      timeSavedMinutes: 30,
      details: 'OK'
    },
    {
      id: '2',
      timestamp: '10:05',
      botId: 'b1',
      botName: 'Bot 1',
      department: 'amministrazione',
      actionTaken: 'A2',
      targetSoftware: 'Zucchetti',
      status: 'completato_autonomo',
      confidenceScore: 96,
      timeSavedMinutes: 30,
      details: 'OK'
    },
    {
      id: '3',
      timestamp: '10:10',
      botId: 'b2',
      botName: 'Bot 2',
      department: 'magazzino',
      actionTaken: 'A3',
      targetSoftware: 'SAP',
      status: 'approvato_supervisore',
      confidenceScore: 90,
      timeSavedMinutes: 60,
      details: 'Requires review'
    }
  ];

  const result = computeAutonomyEfficiency(sampleLogs);
  assert.equal(result.totalActions, 3);
  assert.equal(result.autonomousActions, 2);
  assert.equal(result.supervisedActions, 1);
  assert.equal(result.totalMinutesSaved, 120);
  assert.equal(result.totalHoursSaved, 2.0);
  // 2 autonomous out of 3 = 66.7%
  assert.equal(result.resolutionRate, 66.7);
});

test('generateBotDraftFromPrompt creates specialized bot configuration based on domain keywords', () => {
  const invoiceBot = generateBotDraftFromPrompt('Vorrei automatizzare i solleciti delle fatture scadute e verificare gli incassi');
  assert.equal(invoiceBot.department, 'amministrazione');
  assert.ok(invoiceBot.triggers.length > 0);
  assert.ok(invoiceBot.actions.length > 0);
  assert.ok(invoiceBot.primarySoftware.includes('Zucchetti') || invoiceBot.primarySoftware.includes('Fatture in Cloud'));

  const supportBot = generateBotDraftFromPrompt('Gestione ticket clienti e assistenza rapida 24 ore su 24');
  assert.equal(supportBot.department, 'assistenza');
  assert.ok(supportBot.primarySoftware.includes('Salesforce'));
});

test('calculateFinancialTotals computes incomes, expenses, net profit and overdue balance', () => {
  const records: any[] = [
    {
      id: '1',
      date: '2026-11-01',
      type: 'incasso_pagamento',
      amountGrossEur: 5000,
      direction: 'entrata',
      status: 'saldato'
    },
    {
      id: '2',
      date: '2026-11-02',
      type: 'abbonamento',
      amountGrossEur: 300,
      direction: 'entrata',
      status: 'saldato'
    },
    {
      id: '3',
      date: '2026-11-03',
      type: 'spesa',
      amountGrossEur: 1200,
      direction: 'uscita',
      status: 'saldato'
    },
    {
      id: '4',
      date: '2026-11-04',
      type: 'fattura_attiva',
      amountGrossEur: 2000,
      direction: 'entrata',
      status: 'scaduto'
    }
  ];

  const totals = calculateFinancialTotals(records);
  assert.equal(totals.totalIncomeEur, 5300);
  assert.equal(totals.totalExpensesEur, 1200);
  assert.equal(totals.netProfitEur, 4100);
  assert.equal(totals.overdueInvoicesEur, 2000);
  assert.equal(totals.recurringMrrEur, 300);
});

test('executeBotFinancialCommand processes invoice, expense and payment commands', () => {
  const initialRecords: any[] = [
    {
      id: 'inv-1',
      docNumber: 'FT-2026/010',
      type: 'fattura_attiva',
      clientOrVendor: 'Cliente Alfa',
      amountGrossEur: 1500,
      direction: 'entrata',
      status: 'scaduto'
    }
  ];

  // Test invoice creation
  const invRes = executeBotFinancialCommand('Emetti fattura per Rossi di 1.200 euro', initialRecords, 'Studio Rossi');
  assert.equal(invRes.updatedRecords.length, 2);
  assert.equal(invRes.updatedRecords[0].type, 'fattura_attiva');
  assert.equal(invRes.updatedRecords[0].amountGrossEur, 1200);

  // Test expense creation
  const expRes = executeBotFinancialCommand('Aggiungi spesa di 450 euro per server cloud', initialRecords);
  assert.equal(expRes.updatedRecords.length, 2);
  assert.equal(expRes.updatedRecords[0].type, 'spesa');
  assert.equal(expRes.updatedRecords[0].amountGrossEur, 450);

  // Test overdue reminder
  const reminderRes = executeBotFinancialCommand('Sollecita le fatture scadute', initialRecords);
  assert.ok(reminderRes.replyMessage.includes('solleciti'));
});

test('SIX_EMPLOYEES_CATALOG defines all 6 specialized employees and default configs', () => {
  assert.equal(SIX_EMPLOYEES_CATALOG.length, 6);
  const configs = createDefaultModuleConfigs();
  const guardrails = createDefaultGuardrails();
  assert.equal(Object.keys(configs).length, 6);
  assert.ok(guardrails.priorities.length > 10);
  assert.ok(guardrails.qualityControl.length > 10);
});

test('calculateCustomBotOrderPricing computes all-in-one bundle and modular pricing accurately', () => {
  const allInOneMonthly = calculateCustomBotOrderPricing('all_in_one', ['emp-1'], 'monthly');
  assert.equal(allInOneMonthly.monthlyUnitEur, ALL_IN_ONE_BOT_MONTHLY_EUR);
  assert.equal(allInOneMonthly.effectiveEmployeeCount, 6);
  assert.equal(allInOneMonthly.totalBilledTodayEur, ALL_IN_ONE_BOT_MONTHLY_EUR);
  assert.ok(allInOneMonthly.bundleSavingsMonthlyEur > 100);

  const allInOneAnnual = calculateCustomBotOrderPricing('all_in_one', ['emp-1'], 'annual');
  assert.equal(allInOneAnnual.monthlyUnitEur, ALL_IN_ONE_BOT_ANNUAL_MONTHLY_EUR);
  assert.equal(allInOneAnnual.totalBilledTodayEur, ALL_IN_ONE_BOT_ANNUAL_MONTHLY_EUR * 12);

  const modularSelected = calculateCustomBotOrderPricing('modular', ['emp-1', 'emp-4', 'emp-1'], 'monthly');
  assert.equal(modularSelected.effectiveEmployeeCount, 2);
  assert.equal(modularSelected.monthlyUnitEur, 49 + 45);
});

test('buildBotDraftFromPricingPlan provisions self-service bot tailored to client company, owner, and domain', () => {
  const artigiano = PRICING_PLANS.find((p) => p.id === 'artigiano')!;
  const atelier = PRICING_PLANS.find((p) => p.id === 'atelier')!;

  const artigianoDraft = buildBotDraftFromPricingPlan(
    artigiano,
    'annual',
    'Falegnameria Verdi',
    'Marco Verdi',
    'falegnameriaverdi.it'
  );
  assert.equal(artigianoDraft.priceEur, artigiano.annualMonthlyPrice);
  assert.equal(artigianoDraft.selectedEmployees.length, 3);
  assert.ok(artigianoDraft.name.includes('Falegnameria Verdi'));
  assert.equal(artigianoDraft.ownerFullName, 'Marco Verdi');
  assert.equal(artigianoDraft.boundDomain, 'falegnameriaverdi.it');

  const atelierDraft = buildBotDraftFromPricingPlan(atelier, 'monthly', 'Studio Bianchi');
  assert.equal(atelierDraft.bundleType, 'all_in_one');
  assert.equal(atelierDraft.selectedEmployees.length, 6);
  assert.equal(atelierDraft.priceEur, atelier.monthlyPrice);
});

test('deriveOperationalBotsFromPurchased propagates ownerName and verifiedDomain vs unverified lock', () => {
  const atelier = PRICING_PLANS.find((p) => p.id === 'atelier')!;
  const draft = buildBotDraftFromPricingPlan(atelier, 'annual', 'Officina Beta', 'Luca Quixada', '');
  const purchased = {
    ...draft,
    id: 'bot-1',
    isPaid: true,
    paidAt: '2026-11-13',
  };

  // Unverified domain -> live site actions require approval / stay locked
  const lockedOperational = deriveOperationalBotsFromPurchased([purchased], [], {
    ...DEFAULT_BUSINESS_PROFILE,
    companyName: 'Officina Beta',
    ownerName: 'Luca Quixada',
    verificationStatus: 'non_verificato',
    verifiedDomain: '',
  });
  assert.equal(lockedOperational.length, 6);
  assert.ok(lockedOperational[0].name.includes('Officina Beta'));
  assert.ok(lockedOperational[0].systemDirectives.includes('Luca Quixada'));
  assert.ok(lockedOperational[0].systemDirectives.includes('non ancora verificato'));
  assert.equal(lockedOperational[0].actions[0].requiresApproval, true);
  assert.equal(lockedOperational[0].code, 'DIP-01');
  assert.equal(lockedOperational[5].code, 'DIP-06');

  // Verified domain -> bound to verified domain and autonomous actions unlocked
  const verifiedOperational = deriveOperationalBotsFromPurchased([purchased], [], {
    ...DEFAULT_BUSINESS_PROFILE,
    companyName: 'Officina Beta',
    ownerName: 'Luca Quixada',
    verificationStatus: 'verificato',
    verifiedDomain: 'officinabeta.it',
  });
  assert.ok(verifiedOperational[0].primarySoftware.includes('officinabeta.it'));
  assert.ok(verifiedOperational[0].systemDirectives.includes('officinabeta.it'));
  assert.equal(verifiedOperational[0].actions[0].requiresApproval, false);
});
