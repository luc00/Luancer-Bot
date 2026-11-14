import { db } from './index.ts';
import { users } from './schema.ts';
import { eq } from 'drizzle-orm';

export async function getOrCreateUser(uid: string, email: string, displayName?: string) {
  try {
    const safeEmail = email || `${uid}@luancer.local`;
    const safeName = displayName?.trim() || safeEmail.split('@')[0] || 'Imprenditore Luancer';

    const result = await db
      .insert(users)
      .values({
        uid,
        email: safeEmail,
        displayName: safeName,
      })
      .onConflictDoUpdate({
        target: users.uid,
        set: {
          email: safeEmail,
          displayName: safeName,
          updatedAt: new Date(),
        },
      })
      .returning();

    return result[0];
  } catch (error) {
    console.error('Failed to upsert user:', error);
    throw new Error('Impossibile sincronizzare il profilo utente.', { cause: error });
  }
}

export async function updateUserPlan(uid: string, planId: string, billingCycle: 'monthly' | 'annual', companyName?: string) {
  try {
    const result = await db
      .update(users)
      .set({
        activePlanId: planId,
        billingCycle,
        ...(companyName ? { companyName } : {}),
        updatedAt: new Date(),
      })
      .where(eq(users.uid, uid))
      .returning();

    return result[0];
  } catch (error) {
    console.error('Failed to update user plan:', error);
    throw new Error('Impossibile aggiornare il piano aziendale.', { cause: error });
  }
}

export async function updateUserCompanyName(uid: string, companyName: string) {
  return updateUserBusinessIdentity(uid, { companyName });
}

export async function updateUserBusinessIdentity(
  uid: string,
  input: {
    companyName?: string;
    ownerName?: string;
    websiteUrl?: string;
    resetVerification?: boolean;
  }
) {
  try {
    const patch: Record<string, unknown> = {
      updatedAt: new Date(),
    };
    if (typeof input.companyName === 'string') {
      patch.companyName = input.companyName.trim().slice(0, 120) || 'La Mia Azienda';
    }
    if (typeof input.ownerName === 'string') {
      patch.ownerName = input.ownerName.trim().slice(0, 120);
    }
    if (typeof input.websiteUrl === 'string') {
      patch.websiteUrl = input.websiteUrl.trim().slice(0, 200);
    }
    if (input.resetVerification) {
      patch.verifiedDomain = '';
      patch.domainVerificationStatus = 'non_verificato';
      patch.domainVerificationToken = '';
      patch.domainVerifiedAt = null;
    }

    const result = await db
      .update(users)
      .set(patch)
      .where(eq(users.uid, uid))
      .returning();

    return result[0];
  } catch (error) {
    console.error('Failed to update business identity:', error);
    throw new Error('Impossibile aggiornare i dati aziendali.', { cause: error });
  }
}

export async function saveDomainChallenge(
  uid: string,
  input: {
    websiteUrl: string;
    method: string;
    token: string;
  }
) {
  try {
    const result = await db
      .update(users)
      .set({
        websiteUrl: input.websiteUrl,
        verifiedDomain: '',
        domainVerificationMethod: input.method,
        domainVerificationToken: input.token,
        domainVerificationStatus: 'in_attesa',
        domainVerifiedAt: null,
        updatedAt: new Date(),
      })
      .where(eq(users.uid, uid))
      .returning();

    return result[0];
  } catch (error) {
    console.error('Failed to save domain challenge:', error);
    throw new Error('Impossibile salvare il codice di verifica dominio.', { cause: error });
  }
}

export async function markDomainVerified(
  uid: string,
  input: {
    domain: string;
    websiteUrl: string;
    method: string;
  }
) {
  try {
    const result = await db
      .update(users)
      .set({
        websiteUrl: input.websiteUrl,
        verifiedDomain: input.domain,
        domainVerificationMethod: input.method,
        domainVerificationStatus: 'verificato',
        domainVerifiedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(users.uid, uid))
      .returning();

    return result[0];
  } catch (error) {
    console.error('Failed to mark domain verified:', error);
    throw new Error('Impossibile confermare la verifica dominio.', { cause: error });
  }
}
