import React, { useState } from 'react';
import { SoftwareIntegration } from '../types/index.ts';
import { 
  Check, 
  RefreshCw, 
  Sliders, 
  ExternalLink, 
  ShieldCheck, 
  Lock, 
  CheckCircle2, 
  ArrowUpRight,
  Database,
  Key,
  X
} from 'lucide-react';

interface IntegrationsHubProps {
  integrations: SoftwareIntegration[];
  setIntegrations: React.Dispatch<React.SetStateAction<SoftwareIntegration[]>>;
}

export const IntegrationsHub: React.FC<IntegrationsHubProps> = ({
  integrations,
  setIntegrations
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('Tutti');
  const [activeModalSoftware, setActiveModalSoftware] = useState<SoftwareIntegration | null>(null);
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [syncFreqInput, setSyncFreqInput] = useState<'realtime' | '15min' | 'orario' | 'giornaliero'>('realtime');
  const [isTesting, setIsTesting] = useState(false);
  const [testSuccess, setTestSuccess] = useState(false);

  const categories = ['Tutti', 'ERP & Contabilità', 'CRM & Vendite', 'Supply Chain', 'Comunicazione & Task'];

  const filteredIntegrations = integrations.filter(item => {
    if (selectedCategory === 'Tutti') return true;
    return item.category === selectedCategory;
  });

  const handleOpenConfig = (item: SoftwareIntegration) => {
    setActiveModalSoftware(item);
    setApiKeyInput(item.apiKeyMasked || '');
    setSyncFreqInput(item.syncFrequency || 'realtime');
    setTestSuccess(false);
  };

  const handleSaveConnection = () => {
    if (!activeModalSoftware) return;
    setIsTesting(true);

    setTimeout(() => {
      setIntegrations(prev => prev.map(item => {
        if (item.id === activeModalSoftware.id) {
          return {
            ...item,
            connected: true,
            apiKeyMasked: apiKeyInput ? `live_sec_••••••••${Math.floor(1000 + Math.random() * 9000)}` : item.apiKeyMasked,
            syncFrequency: syncFreqInput,
            lastSync: 'Pochi secondi fa',
            recordsSyncedCount: item.recordsSyncedCount > 0 ? item.recordsSyncedCount + 24 : 150
          };
        }
        return item;
      }));

      setIsTesting(false);
      setTestSuccess(true);

      setTimeout(() => {
        setActiveModalSoftware(null);
        setTestSuccess(false);
      }, 1000);
    }, 900);
  };

  const handleDisconnect = (id: string) => {
    setIntegrations(prev => prev.map(item => {
      if (item.id === id) {
        return {
          ...item,
          connected: false,
          apiKeyMasked: undefined
        };
      }
      return item;
    }));
  };

  return (
    <section className="py-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8 pb-6 border-b border-[#ccdcd2]">
        <div>
          <div className="text-xs font-semibold tracking-widest text-[#5e776a] uppercase mb-1">
            Ecosistema &amp; Interscambio
          </div>
          <h2 className="font-serif-brand text-3xl sm:text-4xl font-semibold text-[#16221d]">
            Integrazioni Gestionali Certificate
          </h2>
          <p className="text-sm text-[#465d50] mt-1 max-w-2xl">
            I bot Luancer &amp; Co. dialogano nativamente con i principali ERP e CRM del mercato italiano e internazionale, senza richiedere modifiche ai vostri sistemi.
          </p>
        </div>

        {/* Category Filter Pills (Functional Buttons) */}
        <div className="flex items-center gap-1.5 p-1 bg-white border border-[#ccdcd2] rounded-lg self-start sm:self-auto overflow-x-auto max-w-full">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                selectedCategory === cat
                  ? 'bg-[#263e34] text-white shadow-sm'
                  : 'text-[#465d50] hover:text-[#16221d]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Grid of integrations */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredIntegrations.map(item => (
          <div
            key={item.id}
            className={`bg-white rounded-xl border p-6 flex flex-col justify-between shadow-sm transition-all hover:shadow ${
              item.connected 
                ? 'border-[#ccdcd2] ring-1 ring-[#263e34]/10' 
                : 'border-[#ccdcd2]/80 opacity-95'
            }`}
          >
            <div>
              {/* Card top lockup */}
              <div className="flex items-start justify-between gap-3 mb-3">
                <div>
                  <span className="font-mono-brand text-[10px] uppercase tracking-wider text-[#5e776a] block mb-1">
                    {item.category}
                  </span>
                  <h3 className="text-base font-semibold text-[#16221d]">
                    {item.name}
                  </h3>
                </div>

                <span className={`text-[11px] font-medium px-2 py-0.5 rounded font-mono-brand shrink-0 ${
                  item.connected
                    ? 'bg-[#eef4f0] text-[#263e34] border border-[#ccdcd2]'
                    : 'bg-[#f4f6f4] text-[#718a7c]'
                }`}>
                  {item.connected ? 'Attivo & Sync' : 'Non Connesso'}
                </span>
              </div>

              <p className="text-xs text-[#465d50] leading-relaxed mb-4">
                {item.description}
              </p>

              {/* Supported Sync Modules */}
              <div className="space-y-1.5 mb-5">
                <span className="text-[11px] font-semibold text-[#16221d] block">
                  Flussi dati gestiti dai bot:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {item.supportedSync.map((sync, idx) => (
                    <span 
                      key={idx}
                      className="text-[11px] bg-[#f7faf8] border border-[#ccdcd2]/80 text-[#2c3b33] px-2 py-0.5 rounded font-mono-brand"
                    >
                      {sync}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Bottom Meta & Action */}
            <div className="pt-4 border-t border-[#ccdcd2]/70 flex items-center justify-between text-xs">
              <div className="text-[11px] text-[#5e776a]">
                {item.connected ? (
                  <div>
                    <span className="font-mono-brand text-[#263e34] font-medium">
                      {item.recordsSyncedCount.toLocaleString('it-IT')} record
                    </span>
                    <span className="block text-[10px]">{item.lastSync}</span>
                  </div>
                ) : (
                  <span>Pronto per il collegamento</span>
                )}
              </div>

              <div className="flex items-center gap-2">
                {item.connected ? (
                  <button
                    onClick={() => handleOpenConfig(item)}
                    className="px-3 py-1.5 text-xs font-medium text-[#263e34] bg-[#eef4f0] hover:bg-[#dce9e1] rounded transition-colors"
                  >
                    Gestisci
                  </button>
                ) : (
                  <button
                    onClick={() => handleOpenConfig(item)}
                    className="px-3.5 py-1.5 text-xs font-semibold text-white bg-[#263e34] hover:bg-[#1a2d25] rounded transition-colors"
                  >
                    Connetti
                  </button>
                )}
              </div>
            </div>

          </div>
        ))}
      </div>

      {/* Integration Setup Modal */}
      {activeModalSoftware && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#16221d]/60 backdrop-blur-sm">
          <div className="bg-white rounded-xl border border-[#ccdcd2] shadow-2xl max-w-lg w-full overflow-hidden animate-in fade-in duration-200">
            
            <div className="px-6 py-4 border-b border-[#ccdcd2] bg-[#f7faf8] flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-mono-brand text-[#5e776a]">
                  Connessione Sicura ERP
                </span>
                <h3 className="font-serif-brand text-xl font-semibold text-[#16221d]">
                  {activeModalSoftware.name}
                </h3>
              </div>
              <button
                onClick={() => setActiveModalSoftware(null)}
                className="p-1 text-[#5e776a] hover:text-[#16221d] rounded"
                aria-label="Chiudi configurazione software"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5 text-xs">
              
              <div className="p-3 bg-[#eef4f0] rounded-lg border border-[#ccdcd2] text-[#2c3b33] leading-relaxed">
                <div className="font-semibold text-[#263e34] mb-0.5 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-[#263e34]" />
                  Protocollo di Scambio Crittografato Luancer
                </div>
                I token di accesso vengono protetti tramite cifratura mTLS e conformità bancaria ISO 27001. I dati rimangono di esclusiva proprietà della vostra azienda.
              </div>

              <div>
                <label className="block text-xs font-medium text-[#465d50] mb-1">
                  API Key / Token di Accesso WebService
                </label>
                <div className="relative">
                  <input
                    type="password"
                    value={apiKeyInput}
                    onChange={(e) => setApiKeyInput(e.target.value)}
                    placeholder="Es. zk_live_9921471029487..."
                    className="w-full px-3 py-2 border border-[#ccdcd2] rounded-md text-xs font-mono-brand focus:outline-none focus:ring-1 focus:ring-[#263e34]"
                  />
                  <Key className="w-4 h-4 text-[#5e776a] absolute right-3 top-2.5" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#465d50] mb-1">
                  Frequenza di Sincronizzazione Dati
                </label>
                <select
                  value={syncFreqInput}
                  onChange={(e) => setSyncFreqInput(e.target.value as any)}
                  className="w-full px-3 py-2 border border-[#ccdcd2] rounded-md text-xs bg-white text-[#2c3b33] focus:outline-none focus:ring-1 focus:ring-[#263e34]"
                >
                  <option value="realtime">In tempo reale (Webhook Push istantaneo)</option>
                  <option value="15min">Ogni 15 minuti</option>
                  <option value="orario">Ogni ora</option>
                  <option value="giornaliero">Giornaliero (chiusura serale)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#465d50] mb-1">
                  Permessi concessi ai Bot
                </label>
                <div className="space-y-1.5 p-3 rounded-lg border border-[#ccdcd2] bg-[#f7faf8]">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" defaultChecked className="rounded text-[#263e34] focus:ring-[#263e34]" />
                    <span>Lettura scadenze, ordini e schede anagrafiche</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" defaultChecked className="rounded text-[#263e34] focus:ring-[#263e34]" />
                    <span>Scrittura bozze documenti e note interne</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" defaultChecked className="rounded text-[#263e34] focus:ring-[#263e34]" />
                    <span>Allineamento automatico partitari e fatture</span>
                  </label>
                </div>
              </div>

              {testSuccess && (
                <div className="p-2.5 rounded bg-[#eef4f0] text-[#263e34] font-medium flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#263e34]" />
                  <span>Connessione verificata con successo! Gestionale allineato.</span>
                </div>
              )}

            </div>

            <div className="px-6 py-4 border-t border-[#ccdcd2] bg-[#f7faf8] flex items-center justify-between">
              {activeModalSoftware.connected ? (
                <button
                  type="button"
                  onClick={() => {
                    handleDisconnect(activeModalSoftware.id);
                    setActiveModalSoftware(null);
                  }}
                  className="text-xs text-red-700 hover:text-red-900 font-medium"
                >
                  Disconnetti Software
                </button>
              ) : (
                <div />
              )}

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setActiveModalSoftware(null)}
                  className="px-4 py-2 border border-[#ccdcd2] text-[#465d50] hover:text-[#16221d] rounded-md text-xs font-medium"
                >
                  Annulla
                </button>
                <button
                  type="button"
                  onClick={handleSaveConnection}
                  disabled={isTesting}
                  className="px-5 py-2 bg-[#263e34] hover:bg-[#1a2d25] disabled:opacity-50 text-white rounded-md text-xs font-semibold tracking-wider uppercase transition-colors flex items-center gap-1.5"
                >
                  {isTesting ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      Test in corso...
                    </>
                  ) : (
                    'Testa & Sincronizza'
                  )}
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

    </section>
  );
};
