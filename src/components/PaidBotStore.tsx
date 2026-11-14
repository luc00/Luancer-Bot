import React, { useState } from 'react';
import {
  AutonomyLevel,
  BotFinishId,
  BusinessProfile,
  DomainVerificationMethod,
  EmployeeModuleId,
  PurchasedBotConfig,
} from '../types/index.ts';
import {
  BOT_FINISH_PRESETS,
  SIX_EMPLOYEES_CATALOG,
  calculateCustomBotOrderPricing,
  createDefaultGuardrails,
  createDefaultModuleConfigs,
} from '../utils/botEngine.ts';
import { DomainVerificationCard } from './DomainVerificationCard.tsx';
import {
  AlertCircle,
  ArrowRight,
  Building2,
  Check,
  CreditCard,
  Globe,
  Loader2,
  Pause,
  Play,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Trash2,
  UserCheck,
} from 'lucide-react';

interface PaidBotStoreProps {
  businessProfile: BusinessProfile;
  onUpdateBusinessProfile: (next: BusinessProfile) => void;
  challengeSignature: string;
  onChallengeGenerated: (payload: {
    domain: string;
    normalizedUrl: string;
    method: DomainVerificationMethod;
    token: string;
    challengeSignature: string;
  }) => void;
  onDomainVerified: (outcome: {
    verified: boolean;
    domain: string;
    method: DomainVerificationMethod;
    verifiedAt?: string;
  }) => void;
  purchasedBots: PurchasedBotConfig[];
  activeBotId: string | null;
  onSelectActiveBot: (id: string) => void;
  onPurchaseBot: (draft: Omit<PurchasedBotConfig, 'id' | 'isPaid' | 'paidAt'>) => Promise<void>;
  onOpenCustomizer: (bot: PurchasedBotConfig, empId?: EmployeeModuleId) => void;
  onToggleBotStatus: (bot: PurchasedBotConfig) => void;
  onDeleteBot: (bot: PurchasedBotConfig) => void;
  onJumpToConsole: () => void;
  onJumpToPlans: () => void;
}

