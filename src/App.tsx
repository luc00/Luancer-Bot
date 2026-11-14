import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { ActiveTab, Navbar } from './components/Navbar.tsx';
import { HeroSection } from './components/HeroSection.tsx';
import { PaidBotStore } from './components/PaidBotStore.tsx';
import { MarketAnalystPanel } from './components/MarketAnalystPanel.tsx';
import { BotStudio } from './components/BotStudio.tsx';
import { PaidBotCustomizerModal } from './components/PaidBotCustomizerModal.tsx';
import { FinancialOmniLedger } from './components/FinancialOmniLedger.tsx';
import { PerformanceDashboard } from './components/PerformanceDashboard.tsx';
import { IntegrationsHub } from './components/IntegrationsHub.tsx';
import { PricingSection } from './components/PricingSection.tsx';
import { ManifestoSection } from './components/ManifestoSection.tsx';
import { Footer } from './components/Footer.tsx';
import { FramerBackground } from './components/FramerBackground.tsx';
import {
  DEFAULT_BUSINESS_PROFILE,
  INITIAL_INTEGRATIONS,
  INITIAL_ACTIVITY_LOGS,
  INITIAL_FINANCIAL_RECORDS,
  INITIAL_PURCHASED_BOTS,
  buildBotDraftFromPricingPlan,
  createDefaultGuardrails,
  createDefaultModuleConfigs,
  deriveOperationalBotsFromPurchased,
} from './utils/botEngine.ts';
import {
  ActivityLogEntry,
  BotFinishId,
  BotInstance,
  BusinessProfile,
  DomainVerificationMethod,
  DomainVerificationStatus,
  EmployeeModuleId,
  FinancialRecord,
  MarketResearchResult,
  PricingPlan,
  PurchasedBotConfig,
  SoftwareIntegration,
} from './types/index.ts';
import { useAuth } from './context/AuthContext.tsx';

const STORAGE_KEYS = {
  businessProfile: 'luancer_business_profile_v1',
  challengeSignature: 'luancer_domain_challenge_sig_v1',
  purchasedBots: 'luancer_purchased_bots_v1',
  customBots: 'luancer_custom_bots_v1',
  currentPlanId: 'luancer_current_plan_id_v1',
  financialRecords: 'luancer_financial_records_v1',
} as const;

