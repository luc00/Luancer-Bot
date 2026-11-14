import React, { useState } from 'react';
import { PricingPlan } from '../types/index.ts';
import { PRICING_PLANS, calculatePlanPricing } from '../utils/botEngine.ts';
import { 
  Check, 
  ArrowRight, 
  ShieldCheck, 
  Sparkles, 
  CreditCard, 
  Receipt, 
  HelpCircle,
  FileCheck,
  X
} from 'lucide-react';

interface PricingSectionProps {
  currentPlanId: string | null;
  companyName: string;
  onSelectPlan: (plan: PricingPlan, billingCycle: 'monthly' | 'annual', monthlyEur: number) => Promise<void> | void;
  onGoToWorkspace: () => void;
}

export const PricingSection: React.FC<PricingSectionProps> = ({
  currentPlanId,
  companyName,
  onSelectPlan,
  onGoToWorkspace,
}) => {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('annual');
  const [selectedPlanForCheckout, setSelectedPlanForCheckout] = useState<PricingPlan | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [checkoutComplete, setCheckoutComplete] = useState(false);

  const handleOpenCheckout = (plan: PricingPlan) => {
    setSelectedPlanForCheckout(plan);
    setCheckoutComplete(false);
  };

  const handleConfirmSubscription = async () => {
    if (!selectedPlanForCheckout || isProcessing) return;
    setIsProcessing(true);

    const monthlyEur =
      selectedPlanForCheckout.id === 'su_misura'
        ? 0
        : billingCycle === 'annual'
          ? selectedPlanForCheckout.annualMonthlyPrice
          : selectedPlanForCheckout.monthlyPrice;

    try {
      await onSelectPlan(selectedPlanForCheckout, billingCycle, monthlyEur);
      setCheckoutComplete(true);
      setTimeout(() => {
        setSelectedPlanForCheckout(null);
        setCheckoutComplete(false);
        onGoToWorkspace();
      }, 900);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <section className="py-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto mb-10">
        <div className="text-xs font-semibold tracking-widest text-[#5e776a] uppercase mb-2">
          Investimento Scalabile &amp; Trasparente
        </div>
        <h2 className="font-serif-brand text-3xl sm:text-4xl lg:text-5xl font-semibold text-[#16221d] mb-4">
          Piani di Abbonamento per Ogni Dimensione d'Impresa
        </h2>
        <p className="text-sm sm:text-base text-[#465d50] leading-relaxed">
          Nessun costo nascosto. Attiva i bot autonomi di cui necessiti con canone mensile flessibile o canone annuale con sconto riservato del 20%.
        </p>

        {/* Cadence Switcher adhering to anti-slop */}
        <div className="mt-8 inline-flex items-center gap-2 p-1.5 bg-white border border-[#ccdcd2] rounded-lg shadow-sm">
          <button
            onClick={() => setBillingCycle('monthly')}
            className={`px-4 py-2 text-xs font-semibold rounded-md transition-colors ${
              billingCycle === 'monthly'
                ? 'bg-[#263e34] text-white shadow-sm'
                : 'text-[#5e776a] hover:text-[#16221d]'
            }`}
          >
            Fatturazione Mensile
          </button>
          
          <button
            onClick={() => setBillingCycle('annual')}
            className={`px-4 py-2 text-xs font-semibold rounded-md transition-colors flex items-center gap-1.5 ${
              billingCycle === 'annual'
                ? 'bg-[#263e34] text-white shadow-sm'
                : 'text-[#5e776a] hover:text-[#16221d]'
            }`}
          >
            <span>Fatturazione Annuale</span>
            <span className="text-[10px] bg-[#eef4f0] text-[#263e34] font-mono-brand px-1.5 py-0.5 rounded font-bold">
              -20% Sconto
            </span>
          </button>
        </div>
      </div>

      {/* Tier Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16 items-stretch">
        {PRICING_PLANS.map(plan => {
          const pricing = calculatePlanPricing(plan, billingCycle);
          const isCurrent = currentPlanId === plan.id;
          const isCustom = plan.id === 'su_misura';

          return (
            <div
              key={plan.id}
              className={`bg-white rounded-xl border p-6 flex flex-col justify-between transition-all duration-200 relative ${
                plan.isPopular
                  ? 'border-[#263e34] shadow-md ring-1 ring-[#263e34]/20'
                  : 'border-[#ccdcd2] shadow-sm hover:shadow'
              }`}
            >
              {plan.isPopular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#263e34] text-[#f7faf8] text-[10px] font-semibold tracking-widest uppercase px-3 py-0.5 rounded shadow-sm">
                  Più Scelto dalle Imprese
                </div>
              )}

              <div>
                <div className="text-xs font-mono-brand text-[#5e776a] uppercase tracking-wider mb-1">
                  {plan.targetAudience}
                </div>
                
                <h3 className="font-serif-brand text-2xl font-bold text-[#16221d] mb-2">
                  {plan.name}
                </h3>

                <p className="text-xs text-[#5e776a] mb-6 leading-relaxed min-h-[36px]">
                  {plan.tagline}
                </p>

                {/* Price Display */}
                <div className="mb-6 pb-6 border-b border-[#ccdcd2]/60">
                  {isCustom ? (
                    <div>
                      <div className="font-serif-brand text-3xl font-semibold text-[#16221d]">
                        Su Progetto
                      </div>
                      <div className="text-xs text-[#5e776a] mt-1">
                        Preventivo sartoriale
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div className="flex items-baseline gap-1">
                        <span className="text-xs font-medium text-[#5e776a]">€</span>
                        <span className="font-mono-brand text-4xl font-bold text-[#16221d]">
                          {pricing.monthlyRate}
                        </span>
                        <span className="text-xs text-[#5e776a]">/ mese</span>
                      </div>

                      {billingCycle === 'annual' ? (
                        <div className="text-[11px] text-[#263e34] font-medium mt-1 font-mono-brand">
                          Fatturato annualmente (€{pricing.totalAnnualBilled}/anno) · Risparmi €{pricing.annualSavingsEur}
                        </div>
                      ) : (
                        <div className="text-[11px] text-[#5e776a] mt-1">
                          Fatturato mese per mese, disdici quando vuoi
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Feature Bullet List */}
                <div className="space-y-3 text-xs mb-8">
                  <div className="font-semibold text-[#16221d] text-[11px] uppercase tracking-wider">
                    Inclusioni del piano:
                  </div>

                  <div className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-[#263e34] shrink-0 mt-0.5" />
                    <span className="text-[#2c3b33] font-medium">{plan.features.activeBots}</span>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-[#263e34] shrink-0 mt-0.5" />
                    <span className="text-[#465d50]">{plan.features.autonomousCalls}</span>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-[#263e34] shrink-0 mt-0.5" />
                    <span className="text-[#465d50]">{plan.features.erpIntegrations}</span>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-[#263e34] shrink-0 mt-0.5" />
                    <span className="text-[#465d50]">{plan.features.reporting}</span>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-[#263e34] shrink-0 mt-0.5" />
                    <span className="text-[#465d50]">{plan.features.support}</span>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-[#263e34] shrink-0 mt-0.5" />
                    <span className="text-[#465d50]">{plan.features.customRules}</span>
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <div>
                {isCurrent ? (
                  <div className="w-full py-2.5 text-center bg-[#eef4f0] border border-[#ccdcd2] text-[#263e34] font-semibold text-xs rounded-md">
                    Piano Attualmente Attivo
                  </div>
                ) : (
                  <button
                    onClick={() => handleOpenCheckout(plan)}
                    className={`w-full py-2.5 px-4 text-xs font-semibold tracking-wider uppercase rounded-md transition-all ${
                      plan.isPopular
                        ? 'bg-[#263e34] hover:bg-[#1a2d25] text-white shadow-sm'
                        : 'bg-[#f7faf8] hover:bg-[#eef4f0] text-[#16221d] border border-[#ccdcd2]'
                    }`}
                  >
                    {isCustom ? 'Richiedi Consulenza' : 'Seleziona Piano'}
                  </button>
                )}
              </div>

            </div>
          );
        })}
      </div>

      {/* Concrete Feature Comparison Matrix */}
      <div className="bg-white rounded-xl border border-[#ccdcd2] shadow-sm p-6 sm:p-8">
        <h3 className="font-serif-brand text-2xl font-semibold text-[#16221d] mb-4">
          Matrice di Confronto Dettagliata
        </h3>
        <p className="text-xs text-[#5e776a] mb-6">
          Specifiche tecniche e limiti operativi per garantire scalabilità e continuità aziendale.
        </p>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-[#ccdcd2] text-[#5e776a]">
                <th className="py-3 pr-4 font-semibold">Caratteristica / Limite</th>
                <th className="py-3 px-3 font-semibold">Artigiano</th>
                <th className="py-3 px-3 font-semibold text-[#263e34]">Atelier (PMI)</th>
                <th className="py-3 px-3 font-semibold">Corporate</th>
                <th className="py-3 pl-3 font-semibold">Bespoke</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f0f4f1] text-[#2c3b33]">
              <tr>
                <td className="py-3 pr-4 font-medium">Numero Bot Autonomi contemporanei</td>
                <td className="py-3 px-3 font-mono-brand">Fino a 3</td>
                <td className="py-3 px-3 font-mono-brand font-semibold text-[#263e34]">Fino a 10</td>
                <td className="py-3 px-3 font-mono-brand">Fino a 30</td>
                <td className="py-3 pl-3 font-mono-brand">Illimitati</td>
              </tr>
              <tr>
                <td className="py-3 pr-4 font-medium">Chiamate ed esecuzioni mensili</td>
                <td className="py-3 px-3 font-mono-brand">2.500 / mese</td>
                <td className="py-3 px-3 font-mono-brand font-semibold text-[#263e34]">15.000 / mese</td>
                <td className="py-3 px-3 font-mono-brand">60.000 / mese</td>
                <td className="py-3 pl-3 font-mono-brand">Su misura</td>
              </tr>
              <tr>
                <td className="py-3 pr-4 font-medium">Connessione ERP / CRM certificata</td>
                <td className="py-3 px-3">1 Software</td>
                <td className="py-3 px-3 font-semibold text-[#263e34]">Fino a 4 Software</td>
                <td className="py-3 px-3">Illimitati</td>
                <td className="py-3 pl-3">Connettori Custom AS400</td>
              </tr>
              <tr>
                <td className="py-3 pr-4 font-medium">Frequenza Generazione Reportistica</td>
                <td className="py-3 px-3">Settimanale</td>
                <td className="py-3 px-3 font-semibold text-[#263e34]">In Tempo Reale (Live BI)</td>
                <td className="py-3 px-3">In Tempo Reale + API</td>
                <td className="py-3 pl-3">Dossier predittivi c-level</td>
              </tr>
              <tr>
                <td className="py-3 pr-4 font-medium">Garanzia SLA Tempi di Risposta</td>
                <td className="py-3 px-3">24 ore</td>
                <td className="py-3 px-3 font-semibold text-[#263e34]">4 ore</td>
                <td className="py-3 px-3">2 ore garantite</td>
                <td className="py-3 pl-3">15 minuti / H24 dedicato</td>
              </tr>
              <tr>
                <td className="py-3 pr-4 font-medium">Audit Log &amp; Crittografia Bancaria</td>
                <td className="py-3 px-3">Standard TLS</td>
                <td className="py-3 px-3 font-semibold text-[#263e34]">Audit 90 Giorni</td>
                <td className="py-3 px-3">Audit Illimitato + ISO 27001</td>
                <td className="py-3 pl-3">Cloud Sovrano / On-Premise</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Checkout / Subscription Simulation Modal */}
      {selectedPlanForCheckout && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#16221d]/60 backdrop-blur-sm">
          <div className="bg-white rounded-xl border border-[#ccdcd2] shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in duration-200">
            
            <div className="px-6 py-4 border-b border-[#ccdcd2] bg-[#f7faf8] flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-mono-brand text-[#5e776a]">
                  Attivazione Piano · {companyName || 'La Mia Azienda'}
                </span>
                <h3 className="font-serif-brand text-xl font-semibold text-[#16221d]">
                  Piano {selectedPlanForCheckout.name}
                </h3>
              </div>
              <button
                onClick={() => setSelectedPlanForCheckout(null)}
                className="p-1 text-[#5e776a] hover:text-[#16221d] rounded"
                aria-label="Chiudi riepilogo abbonamento"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5 text-xs">
              
              {/* Billing Calculation Breakdown */}
              {selectedPlanForCheckout.id === 'su_misura' ? (
                <div className="p-4 bg-[#eef4f0] rounded-lg border border-[#ccdcd2] text-[#2c3b33] leading-relaxed">
                  <div className="font-semibold text-[#263e34] mb-1">
                    Richiesta Atelier Bespoke Enterprise
                  </div>
                  Un ingegnere di processo Luancer &amp; Co. vi contatterà entro 2 ore per calibrare l'infrastruttura, dimensionare le GPU dedicate ed effettuare l'analisi preliminare dei vostri gestionali.
                </div>
              ) : (
                <div className="p-4 bg-[#f7faf8] rounded-lg border border-[#ccdcd2] space-y-2.5">
                  <div className="flex justify-between text-xs">
                    <span className="text-[#5e776a]">Cadenza Selezionata:</span>
                    <span className="font-semibold text-[#16221d] capitalize">
                      {billingCycle === 'annual' ? 'Annuale (-20% applicato)' : 'Mensile'}
                    </span>
                  </div>

                  <div className="flex justify-between text-xs">
                    <span className="text-[#5e776a]">Imponibile canone:</span>
                    <span className="font-mono-brand font-medium text-[#16221d]">
                      € {billingCycle === 'annual' 
                        ? (selectedPlanForCheckout.annualMonthlyPrice * 12).toLocaleString('it-IT') 
                        : selectedPlanForCheckout.monthlyPrice.toLocaleString('it-IT')}
                    </span>
                  </div>

                  <div className="flex justify-between text-xs">
                    <span className="text-[#5e776a]">IVA (22% per imprese UE):</span>
                    <span className="font-mono-brand text-[#5e776a]">
                      € {billingCycle === 'annual'
                        ? Math.round(selectedPlanForCheckout.annualMonthlyPrice * 12 * 0.22).toLocaleString('it-IT')
                        : Math.round(selectedPlanForCheckout.monthlyPrice * 0.22).toLocaleString('it-IT')}
                    </span>
                  </div>

                  <div className="pt-2 border-t border-[#ccdcd2] flex justify-between text-sm font-semibold text-[#16221d]">
                    <span>Totale da Liquidare:</span>
                    <span className="font-mono-brand text-[#263e34]">
                      € {billingCycle === 'annual'
                        ? Math.round(selectedPlanForCheckout.annualMonthlyPrice * 12 * 1.22).toLocaleString('it-IT')
                        : Math.round(selectedPlanForCheckout.monthlyPrice * 1.22).toLocaleString('it-IT')}
                    </span>
                  </div>
                </div>
              )}

              {/* Guarantees */}
              <div className="space-y-1.5 text-[11px] text-[#5e776a]">
                <div className="flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#263e34]" />
                  <span>Fatturazione elettronica immediata con codice destinatario SDI</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Receipt className="w-3.5 h-3.5 text-[#263e34]" />
                  <span>Garanzia soddisfatti o rimborsati di 30 giorni inclusa</span>
                </div>
              </div>

              {checkoutComplete && (
                <div className="p-3 bg-[#eef4f0] text-[#263e34] rounded-lg font-medium flex items-center gap-2">
                  <Check className="w-4 h-4 text-[#263e34]" />
                  <span>Piano attivato! Apertura del tuo workspace aziendale...</span>
                </div>
              )}

            </div>

            <div className="px-6 py-4 border-t border-[#ccdcd2] bg-[#f7faf8] flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setSelectedPlanForCheckout(null)}
                className="px-4 py-2 border border-[#ccdcd2] text-[#465d50] hover:text-[#16221d] rounded-md text-xs font-medium"
              >
                Annulla
              </button>
              
              <button
                type="button"
                onClick={handleConfirmSubscription}
                disabled={isProcessing || checkoutComplete}
                className="px-5 py-2 bg-[#263e34] hover:bg-[#1a2d25] disabled:opacity-50 text-white rounded-md text-xs font-semibold tracking-wider uppercase transition-colors"
              >
                {isProcessing ? 'Elaborazione in corso...' : 'Conferma & Attiva'}
              </button>
            </div>

          </div>
        </div>
      )}

    </section>
  );
};