export const PaidBotStore: React.FC<PaidBotStoreProps> = ({
  businessProfile,
  onUpdateBusinessProfile,
  challengeSignature,
  onChallengeGenerated,
  onDomainVerified,
  purchasedBots,
  activeBotId,
  onSelectActiveBot,
  onPurchaseBot,
  onOpenCustomizer,
  onToggleBotStatus,
  onDeleteBot,
  onJumpToConsole,
  onJumpToPlans,
}) => {
  const [bundleType, setBundleType] = useState<'all_in_one' | 'modular'>('all_in_one');
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('annual');
  const [selectedEmployees, setSelectedEmployees] = useState<EmployeeModuleId[]>([
    'emp-1',
    'emp-2',
    'emp-3',
    'emp-4',
    'emp-5',
    'emp-6',
  ]);
  const [finishId, setFinishId] = useState<BotFinishId>('sage_brass');
  const [autonomyLevel, setAutonomyLevel] = useState<AutonomyLevel>('semi-autonomo');
  const [botNameDirty, setBotNameDirty] = useState(false);
  const [botName, setBotName] = useState(
    `Bot Azienda Completa · ${businessProfile.companyName || 'La Mia Azienda'}`
  );
  const [customDirectives, setCustomDirectives] = useState(
    'Opera per il mio business con tono professionale italiano e rispetto delle 4 regole non delegabili.'
  );
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [purchaseFeedback, setPurchaseFeedback] = useState<string | null>(null);
  const [ownerError, setOwnerError] = useState<string | null>(null);

  React.useEffect(() => {
    if (botNameDirty) return;
    const company = businessProfile.companyName.trim() || 'La Mia Azienda';
    setBotName(
      bundleType === 'all_in_one'
        ? `Bot Azienda Completa · ${company}`
        : `Piano Modulare · ${company}`
    );
  }, [businessProfile.companyName, bundleType, botNameDirty]);

  const effectiveSelected: EmployeeModuleId[] =
    bundleType === 'all_in_one'
      ? ['emp-1', 'emp-2', 'emp-3', 'emp-4', 'emp-5', 'emp-6']
      : selectedEmployees;

  const pricing = calculateCustomBotOrderPricing(bundleType, effectiveSelected, billingCycle);

  const handleToggleEmployeeSelection = (id: EmployeeModuleId) => {
    if (bundleType === 'all_in_one') {
      setBundleType('modular');
      if (!botNameDirty) {
        setBotName(`Piano Modulare · ${businessProfile.companyName || 'La Mia Azienda'}`);
      }
    }
    setSelectedEmployees((prev) => {
      const exists = prev.includes(id);
      if (exists && prev.length <= 1) return prev;
      return exists ? prev.filter((e) => e !== id) : [...prev, id];
    });
  };

  const handleSelectBundleMode = (mode: 'all_in_one' | 'modular') => {
    setBundleType(mode);
    const company = businessProfile.companyName.trim() || 'La Mia Azienda';
    if (mode === 'all_in_one') {
      setSelectedEmployees(['emp-1', 'emp-2', 'emp-3', 'emp-4', 'emp-5', 'emp-6']);
      if (!botNameDirty) {
        setBotName(`Bot Azienda Completa · ${company}`);
      }
    } else if (!botNameDirty) {
      setBotName(`Piano Modulare · ${company}`);
    }
  };

  const handleCheckout = async () => {
    if (isPurchasing || effectiveSelected.length === 0) return;

    const cleanOwner = businessProfile.ownerName.trim();
    if (cleanOwner.length < 2) {
      setOwnerError(
        'Inserisci il tuo Nome e Cognome Titolare nello Spazio Business qui sopra: ogni piano bot è intestato a nome proprio.'
      );
      return;
    }

    setOwnerError(null);
    setIsPurchasing(true);
    setPurchaseFeedback(null);

    try {
      const moduleConfigs = createDefaultModuleConfigs();
      for (const emp of SIX_EMPLOYEES_CATALOG) {
        moduleConfigs[emp.id].enabled = effectiveSelected.includes(emp.id);
      }

      const verifiedDomain =
        businessProfile.verificationStatus === 'verificato'
          ? businessProfile.verifiedDomain.trim()
          : '';

      await onPurchaseBot({
        botCode:
          bundleType === 'all_in_one'
            ? 'LUANCER-6X1'
            : `MOD-${effectiveSelected.length}X-${Date.now().toString().slice(-3)}`,
        name: botName.trim() || `Bot Aziendale · ${businessProfile.companyName || 'La Mia Azienda'}`,
        ownerFullName: cleanOwner,
        boundDomain: verifiedDomain || undefined,
        bundleType,
        billingCycle,
        priceEur: pricing.monthlyUnitEur,
        autonomyLevel,
        finishId,
        selectedEmployees: effectiveSelected,
        moduleConfigs,
        guardrails: createDefaultGuardrails(),
        customDirectives: customDirectives.trim(),
        connectedSoftware: verifiedDomain
          ? [verifiedDomain, 'Zucchetti', 'Fatture in Cloud', 'Telegram Bot']
          : ['Zucchetti', 'Fatture in Cloud', 'Telegram Bot', 'PostHog'],
        status: 'attivo',
      });

      setPurchaseFeedback(
        verifiedDomain
          ? `Piano acquistato a nome di ${cleanOwner} e collegato al sito verificato "${verifiedDomain}"!`
          : `Piano acquistato a nome di ${cleanOwner}! Verifica ora la proprietà del tuo sito aziendale per abilitare le azioni live sul dominio.`
      );
    } finally {
      setIsPurchasing(false);
    }
  };

  const verifiedDomainLabel =
    businessProfile.verificationStatus === 'verificato' && businessProfile.verifiedDomain
      ? businessProfile.verifiedDomain
      : null;

  return (
    <div className="space-y-8">
      {/* 0. Client Business Identity + Website Verification + Active Owned Bot Plan */}
      <div className="bg-white rounded-xl border border-[#ccdcd2] shadow-sm p-6 space-y-6">
        {/* Editable Business Identity Header */}
        <div className="space-y-4 pb-5 border-b border-[#e5eee8]">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-2">
            <div>
              <div className="flex items-center gap-2 text-[11px] font-mono-brand uppercase tracking-wider text-[#263e34] font-semibold">
                <Building2 className="w-3.5 h-3.5" />
                <span>Il Tuo Spazio Business Privato · Intestazione a Nome Proprio</span>
              </div>
              <h3 className="font-serif-brand text-2xl font-semibold text-[#16221d] mt-0.5">
                {purchasedBots.length > 0
                  ? `I Tuoi Piani Bot Attivi (${purchasedBots.length})`
                  : 'Intesta il Piano a Nome Tuo, Verifica il Sito e Attiva i Bot'}
              </h3>
              <p className="text-xs text-[#5e776a] mt-1">
                Ogni licenza è registrata a tuo nome personale e opera esclusivamente sul sito aziendale di cui dimostri la proprietà.
              </p>
            </div>
          </div>

          {/* 4-field Business + Owner Identity Strip */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div>
              <label className="block text-[10px] font-semibold uppercase tracking-wider text-[#263e34] mb-1">
                Nome e Cognome Titolare *
              </label>
              <input
                type="text"
                value={businessProfile.ownerName}
                onChange={(e) => {
                  if (ownerError && e.target.value.trim().length >= 2) {
                    setOwnerError(null);
                  }
                  onUpdateBusinessProfile({ ...businessProfile, ownerName: e.target.value });
                }}
                data-testid="business-owner-input"
                placeholder="Es. Mario Rossi"
                className="w-full px-3 py-2 border border-[#ccdcd2] rounded-md text-xs bg-[#f7faf8] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#263e34]"
              />
            </div>
            <div>
              <label className="block text-[10px] font-semibold uppercase tracking-wider text-[#5e776a] mb-1">
                Nome Tua Azienda
              </label>
              <input
                type="text"
                value={businessProfile.companyName}
                onChange={(e) =>
                  onUpdateBusinessProfile({ ...businessProfile, companyName: e.target.value })
                }
                data-testid="business-company-input"
                placeholder="Es. Rossi Impianti S.r.l."
                className="w-full px-3 py-2 border border-[#ccdcd2] rounded-md text-xs bg-[#f7faf8] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#263e34]"
              />
            </div>
            <div>
              <label className="block text-[10px] font-semibold uppercase tracking-wider text-[#5e776a] mb-1">
                Settore Operativo
              </label>
              <input
                type="text"
                value={businessProfile.sector}
                onChange={(e) =>
                  onUpdateBusinessProfile({ ...businessProfile, sector: e.target.value })
                }
                placeholder="Es. Studi tecnici / E-commerce"
                className="w-full px-3 py-2 border border-[#ccdcd2] rounded-md text-xs bg-[#f7faf8] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#263e34]"
              />
            </div>
            <div>
              <label className="block text-[10px] font-semibold uppercase tracking-wider text-[#5e776a] mb-1">
                P.IVA (Opzionale)
              </label>
              <input
                type="text"
                value={businessProfile.vatNumber}
                onChange={(e) =>
                  onUpdateBusinessProfile({ ...businessProfile, vatNumber: e.target.value })
                }
                placeholder="IT01234567890"
                className="w-full px-3 py-2 border border-[#ccdcd2] rounded-md text-xs font-mono-brand bg-[#f7faf8] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#263e34]"
              />
            </div>
          </div>
        </div>

        {/* Real Domain Ownership Verification Panel */}
        <DomainVerificationCard
          businessProfile={businessProfile}
          onUpdateBusinessProfile={onUpdateBusinessProfile}
          challengeSignature={challengeSignature}
          onChallengeGenerated={onChallengeGenerated}
          onDomainVerified={onDomainVerified}
        />

        {/* Either Empty Onboarding State OR Active Purchased Plans */}
        {purchasedBots.length === 0 ? (
          <div
            data-testid="no-plan-onboarding-banner"
            className="rounded-xl border border-dashed border-[#8faea0] bg-[#f7faf8] p-6 flex flex-col md:flex-row md:items-center justify-between gap-5"
          >
            <div className="space-y-2 max-w-2xl">
              <div className="text-xs font-semibold uppercase tracking-wider text-[#263e34]">
                Nessun Piano Bot Ancora Attivato
              </div>
              <h4 className="font-serif-brand text-xl font-semibold text-[#16221d]">
                Acquista il piano adatto al tuo business e usalo subito per conto tuo
              </h4>
              <p className="text-xs text-[#465d50] leading-relaxed">
                1. Personalizza il Bot Unico 6-in-1 o scegli solo i dipendenti AI che ti servono qui sotto.{' '}
                2. Attiva il piano.{' '}
                3. Gestisci mercato, marketing, supporto clienti e contabilità aziendale direttamente dal tuo workspace privato.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 shrink-0">
              <button
                type="button"
                onClick={onJumpToPlans}
                className="px-4 py-2.5 rounded-md border border-[#ccdcd2] bg-white hover:border-[#263e34] text-xs font-medium text-[#263e34] transition-colors"
              >
                Confronta Piani
              </button>
              <a
                href="#configuratore-acquisto-bot"
                className="px-4 py-2.5 rounded-md bg-[#263e34] hover:bg-[#1a2d25] text-white text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5 transition-colors"
              >
                <span>Configura Ora</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {purchasedBots.map((bot) => {
              const isSelected = bot.id === activeBotId;
              const finishMeta =
                BOT_FINISH_PRESETS.find((f) => f.id === bot.finishId) || BOT_FINISH_PRESETS[0];

              return (
                <div
                  key={bot.id}
                  onClick={() => onSelectActiveBot(bot.id)}
                  className={`rounded-xl border p-5 transition-all cursor-pointer ${
                    isSelected
                      ? 'border-[#263e34] bg-[#f7faf8] ring-1 ring-[#263e34]/25'
                      : 'border-[#ccdcd2] bg-white hover:border-[#8faea0]'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div>
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span className="font-mono-brand text-[11px] font-bold px-2 py-0.5 rounded bg-[#263e34] text-white">
                          {bot.botCode}
                        </span>
                        <span className="text-[11px] font-medium text-[#263e34] bg-[#eef4f0] px-2 py-0.5 rounded">
                          {bot.bundleType === 'all_in_one'
                            ? 'Piano Completo 6-in-1'
                            : `Piano Modulare (${bot.selectedEmployees.length} reparti)`}
                        </span>
                        <span
                          className={`text-[11px] font-medium ${
                            bot.status === 'attivo' ? 'text-[#263e34]' : 'text-amber-800'
                          }`}
                        >
                          · {bot.status === 'attivo' ? 'Attivo nel tuo business' : 'In pausa'}
                        </span>
                      </div>
                      <h4 className="text-base font-semibold text-[#16221d]">{bot.name}</h4>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5 text-[11px] text-[#465d50]">
                        <span className="inline-flex items-center gap-1 font-medium text-[#16221d]">
                          <UserCheck className="w-3 h-3 text-[#263e34]" />
                          Intestato a: {bot.ownerFullName || businessProfile.ownerName || 'Da intestare'}
                        </span>
                        <span className="inline-flex items-center gap-1 font-mono-brand">
                          <Globe className="w-3 h-3 text-[#5e776a]" />
                          Sito:{' '}
                          {bot.boundDomain || verifiedDomainLabel ? (
                            <span className="text-[#263e34] font-semibold">
                              {bot.boundDomain || verifiedDomainLabel}
                            </span>
                          ) : (
                            <span className="text-[#7c3525]">Verifica sito richiesta</span>
                          )}
                        </span>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="font-mono-brand text-sm font-bold text-[#16221d]">
                        € {bot.priceEur}/mese
                      </div>
                      <div className="text-[10px] text-[#5e776a]">
                        {bot.billingCycle === 'annual' ? 'Piano Annuale' : 'Piano Mensile'}
                      </div>
                    </div>
                  </div>

                  {/* 6 Employee Chips */}
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {SIX_EMPLOYEES_CATALOG.map((emp) => {
                      const active = bot.selectedEmployees.includes(emp.id);
                      return (
                        <button
                          key={emp.id}
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onOpenCustomizer(bot, emp.id);
                          }}
                          className={`px-2 py-1 rounded text-[11px] border transition-colors ${
                            active
                              ? 'bg-white border-[#ccdcd2] text-[#16221d] hover:border-[#263e34]'
                              : 'bg-[#f4f7f5] border-[#e2eae5] text-[#8faea0] line-through'
                          }`}
                        >
                          0{emp.order} {emp.shortLabel}
                        </button>
                      );
                    })}
                  </div>

                  <div className="pt-3 border-t border-[#e2ece6] flex flex-wrap items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-2 text-[11px] text-[#5e776a]">
                      <span
                        className="w-3 h-3 rounded-full border border-[#16221d]/20 inline-block"
                        style={{ backgroundColor: finishMeta.swatchHex }}
                      />
                      <span>{finishMeta.label}</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectActiveBot(bot.id);
                          onJumpToConsole();
                        }}
                        className="px-2.5 py-1.5 rounded bg-[#eef4f0] hover:bg-[#dce9e1] text-[#263e34] text-[11px] font-semibold"
                      >
                        Usa Ora
                      </button>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenCustomizer(bot, 'emp-1');
                        }}
                        data-testid={`customize-bot-${bot.id}`}
                        className="px-2.5 py-1.5 rounded bg-[#263e34] hover:bg-[#1a2d25] text-white text-[11px] font-semibold flex items-center gap-1"
                      >
                        <SlidersHorizontal className="w-3.5 h-3.5" />
                        <span>Personalizza</span>
                      </button>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleBotStatus(bot);
                        }}
                        aria-label="Attiva o sospendi bot"
                        className="p-1.5 rounded border border-[#ccdcd2] bg-white text-[#5e776a] hover:text-[#16221d]"
                      >
                        {bot.status === 'attivo' ? (
                          <Pause className="w-3.5 h-3.5 text-amber-700" />
                        ) : (
                          <Play className="w-3.5 h-3.5 text-[#263e34]" />
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteBot(bot);
                        }}
                        aria-label="Rimuovi bot"
                        className="p-1.5 rounded border border-[#ccdcd2] bg-white text-[#5e776a] hover:text-red-700"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 2. Paid Custom Bot Configurator & Checkout */}
      <div
        id="configuratore-acquisto-bot"
        className="bg-white rounded-xl border border-[#ccdcd2] shadow-sm overflow-hidden"
      >
        <div className="px-6 py-5 bg-[#f7faf8] border-b border-[#ccdcd2] flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="text-[11px] font-mono-brand uppercase tracking-wider text-[#9e7d53] font-semibold">
              Acquista il Tuo Piano · Licenza d&apos;Uso Autonomo
            </div>
            <h3 className="font-serif-brand text-2xl sm:text-3xl font-semibold text-[#16221d]">
              Scegli un Bot Unico Completo o Componi il Tuo Piano Modulare
            </h3>
          </div>

          {/* Mode + Billing Controls */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex p-1 bg-white border border-[#ccdcd2] rounded-lg">
              <button
                type="button"
                onClick={() => handleSelectBundleMode('all_in_one')}
                data-testid="mode-all-in-one"
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                  bundleType === 'all_in_one'
                    ? 'bg-[#263e34] text-white'
                    : 'text-[#465d50] hover:text-[#16221d]'
                }`}
              >
                Bot Unico (6-in-1)
              </button>
              <button
                type="button"
                onClick={() => handleSelectBundleMode('modular')}
                data-testid="mode-modular"
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                  bundleType === 'modular'
                    ? 'bg-[#263e34] text-white'
                    : 'text-[#465d50] hover:text-[#16221d]'
                }`}
              >
                Componi Modulare
              </button>
            </div>

            <div className="inline-flex p-1 bg-white border border-[#ccdcd2] rounded-lg">
              <button
                type="button"
                onClick={() => setBillingCycle('monthly')}
                className={`px-3 py-1.5 rounded-md text-xs font-medium ${
                  billingCycle === 'monthly' ? 'bg-[#16221d] text-white' : 'text-[#5e776a]'
                }`}
              >
                Mensile
              </button>
              <button
                type="button"
                onClick={() => setBillingCycle('annual')}
                className={`px-3 py-1.5 rounded-md text-xs font-medium ${
                  billingCycle === 'annual' ? 'bg-[#16221d] text-white' : 'text-[#5e776a]'
                }`}
              >
                Annuale (-20%)
              </button>
            </div>
          </div>
        </div>

        <div className="p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left: 6 Employees Selector Cards */}
          <div className="lg:col-span-8 space-y-4">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold uppercase tracking-wider text-[#16221d]">
                I 6 Dipendenti AI che Lavorano per il Tuo Business
              </span>
              <span className="text-[#5e776a]">
                {bundleType === 'all_in_one'
                  ? 'Tutti e 6 inclusi nel Bot Unico aziendale'
                  : 'Clicca sui moduli da includere nel tuo piano'}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {SIX_EMPLOYEES_CATALOG.map((emp) => {
                const isIncluded = effectiveSelected.includes(emp.id);
                const unitPrice =
                  billingCycle === 'annual'
                    ? emp.annualMonthlyStandaloneEur
                    : emp.monthlyStandaloneEur;

                return (
                  <button
                    key={emp.id}
                    type="button"
                    onClick={() => handleToggleEmployeeSelection(emp.id)}
                    data-testid={`employee-card-${emp.id}`}
                    className={`text-left p-4 rounded-xl border transition-all flex flex-col justify-between gap-2 ${
                      isIncluded
                        ? 'border-[#263e34] bg-[#f7faf8] ring-1 ring-[#263e34]/20'
                        : 'border-[#ccdcd2] bg-white opacity-75 hover:opacity-100'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="font-mono-brand text-[10px] font-bold px-2 py-0.5 rounded bg-[#eef4f0] text-[#263e34]">
                          {emp.code} · {emp.shortLabel}
                        </span>
                        <span className="font-mono-brand text-xs font-semibold text-[#16221d]">
                          {bundleType === 'all_in_one' ? 'Incluso' : `€ ${unitPrice}/m`}
                        </span>
                      </div>
                      <div className="font-semibold text-sm text-[#16221d]">{emp.roleTitle}</div>
                      <p className="text-[11px] text-[#5e776a] leading-relaxed mt-1">
                        {emp.subtitle}
                      </p>
                    </div>

                    <div className="pt-2 border-t border-[#e2ece6] flex items-center justify-between text-[10px] text-[#465d50]">
                      <span className="truncate">{emp.connectors.slice(0, 3).join(' · ')}</span>
                      <span
                        className={`font-semibold flex items-center gap-1 shrink-0 ${
                          isIncluded ? 'text-[#263e34]' : 'text-[#8faea0]'
                        }`}
                      >
                        {isIncluded && <Check className="w-3 h-3" />}
                        {isIncluded ? 'Selezionato' : 'Aggiungi'}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right: Live Customization & Paid Order Summary */}
          <div className="lg:col-span-4 flex flex-col justify-between bg-[#f7faf8] rounded-xl border border-[#ccdcd2] p-5 space-y-5 text-xs">
            <div className="space-y-4">
              <div className="font-serif-brand text-xl font-semibold text-[#16221d]">
                Riepilogo Piano &amp; Attivazione
              </div>

              <div>
                <label className="block text-[11px] font-medium text-[#465d50] mb-1">
                  Nome del Tuo Bot / Piano Aziendale
                </label>
                <input
                  type="text"
                  value={botName}
                  onChange={(e) => {
                    setBotNameDirty(true);
                    setBotName(e.target.value);
                  }}
                  className="w-full px-3 py-2 border border-[#ccdcd2] rounded-md text-xs bg-white focus:outline-none focus:ring-1 focus:ring-[#263e34]"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[11px] font-medium text-[#465d50] mb-1">
                    Stile Atelier
                  </label>
                  <select
                    value={finishId}
                    onChange={(e) => setFinishId(e.target.value as BotFinishId)}
                    className="w-full px-2.5 py-2 border border-[#ccdcd2] rounded-md text-xs bg-white"
                  >
                    {BOT_FINISH_PRESETS.map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-[#465d50] mb-1">
                    Autonomia
                  </label>
                  <select
                    value={autonomyLevel}
                    onChange={(e) => setAutonomyLevel(e.target.value as AutonomyLevel)}
                    className="w-full px-2.5 py-2 border border-[#ccdcd2] rounded-md text-xs bg-white"
                  >
                    <option value="supervisionato">Supervisionato</option>
                    <option value="semi-autonomo">Semi-Autonomo</option>
                    <option value="piena-autonomia">Piena Autonomia</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-[#465d50] mb-1">
                  Direttive per il Tuo Business
                </label>
                <textarea
                  rows={2}
                  value={customDirectives}
                  onChange={(e) => setCustomDirectives(e.target.value)}
                  className="w-full px-3 py-2 border border-[#ccdcd2] rounded-md text-xs bg-white focus:outline-none focus:ring-1 focus:ring-[#263e34]"
                />
              </div>

              {/* Price & Ownership Breakdown */}
              <div className="p-4 rounded-lg bg-white border border-[#ccdcd2] space-y-2">
                <div className="flex justify-between gap-2">
                  <span className="text-[#5e776a]">Intestato a:</span>
                  <span className="font-semibold text-[#16221d] truncate">
                    {businessProfile.ownerName.trim() || 'Inserisci Nome e Cognome'}
                  </span>
                </div>
                <div className="flex justify-between gap-2">
                  <span className="text-[#5e776a]">Sito autorizzato:</span>
                  <span
                    className={`font-mono-brand font-semibold truncate ${
                      verifiedDomainLabel ? 'text-[#263e34]' : 'text-[#7c3525]'
                    }`}
                  >
                    {verifiedDomainLabel || 'Verifica richiesta'}
                  </span>
                </div>
                <div className="pt-2 border-t border-[#e2ece6] flex justify-between">
                  <span className="text-[#5e776a]">Dipendenti inclusi:</span>
                  <span className="font-mono-brand font-semibold text-[#16221d]">
                    {pricing.effectiveEmployeeCount} su 6
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#5e776a]">Canone mensile equivalente:</span>
                  <span className="font-mono-brand font-semibold text-[#263e34]">
                    € {pricing.monthlyUnitEur}/mese
                  </span>
                </div>
                {pricing.bundleSavingsMonthlyEur > 0 && (
                  <div className="flex justify-between text-[#263e34] font-medium">
                    <span>Risparmio pacchetto:</span>
                    <span className="font-mono-brand">-€ {pricing.bundleSavingsMonthlyEur}/mese</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-[#5e776a]">
                    Imponibile ({billingCycle === 'annual' ? '12 mesi' : '1 mese'}):
                  </span>
                  <span className="font-mono-brand text-[#16221d]">
                    € {pricing.totalBilledTodayEur.toLocaleString('it-IT')}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#5e776a]">IVA 22%:</span>
                  <span className="font-mono-brand text-[#5e776a]">
                    € {pricing.vatAmountEur.toLocaleString('it-IT')}
                  </span>
                </div>
                <div className="pt-2 border-t border-[#e2ece6] flex justify-between text-sm font-bold text-[#16221d]">
                  <span>Totale Ordine:</span>
                  <span className="font-mono-brand text-[#263e34]" data-testid="order-total-eur">
                    € {pricing.totalWithVatEur.toLocaleString('it-IT')}
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              {ownerError && (
                <div
                  data-testid="owner-required-error"
                  className="p-3 rounded-lg bg-[#fdf2f0] border border-[#c48d7a]/60 text-[#7c3525] font-medium text-[11px] flex items-start gap-2"
                >
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-[#9a3d29]" />
                  <span>{ownerError}</span>
                </div>
              )}

              {purchaseFeedback && (
                <div
                  data-testid="purchase-success-banner"
                  className="p-3 rounded-lg bg-[#eef4f0] border border-[#263e34]/30 text-[#263e34] font-medium text-[11px] flex items-start gap-2"
                >
                  <Sparkles className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{purchaseFeedback}</span>
                </div>
              )}

              <button
                type="button"
                onClick={handleCheckout}
                disabled={isPurchasing || effectiveSelected.length === 0}
                data-testid="confirm-purchase-bot-btn"
                className="w-full py-3 px-4 bg-[#263e34] hover:bg-[#1a2d25] disabled:opacity-50 text-white rounded-lg text-xs font-semibold uppercase tracking-wider flex items-center justify-center gap-2 shadow-sm transition-colors"
              >
                {isPurchasing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Attivazione piano in corso...</span>
                  </>
                ) : (
                  <>
                    <CreditCard className="w-4 h-4" />
                    <span>Acquista Piano &amp; Usa Ora</span>
                  </>
                )}
              </button>

              <div className="flex items-center gap-1.5 text-[11px] text-[#5e776a] justify-center">
                <ShieldCheck className="w-3.5 h-3.5 text-[#263e34]" />
                <span>Intestato a nome proprio &amp; Fattura SDI inclusa</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
