import React from 'react';
import { LogOut, UserCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';

export type ActiveTab =
  | 'studio'
  | 'finanza'
  | 'analytics'
  | 'integrations'
  | 'pricing'
  | 'manifesto';

interface NavbarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  onOpenCreateModal: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  onOpenCreateModal,
}) => {
  const { user, isSigningIn, signInWithGoogle, signOutUser } = useAuth();

  return (
    <header className="sticky top-0 z-40 bg-[#eef4f0]/95 backdrop-blur-md border-b border-[#ccdcd2]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20 gap-4">
          {/* Zone 1: Single Brand Logo */}
          <button
            onClick={() => setActiveTab('studio')}
            className="flex items-center text-left group focus:outline-none focus-visible:ring-2 focus-visible:ring-[#263e34] rounded shrink-0"
            aria-label="Luancer & Co. Home"
          >
            <img
              src="/assets/aistudio/logo_LUANCER_d035bfad.PNG"
              alt="Luancer & Co."
              className="h-14 sm:h-16 w-auto object-contain transition-transform duration-200 group-hover:scale-105"
            />
          </button>

          {/* Zone 2: Navigation Links */}
          <nav className="hidden lg:flex items-center gap-5 text-sm font-medium text-[#465d50]">
            <button
              onClick={() => setActiveTab('studio')}
              className={`whitespace-nowrap transition-colors py-2 border-b-2 text-[13px] tracking-wide ${
                activeTab === 'studio'
                  ? 'border-[#263e34] text-[#16221d] font-semibold'
                  : 'border-transparent hover:text-[#16221d]'
              }`}
            >
              Il Mio Workspace
            </button>
            <button
              onClick={() => setActiveTab('finanza')}
              className={`whitespace-nowrap transition-colors py-2 border-b-2 text-[13px] tracking-wide ${
                activeTab === 'finanza'
                  ? 'border-[#263e34] text-[#16221d] font-semibold'
                  : 'border-transparent hover:text-[#16221d]'
              }`}
            >
              Finanza &amp; Fatture
            </button>
            <button
              onClick={() => setActiveTab('analytics')}
              className={`whitespace-nowrap transition-colors py-2 border-b-2 text-[13px] tracking-wide ${
                activeTab === 'analytics'
                  ? 'border-[#263e34] text-[#16221d] font-semibold'
                  : 'border-transparent hover:text-[#16221d]'
              }`}
            >
              Performance &amp; Report
            </button>
            <button
              onClick={() => setActiveTab('integrations')}
              className={`whitespace-nowrap transition-colors py-2 border-b-2 text-[13px] tracking-wide ${
                activeTab === 'integrations'
                  ? 'border-[#263e34] text-[#16221d] font-semibold'
                  : 'border-transparent hover:text-[#16221d]'
              }`}
            >
              Integrazioni Gestionali
            </button>
            <button
              onClick={() => setActiveTab('pricing')}
              className={`whitespace-nowrap transition-colors py-2 border-b-2 text-[13px] tracking-wide ${
                activeTab === 'pricing'
                  ? 'border-[#263e34] text-[#16221d] font-semibold'
                  : 'border-transparent hover:text-[#16221d]'
              }`}
            >
              Piani &amp; Abbonamento
            </button>
            <button
              onClick={() => setActiveTab('manifesto')}
              className={`whitespace-nowrap transition-colors py-2 border-b-2 text-[13px] tracking-wide ${
                activeTab === 'manifesto'
                  ? 'border-[#263e34] text-[#16221d] font-semibold'
                  : 'border-transparent hover:text-[#16221d]'
              }`}
            >
              Chi Siamo
            </button>
          </nav>

          {/* Zone 3: Auth & Primary Action */}
          <div className="flex items-center gap-2 shrink-0">
            {user ? (
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-white border border-[#ccdcd2] rounded-md text-xs text-[#16221d]">
                <UserCheck className="w-3.5 h-3.5 text-[#263e34]" />
                <span className="max-w-[85px] sm:max-w-[120px] truncate font-medium">
                  {user.displayName || user.email?.split('@')[0]}
                </span>
                <button
                  type="button"
                  onClick={signOutUser}
                  title="Esci dall'account"
                  aria-label="Esci"
                  className="text-[#5e776a] hover:text-[#16221d]"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={signInWithGoogle}
                disabled={isSigningIn}
                data-testid="google-signin-btn"
                className="inline-flex px-2.5 sm:px-3.5 py-2 text-[11px] sm:text-xs font-medium text-[#263e34] bg-white hover:bg-[#f7faf8] border border-[#ccdcd2] hover:border-[#263e34] rounded-md transition-colors whitespace-nowrap"
              >
                {isSigningIn ? 'Accesso...' : (
                  <>
                    <span className="sm:hidden">Accedi</span>
                    <span className="hidden sm:inline">Accedi con Google</span>
                  </>
                )}
              </button>
            )}

            <button
              onClick={onOpenCreateModal}
              className="px-3.5 sm:px-4 py-2 sm:py-2.5 text-[11px] sm:text-xs font-semibold tracking-wider uppercase text-[#f7faf8] bg-[#263e34] hover:bg-[#1a2d25] rounded-md transition-all shadow-sm hover:shadow whitespace-nowrap focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#263e34]"
            >
              + Nuovo Flusso
            </button>
          </div>
        </div>

        {/* Mobile Navigation Row */}
        <div className="lg:hidden flex items-center justify-between py-2 border-t border-[#ccdcd2]/60 overflow-x-auto gap-3 text-xs">
          <button
            onClick={() => setActiveTab('studio')}
            className={`whitespace-nowrap px-2.5 py-1 rounded ${
              activeTab === 'studio' ? 'bg-[#263e34] text-white' : 'text-[#465d50]'
            }`}
          >
            Il Mio Workspace
          </button>
          <button
            onClick={() => setActiveTab('finanza')}
            className={`whitespace-nowrap px-2.5 py-1 rounded ${
              activeTab === 'finanza' ? 'bg-[#263e34] text-white' : 'text-[#465d50]'
            }`}
          >
            Finanza &amp; Fatture
          </button>
          <button
            onClick={() => setActiveTab('analytics')}
            className={`whitespace-nowrap px-2.5 py-1 rounded ${
              activeTab === 'analytics' ? 'bg-[#263e34] text-white' : 'text-[#465d50]'
            }`}
          >
            Report
          </button>
          <button
            onClick={() => setActiveTab('integrations')}
            className={`whitespace-nowrap px-2.5 py-1 rounded ${
              activeTab === 'integrations' ? 'bg-[#263e34] text-white' : 'text-[#465d50]'
            }`}
          >
            Integrazioni
          </button>
          <button
            onClick={() => setActiveTab('pricing')}
            className={`whitespace-nowrap px-2.5 py-1 rounded ${
              activeTab === 'pricing' ? 'bg-[#263e34] text-white' : 'text-[#465d50]'
            }`}
          >
            Piani
          </button>
          <button
            onClick={() => setActiveTab('manifesto')}
            className={`whitespace-nowrap px-2.5 py-1 rounded ${
              activeTab === 'manifesto' ? 'bg-[#263e34] text-white' : 'text-[#465d50]'
            }`}
          >
            Chi Siamo
          </button>
        </div>
      </div>
    </header>
  );
};
