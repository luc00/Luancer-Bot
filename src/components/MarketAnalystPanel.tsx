import React, { useEffect, useState } from 'react';
import { BusinessProfile, MarketResearchResult } from '../types/index.ts';
import { Search, Globe, ExternalLink, Loader2, ArrowRight, Check } from 'lucide-react';
import { parseJsonResponse } from '../utils/http.ts';

interface MarketAnalystPanelProps {
  businessProfile?: BusinessProfile;
  onApplyInsightsToBot: (result: MarketResearchResult) => void;
}

const QUICK_SECTORS = [
  {
    sector: 'Studi di Architettura & Ingegneria PMI',
    idea: 'Automazione preventivi, fatturazione elettronica e gestione clienti per studi tecnici italiani',
    focus: 'competitor software gestionali, prezzi mensili e bisogni scoperti',
  },
  {
    sector: 'Manifattura Meccanica & Subfornitura',
    idea: 'Bot collegato a Zucchetti e SAP per solleciti incassi, ordini fornitori e margini per commessa',
    focus: 'player software industriali Italia, ROI automazione amministrativa',
  },
  {
    sector: 'Cliniche Mediche & Odontoiatriche Private',
    idea: 'Customer care 24/7 su Telegram/WhatsApp, promemoria fatture e agenda appuntamenti',
    focus: 'posizionamento competitor e angoli di differenziazione',
  },
];