function readStorageJson<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export default function App() {
  const { user, idToken, getFreshToken, syncBotPresetToFirestore } = useAuth();

  const [activeTab, setActiveTab] = useState<ActiveTab>('studio');
  const [businessProfile, setBusinessProfile] = useState<BusinessProfile>(() => {
    const saved = readStorageJson<Partial<BusinessProfile>>(STORAGE_KEYS.businessProfile, {});
    return {
      ...DEFAULT_BUSINESS_PROFILE,
      ...saved,
      siteAutomationScopes: Array.isArray(saved.siteAutomationScopes)
        ? saved.siteAutomationScopes
        : DEFAULT_BUSINESS_PROFILE.siteAutomationScopes,
    };
  });
  const [challengeSignature, setChallengeSignature] = useState<string>(() =>
    readStorageJson<string>(STORAGE_KEYS.challengeSignature, '')
  );
  const [purchasedBots, setPurchasedBots] = useState<PurchasedBotConfig[]>(() =>
    readStorageJson<PurchasedBotConfig[]>(STORAGE_KEYS.purchasedBots, INITIAL_PURCHASED_BOTS)
  );
  const [customBots, setCustomBots] = useState<BotInstance[]>(() =>
    readStorageJson<BotInstance[]>(STORAGE_KEYS.customBots, [])
  );
  const [activePurchasedBotId, setActivePurchasedBotId] = useState<string>(() => {
    const saved = readStorageJson<PurchasedBotConfig[]>(STORAGE_KEYS.purchasedBots, INITIAL_PURCHASED_BOTS);
    return saved[0]?.id ?? '';
  });
  const [financialRecords, setFinancialRecords] = useState<FinancialRecord[]>(() =>
    readStorageJson<FinancialRecord[]>(STORAGE_KEYS.financialRecords, INITIAL_FINANCIAL_RECORDS)
  );
  const [integrations, setIntegrations] = useState<SoftwareIntegration[]>(INITIAL_INTEGRATIONS);
  const [activityLogs, setActivityLogs] = useState<ActivityLogEntry[]>(INITIAL_ACTIVITY_LOGS);
  const [currentPlanId, setCurrentPlanId] = useState<string | null>(() =>
    readStorageJson<string | null>(STORAGE_KEYS.currentPlanId, null)
  );
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);

  const [customizerTarget, setCustomizerTarget] = useState<{
    bot: PurchasedBotConfig;
    employeeId: EmployeeModuleId;
  } | null>(null);

  const profileSyncTimerRef = useRef<number | null>(null);

  // Persist self-service workspace state locally across reloads
  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEYS.businessProfile, JSON.stringify(businessProfile));
    } catch {
      // Ignore quota errors
    }
  }, [businessProfile]);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEYS.challengeSignature, JSON.stringify(challengeSignature));
    } catch {
      // Ignore quota errors
    }
  }, [challengeSignature]);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEYS.purchasedBots, JSON.stringify(purchasedBots));
    } catch {
      // Ignore quota errors
    }
  }, [purchasedBots]);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEYS.customBots, JSON.stringify(customBots));
    } catch {
      // Ignore quota errors
    }
  }, [customBots]);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEYS.currentPlanId, JSON.stringify(currentPlanId));
    } catch {
      // Ignore quota errors
    }
  }, [currentPlanId]);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEYS.financialRecords, JSON.stringify(financialRecords));
    } catch {
      // Ignore quota errors
    }
  }, [financialRecords]);

  // Hydrate purchased bots & company profile from Cloud SQL when Firebase Auth token is ready
  useEffect(() => {
    if (!idToken || !user) return;

    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/me', {
          headers: { Authorization: `Bearer ${idToken}` },
        });
        if (!res.ok || cancelled) return;
        const data = await res.json();

        if (data.user && !cancelled) {
          const srvUser = data.user as Record<string, unknown>;
          setBusinessProfile((prev) => ({
            ...prev,
            companyName:
              typeof srvUser.companyName === 'string' && srvUser.companyName !== 'Azienda Cliente'
                ? srvUser.companyName
                : prev.companyName,
            ownerName:
              typeof srvUser.ownerName === 'string' && srvUser.ownerName.trim()
                ? srvUser.ownerName
                : prev.ownerName,
            websiteUrl:
              typeof srvUser.websiteUrl === 'string' && srvUser.websiteUrl.trim()
                ? srvUser.websiteUrl
                : prev.websiteUrl,
            verifiedDomain:
              typeof srvUser.verifiedDomain === 'string' && srvUser.verifiedDomain.trim()
                ? srvUser.verifiedDomain
                : prev.verifiedDomain,
            verificationMethod:
              srvUser.domainVerificationMethod === 'meta_tag' ||
              srvUser.domainVerificationMethod === 'well_known_file' ||
              srvUser.domainVerificationMethod === 'dns_txt'
                ? srvUser.domainVerificationMethod
                : prev.verificationMethod,
            verificationToken:
              typeof srvUser.domainVerificationToken === 'string' && srvUser.domainVerificationToken
                ? srvUser.domainVerificationToken
                : prev.verificationToken,
            verificationStatus:
              srvUser.domainVerificationStatus === 'verificato' ||
              srvUser.domainVerificationStatus === 'in_attesa' ||
              srvUser.domainVerificationStatus === 'non_verificato'
                ? (srvUser.domainVerificationStatus as DomainVerificationStatus)
                : prev.verificationStatus,
            verifiedAt:
              typeof srvUser.domainVerifiedAt === 'string' && srvUser.domainVerifiedAt
                ? srvUser.domainVerifiedAt
                : prev.verifiedAt,
          }));
        }

        if (Array.isArray(data.bots) && data.bots.length > 0 && !cancelled) {
          const srvOwner =
            typeof data.user?.ownerName === 'string' && data.user.ownerName.trim()
              ? data.user.ownerName.trim()
              : undefined;
          const srvDomain =
            data.user?.domainVerificationStatus === 'verificato' &&
            typeof data.user?.verifiedDomain === 'string'
              ? data.user.verifiedDomain.trim()
              : undefined;

          const hydrated: PurchasedBotConfig[] = data.bots.map((row: Record<string, unknown>) => ({
            id: `db-bot-${row.id}`,
            dbId: Number(row.id),
            botCode: String(row.botCode || 'BOT-01'),
            name: String(row.name || 'Bot Aziendale'),
            ownerFullName: srvOwner,
            boundDomain: srvDomain,
            bundleType: row.bundleType === 'all_in_one' ? 'all_in_one' : 'modular',
            billingCycle: row.billingCycle === 'monthly' ? 'monthly' : 'annual',
            priceEur: Number(row.priceEur || 199),
            autonomyLevel:
              row.autonomyLevel === 'supervisionato' || row.autonomyLevel === 'piena-autonomia'
                ? row.autonomyLevel
                : 'semi-autonomo',
            finishId: (row.finishId as BotFinishId) || 'sage_brass',
            selectedEmployees: Array.isArray(row.selectedEmployees)
              ? (row.selectedEmployees as EmployeeModuleId[])
              : ['emp-1', 'emp-2', 'emp-3', 'emp-4', 'emp-5', 'emp-6'],
            moduleConfigs:
              row.moduleConfigs && typeof row.moduleConfigs === 'object'
                ? { ...createDefaultModuleConfigs(), ...(row.moduleConfigs as Record<EmployeeModuleId, any>) }
                : createDefaultModuleConfigs(),
            guardrails:
              row.guardrails && typeof row.guardrails === 'object'
                ? { ...createDefaultGuardrails(), ...(row.guardrails as Record<string, string>) }
                : createDefaultGuardrails(),
            customDirectives: String(row.customDirectives || ''),
            connectedSoftware: Array.isArray(row.connectedSoftware)
              ? (row.connectedSoftware as string[])
              : ['Zucchetti'],
            status: row.status === 'in_pausa' ? 'in_pausa' : 'attivo',
            isPaid: true,
            paidAt: row.createdAt ? String(row.createdAt).split('T')[0] : new Date().toISOString().split('T')[0],
          }));

          setPurchasedBots(hydrated);
          setActivePurchasedBotId(hydrated[0].id);
          if (data.user?.activePlanId) {
            setCurrentPlanId(String(data.user.activePlanId));
          }
        }
      } catch (err) {
        console.error('Cloud SQL hydration warning:', err);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [idToken, user]);

  const handleUpdateBusinessProfile = useCallback(
    (next: BusinessProfile) => {
      setBusinessProfile(next);

      if (next.verificationStatus !== 'verificato') {
        if (!next.verificationToken) {
          setChallengeSignature('');
        }
      }

      if (profileSyncTimerRef.current) {
        window.clearTimeout(profileSyncTimerRef.current);
      }

      if (idToken && (next.companyName.trim().length >= 2 || next.ownerName.trim().length >= 2)) {
        profileSyncTimerRef.current = window.setTimeout(async () => {
          try {
            const token = (await getFreshToken()) || idToken;
            if (!token) return;
            await fetch('/api/profile', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({
                companyName: next.companyName.trim() || undefined,
                ownerName: next.ownerName.trim() || undefined,
                websiteUrl: next.websiteUrl.trim(),
              }),
            });
          } catch (err) {
            console.error('Profile sync warning:', err);
          }
        }, 450);
      }
    },
    [getFreshToken, idToken]
  );

  const handleChallengeGenerated = useCallback(
    (payload: {
      domain: string;
      normalizedUrl: string;
      method: DomainVerificationMethod;
      token: string;
      challengeSignature: string;
    }) => {
      setChallengeSignature(payload.challengeSignature);
      setBusinessProfile((prev) => ({
        ...prev,
        websiteUrl: payload.normalizedUrl,
        verificationMethod: payload.method,
        verificationToken: payload.token,
        verificationStatus: 'in_attesa',
        verifiedDomain: prev.verifiedDomain === payload.domain ? prev.verifiedDomain : '',
        verifiedAt: prev.verifiedDomain === payload.domain ? prev.verifiedAt : undefined,
      }));
    },
    []
  );

  const handleDomainVerified = useCallback(
    (outcome: {
      verified: boolean;
      domain: string;
      method: DomainVerificationMethod;
      verifiedAt?: string;
    }) => {
      if (!outcome.verified) return;
      const verifiedIso = outcome.verifiedAt || new Date().toISOString();
      setBusinessProfile((prev) => ({
        ...prev,
        verifiedDomain: outcome.domain,
        verificationMethod: outcome.method,
        verificationStatus: 'verificato',
        verifiedAt: verifiedIso,
      }));
      setPurchasedBots((prev) =>
        prev.map((bot) =>
          bot.boundDomain
            ? bot
            : {
                ...bot,
                boundDomain: outcome.domain,
              }
        )
      );
    },
    []
  );

  const activePurchasedBot =
    purchasedBots.find((b) => b.id === activePurchasedBotId) || purchasedBots[0];

  const operationalBots = useMemo(
    () => deriveOperationalBotsFromPurchased(purchasedBots, customBots, businessProfile),
    [purchasedBots, customBots, businessProfile]
  );

  const handleOpenCreateModal = () => {
    setActiveTab('studio');
    setIsCreateModalOpen(true);
  };

  // Persist a newly purchased customizable bot (Cloud SQL + Firestore + Client Financial Ledger)
  const handlePurchaseCustomBot = useCallback(
    async (
      draft: Omit<PurchasedBotConfig, 'id' | 'isPaid' | 'paidAt'>,
      explicitPlanId?: PricingPlan['id']
    ) => {
      const today = new Date().toISOString().split('T')[0];
      let createdBot: PurchasedBotConfig = {
        ...draft,
        id: `bot-paid-${Date.now()}`,
        isPaid: true,
        paidAt: today,
      };

      const token = (await getFreshToken()) || idToken;
      if (token) {
        try {
          const res = await fetch('/api/bots/purchase', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(draft),
          });
          if (res.ok) {
            const payload = await res.json();
            if (payload.bot?.id) {
              createdBot = {
                ...createdBot,
                id: `db-bot-${payload.bot.id}`,
                dbId: Number(payload.bot.id),
              };
            }
          }
        } catch (err) {
          console.error('Purchase API persistence error:', err);
        }

        await syncBotPresetToFirestore({
          id: createdBot.id,
          botCode: createdBot.botCode,
          name: createdBot.name,
          bundleType: createdBot.bundleType,
          finishId: createdBot.finishId,
          autonomyLevel: createdBot.autonomyLevel,
          selectedEmployees: createdBot.selectedEmployees,
          customDirectives: createdBot.customDirectives,
          status: createdBot.status,
        });
      }

      setPurchasedBots((prev) => [createdBot, ...prev]);
      setActivePurchasedBotId(createdBot.id);
      setCurrentPlanId(
        explicitPlanId ?? (createdBot.bundleType === 'all_in_one' ? 'atelier' : 'artigiano')
      );

      // Record subscription order from the client's own business perspective (software expense)
      const netAmount =
        createdBot.billingCycle === 'annual' ? createdBot.priceEur * 12 : createdBot.priceEur;
      const grossAmount = Math.round(netAmount * 1.22 * 100) / 100;
      const ledgerRecord: FinancialRecord = {
        id: `rec-bot-${Date.now()}`,
        date: today,
        type: 'spesa',
        docNumber: `ORD-${new Date().getFullYear()}/${Math.floor(100 + Math.random() * 900)}`,
        clientOrVendor: 'Luancer & Co. S.r.l.',
        description: `Acquisto ${createdBot.name} (${createdBot.selectedEmployees.length}/6 moduli · ${
          createdBot.billingCycle === 'annual' ? 'Annuale' : 'Mensile'
        })`,
        category: 'Licenze & Automazione AI',
        amountGrossEur: grossAmount,
        amountNetEur: netAmount,
        vatRatePercent: 22,
        direction: 'uscita',
        status: 'saldato',
        paymentMethod: 'Carta Aziendale / SEPA',
        dueDate: today,
        handledByBot: true,
        botNote: 'Licenza piano bot attivata per il tuo business (fattura passiva deducibile registrata).',
      };
      setFinancialRecords((prev) => [ledgerRecord, ...prev]);
    },
    [getFreshToken, idToken, syncBotPresetToFirestore]
  );

  // Save customization changes on any purchased bot
  const handleSaveCustomBot = useCallback(
    async (updated: PurchasedBotConfig) => {
      setPurchasedBots((prev) => prev.map((b) => (b.id === updated.id ? updated : b)));

      const token = (await getFreshToken()) || idToken;
      if (token && updated.dbId) {
        try {
          await fetch(`/api/bots/${updated.dbId}`, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              name: updated.name,
              autonomyLevel: updated.autonomyLevel,
              finishId: updated.finishId,
              selectedEmployees: updated.selectedEmployees,
              moduleConfigs: updated.moduleConfigs,
              guardrails: updated.guardrails,
              customDirectives: updated.customDirectives,
              connectedSoftware: updated.connectedSoftware,
              status: updated.status,
            }),
          });
        } catch (err) {
          console.error('Update bot API warning:', err);
        }
      }

      if (token) {
        await syncBotPresetToFirestore({
          id: updated.id,
          botCode: updated.botCode,
          name: updated.name,
          bundleType: updated.bundleType,
          finishId: updated.finishId,
          autonomyLevel: updated.autonomyLevel,
          selectedEmployees: updated.selectedEmployees,
          customDirectives: updated.customDirectives,
          status: updated.status,
        });
      }
    },
    [getFreshToken, idToken, syncBotPresetToFirestore]
  );

  const handleTogglePurchasedBotStatus = useCallback(
    (bot: PurchasedBotConfig) => {
      const nextStatus: 'attivo' | 'in_pausa' = bot.status === 'attivo' ? 'in_pausa' : 'attivo';
      void handleSaveCustomBot({ ...bot, status: nextStatus });
    },
    [handleSaveCustomBot]
  );

  const handleDeletePurchasedBot = useCallback(
    async (bot: PurchasedBotConfig) => {
      setPurchasedBots((prev) => {
        const filtered = prev.filter((item) => item.id !== bot.id);
        if (activePurchasedBotId === bot.id) {
          setActivePurchasedBotId(filtered[0]?.id ?? '');
        }
        if (filtered.length === 0) {
          setCurrentPlanId(null);
        }
        return filtered;
      });

      const token = (await getFreshToken()) || idToken;
      if (token && bot.dbId) {
        try {
          await fetch(`/api/bots/${bot.dbId}`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${token}` },
          });
        } catch (err) {
          console.error('Delete bot API warning:', err);
        }
      }
    },
    [activePurchasedBotId, getFreshToken, idToken]
  );

  // Route BotStudio mutations back to either purchased bot employee modules or custom flows
  const handleSetOperationalBots: React.Dispatch<React.SetStateAction<BotInstance[]>> = useCallback(
    (updater) => {
      const nextList = typeof updater === 'function' ? updater(operationalBots) : updater;

      const derivedPrefixMap = new Map<
        string,
        { purchased: PurchasedBotConfig; empId: EmployeeModuleId; prevBot: BotInstance }
      >();
      for (const prevBot of operationalBots) {
        for (const p of purchasedBots) {
          const prefix = `${p.id}-`;
          if (prevBot.id.startsWith(prefix)) {
            const empId = prevBot.id.slice(prefix.length) as EmployeeModuleId;
            derivedPrefixMap.set(prevBot.id, { purchased: p, empId, prevBot });
            break;
          }
        }
      }

      // Sync custom standalone workflows
      const nextCustomBots = nextList.filter((item) => !derivedPrefixMap.has(item.id));
      setCustomBots(nextCustomBots);

      // Sync edits, pauses, or removals on derived employee agents back into PurchasedBotConfig
      const nextById = new Map(nextList.map((item) => [item.id, item]));
      const purchasedUpdates = new Map<string, PurchasedBotConfig>();

      for (const [derivedId, meta] of derivedPrefixMap.entries()) {
        const currentTarget = purchasedUpdates.get(meta.purchased.id) ?? meta.purchased;
        const edited = nextById.get(derivedId);

        if (!edited) {
          // Employee agent disabled/removed from operational console
          const updatedSelected = currentTarget.selectedEmployees.filter((id) => id !== meta.empId);
          const updatedConfigs = {
            ...currentTarget.moduleConfigs,
            [meta.empId]: {
              ...currentTarget.moduleConfigs[meta.empId],
              enabled: false,
            },
          };
          purchasedUpdates.set(meta.purchased.id, {
            ...currentTarget,
            selectedEmployees: updatedSelected,
            moduleConfigs: updatedConfigs,
          });
        } else if (
          edited.description !== meta.prevBot.description ||
          edited.autonomyLevel !== meta.prevBot.autonomyLevel ||
          edited.status !== meta.prevBot.status
        ) {
          const updatedConfigs = {
            ...currentTarget.moduleConfigs,
            [meta.empId]: {
              ...currentTarget.moduleConfigs[meta.empId],
              directives: edited.description,
            },
          };
          purchasedUpdates.set(meta.purchased.id, {
            ...currentTarget,
            autonomyLevel: edited.autonomyLevel,
            status: edited.status === 'in_pausa' ? 'in_pausa' : 'attivo',
            moduleConfigs: updatedConfigs,
          });
        }
      }

      for (const updatedPurchased of purchasedUpdates.values()) {
        void handleSaveCustomBot(updatedPurchased);
      }
    },
    [operationalBots, purchasedBots, handleSaveCustomBot]
  );

  // Inject live Google Search market report into Dipendente 1, 2, and 3 directives
  const handleApplyMarketResearchToBot = useCallback(
    (result: MarketResearchResult) => {
      if (!activePurchasedBot) return;
      const summaryExcerpt = result.reportMarkdown.slice(0, 420);
      const updated: PurchasedBotConfig = {
        ...activePurchasedBot,
        moduleConfigs: {
          ...activePurchasedBot.moduleConfigs,
          'emp-1': {
            ...activePurchasedBot.moduleConfigs['emp-1'],
            directives: `Analisi attiva sul settore "${result.sector}" (Focus: ${result.focus}). Sintesi: ${summaryExcerpt}`,
          },
          'emp-2': {
            ...activePurchasedBot.moduleConfigs['emp-2'],
            directives: `Usa il report reale sul mercato "${result.sector}" per costruire offerta a 3 fasce, homepage e ads con il mio tono personale.`,
          },
          'emp-3': {
            ...activePurchasedBot.moduleConfigs['emp-3'],
            directives: `Progetta la landing page e i micro-tool ottimizzati per il mercato "${result.sector}" secondo il posizionamento approvato.`,
          },
        },
      };
      void handleSaveCustomBot(updated);
    },
    [activePurchasedBot, handleSaveCustomBot]
  );

  const handleSelectPlan = useCallback(
    async (plan: PricingPlan, billingCycle: 'monthly' | 'annual', monthlyEur: number) => {
      setCurrentPlanId(plan.id);
      const verifiedDomain =
        businessProfile.verificationStatus === 'verificato'
          ? businessProfile.verifiedDomain
          : '';
      const draft = buildBotDraftFromPricingPlan(
        plan,
        billingCycle,
        businessProfile.companyName,
        businessProfile.ownerName,
        verifiedDomain
      );
      await handlePurchaseCustomBot(draft, plan.id);

      const token = (await getFreshToken()) || idToken;
      if (token) {
        try {
          await fetch('/api/subscriptions/activate', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              planId: plan.id,
              billingCycle,
              monthlyEur,
              companyName: businessProfile.companyName,
            }),
          });
        } catch (err) {
          console.error('Subscription persistence warning:', err);
        }
      }
    },
    [
      businessProfile.companyName,
      businessProfile.ownerName,
      businessProfile.verificationStatus,
      businessProfile.verifiedDomain,
      getFreshToken,
      handlePurchaseCustomBot,
      idToken,
    ]
  );

  const scrollToConfigurator = () => {
    setActiveTab('studio');
    window.setTimeout(() => {
      const el = document.getElementById('configuratore-acquisto-bot');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }, 60);
  };

  const scrollToConsole = () => {
    setActiveTab('studio');
    window.setTimeout(() => {
      const el = document.getElementById('console-operativa-business');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }, 60);
  };

  return (
    <div className="relative z-0 min-h-screen bg-[#eef4f0] text-[#16221d] flex flex-col font-sans-brand pointer-pass-foreground">
      <FramerBackground />
      {/* Primary Top Bar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenCreateModal={handleOpenCreateModal}
      />

      <main className="flex-1">
        {/* Hero Section shown on primary landing / workspace tab */}
        {activeTab === 'studio' && (
          <HeroSection
            businessProfile={businessProfile}
            activePurchasedBot={activePurchasedBot}
            onStartBuilder={scrollToConfigurator}
            onExplorePlans={() => setActiveTab('pricing')}
            onOpenFinanza={() => setActiveTab('finanza')}
            onJumpToConsole={scrollToConsole}
          />
        )}

        {/* Client Self-Service Workspace */}
        {activeTab === 'studio' && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 space-y-10">
            <PaidBotStore
              businessProfile={businessProfile}
              onUpdateBusinessProfile={handleUpdateBusinessProfile}
              challengeSignature={challengeSignature}
              onChallengeGenerated={handleChallengeGenerated}
              onDomainVerified={handleDomainVerified}
              purchasedBots={purchasedBots}
              activeBotId={activePurchasedBot?.id ?? null}
              onSelectActiveBot={setActivePurchasedBotId}
              onPurchaseBot={(draft) => handlePurchaseCustomBot(draft)}
              onOpenCustomizer={(bot, empId) =>
                setCustomizerTarget({ bot, employeeId: empId || 'emp-1' })
              }
              onToggleBotStatus={handleTogglePurchasedBotStatus}
              onDeleteBot={handleDeletePurchasedBot}
              onJumpToConsole={scrollToConsole}
              onJumpToPlans={() => setActiveTab('pricing')}
            />

            <MarketAnalystPanel
              businessProfile={businessProfile}
              onApplyInsightsToBot={handleApplyMarketResearchToBot}
            />
          </div>
        )}

        {activeTab === 'studio' && (
          <BotStudio
            bots={operationalBots}
            setBots={handleSetOperationalBots}
            hasPurchasedPlan={purchasedBots.length > 0}
            businessProfile={businessProfile}
            onJumpToPurchase={scrollToConfigurator}
            activityLogs={activityLogs}
            setActivityLogs={setActivityLogs}
            isCreateModalOpen={isCreateModalOpen}
            setIsCreateModalOpen={setIsCreateModalOpen}
          />
        )}

        {activeTab === 'finanza' && (
          <FinancialOmniLedger
            businessProfile={businessProfile}
            records={financialRecords}
            setRecords={setFinancialRecords}
          />
        )}

        {activeTab === 'analytics' && (
          <PerformanceDashboard
            bots={operationalBots}
            activityLogs={activityLogs}
            companyName={businessProfile.companyName}
          />
        )}

        {activeTab === 'integrations' && (
          <IntegrationsHub integrations={integrations} setIntegrations={setIntegrations} />
        )}

        {activeTab === 'pricing' && (
          <PricingSection
            currentPlanId={currentPlanId}
            companyName={businessProfile.companyName}
            onSelectPlan={handleSelectPlan}
            onGoToWorkspace={() => setActiveTab('studio')}
          />
        )}

        {activeTab === 'manifesto' && <ManifestoSection />}
      </main>

      {/* Paid Bot 6-Employee Customizer Modal */}
      {customizerTarget && (
        <PaidBotCustomizerModal
          bot={customizerTarget.bot}
          initialEmployeeId={customizerTarget.employeeId}
          onClose={() => setCustomizerTarget(null)}
          onSave={handleSaveCustomBot}
        />
      )}

      {/* Footer with clean design */}
      <Footer onNavigate={(tab) => setActiveTab(tab)} />
    </div>
  );
}
