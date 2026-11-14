import { relations } from 'drizzle-orm';
import {
  boolean,
  doublePrecision,
  integer,
  jsonb,
  pgTable,
  serial,
  text,
  timestamp,
} from 'drizzle-orm/pg-core';

export interface EmployeeModuleConfig {
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

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(),
  email: text('email').notNull(),
  displayName: text('display_name').notNull().default('Imprenditore Luancer'),
  ownerName: text('owner_name').notNull().default(''),
  companyName: text('company_name').notNull().default('Azienda Cliente'),
  websiteUrl: text('website_url').notNull().default(''),
  verifiedDomain: text('verified_domain').notNull().default(''),
  domainVerificationMethod: text('domain_verification_method').notNull().default('dns_txt'),
  domainVerificationToken: text('domain_verification_token').notNull().default(''),
  domainVerificationStatus: text('domain_verification_status').notNull().default('non_verificato'),
  domainVerifiedAt: timestamp('domain_verified_at'),
  activePlanId: text('active_plan_id').notNull().default('atelier'),
  billingCycle: text('billing_cycle').notNull().default('annual'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const purchasedBots = pgTable('purchased_bots', {
  id: serial('id').primaryKey(),
  userUid: text('user_uid')
    .references(() => users.uid, { onDelete: 'cascade' })
    .notNull(),
  botCode: text('bot_code').notNull(),
  name: text('name').notNull(),
  bundleType: text('bundle_type').notNull(), // 'all_in_one' | 'modular'
  billingCycle: text('billing_cycle').notNull(), // 'monthly' | 'annual'
  priceEur: integer('price_eur').notNull(),
  autonomyLevel: text('autonomy_level').notNull().default('semi-autonomo'),
  finishId: text('finish_id').notNull().default('sage_brass'),
  selectedEmployees: jsonb('selected_employees').$type<string[]>().notNull(),
  moduleConfigs: jsonb('module_configs')
    .$type<Record<string, EmployeeModuleConfig>>()
    .notNull(),
  guardrails: jsonb('guardrails').$type<NonDelegableGuardrails>().notNull(),
  customDirectives: text('custom_directives').notNull().default(''),
  connectedSoftware: jsonb('connected_software').$type<string[]>().notNull(),
  status: text('status').notNull().default('attivo'), // 'attivo' | 'in_pausa'
  paidAt: timestamp('paid_at').defaultNow().notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const financialTransactions = pgTable('financial_transactions', {
  id: serial('id').primaryKey(),
  userUid: text('user_uid')
    .references(() => users.uid, { onDelete: 'cascade' })
    .notNull(),
  docNumber: text('doc_number').notNull(),
  clientOrVendor: text('client_or_vendor').notNull(),
  recordType: text('record_type').notNull(), // 'fattura_attiva' | 'incasso_pagamento' | 'spesa' | 'abbonamento'
  description: text('description').notNull(),
  amountGrossEur: doublePrecision('amount_gross_eur').notNull(),
  direction: text('direction').notNull(), // 'entrata' | 'uscita'
  status: text('status').notNull(), // 'saldato' | 'in_attesa' | 'scaduto'
  handledByBot: boolean('handled_by_bot').notNull().default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const usersRelations = relations(users, ({ many }) => ({
  purchasedBots: many(purchasedBots),
  financialTransactions: many(financialTransactions),
}));

export const purchasedBotsRelations = relations(purchasedBots, ({ one }) => ({
  owner: one(users, {
    fields: [purchasedBots.userUid],
    references: [users.uid],
  }),
}));

export const financialTransactionsRelations = relations(financialTransactions, ({ one }) => ({
  owner: one(users, {
    fields: [financialTransactions.userUid],
    references: [users.uid],
  }),
}));
