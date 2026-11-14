import React from 'react';
import { ActiveTab } from './Navbar.tsx';

interface FooterProps {
  onNavigate: (tab: ActiveTab) => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  return (
    <footer className="bg-[#eef4f0]/75 border-t border-[#ccdcd2] mt-16 pt-12 pb-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8 pb-10 border-b border-[#ccdcd2]/80">
          
          {/* Brand mark */}
          <button 
            onClick={() => onNavigate('studio')}
            className="flex items-center text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-[#263e34] rounded shrink-0"
            aria-label="Luancer & Co. Home"
          >
            <img 
              src="/assets/aistudio/logo_LUANCER_d035bfad.PNG" 
              alt="Luancer & Co." 
              className="h-12 w-auto object-contain"
            />
          </button>

          {/* Clean nav links */}
          <div className="flex flex-wrap gap-6 text-xs text-[#465d50] font-medium">
            <button 
              onClick={() => onNavigate('studio')}
              className="hover:text-[#16221d] transition-colors"
            >
              Il Mio Workspace
            </button>
            <button 
              onClick={() => onNavigate('finanza')}
              className="hover:text-[#16221d] transition-colors font-semibold"
            >
              Finanza &amp; Fatture
            </button>
            <button 
              onClick={() => onNavigate('analytics')}
              className="hover:text-[#16221d] transition-colors"
            >
              Performance &amp; Report
            </button>
            <button 
              onClick={() => onNavigate('integrations')}
              className="hover:text-[#16221d] transition-colors"
            >
              Integrazioni Gestionali
            </button>
            <button 
              onClick={() => onNavigate('pricing')}
              className="hover:text-[#16221d] transition-colors"
            >
              Piani &amp; Abbonamenti
            </button>
            <button 
              onClick={() => onNavigate('manifesto')}
              className="hover:text-[#16221d] transition-colors"
            >
              Manifesto dell'Atelier
            </button>
          </div>

        </div>

        {/* Bottom copyright and legal */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#5e776a]">
          <div>
            &copy; {new Date().getFullYear()} Luancer &amp; Co. S.r.l. Tutti i diritti riservati. P.IVA IT09842100961.
          </div>
          <div className="flex items-center gap-4 text-[11px]">
            <span>Crittografia mTLS</span>
            <span>·</span>
            <span>Conforme GDPR &amp; ISO 27001</span>
            <span>·</span>
            <span>Made with Italian Craftsmanship</span>
          </div>
        </div>

      </div>
    </footer>
  );
};
