import React, { useEffect, useState } from 'react';
import { 
  BotInstance, 
  BusinessProfile,
  Department, 
  AutonomyLevel, 
  BotTrigger, 
  BotAction,
  ActivityLogEntry 
} from '../types/index.ts';
import { generateBotDraftFromPrompt } from '../utils/botEngine.ts';
import { 
  Plus, 
  Play, 
  Pause, 
  SlidersHorizontal, 
  Trash2, 
  Check, 
  AlertCircle, 
  Layers, 
  Sparkles, 
  Send,
  ArrowRight,
  Database,
  Globe,
  Lock,
  Shield,
  FileCheck2,
  Loader2,
  UserCheck,
  X
} from 'lucide-react';

interface BotStudioProps {
  bots: BotInstance[];
  setBots: React.Dispatch<React.SetStateAction<BotInstance[]>>;
  hasPurchasedPlan: boolean;
  businessProfile: BusinessProfile;
  onJumpToPurchase: () => void;
  activityLogs: ActivityLogEntry[];
  setActivityLogs: React.Dispatch<React.SetStateAction<ActivityLogEntry[]>>;
  isCreateModalOpen: boolean;
  setIsCreateModalOpen: (open: boolean) => void;
}

const DEPARTMENTS: { id: Department; label: string }[] = [
  { id: 'amministrazione', label: 'Amministrazione & Tesoreria' },
  { id: 'assistenza', label: 'Assistenza Clienti' },
  { id: 'vendite', label: 'Vendite & Commerciale' },
  { id: 'magazzino', label: 'Logistica & Magazzino' },
  { id: 'hr', label: 'Risorse Umane' },
  { id: 'operations', label: 'Operazioni Generali' }
];

const AUTONOMY_OPTIONS: { id: AutonomyLevel; title: string; desc: string }[] = [
  {
    id: 'supervisionato',
    title: 'Supervisionato',
    desc: 'Il bot predispone le azioni nei gestionali ma richiede sempre l\'approvazione del responsabile prima dell\'esecuzione.'
  },
  {
    id: 'semi-autonomo',
    title: 'Semi-Autonomo',
    desc: 'Esegue in autonomia le operazioni ordinarie a basso rischio. Richiede supervisione umana per importi elevati o casi atipici.'
  },
  {
    id: 'piena-autonomia',
    title: '100% Piena Autonomia',
    desc: 'Opera continuativamente 24/7 senza necessità di convalida manuale, registrando ogni operazione nell\'audit log aziendale.'
  }
];

