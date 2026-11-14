import React from 'react';
import { ShieldCheck, Compass, Anchor, Sparkles, Feather } from 'lucide-react';

export const ManifestoSection: React.FC = () => {
  return (
    <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      
      {/* Editorial Headline */}
      <div className="max-w-3xl mx-auto text-center mb-16">
        <div className="text-xs font-semibold tracking-widest text-[#5e776a] uppercase mb-2">
          La Nostra Filosofia
        </div>
        <h2 className="font-serif-brand text-3xl sm:text-4xl lg:text-5xl font-semibold text-[#16221d] mb-5">
          L'Ingegneria dell'Automazione, con la Cura di un Atelier d'Altri Tempi.
        </h2>
        <p className="text-sm sm:text-base text-[#465d50] leading-relaxed">
          Rifiutiamo le scorciatoie dell'intelligenza artificiale generica. In un'azienda reale un errore contabile o una discrepanza di magazzino hanno un costo concreto: per questo costruiamo agenti deterministici, controllati e calibrati al millimetro.
        </p>
      </div>

      {/* Brand Pillars Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
        
        {/* Pillar 1 */}
        <div className="bg-white p-8 rounded-xl border border-[#ccdcd2] shadow-sm flex flex-col justify-between">
          <div>
            <div className="font-mono-brand text-xs font-semibold text-[#263e34] mb-3">
              01. ZERO CODICE, MASSIMO RIGORE
            </div>
            <h3 className="font-serif-brand text-xl font-bold text-[#16221d] mb-3">
              Semplicità per chi Guida, Precisione per chi Opera
            </h3>
            <p className="text-xs text-[#465d50] leading-relaxed">
              L'imprenditore e i responsabili di reparto devono poter configurare un flusso decisionale in pochi minuti, descrivendolo con il linguaggio quotidiano della propria azienda, senza dipendere da programmatori esterni.
            </p>
          </div>
          <div className="pt-6 border-t border-[#f0f4f1] mt-6 text-[11px] text-[#5e776a]">
            Valutazione preventiva dei vincoli gestionali inclusa.
          </div>
        </div>

        {/* Pillar 2 */}
        <div className="bg-white p-8 rounded-xl border border-[#ccdcd2] shadow-sm flex flex-col justify-between">
          <div>
            <div className="font-mono-brand text-xs font-semibold text-[#263e34] mb-3">
              02. INTEGRABILE, NON INVASIVO
            </div>
            <h3 className="font-serif-brand text-xl font-bold text-[#16221d] mb-3">
              I Vostri Software Rimangono al Centro
            </h3>
            <p className="text-xs text-[#465d50] leading-relaxed">
              Nessun costoso progetto di migrazione o cambio gestionale. I bot Luancer &amp; Co. agiscono come preziosi collaboratori silenziosi che leggono e compilano i record direttamente dentro Zucchetti, SAP, Salesforce o Fatture in Cloud.
            </p>
          </div>
          <div className="pt-6 border-t border-[#f0f4f1] mt-6 text-[11px] text-[#5e776a]">
            Protocollo sicuro via API &amp; Webhook protetti mTLS.
          </div>
        </div>

        {/* Pillar 3 */}
        <div className="bg-white p-8 rounded-xl border border-[#ccdcd2] shadow-sm flex flex-col justify-between">
          <div>
            <div className="font-mono-brand text-xs font-semibold text-[#263e34] mb-3">
              03. REPORTISTICA TRASPARENTE
            </div>
            <h3 className="font-serif-brand text-xl font-bold text-[#16221d] mb-3">
              Metriche Autentiche in Tempo Reale
            </h3>
            <p className="text-xs text-[#465d50] leading-relaxed">
              Ogni minuto risparmiato, ogni fattura riconciliata e ogni ticket risolto viene documentato in un registro verificabile. Dati puri per prendere decisioni strategiche fondate sui fatti, non su promesse astratte.
            </p>
          </div>
          <div className="pt-6 border-t border-[#f0f4f1] mt-6 text-[11px] text-[#5e776a]">
            Dossier esecutivi stampabili conformi per organi di audit.
          </div>
        </div>

      </div>

      {/* Brand Mark Showcase & Quote */}
      <div className="bg-white rounded-2xl border border-[#ccdcd2] p-8 sm:p-12 shadow-sm flex flex-col md:flex-row items-center gap-8 justify-between">
        <div className="flex items-center gap-6">
          <img
            src="/assets/aistudio/logo_LUANCER_d035bfad.PNG"
            alt="Luancer and Co. Emblem"
            className="w-28 h-auto object-contain shrink-0"
          />
          <p className="text-xs text-[#465d50] max-w-lg leading-relaxed italic">
            «L'autonomia operativa non consiste nel sostituire il giudizio dell'uomo, ma nel liberare il suo tempo da ciò che è ripetitivo affinché possa dedicarsi al vero valore artigianale della propria impresa.»
          </p>
        </div>

        <div className="text-center md:text-right shrink-0 border-t md:border-t-0 md:border-l border-[#ccdcd2] pt-4 md:pt-0 md:pl-8">
          <div className="font-mono-brand text-xs text-[#5e776a]">Sede &amp; Progettazione</div>
          <div className="text-sm font-semibold text-[#16221d] mt-1">Milano · Zurigo · Londra</div>
          <div className="text-xs text-[#263e34] mt-1 font-mono-brand">info@luancer.co</div>
        </div>
      </div>

    </section>
  );
};