export const MarketAnalystPanel: React.FC<MarketAnalystPanelProps> = ({
  businessProfile,
  onApplyInsightsToBot,
}) => {
  const [sector, setSector] = useState(
    businessProfile?.sector || 'Studi professionali e PMI manifatturiere in Italia'
  );
  const [companyIdea, setCompanyIdea] = useState('');
  const [focus, setFocus] = useState('competitor principali, fasce di prezzo e 3 segmenti scoperti');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [result, setResult] = useState<MarketResearchResult | null>(null);
  const [appliedBanner, setAppliedBanner] = useState(false);

  useEffect(() => {
    if (businessProfile?.sector && businessProfile.sector.trim().length > 2) {
      setSector(businessProfile.sector);
    }
  }, [businessProfile?.sector]);

  const handleRunResearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sector.trim() || isLoading) return;

    setIsLoading(true);
    setErrorMessage(null);
    setAppliedBanner(false);

    try {
      const res = await fetch('/api/market-research', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sector: sector.trim(),
          companyIdea: companyIdea.trim(),
          focus: focus.trim(),
        }),
      });

      const data = await parseJsonResponse<MarketResearchResult & { error?: string }>(res);
      if (!res.ok) {
        throw new Error(data.error || 'Impossibile completare la ricerca di mercato.');
      }

      setResult(data as MarketResearchResult);
    } catch (err: unknown) {
      setErrorMessage(
        err instanceof Error ? err.message : 'Errore imprevisto durante la ricerca live.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleApply = () => {
    if (!result) return;
    onApplyInsightsToBot(result);
    setAppliedBanner(true);
  };

  return (
    <div className="bg-white rounded-xl border border-[#ccdcd2] shadow-sm overflow-hidden">
      <div className="px-6 py-4 bg-[#f7faf8] border-b border-[#ccdcd2] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-[11px] font-mono-brand uppercase tracking-wider text-[#263e34] font-semibold">
            <Globe className="w-3.5 h-3.5" />
            <span>Dipendente 01 · Analista di Mercato Live (Google Search Grounding)</span>
          </div>
          <h3 className="font-serif-brand text-xl font-semibold text-[#16221d] mt-0.5">
            Analisi Competitor &amp; Posizionamento per {businessProfile?.companyName || 'la Tua Azienda'}
          </h3>
        </div>
        <span className="text-[11px] text-[#5e776a] font-mono-brand">
          Fonti Web Verificate · Uso Diretto Business
        </span>
      </div>

      <div className="p-6 space-y-5 text-xs">
        {/* Preset examples */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-medium text-[#5e776a]">Scenari rapidi:</span>
          {QUICK_SECTORS.map((item, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => {
                setSector(item.sector);
                setCompanyIdea(item.idea);
                setFocus(item.focus);
              }}
              className="px-2.5 py-1 rounded border border-[#ccdcd2] bg-[#f7faf8] hover:border-[#263e34] text-[#2c3b33] text-[11px] transition-colors"
            >
              {item.sector}
            </button>
          ))}
        </div>

        <form onSubmit={handleRunResearch} className="grid grid-cols-1 md:grid-cols-12 gap-3.5">
          <div className="md:col-span-5">
            <label className="block text-[11px] font-medium text-[#465d50] mb-1">
              Settore / Mercato Target
            </label>
            <input
              type="text"
              value={sector}
              onChange={(e) => setSector(e.target.value)}
              placeholder="Es. Studi di architettura o e-commerce moda"
              data-testid="market-sector-input"
              className="w-full px-3 py-2 border border-[#ccdcd2] rounded-md text-xs bg-white focus:outline-none focus:ring-1 focus:ring-[#263e34]"
            />
          </div>

          <div className="md:col-span-4">
            <label className="block text-[11px] font-medium text-[#465d50] mb-1">
              Focus Analisi
            </label>
            <input
              type="text"
              value={focus}
              onChange={(e) => setFocus(e.target.value)}
              placeholder="Competitor, prezzi, segmenti scoperti"
              className="w-full px-3 py-2 border border-[#ccdcd2] rounded-md text-xs bg-white focus:outline-none focus:ring-1 focus:ring-[#263e34]"
            />
          </div>

          <div className="md:col-span-3 flex items-end">
            <button
              type="submit"
              disabled={isLoading || !sector.trim()}
              data-testid="run-market-research-btn"
              className="w-full py-2 px-4 bg-[#263e34] hover:bg-[#1a2d25] disabled:opacity-50 text-white rounded-md font-semibold uppercase tracking-wider text-[11px] flex items-center justify-center gap-2 transition-colors"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Ricerca Live...</span>
                </>
              ) : (
                <>
                  <Search className="w-3.5 h-3.5" />
                  <span>Avvia Analisi Web</span>
                </>
              )}
            </button>
          </div>

          <div className="md:col-span-12">
            <input
              type="text"
              value={companyIdea}
              onChange={(e) => setCompanyIdea(e.target.value)}
              placeholder="Opzionale: descrivi brevemente la tua azienda o il prodotto che vuoi lanciare..."
              className="w-full px-3 py-2 border border-[#ccdcd2] rounded-md text-xs bg-[#f7faf8] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#263e34]"
            />
          </div>
        </form>

        {errorMessage && (
          <div
            data-testid="market-research-error"
            className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-xs"
          >
            {errorMessage}
          </div>
        )}

        {result && (
          <div
            data-testid="market-research-result"
            className="mt-4 pt-5 border-t border-[#ccdcd2] space-y-4"
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <span className="text-[11px] font-mono-brand uppercase text-[#263e34] font-semibold">
                  Report Esecutivo · {result.sector}
                </span>
                <div className="text-[11px] text-[#5e776a]">
                  Generato il {new Date(result.generatedAt).toLocaleString('it-IT')}
                </div>
              </div>

              <button
                type="button"
                onClick={handleApply}
                className="px-3.5 py-1.5 rounded-md bg-[#eef4f0] hover:bg-[#dfe9e3] border border-[#263e34]/30 text-[#263e34] font-semibold text-[11px] flex items-center gap-1.5 transition-colors"
              >
                {appliedBanner ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Direttive salvate nei 6 Dipendenti</span>
                  </>
                ) : (
                  <>
                    <span>Applica Insight a Marketing &amp; CTO</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </div>

            <div className="p-4 rounded-lg bg-[#f7faf8] border border-[#ccdcd2] text-[#16221d] whitespace-pre-wrap leading-relaxed text-xs font-normal">
              {result.reportMarkdown}
            </div>

            {result.sources && result.sources.length > 0 && (
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-wider text-[#5e776a] mb-2">
                  Fonti Web Verificate ({result.sources.length})
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                  {result.sources.map((src, idx) => (
                    <a
                      key={idx}
                      href={src.uri}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2.5 rounded-lg border border-[#ccdcd2] bg-white hover:border-[#263e34] flex items-center justify-between gap-2 transition-colors group"
                    >
                      <span className="truncate text-[11px] font-medium text-[#263e34] group-hover:underline">
                        {src.title}
                      </span>
                      <ExternalLink className="w-3 h-3 text-[#5e776a] shrink-0" />
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