export const BotStudio: React.FC<BotStudioProps> = ({
  bots,
  setBots,
  hasPurchasedPlan,
  businessProfile,
  onJumpToPurchase,
  activityLogs,
  setActivityLogs,
  isCreateModalOpen,
  setIsCreateModalOpen
}) => {
  const isCreating = isCreateModalOpen;
  const setIsCreating = setIsCreateModalOpen;
  const [selectedBotForTest, setSelectedBotForTest] = useState<BotInstance | null>(bots[0] || null);
  const [promptInput, setPromptInput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [editingBot, setEditingBot] = useState<BotInstance | null>(null);

  useEffect(() => {
    if (bots.length === 0) {
      setSelectedBotForTest(null);
      return;
    }
    if (!selectedBotForTest || !bots.some((b) => b.id === selectedBotForTest.id)) {
      setSelectedBotForTest(bots[0]);
    }
  }, [bots, selectedBotForTest]);

  // Simulator state
  const [simMessage, setSimMessage] = useState('');
  const [simHistory, setSimHistory] = useState<Array<{ sender: 'user' | 'bot' | 'system'; text: string; details?: string; time: string }>>([
    {
      sender: 'system',
      text: 'Console Operativa del Tuo Business pronta. Seleziona uno dei tuoi agenti attivi e invia un\'istruzione operativa.',
      time: '12:00'
    }
  ]);
  const [isSimulating, setIsSimulating] = useState(false);

  // Quick prompt templates
  const QUICK_TEMPLATES = [
    {
      label: 'Riconciliazione Fatture Scadute (Zucchetti)',
      prompt: 'Vorrei un bot che monitori le scadenze clienti su Zucchetti e Fatture in Cloud, invii solleciti cordiali e riconcili i bonifici in entrata.'
    },
    {
      label: 'Helpdesk Clienti & Tracking (Salesforce)',
      prompt: 'Un bot per rispondere alle richieste dei clienti sullo stato spedizioni dei colli, aprendo e aggiornando i ticket su Salesforce.'
    },
    {
      label: 'Controllo Scorte Minime & Ordini (SAP)',
      prompt: 'Un assistente di magazzino che quando una materia prima scende sotto scorta generi una bozza d\'ordine d\'acquisto su SAP S/4HANA.'
    },
    {
      label: 'Qualificazione Lead & Preventivi (CRM)',
      prompt: 'Un bot commerciale che analizzi i nuovi contatti sul sito, verifichi i dati aziendali e prepari preventivi preliminari personalizzati.'
    }
  ];

  const handleGenerateBot = () => {
    if (!promptInput.trim()) return;
    setIsGenerating(true);

    setTimeout(() => {
      const generated = generateBotDraftFromPrompt(promptInput);
      setEditingBot(generated);
      setIsGenerating(false);
    }, 600);
  };

  const handleSaveBot = () => {
    if (!editingBot) return;
    
    setBots(prev => {
      const exists = prev.some(b => b.id === editingBot.id);
      if (exists) {
        return prev.map(b => b.id === editingBot.id ? editingBot : b);
      }
      return [editingBot, ...prev];
    });

    setSelectedBotForTest(editingBot);
    setEditingBot(null);
    setIsCreating(false);
    setPromptInput('');
  };

  const handleToggleStatus = (botId: string) => {
    setBots(prev => prev.map(b => {
      if (b.id === botId) {
        return {
          ...b,
          status: b.status === 'attivo' ? 'in_pausa' : 'attivo'
        };
      }
      return b;
    }));
  };

  const handleDeleteBot = (botId: string) => {
    setBots(prev => prev.filter(b => b.id !== botId));
    if (selectedBotForTest?.id === botId) {
      setSelectedBotForTest(bots.find(b => b.id !== botId) || null);
    }
  };

  // Run a live test inside simulator
  const handleRunSimulation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!simMessage.trim() || !selectedBotForTest) return;

    const userText = simMessage;
    setSimMessage('');
    const now = new Date().toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });

    setSimHistory(prev => [
      ...prev,
      { sender: 'user', text: userText, time: now }
    ]);

    setIsSimulating(true);

    setTimeout(() => {
      let botResponse = '';
      let systemDetail = '';
      const primarySoftware = selectedBotForTest.primarySoftware[0] || 'Gestionale Aziendale';
      const isSiteVerified =
        businessProfile.verificationStatus === 'verificato' && Boolean(businessProfile.verifiedDomain);
      const siteScopeNote = isSiteVerified
        ? ` Operazione predisposta/eseguita in autonomia su https://${businessProfile.verifiedDomain}.`
        : ` Solo simulazione locale: verifica la proprietà di ${
            businessProfile.websiteUrl.trim() || 'il tuo sito'
          } prima di collegare i bot in produzione.`;

      if (selectedBotForTest.department === 'amministrazione') {
        botResponse = `Ho verificato la transazione nei registri di ${primarySoftware}. La partita contabile è stata identificata con successo: predisposto riscontro con estratto conto aggiornato.${siteScopeNote}`;
        systemDetail = isSiteVerified
          ? `Azione eseguita su ${primarySoftware} · Sito autorizzato: ${businessProfile.verifiedDomain}`
          : `Simulazione interna (${primarySoftware}) · Esecuzione live sul sito bloccata finché non verifichi il dominio`;
      } else if (selectedBotForTest.department === 'assistenza') {
        botResponse = `Ho interrogato i servizi connessi per la richiesta del cliente. Record sincronizzato su ${primarySoftware} con stato 'Pratica Evasa' ed invio notifica confermato.${siteScopeNote}`;
        systemDetail = isSiteVerified
          ? `Interrogazione API completata su ${businessProfile.verifiedDomain} · SLA rispettato`
          : `Simulazione locale completata · Connettore sito esterno in attesa verifica proprietà`;
      } else if (selectedBotForTest.department === 'magazzino') {
        botResponse = `Verifica disponibilità completata su ${primarySoftware}. I parametri di rotazione indicano che la soglia minima è presidiata; bozza documentale registrata.${siteScopeNote}`;
        systemDetail = isSiteVerified
          ? `Controllo incrociato DDT vs Scorte su ${businessProfile.verifiedDomain}`
          : `Simulazione magazzino locale · Sito non verificato`;
      } else {
        botResponse = `Processo elaborato secondo le direttive del bot (${selectedBotForTest.name}). Dati allineati su ${primarySoftware} e notifiche inviate ai collaboratori competenti.${siteScopeNote}`;
        systemDetail = isSiteVerified
          ? `Aggiornamento sincrono su https://${businessProfile.verifiedDomain} (confidenza 99.2%)`
          : `Simulazione sandbox locale · Verifica il sito aziendale per sbloccare l'automazione live`;
      }

      setSimHistory(prev => [
        ...prev,
        { 
          sender: 'bot', 
          text: botResponse, 
          details: systemDetail,
          time: new Date().toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' }) 
        }
      ]);

      // Record a new activity log
      const newLog: ActivityLogEntry = {
        id: `sim-log-${Date.now()}`,
        timestamp: new Date().toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        botId: selectedBotForTest.id,
        botName: selectedBotForTest.name,
        department: selectedBotForTest.department,
        actionTaken: `Esecuzione evento simulato: ${userText.slice(0, 40)}...`,
        targetSoftware: isSiteVerified ? businessProfile.verifiedDomain : selectedBotForTest.primarySoftware[0] || 'Gestionale',
        status: selectedBotForTest.autonomyLevel === 'supervisionato' ? 'approvato_supervisore' : 'completato_autonomo',
        confidenceScore: 99.3,
        timeSavedMinutes: 15,
        details: `Simulazione collaudo: ${botResponse}`
      };

      setActivityLogs(prev => [newLog, ...prev]);
      setIsSimulating(false);
    }, 800);
  };

  const isDomainVerified =
    businessProfile.verificationStatus === 'verificato' && Boolean(businessProfile.verifiedDomain);
  const ownerDisplayName = businessProfile.ownerName.trim() || 'Da intestare';

  return (
    <section id="console-operativa-business" className="py-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8 pb-6 border-b border-[#ccdcd2]">
        <div className="space-y-2">
          <div className="text-xs font-semibold tracking-widest text-[#5e776a] uppercase">
            Uso Autonomo · {businessProfile.companyName || 'La Mia Azienda'}
          </div>
          <h2 className="font-serif-brand text-3xl sm:text-4xl font-semibold text-[#16221d]">
            Console Operativa del Tuo Business
          </h2>
          <p className="text-sm text-[#465d50] max-w-2xl">
            Qui girano in autonomia gli agenti AI intestati a tuo nome per il sito e i software della tua impresa.
          </p>
          <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px]">
            <span
              data-testid="console-owner-badge"
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-white border border-[#ccdcd2] text-[#16221d] font-medium"
            >
              <UserCheck className="w-3.5 h-3.5 text-[#263e34]" />
              <span>Titolare: {ownerDisplayName}</span>
            </span>
            <span
              data-testid="console-domain-badge"
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded border font-medium ${
                isDomainVerified
                  ? 'bg-[#eef4f0] border-[#263e34]/30 text-[#263e34]'
                  : 'bg-[#fdf2f0] border-[#c48d7a]/50 text-[#7c3525]'
              }`}
            >
              {isDomainVerified ? <Globe className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
              <span>
                {isDomainVerified
                  ? `Sito Autorizzato: ${businessProfile.verifiedDomain}`
                  : 'Sito non ancora verificato — esecuzione live bloccata'}
              </span>
            </span>
          </div>
        </div>

        <button
          onClick={() => {
            setIsCreating(true);
            setEditingBot(generateBotDraftFromPrompt(''));
          }}
          className="px-5 py-2.5 text-xs font-semibold tracking-wider uppercase text-[#f7faf8] bg-[#263e34] hover:bg-[#1a2d25] rounded-md transition-all shadow-sm flex items-center gap-2 shrink-0 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          Nuovo Flusso Operativo
        </button>
      </div>

      {/* Main Grid: Bot List on Left, Interactive Simulator on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left: Active Bot Inventory */}
        <div className="lg:col-span-7 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-[#16221d] uppercase tracking-wider">
              {hasPurchasedPlan
                ? `I Tuoi Agenti Operativi Attivi (${bots.length})`
                : `Agenti del Piano (${bots.length})`}
            </h3>
            <span className="text-xs text-[#5e776a]">
              {hasPurchasedPlan
                ? 'Sincronizzati con il piano acquistato'
                : 'In attesa di attivazione piano'}
            </span>
          </div>

          {bots.length === 0 ? (
            <div className="bg-white rounded-xl border border-dashed border-[#8faea0] p-6 text-xs space-y-3">
              <div className="font-semibold text-[#16221d] text-sm">
                Attiva prima un Piano Bot per popolare la tua Console Operativa
              </div>
              <p className="text-[#465d50] leading-relaxed">
                Appena acquisti il Bot Unico 6-in-1 o un Piano Modulare, tutti i tuoi dipendenti AI (Analista, Marketing, CTO, Customer Care, Contabilità, COO) compariranno qui pronti per ricevere istruzioni e lavorare sul tuo business.
              </p>
              <button
                type="button"
                onClick={onJumpToPurchase}
                className="px-4 py-2 bg-[#263e34] hover:bg-[#1a2d25] text-white rounded-md font-semibold uppercase tracking-wider text-[11px] inline-flex items-center gap-1.5"
              >
                <span>Scegli e Acquista il Tuo Piano</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : null}

          <div className="space-y-4">
            {bots.map(bot => {
              const isSelected = selectedBotForTest?.id === bot.id;

              return (
                <div
                  key={bot.id}
                  className={`bg-white rounded-xl border p-5 transition-all shadow-sm hover:shadow ${
                    isSelected 
                      ? 'border-[#263e34] ring-1 ring-[#263e34]/30' 
                      : 'border-[#ccdcd2] hover:border-[#8faea0]'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono-brand text-xs font-semibold text-[#263e34] bg-[#eef4f0] px-2 py-0.5 rounded">
                          {bot.code}
                        </span>
                        <span className="text-xs text-[#5e776a]">
                          {DEPARTMENTS.find(d => d.id === bot.department)?.label}
                        </span>
                        <span className="text-xs text-[#5e776a]">·</span>
                        <span className={`text-xs capitalize font-medium ${
                          bot.status === 'attivo' ? 'text-[#263e34]' : 'text-amber-800'
                        }`}>
                          {bot.status === 'attivo' ? 'In Esecuzione' : 'In Pausa'}
                        </span>
                      </div>
                      <h4 className="text-base font-semibold text-[#16221d]">
                        {bot.name}
                      </h4>
                    </div>

                    {/* Quick Action Buttons */}
                    <div className="flex items-center gap-1 self-end sm:self-auto">
                      <button
                        onClick={() => setSelectedBotForTest(bot)}
                        className={`px-3 py-1.5 text-xs font-medium rounded transition-colors ${
                          isSelected
                            ? 'bg-[#263e34] text-white'
                            : 'bg-[#eef4f0] text-[#263e34] hover:bg-[#dce9e1]'
                        }`}
                        title="Seleziona per il simulatore"
                      >
                        Collauda
                      </button>

                      <button
                        onClick={() => {
                          setEditingBot(bot);
                          setIsCreating(true);
                        }}
                        className="p-1.5 text-[#5e776a] hover:text-[#16221d] hover:bg-[#f4f8f5] rounded transition-colors"
                        title="Modifica impostazioni"
                        aria-label={`Modifica bot ${bot.name}`}
                      >
                        <SlidersHorizontal className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => handleToggleStatus(bot.id)}
                        className="p-1.5 text-[#5e776a] hover:text-[#16221d] hover:bg-[#f4f8f5] rounded transition-colors"
                        title={bot.status === 'attivo' ? 'Metti in pausa' : 'Attiva bot'}
                        aria-label={`Attiva o sospendi bot ${bot.name}`}
                      >
                        {bot.status === 'attivo' ? (
                          <Pause className="w-4 h-4 text-amber-700" />
                        ) : (
                          <Play className="w-4 h-4 text-[#263e34]" />
                        )}
                      </button>

                      <button
                        onClick={() => handleDeleteBot(bot.id)}
                        className="p-1.5 text-[#5e776a] hover:text-red-700 hover:bg-red-50 rounded transition-colors"
                        title="Elimina bot"
                        aria-label={`Elimina bot ${bot.name}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <p className="text-xs text-[#465d50] leading-relaxed mb-4">
                    {bot.description}
                  </p>

                  {/* Connected ERPs and Autonomy Level */}
                  <div className="pt-3 border-t border-[#e8f0eb] flex flex-wrap items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="text-[#5e776a]">Gestionali:</span>
                      <div className="flex flex-wrap gap-1">
                        {bot.primarySoftware.map((sw, idx) => (
                          <span key={idx} className="bg-[#f2f7f4] border border-[#ccdcd2] text-[#263e34] px-2 py-0.5 rounded text-[11px] font-mono-brand">
                            {sw}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center gap-3 text-[#5e776a]">
                      <span className="capitalize">
                        Grado: <strong className="text-[#16221d] font-medium">{bot.autonomyLevel.replace('-', ' ')}</strong>
                      </span>
                      <span>·</span>
                      <span className="font-mono-brand text-[#263e34]">
                        {bot.metrics.hoursSavedMonth}h risparmiate
                      </span>
                    </div>
                  </div>

                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Live Bot Simulator (Collaudo Operativo) */}
        <div className="lg:col-span-5">
          <div className="bg-white rounded-xl border border-[#ccdcd2] shadow-sm flex flex-col h-[640px] sticky top-24">
            
            {/* Simulator Header */}
            <div className="p-4 border-b border-[#ccdcd2] bg-[#f7faf8] rounded-t-xl flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-[#263e34]" />
                <span className="text-xs font-semibold tracking-wider uppercase text-[#16221d]">
                  Collaudo Operativo in Tempo Reale
                </span>
              </div>
              
              {selectedBotForTest && (
                <span className="font-mono-brand text-[11px] text-[#263e34] bg-[#eef4f0] px-2 py-0.5 rounded">
                  {selectedBotForTest.code}
                </span>
              )}
            </div>

            {/* Selected Bot Details Bar */}
            {selectedBotForTest && (
              <div className="px-4 py-2.5 bg-[#eef4f0]/60 border-b border-[#ccdcd2]/60 text-xs flex items-center justify-between gap-2 text-[#465d50]">
                <span className="truncate font-medium text-[#16221d]">
                  Test su: {selectedBotForTest.name}
                </span>
                <span
                  className={`text-[11px] font-mono-brand shrink-0 ${
                    isDomainVerified ? 'text-[#263e34] font-semibold' : 'text-[#7c3525]'
                  }`}
                >
                  {isDomainVerified ? `Live su ${businessProfile.verifiedDomain}` : 'Sandbox Locale'}
                </span>
              </div>
            )}

            {/* Chat/Event Log Stream */}
            <div className="flex-1 p-4 overflow-y-auto space-y-3 text-xs">
              {simHistory.map((item, idx) => (
                <div
                  key={idx}
                  className={`flex flex-col ${
                    item.sender === 'user' 
                      ? 'items-end' 
                      : item.sender === 'bot' 
                        ? 'items-start' 
                        : 'items-center'
                  }`}
                >
                  {item.sender === 'system' ? (
                    <div className="w-full text-center py-2 px-3 bg-[#f7faf8] border border-[#ccdcd2] rounded text-[#5e776a] text-[11px] leading-relaxed">
                      {item.text}
                    </div>
                  ) : item.sender === 'user' ? (
                    <div className="max-w-[85%] bg-[#263e34] text-white p-3 rounded-xl rounded-tr-none shadow-sm">
                      <p className="leading-relaxed">{item.text}</p>
                      <span className="text-[10px] text-[#ccdcd2] block text-right mt-1 font-mono-brand">
                        {item.time}
                      </span>
                    </div>
                  ) : (
                    <div className="max-w-[90%] bg-[#f4f8f5] border border-[#ccdcd2] text-[#16221d] p-3 rounded-xl rounded-tl-none shadow-sm space-y-2">
                      <div className="flex items-center gap-1.5 text-[11px] text-[#263e34] font-semibold">
                        <Check className="w-3.5 h-3.5 text-[#263e34]" />
                        <span>Risposta Autonoma Luancer</span>
                      </div>
                      <p className="leading-relaxed text-[#2c3b33]">{item.text}</p>
                      {item.details && (
                        <div className="pt-2 border-t border-[#ccdcd2]/60 text-[10px] text-[#5e776a] font-mono-brand flex items-center gap-1">
                          <Database className="w-3 h-3 text-[#5e776a]" />
                          <span>{item.details}</span>
                        </div>
                      )}
                      <span className="text-[10px] text-[#5e776a] block text-right font-mono-brand">
                        {item.time}
                      </span>
                    </div>
                  )}
                </div>
              ))}

              {isSimulating && (
                <div className="flex items-center gap-2 text-xs text-[#5e776a] p-2 bg-[#f4f8f5] rounded border border-[#ccdcd2] w-fit">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-[#263e34]" />
                  <span>Elaborazione regole e interrogazione gestionale...</span>
                </div>
              )}
            </div>

            {/* Input Form for Simulator */}
            <form onSubmit={handleRunSimulation} className="p-3 border-t border-[#ccdcd2] bg-[#f7faf8] rounded-b-xl">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={simMessage}
                  onChange={(e) => setSimMessage(e.target.value)}
                  placeholder="Invia evento (es. Richiesta cliente o Fattura scaduta)..."
                  disabled={!selectedBotForTest || isSimulating}
                  className="flex-1 px-3 py-2 text-xs border border-[#ccdcd2] rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-[#263e34] placeholder:text-[#8faea0]"
                />
                <button
                  type="submit"
                  disabled={!selectedBotForTest || !simMessage.trim() || isSimulating}
                  className="p-2 bg-[#263e34] hover:bg-[#1a2d25] disabled:opacity-50 text-white rounded-md transition-colors"
                  aria-label="Invia test al simulatore"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </form>

          </div>
        </div>

      </div>

      {/* Modal: Visual Bot Builder / Customizer */}
      {isCreating && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#16221d]/60 backdrop-blur-sm">
          <div className="bg-white rounded-xl border border-[#ccdcd2] shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in duration-200">
            
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-[#ccdcd2] bg-[#f7faf8] flex items-center justify-between">
              <div>
                <h3 className="font-serif-brand text-2xl font-semibold text-[#16221d]">
                  Atelier di Creazione Bot
                </h3>
                <p className="text-xs text-[#5e776a]">
                  Definisci i compiti aziendali in linguaggio naturale o seleziona un archetipo.
                </p>
              </div>
              <button
                onClick={() => {
                  setIsCreating(false);
                  setEditingBot(null);
                }}
                className="p-1 text-[#5e776a] hover:text-[#16221d] rounded"
                aria-label="Chiudi finestra di creazione"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
              
              {/* Natural Language Prompt Box */}
              <div>
                <label className="block text-xs font-semibold text-[#16221d] uppercase tracking-wider mb-2">
                  01. Descrivi l'obiettivo operativo da automatizzare
                </label>
                <div className="relative">
                  <textarea
                    rows={3}
                    value={promptInput}
                    onChange={(e) => setPromptInput(e.target.value)}
                    placeholder="Ad esempio: Vorrei un bot per l'amministrazione che verifichi quotidianamente gli insoluti su Zucchetti, invii un sollecito formale e notifichi il titolare..."
                    className="w-full p-3 text-xs border border-[#ccdcd2] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#263e34] bg-white placeholder:text-[#8faea0]"
                  />
                  <button
                    type="button"
                    onClick={handleGenerateBot}
                    disabled={!promptInput.trim() || isGenerating}
                    className="mt-2 px-4 py-2 bg-[#263e34] hover:bg-[#1a2d25] disabled:opacity-50 text-white font-medium rounded-md text-xs flex items-center gap-2 transition-colors"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    {isGenerating ? 'Sintesi regole in corso...' : 'Genera Architettura Bot'}
                  </button>
                </div>

                {/* Quick Archetype Pills */}
                <div className="mt-3">
                  <span className="text-[11px] text-[#5e776a] block mb-1.5 font-medium">
                    Oppure scegli un processo aziendale consolidato:
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {QUICK_TEMPLATES.map((tmpl, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          setPromptInput(tmpl.prompt);
                          const generated = generateBotDraftFromPrompt(tmpl.prompt);
                          setEditingBot(generated);
                        }}
                        className="text-[11px] px-2.5 py-1.5 rounded border border-[#ccdcd2] bg-[#f7faf8] text-[#2c3b33] hover:border-[#263e34] hover:bg-[#eef4f0] transition-colors text-left"
                      >
                        {tmpl.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Bot Customization Form (Appears once generated or for manual configuration) */}
              {editingBot && (
                <div className="pt-4 border-t border-[#ccdcd2] space-y-5">
                  <div className="text-xs font-semibold text-[#16221d] uppercase tracking-wider">
                    02. Configurazione Sartoriale dei Parametri
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-[#465d50] mb-1">
                        Nome Identificativo del Bot
                      </label>
                      <input
                        type="text"
                        value={editingBot.name}
                        onChange={(e) => setEditingBot({ ...editingBot, name: e.target.value })}
                        className="w-full px-3 py-2 border border-[#ccdcd2] rounded-md text-xs focus:outline-none focus:ring-1 focus:ring-[#263e34]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-[#465d50] mb-1">
                        Dipartimento Aziendale
                      </label>
                      <select
                        value={editingBot.department}
                        onChange={(e) => setEditingBot({ ...editingBot, department: e.target.value as Department })}
                        className="w-full px-3 py-2 border border-[#ccdcd2] rounded-md text-xs focus:outline-none focus:ring-1 focus:ring-[#263e34] bg-white"
                      >
                        {DEPARTMENTS.map(d => (
                          <option key={d.id} value={d.id}>{d.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-[#465d50] mb-1">
                      Scopo &amp; Perimetro Operativo
                    </label>
                    <textarea
                      rows={2}
                      value={editingBot.description}
                      onChange={(e) => setEditingBot({ ...editingBot, description: e.target.value })}
                      className="w-full px-3 py-2 border border-[#ccdcd2] rounded-md text-xs focus:outline-none focus:ring-1 focus:ring-[#263e34]"
                    />
                  </div>

                  {/* Level of Autonomy Selection */}
                  <div>
                    <label className="block text-xs font-medium text-[#465d50] mb-2">
                      Grado di Autonomia Decisionale
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {AUTONOMY_OPTIONS.map(opt => (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => setEditingBot({ ...editingBot, autonomyLevel: opt.id })}
                          className={`p-3 text-left rounded-lg border transition-all ${
                            editingBot.autonomyLevel === opt.id
                              ? 'border-[#263e34] bg-[#eef4f0] ring-1 ring-[#263e34]'
                              : 'border-[#ccdcd2] bg-white hover:border-[#8faea0]'
                          }`}
                        >
                          <div className="font-semibold text-[#16221d] mb-1 text-xs">
                            {opt.title}
                          </div>
                          <div className="text-[11px] text-[#5e776a] leading-relaxed">
                            {opt.desc}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Triggers and Automated Actions Breakdown */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-3 rounded-lg bg-[#f7faf8] border border-[#ccdcd2]">
                      <div className="font-semibold text-[#16221d] mb-2 flex items-center justify-between">
                        <span>Eventi Scatenanti (Trigger)</span>
                        <span className="text-[11px] text-[#5e776a] font-mono-brand">
                          {editingBot.triggers.length} configurati
                        </span>
                      </div>
                      <div className="space-y-2">
                        {editingBot.triggers.map((t, idx) => (
                          <div key={idx} className="p-2 rounded bg-white border border-[#ccdcd2]/60 text-[11px]">
                            <div className="font-medium text-[#263e34]">{t.source}</div>
                            <div className="text-[#5e776a]">{t.condition}</div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="p-3 rounded-lg bg-[#f7faf8] border border-[#ccdcd2]">
                      <div className="font-semibold text-[#16221d] mb-2 flex items-center justify-between">
                        <span>Azioni Gestionali Eseguite</span>
                        <span className="text-[11px] text-[#5e776a] font-mono-brand">
                          {editingBot.actions.length} collegate
                        </span>
                      </div>
                      <div className="space-y-2">
                        {editingBot.actions.map((a, idx) => (
                          <div key={idx} className="p-2 rounded bg-white border border-[#ccdcd2]/60 text-[11px]">
                            <div className="flex items-center justify-between">
                              <span className="font-medium text-[#16221d]">{a.title}</span>
                              <span className="font-mono-brand text-[10px] text-[#5e776a]">{a.targetSoftware}</span>
                            </div>
                            <div className="text-[#5e776a] text-[10px] mt-0.5">{a.description}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* System Directives */}
                  <div>
                    <label className="block text-xs font-medium text-[#465d50] mb-1">
                      Direttive di Salvaguardia &amp; Tono di Voce
                    </label>
                    <input
                      type="text"
                      value={editingBot.systemDirectives}
                      onChange={(e) => setEditingBot({ ...editingBot, systemDirectives: e.target.value })}
                      className="w-full px-3 py-2 border border-[#ccdcd2] rounded-md text-xs focus:outline-none focus:ring-1 focus:ring-[#263e34]"
                    />
                  </div>

                </div>
              )}

            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-[#ccdcd2] bg-[#f7faf8] flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setIsCreating(false);
                  setEditingBot(null);
                }}
                className="px-4 py-2 border border-[#ccdcd2] text-[#465d50] hover:text-[#16221d] rounded-md text-xs font-medium"
              >
                Annulla
              </button>
              
              <button
                type="button"
                onClick={handleSaveBot}
                disabled={!editingBot || !editingBot.name.trim()}
                className="px-5 py-2 bg-[#263e34] hover:bg-[#1a2d25] disabled:opacity-50 text-white rounded-md text-xs font-semibold tracking-wider uppercase transition-colors"
              >
                Salva &amp; Attiva Bot
              </button>
            </div>

          </div>
        </div>
      )}

    </section>
  );
};
