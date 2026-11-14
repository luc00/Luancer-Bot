import { db } from './index.ts';
import {
  purchasedBots,
  financialTransactions,
  EmployeeModuleConfig,
  NonDelegableGuardrails,
} from './schema.ts';
import { and, desc, eq } from 'drizzle-orm';

export interface CreatePurchasedBotInput {
  userUid: string;
  botCode: string;
  name: string;
  bundleType: 'all_in_one' | 'modular';
  billingCycle: 'monthly' | 'annual';
  priceEur: number;
  autonomyLevel: string;
  finishId: string;
  selectedEmployees: string[];
  moduleConfigs: Record<string, EmployeeModuleConfig>;
  guardrails: NonDelegableGuardrails;
  customDirectives: string;
  connectedSoftware: string[];
}

export async function listUserPurchasedBots(userUid: string) {
  try {
    return await db
      .select()
      .from(purchasedBots)
      .where(eq(purchasedBots.userUid, userUid))
      .orderBy(desc(purchasedBots.createdAt));
  } catch (error) {
    console.error('Failed to list purchased bots:', error);
    throw new Error('Impossibile recuperare i bot acquistati dal database.', { cause: error });
  }
}

export async function createPurchasedBot(input: CreatePurchasedBotInput) {
  try {
    const [createdBot] = await db
      .insert(purchasedBots)
      .values({
        userUid: input.userUid,
        botCode: input.botCode,
        name: input.name,
        bundleType: input.bundleType,
        billingCycle: input.billingCycle,
        priceEur: input.priceEur,
        autonomyLevel: input.autonomyLevel,
        finishId: input.finishId,
        selectedEmployees: input.selectedEmployees,
        moduleConfigs: input.moduleConfigs,
        guardrails: input.guardrails,
        customDirectives: input.customDirectives,
        connectedSoftware: input.connectedSoftware,
        status: 'attivo',
      })
      .returning();

    return createdBot;
  } catch (error) {
    console.error('Failed to create purchased bot:', error);
    throw new Error('Impossibile registrare l\'acquisto del bot.', { cause: error });
  }
}

export async function updatePurchasedBot(
  id: number,
  userUid: string,
  updates: Partial<{
    name: string;
    autonomyLevel: string;
    finishId: string;
    selectedEmployees: string[];
    moduleConfigs: Record<string, EmployeeModuleConfig>;
    guardrails: NonDelegableGuardrails;
    customDirectives: string;
    connectedSoftware: string[];
    status: string;
  }>
) {
  try {
    const [updated] = await db
      .update(purchasedBots)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(and(eq(purchasedBots.id, id), eq(purchasedBots.userUid, userUid)))
      .returning();

    return updated;
  } catch (error) {
    console.error('Failed to update purchased bot:', error);
    throw new Error('Impossibile aggiornare la configurazione del bot.', { cause: error });
  }
}

export async function deletePurchasedBot(id: number, userUid: string) {
  try {
    const [deleted] = await db
      .delete(purchasedBots)
      .where(and(eq(purchasedBots.id, id), eq(purchasedBots.userUid, userUid)))
      .returning();

    return deleted;
  } catch (error) {
    console.error('Failed to delete purchased bot:', error);
    throw new Error('Impossibile rimuovere il bot selezionato.', { cause: error });
  }
}

export async function recordUserTransaction(input: {
  userUid: string;
  docNumber: string;
  clientOrVendor: string;
  recordType: string;
  description: string;
  amountGrossEur: number;
  direction: 'entrata' | 'uscita';
  status: string;
}) {
  try {
    const [created] = await db
      .insert(financialTransactions)
      .values({
        userUid: input.userUid,
        docNumber: input.docNumber,
        clientOrVendor: input.clientOrVendor,
        recordType: input.recordType,
        description: input.description,
        amountGrossEur: input.amountGrossEur,
        direction: input.direction,
        status: input.status,
        handledByBot: true,
      })
      .returning();

    return created;
  } catch (error) {
    console.error('Failed to record transaction:', error);
    throw new Error('Impossibile salvare la transazione.', { cause: error });
  }
}
