import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface ErrorBoundaryState {
  hasError: boolean;
  message: string;
}

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, message: '' };
  }

  static getDerivedStateFromError(error: unknown): ErrorBoundaryState {
    const message =
      error instanceof Error && error.message
        ? error.message
        : 'Si è verificato un errore imprevisto durante il caricamento dell’interfaccia.';
    return { hasError: true, message };
  }

  componentDidCatch(error: unknown, info: React.ErrorInfo): void {
    console.error('Luancer UI ErrorBoundary caught error:', error, info.componentStack);
  }

  handleReload = (): void => {
    window.location.reload();
  };

  render(): React.ReactNode {
    if (!this.state.hasError) {
      return this.props.children;
    }

    return (
      <div className="min-h-screen bg-[#eef4f0] text-[#16221d] flex items-center justify-center p-6 font-sans-brand">
        <div
          role="alert"
          className="max-w-lg w-full bg-white border border-[#ccdcd2] rounded-2xl shadow-sm p-8 space-y-5 text-center"
        >
          <div className="w-12 h-12 rounded-xl bg-[#f9f2ef] border border-[#c48d7a]/50 text-[#9a3d29] flex items-center justify-center mx-auto">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div className="space-y-2">
            <h1 className="font-serif-brand text-2xl font-semibold text-[#16221d]">
              Ripristino Piattaforma Luancer &amp; Co.
            </h1>
            <p className="text-sm text-[#465d50] leading-relaxed">
              È stato intercettato un problema temporaneo di rendering. Puoi ricaricare
              l’applicazione per ripristinare la console operativa dei tuoi bot.
            </p>
          </div>
          <div className="p-3 rounded-lg bg-[#f7faf8] border border-[#e2ece6] text-xs font-mono-brand text-[#5e776a] break-words">
            {this.state.message}
          </div>
          <button
            type="button"
            onClick={this.handleReload}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-[#263e34] hover:bg-[#1a2d25] text-white text-xs font-semibold uppercase tracking-wider transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Ricarica Applicazione</span>
          </button>
        </div>
      </div>
    );
  }
}
