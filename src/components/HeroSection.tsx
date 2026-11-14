import React from 'react';
import { ArrowRight } from 'lucide-react';
import { BusinessProfile, PurchasedBotConfig } from '../types/index.ts';

interface HeroSectionProps {
  businessProfile: BusinessProfile;
  activePurchasedBot?: PurchasedBotConfig;
  onStartBuilder: () => void;
  onExplorePlans: () => void;
  onOpenFinanza?: () => void;
  onJumpToConsole?: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  businessProfile,
  activePurchasedBot,
  onStartBuilder,
  onExplorePlans,
  onOpenFinanza,
  onJumpToConsole,
}) => {
  const companyLabel = businessProfile.companyName.trim() || 'La Mia Azienda';
  const ownerLabel = businessProfile.ownerName.trim();
  const verifiedDomain =
    businessProfile.verificationStatus === 'verificato'
      ? businessProfile.verifiedDomain.trim()
      : '';
  const hasPlan = Boolean(activePurchasedBot);

  return (
    <section className="relative overflow-hidden pt-12 pb-16 border-b border-[#ccdcd2] bg-gradient-to-b from-[#eef4f0]/65 via-[#f4f8f5]/45 to-[#eef4f0]/65">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Main Editorial Presentation */}
          <div className="lg:col-span-7 flex flex-col justify-center">
            <div className="flex items-center gap-2 text-xs font-medium tracking-widest text-[#5e776a] uppercase mb-4">
              <span>Piattaforma Self-Service</span>
              <span aria-hidden="true">·</span>
              <span>Bot Intestati a Nome Proprio</span>
            </div>

            <h1 className="font-serif-brand text-4xl sm:text-5xl lg:text-6xl font-medium tracking-tight text-[#16221d] leading-[1.1] mb-6 [text-wrap:balance]">
              Acquista il tuo piano di bot e gestisci il tuo sito aziendale in piena autonomia.
            </h1>

            <p className="text-base sm:text-lg text-[#3d5447] font-normal leading-relaxed mb-8 max-w-2xl">
              Ogni bot è intestato a tuo nome, collegato al sito della tua impresa dopo verifica reale di proprietà (DNS TXT, Meta Tag o .well-known) e lavora in automatico su clienti, vendite e contabilità.
            </p>

            {/* CTAs adhering to hierarchy */}
            <div className="flex flex-wrap items-center gap-3 mb-10">
              {hasPlan && onJumpToConsole ? (
                <button
                  onClick={onJumpToConsole}
                  className="px-6 py-3.5 text-xs sm:text-sm font-semibold tracking-wider uppercase text-[#f7faf8] bg-[#263e34] hover:bg-[#1a2d25] rounded-md transition-all shadow-sm flex items-center gap-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#263e34]"
                >
                  Usa il Tuo Workspace Attivo
                  <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  onClick={onStartBuilder}
                  className="px-6 py-3.5 text-xs sm:text-sm font-semibold tracking-wider uppercase text-[#f7faf8] bg-[#263e34] hover:bg-[#1a2d25] rounded-md transition-all shadow-sm flex items-center gap-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#263e34]"
                >
                  Scegli &amp; Acquista il Tuo Piano
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}

              {onOpenFinanza && (
                <button
                  onClick={onOpenFinanza}
                  className="px-5 py-3.5 text-xs sm:text-sm font-medium text-[#263e34] hover:text-[#16221d] border border-[#263e34]/30 hover:border-[#263e34] bg-white/80 rounded-md transition-colors"
                >
                  Finanza del Tuo Business
                </button>
              )}

              <button
                onClick={onExplorePlans}
                className="px-5 py-3.5 text-xs sm:text-sm font-medium text-[#5e776a] hover:text-[#16221d] border border-[#ccdcd2] hover:border-[#8faea0] bg-white/50 rounded-md transition-colors"
              >
                Piani e Tariffe
              </button>
            </div>

            {/* Adjacent Trust Badges & Gestionali */}
            <div className="pt-6 border-t border-[#ccdcd2]/70 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6 text-xs text-[#5e776a]">
              <span className="font-semibold text-[#263e34] uppercase tracking-wider text-[11px]">
                Collegabile ai tuoi software:
              </span>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 font-mono-brand text-[12px] text-[#2c3b33]">
                <span>Zucchetti Omnia</span>
                <span>/</span>
                <span>SAP S/4HANA</span>
                <span>/</span>
                <span>TeamSystem</span>
                <span>/</span>
                <span>Salesforce</span>
                <span>/</span>
                <span>Fatture in Cloud</span>
              </div>
            </div>
          </div>

          {/* Right Column: Client Private Workspace Status Card */}
          <div className="lg:col-span-5">
            <div className="bg-white rounded-xl border border-[#ccdcd2] shadow-sm p-6 sm:p-7 relative">
              <div className="flex items-center justify-between pb-4 border-b border-[#e5eee8] mb-5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-[#eef4f0] border border-[#ccdcd2] flex items-center justify-center text-[#263e34] font-serif-brand font-bold text-lg">
                    {companyLabel.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h2 className="text-sm font-semibold text-[#16221d]">
                      Workspace · {companyLabel}
                    </h2>
                    <p className="text-xs text-[#5e776a]">
                      {ownerLabel
                        ? `Intestato a: ${ownerLabel}`
                        : hasPlan
                          ? `Licenza attiva · ${activePurchasedBot!.botCode}`
                          : 'Da intestare a nome proprio'}
                    </p>
                  </div>
                </div>
                <span
                  className={`text-xs font-mono-brand px-2.5 py-1 rounded ${
                    hasPlan
                      ? 'text-[#263e34] bg-[#eef4f0] font-semibold'
                      : 'text-[#9e7d53] bg-[#f8f5ef]'
                  }`}
                >
                  {hasPlan ? 'Piano Attivo' : 'Da Attivare'}
                </span>
              </div>

              <div className="space-y-4">
                <div className="p-4 rounded-lg bg-[#f7faf8] border border-[#ccdcd2]/70">
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="font-semibold text-[#16221d]">
                      {hasPlan ? activePurchasedBot!.name : '1. Intesta & Acquista il Tuo Piano Bot'}
                    </span>
                    <span className="text-[#5e776a] font-mono-brand">
                      {hasPlan
                        ? `${activePurchasedBot!.selectedEmployees.length}/6 moduli`
                        : 'Da € 36/mese'}
                    </span>
                  </div>
                  <p className="text-xs text-[#465d50] mb-3">
                    {hasPlan
                      ? activePurchasedBot!.customDirectives
                      : 'Scegli il Bot Unico 6-in-1 o seleziona solo i reparti utili alla tua impresa, intestati a tuo nome.'}
                  </p>
                  <div className="flex items-center justify-between text-[11px] text-[#5e776a] pt-2 border-t border-[#e2ece5]">
                    <span>
                      Autonomia: {hasPlan ? activePurchasedBot!.autonomyLevel : 'Configurabile'}
                    </span>
                    <span className="font-mono-brand text-[#263e34] font-medium">
                      {hasPlan ? `€ ${activePurchasedBot!.priceEur}/mese` : 'Fattura SDI inclusa'}
                    </span>
                  </div>
                </div>

                <div className="p-4 rounded-lg bg-[#f7faf8] border border-[#ccdcd2]/70">
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="font-semibold text-[#16221d]">
                      2. Sito Aziendale &amp; Sicurezza Anti-Abuso
                    </span>
                    <span
                      className={`font-mono-brand text-[11px] ${
                        verifiedDomain ? 'text-[#263e34] font-semibold' : 'text-[#7c3525]'
                      }`}
                    >
                      {verifiedDomain ? 'DOMINIO VERIFICATO' : 'VERIFICA RICHIESTA'}
                    </span>
                  </div>
                  <p className="text-xs text-[#465d50] mb-3">
                    {verifiedDomain
                      ? `I bot operano in autonomia sul tuo sito verificato (${verifiedDomain}) con controlli anti-spoofing attivi.`
                      : 'Collega il sito della tua impresa con record DNS TXT, Meta Tag o .well-known: i bot agiscono solo su domini realmente tuoi.'}
                  </p>
                  <div className="flex items-center justify-between text-[11px] text-[#5e776a] pt-2 border-t border-[#e2ece5]">
                    <span>Sito Aziendale:</span>
                    <span
                      className={`font-mono-brand font-medium ${
                        verifiedDomain ? 'text-[#263e34]' : 'text-[#7c3525]'
                      }`}
                    >
                      {verifiedDomain || 'Verifica proprietà richiesta'}
                    </span>
                  </div>
                </div>

                {/* Instant KPI Micro-Strip */}
                <div className="pt-2 grid grid-cols-3 gap-2 text-center">
                  <div className="p-2.5 rounded bg-[#eef4f0]">
                    <div className="font-mono-brand text-base font-semibold text-[#16221d]">
                      {hasPlan ? `${activePurchasedBot!.selectedEmployees.length}/6` : '6'}
                    </div>
                    <div className="text-[10px] text-[#5e776a]">Dipendenti AI</div>
                  </div>
                  <div className="p-2.5 rounded bg-[#eef4f0]">
                    <div className="font-mono-brand text-base font-semibold text-[#16221d]">4</div>
                    <div className="text-[10px] text-[#5e776a]">Regole Titolare</div>
                  </div>
                  <div className="p-2.5 rounded bg-[#eef4f0]">
                    <div className="font-mono-brand text-base font-semibold text-[#263e34]">0 Righe</div>
                    <div className="text-[10px] text-[#5e776a]">Codice scritto</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
