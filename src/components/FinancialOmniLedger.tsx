import React, { useState } from 'react';
import {
  BusinessProfile,
  FinancialRecord,
  FinancialRecordType,
  FinancialStatus,
  OmniBotFinancialSettings,
} from '../types/index.ts';
import {
  calculateFinancialTotals,
  executeBotFinancialCommand,
  formatCurrency,
  DEFAULT_OMNIBOT_SETTINGS,
} from '../utils/botEngine.ts';
import {
  Receipt,
  Wallet,
  TrendingUp,
  TrendingDown,
  Send,
  Sliders,
  ShieldCheck,
  Download,
  Search,
  CheckCircle2,
  User,
  CreditCard,
  X,
} from 'lucide-react';

interface FinancialOmniLedgerProps {
  businessProfile: BusinessProfile;
  records: FinancialRecord[];
  setRecords: React.Dispatch<React.SetStateAction<FinancialRecord[]>>;
}

export const FinancialOmniLedger: React.FC<FinancialOmniLedgerProps> = ({
  businessProfile,
  records,
  setRecords,
}) => {
  const [selectedCounterparty, setSelectedCounterparty] = useState<string>('ALL');
  const [botSettings, setBotSettings] = useState<OmniBotFinancialSettings>(DEFAULT_OMNIBOT_SETTINGS);

  const companyName = businessProfile.companyName.trim() || 'La Mia Azienda';

  // Command bar state
  const [commandInput, setCommandInput] = useState('');
  const [lastBotReply, setLastBotReply] = useState<{ message: string; summary: string } | null>({
    message: `Il tuo Dipendente 05 presidia fatture attive, incassi, spese fornitori e abbonamenti per ${companyName}.`,
    summary: 'Contabilità privata attiva · Pronto a eseguire i tuoi comandi',
  });
  const [isBotWorking, setIsBotWorking] = useState(false);

  // Table filters
  const [typeFilter, setTypeFilter] = useState<string>('tutti');
  const [statusFilter, setStatusFilter] = useState<string>('tutti');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [isRulesModalOpen, setIsRulesModalOpen] = useState(false);
  const [isNewRecordModalOpen, setIsNewRecordModalOpen] = useState(false);
  const [modalRecordType, setModalRecordType] = useState<FinancialRecordType>('fattura_attiva');

  // Form states for manual additions
  const [formClient, setFormClient] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formAmount, setFormAmount] = useState<number>(1000);
  const [formCategory, setFormCategory] = useState('Vendite & Servizi');
  const [formPaymentMethod, setFormPaymentMethod] = useState('Bonifico SEPA');
  const [formDueDate, setFormDueDate] = useState(new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0]);

  const counterparties = Array.from(new Set(records.map((r) => r.clientOrVendor))).sort();

  // Filter records by selected counterparty
  const clientFilteredRecords = records.filter((r) => {
    if (selectedCounterparty === 'ALL') return true;
    return r.clientOrVendor === selectedCounterparty;
  });

  // Calculate live financial totals
  const totals = calculateFinancialTotals(clientFilteredRecords);

  // Apply search and category filters
  const displayedRecords = clientFilteredRecords.filter(r => {
    if (typeFilter !== 'tutti' && r.type !== typeFilter) return false;
    if (statusFilter !== 'tutti' && r.status !== statusFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const match = 
        r.clientOrVendor.toLowerCase().includes(q) ||
        r.description.toLowerCase().includes(q) ||
        r.docNumber.toLowerCase().includes(q) ||
        r.category.toLowerCase().includes(q);
      if (!match) return false;
    }
    return true;
  });

  // Execute programmable bot command
  const handleExecuteCommand = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commandInput.trim() || isBotWorking) return;

    const userCmd = commandInput;
    setCommandInput('');
    setIsBotWorking(true);

    setTimeout(() => {
      const clientNameContext = selectedCounterparty !== 'ALL' ? selectedCounterparty : undefined;
      const res = executeBotFinancialCommand(userCmd, records, clientNameContext);
      setRecords(res.updatedRecords);
      setLastBotReply({
        message: res.replyMessage,
        summary: res.actionSummary
      });
      setIsBotWorking(false);
    }, 500);
  };

  const handleQuickCommand = (prompt: string) => {
    setCommandInput(prompt);
  };

  // Submit manual creation form
  const handleCreateRecordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const today = new Date().toISOString().split('T')[0];
    const clientName = formClient.trim() || (selectedCounterparty !== 'ALL' ? selectedCounterparty : 'Cliente della Tua Azienda');
    const net = Math.round((formAmount / 1.22) * 100) / 100;
    
    let prefix = 'FT';
    let dir: 'entrata' | 'uscita' = 'entrata';
    let stat: FinancialStatus = 'in_attesa';

    if (modalRecordType === 'spesa') {
      prefix = 'SP';
      dir = 'uscita';
      stat = 'saldato';
    } else if (modalRecordType === 'incasso_pagamento') {
      prefix = 'INC';
      dir = 'entrata';
      stat = 'saldato';
    } else if (modalRecordType === 'abbonamento') {
      prefix = 'SUB';
      dir = 'entrata';
      stat = 'saldato';
    }

    const newRec: FinancialRecord = {
      id: `manual-${Date.now()}`,
      date: today,
      type: modalRecordType,
      docNumber: `${prefix}-${new Date().getFullYear()}/${Math.floor(100 + Math.random() * 900)}`,
      clientOrVendor: clientName,
      description: formDescription.trim() || 'Registrazione contabile aziendale',
      category: formCategory,
      amountGrossEur: formAmount,
      amountNetEur: net,
      vatRatePercent: 22,
      direction: dir,
      status: stat,
      paymentMethod: formPaymentMethod,
      dueDate: formDueDate,
      handledByBot: true,
      botNote: 'Inserita e allineata in contabilità tramite interfaccia Luancer'
    };

    setRecords(prev => [newRec, ...prev]);
    setIsNewRecordModalOpen(false);
    setFormDescription('');
  };

  const handleExportCsv = () => {
    const headers = 'ID,Data,Tipo,Documento,Cliente/Fornitore,Descrizione,Categoria,ImportoLordo,Direzione,Stato,MetodoPagamento\n';
    const rows = displayedRecords.map(r => 
      `"${r.id}","${r.date}","${r.type}","${r.docNumber}","${r.clientOrVendor}","${r.description.replace(/"/g, '""')}","${r.category}",${r.amountGrossEur},"${r.direction}","${r.status}","${r.paymentMethod}"`
    ).join('\n');
    
    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Registro_Finanziario_Luancer_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <section className="py-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      
      {/* Header with Counterparty Filter & Rules Button */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-8 pb-6 border-b border-[#ccdcd2]">
        <div>
          <div className="text-xs font-semibold tracking-widest text-[#5e776a] uppercase mb-1">
            Dipendente 05 · Contabilità Privata di {companyName}
          </div>
          <h2 className="font-serif-brand text-3xl sm:text-4xl font-semibold text-[#16221d]">
            Finanza &amp; Fatture del Tuo Business
          </h2>
          <p className="text-sm text-[#465d50] mt-1 max-w-2xl">
            Usa il tuo bot contabile in autonomia: emetti fatture ai tuoi clienti, registra spese dei fornitori, monitora gli incassi e controlla i margini netti della tua impresa.
          </p>
        </div>

        {/* Counterparty Switcher */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-white border border-[#ccdcd2] p-1.5 rounded-lg shadow-sm">
            <User className="w-4 h-4 text-[#263e34] ml-1" />
            <span className="text-xs font-medium text-[#5e776a]">Controparte:</span>
            <select
              value={selectedCounterparty}
              onChange={(e) => setSelectedCounterparty(e.target.value)}
              className="text-xs font-semibold text-[#16221d] bg-transparent focus:outline-none cursor-pointer pr-2"
            >
              <option value="ALL">Tutte le Controparti ({companyName})</option>
              {counterparties.map((cp) => (
                <option key={cp} value={cp}>
                  {cp}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={() => setIsRulesModalOpen(true)}
            className="px-4 py-2 text-xs font-medium border border-[#ccdcd2] bg-white hover:bg-[#eef4f0] text-[#263e34] rounded-md transition-colors flex items-center gap-1.5 shadow-sm"
          >
            <Sliders className="w-3.5 h-3.5 text-[#263e34]" />
            Regole Bot Contabile
          </button>
        </div>
      </div>

      {/* Top 5 Financial Metric Cards (Guadagni, Fatture, Spese, Pagamenti, Abbonamenti) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        
        {/* Metric 1: Ricavi / Fatturato */}
        <div className="bg-white p-5 rounded-xl border border-[#ccdcd2] shadow-sm">
          <div className="flex items-center justify-between text-xs text-[#5e776a] mb-2">
            <span>Fatturato &amp; Ricavi</span>
            <TrendingUp className="w-4 h-4 text-[#263e34]" />
          </div>
          <div className="font-mono-brand text-2xl font-bold text-[#16221d]">
            {formatCurrency(totals.totalIncomeEur)}
          </div>
          <div className="text-[11px] text-[#5e776a] mt-2 pt-2 border-t border-[#f0f4f1] flex justify-between">
            <span>Incassi convalidati</span>
            <span className="text-[#263e34] font-medium">+100% tracciati</span>
          </div>
        </div>

        {/* Metric 2: Spese Aziendali */}
        <div className="bg-white p-5 rounded-xl border border-[#ccdcd2] shadow-sm">
          <div className="flex items-center justify-between text-xs text-[#5e776a] mb-2">
            <span>Spese &amp; Fornitori</span>
            <TrendingDown className="w-4 h-4 text-amber-800" />
          </div>
          <div className="font-mono-brand text-2xl font-bold text-[#16221d]">
            {formatCurrency(totals.totalExpensesEur)}
          </div>
          <div className="text-[11px] text-[#5e776a] mt-2 pt-2 border-t border-[#f0f4f1] flex justify-between">
            <span>Sotto la soglia limite</span>
            <span className="text-[#263e34] font-medium font-mono-brand">&lt; €{botSettings.autoExpenseAlertLimitEur}</span>
          </div>
        </div>

        {/* Metric 3: Guadagni Netti */}
        <div className="bg-white p-5 rounded-xl border border-[#ccdcd2] shadow-sm ring-1 ring-[#263e34]/20">
          <div className="flex items-center justify-between text-xs text-[#263e34] font-semibold mb-2">
            <span>Guadagno Netto (Utile)</span>
            <Wallet className="w-4 h-4 text-[#263e34]" />
          </div>
          <div className="font-mono-brand text-2xl font-bold text-[#263e34]">
            {formatCurrency(totals.netProfitEur)}
          </div>
          <div className="text-[11px] text-[#5e776a] mt-2 pt-2 border-t border-[#f0f4f1] flex justify-between">
            <span>Margine operativo:</span>
            <span className="font-mono-brand text-[#263e34] font-semibold">{totals.profitMarginPercent}%</span>
          </div>
        </div>

        {/* Metric 4: Fatture da Incassare */}
        <div className="bg-white p-5 rounded-xl border border-[#ccdcd2] shadow-sm">
          <div className="flex items-center justify-between text-xs text-[#5e776a] mb-2">
            <span>Fatture &amp; Crediti</span>
            <Receipt className="w-4 h-4 text-[#263e34]" />
          </div>
          <div className="font-mono-brand text-2xl font-bold text-[#16221d]">
            {formatCurrency(totals.pendingInvoicesEur + totals.overdueInvoicesEur)}
          </div>
          <div className="text-[11px] text-[#5e776a] mt-2 pt-2 border-t border-[#f0f4f1] flex justify-between">
            <span>Scaduti da incassare:</span>
            <span className={`font-mono-brand font-medium ${totals.overdueInvoicesEur > 0 ? 'text-amber-800' : 'text-[#263e34]'}`}>
              {formatCurrency(totals.overdueInvoicesEur)}
            </span>
          </div>
        </div>

        {/* Metric 5: Abbonamenti Ricorrenti (MRR) */}
        <div className="bg-white p-5 rounded-xl border border-[#ccdcd2] shadow-sm">
          <div className="flex items-center justify-between text-xs text-[#5e776a] mb-2">
            <span>Abbonamenti (MRR)</span>
            <CreditCard className="w-4 h-4 text-[#263e34]" />
          </div>
          <div className="font-mono-brand text-2xl font-bold text-[#16221d]">
            {formatCurrency(totals.recurringMrrEur)}
            <span className="text-xs text-[#5e776a] font-normal">/m</span>
          </div>
          <div className="text-[11px] text-[#5e776a] mt-2 pt-2 border-t border-[#f0f4f1] flex justify-between">
            <span>Rinnovo automatico:</span>
            <span className="text-[#263e34] font-medium">Attivo 100%</span>
          </div>
        </div>

      </div>

      {/* Interactive Programmable Bot Command Console */}
      <div className="bg-white rounded-xl border border-[#ccdcd2] shadow-sm p-6 mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#eef4f0] border border-[#ccdcd2] flex items-center justify-center font-serif-brand font-bold text-[#263e34]">
              L
            </div>
            <div>
              <h3 className="text-sm font-semibold text-[#16221d]">
                Console del Tuo Bot Contabile · {selectedCounterparty !== 'ALL' ? selectedCounterparty : companyName}
              </h3>
              <p className="text-xs text-[#5e776a]">
                Dai istruzioni al tuo Dipendente 05 su fatture ai tuoi clienti, spese, incassi e bilanci aziendali.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setModalRecordType('fattura_attiva');
                setIsNewRecordModalOpen(true);
              }}
              className="px-3 py-1.5 text-xs font-medium text-[#263e34] bg-[#eef4f0] hover:bg-[#dce9e1] rounded-md transition-colors"
            >
              + Fattura
            </button>
            <button
              onClick={() => {
                setModalRecordType('spesa');
                setIsNewRecordModalOpen(true);
              }}
              className="px-3 py-1.5 text-xs font-medium text-[#263e34] bg-[#eef4f0] hover:bg-[#dce9e1] rounded-md transition-colors"
            >
              + Spesa
            </button>
            <button
              onClick={() => {
                setModalRecordType('abbonamento');
                setIsNewRecordModalOpen(true);
              }}
              className="px-3 py-1.5 text-xs font-medium text-[#263e34] bg-[#eef4f0] hover:bg-[#dce9e1] rounded-md transition-colors"
            >
              + Abbonamento
            </button>
          </div>
        </div>

        {/* Command Input Form */}
        <form onSubmit={handleExecuteCommand} className="mb-3">
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={commandInput}
              onChange={(e) => setCommandInput(e.target.value)}
              placeholder="Esempi: 'Emetti fattura di € 2.400', 'Registra spesa fornitore di € 350', 'Sollecita crediti scaduti', 'Incassa € 7.800'..."
              className="flex-1 px-4 py-2.5 text-xs border border-[#ccdcd2] rounded-lg bg-[#f7faf8] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#263e34] placeholder:text-[#8faea0]"
            />
            <button
              type="submit"
              disabled={!commandInput.trim() || isBotWorking}
              className="px-5 py-2.5 bg-[#263e34] hover:bg-[#1a2d25] disabled:opacity-50 text-white rounded-lg text-xs font-semibold tracking-wider uppercase transition-colors flex items-center gap-1.5"
            >
              <Send className="w-3.5 h-3.5" />
              {isBotWorking ? 'Esecuzione...' : 'Esegui'}
            </button>
          </div>
        </form>

        {/* Quick Suggestion Chips */}
        <div className="flex flex-wrap items-center gap-2 text-[11px] mb-4">
          <span className="text-[#5e776a] font-medium">Azioni veloci:</span>
          <button
            type="button"
            onClick={() => handleQuickCommand('Sollecita tutte le fatture scadute con estratto conto')}
            className="px-2.5 py-1 rounded bg-[#f7faf8] border border-[#ccdcd2] text-[#2c3b33] hover:border-[#263e34] hover:bg-[#eef4f0] transition-colors"
          >
            Sollecita fatture scadute
          </button>
          <button
            type="button"
            onClick={() => handleQuickCommand('Emetti fattura per consulenza di € 1.500')}
            className="px-2.5 py-1 rounded bg-[#f7faf8] border border-[#ccdcd2] text-[#2c3b33] hover:border-[#263e34] hover:bg-[#eef4f0] transition-colors"
          >
            Emetti nuova fattura € 1.500
          </button>
          <button
            type="button"
            onClick={() => handleQuickCommand('Registra spesa di € 420 per software cloud')}
            className="px-2.5 py-1 rounded bg-[#f7faf8] border border-[#ccdcd2] text-[#2c3b33] hover:border-[#263e34] hover:bg-[#eef4f0] transition-colors"
          >
            Registra spesa software € 420
          </button>
          <button
            type="button"
            onClick={() => handleQuickCommand('Attiva abbonamento mensile ricorrente di € 199 per il cliente')}
            className="px-2.5 py-1 rounded bg-[#f7faf8] border border-[#ccdcd2] text-[#2c3b33] hover:border-[#263e34] hover:bg-[#eef4f0] transition-colors"
          >
            Attiva abbonamento € 199/m
          </button>
          <button
            type="button"
            onClick={() => handleQuickCommand('Calcola bilancio e guadagni netti di oggi')}
            className="px-2.5 py-1 rounded bg-[#f7faf8] border border-[#ccdcd2] text-[#2c3b33] hover:border-[#263e34] hover:bg-[#eef4f0] transition-colors"
          >
            Calcola guadagni netti
          </button>
        </div>

        {/* Live Bot Execution Feedback Box */}
        {lastBotReply && (
          <div className="p-3.5 rounded-lg bg-[#eef4f0] border border-[#ccdcd2] text-xs flex items-start gap-3">
            <CheckCircle2 className="w-4 h-4 text-[#263e34] shrink-0 mt-0.5" />
            <div className="flex-1">
              <div className="font-semibold text-[#16221d] mb-0.5">
                Riscontro Esecutivo Luancer Bot
              </div>
              <p className="text-[#2c3b33] leading-relaxed mb-1.5">
                {lastBotReply.message}
              </p>
              <div className="text-[11px] font-mono-brand text-[#5e776a] flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-[#263e34]" />
                <span>{lastBotReply.summary}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Unified Enterprise Ledger Table ("Registra Tutto") */}
      <div className="bg-white rounded-xl border border-[#ccdcd2] shadow-sm p-6">
        
        {/* Table Filters & Search */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-4 border-b border-[#ccdcd2]">
          <div>
            <h3 className="text-sm font-semibold text-[#16221d] uppercase tracking-wider">
              Registro Storico Completo ({displayedRecords.length} movimenti)
            </h3>
            <p className="text-xs text-[#5e776a]">
              Ogni fattura, pagamento, spesa e abbonamento viene registrato e memorizzato in modo immutabile.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 text-xs">
            {/* Search */}
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cerca record o cliente..."
                className="pl-8 pr-3 py-1.5 border border-[#ccdcd2] rounded-md text-xs bg-white text-[#16221d] focus:outline-none focus:ring-1 focus:ring-[#263e34]"
              />
              <Search className="w-3.5 h-3.5 text-[#5e776a] absolute left-2.5 top-2" />
            </div>

            {/* Type Filter */}
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-2.5 py-1.5 border border-[#ccdcd2] rounded-md text-xs bg-white text-[#2c3b33] focus:outline-none focus:ring-1 focus:ring-[#263e34]"
            >
              <option value="tutti">Tutti i tipi</option>
              <option value="fattura_attiva">Fatture Attive</option>
              <option value="incasso_pagamento">Incassi / Pagamenti</option>
              <option value="spesa">Spese Fornitori</option>
              <option value="abbonamento">Abbonamenti Ricorrenti</option>
            </select>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-2.5 py-1.5 border border-[#ccdcd2] rounded-md text-xs bg-white text-[#2c3b33] focus:outline-none focus:ring-1 focus:ring-[#263e34]"
            >
              <option value="tutti">Tutti gli stati</option>
              <option value="saldato">Saldato</option>
              <option value="in_attesa">In Attesa</option>
              <option value="scaduto">Scaduto</option>
            </select>

            {/* Export CSV */}
            <button
              onClick={handleExportCsv}
              className="px-3 py-1.5 border border-[#ccdcd2] hover:bg-[#eef4f0] text-[#263e34] rounded-md text-xs font-medium flex items-center gap-1.5 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              Esporta CSV
            </button>
          </div>
        </div>

        {/* Ledger Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-[#ccdcd2] text-[#5e776a] font-semibold">
                <th className="py-2.5 pr-3">Data</th>
                <th className="py-2.5 px-3">Tipo Movimento</th>
                <th className="py-2.5 px-3">Doc #</th>
                <th className="py-2.5 px-3">Cliente / Fornitore</th>
                <th className="py-2.5 px-3">Descrizione</th>
                <th className="py-2.5 px-3 text-right">Importo Lordo</th>
                <th className="py-2.5 px-3 text-center">Stato</th>
                <th className="py-2.5 pl-3">Azione Bot &amp; Audit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f0f4f1] text-[#2c3b33]">
              {displayedRecords.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-[#5e776a]">
                    Nessun movimento contabile trovato con i filtri selezionati.
                  </td>
                </tr>
              ) : (
                displayedRecords.map(rec => (
                  <tr key={rec.id} className="hover:bg-[#f7faf8] transition-colors">
                    <td className="py-3 pr-3 font-mono-brand text-[#5e776a] whitespace-nowrap">
                      {rec.date}
                    </td>

                    <td className="py-3 px-3 whitespace-nowrap">
                      <span className={`text-[11px] font-mono-brand px-2 py-0.5 rounded font-medium ${
                        rec.type === 'fattura_attiva' ? 'bg-[#eef4f0] text-[#263e34]' :
                        rec.type === 'incasso_pagamento' ? 'bg-emerald-50 text-emerald-800' :
                        rec.type === 'spesa' ? 'bg-amber-50 text-amber-900' :
                        'bg-sky-50 text-sky-900'
                      }`}>
                        {rec.type === 'fattura_attiva' ? 'Fattura Attiva' :
                         rec.type === 'incasso_pagamento' ? 'Incasso / Pagamento' :
                         rec.type === 'spesa' ? 'Spesa Fornitore' :
                         'Abbonamento Ricorrente'}
                      </span>
                    </td>

                    <td className="py-3 px-3 font-mono-brand text-[#16221d] font-semibold whitespace-nowrap">
                      {rec.docNumber}
                    </td>

                    <td className="py-3 px-2.5 font-medium text-[#16221d]">
                      {rec.clientOrVendor}
                    </td>

                    <td className="py-3 px-2.5 max-w-[190px] truncate text-[#465d50]" title={rec.description}>
                      {rec.description}
                    </td>

                    <td className="py-3 px-2.5 text-right font-mono-brand whitespace-nowrap">
                      <span className={`font-semibold ${
                        rec.direction === 'entrata' ? 'text-[#263e34]' : 'text-amber-900'
                      }`}>
                        {rec.direction === 'entrata' ? '+' : '-'} € {rec.amountGrossEur.toLocaleString('it-IT', { minimumFractionDigits: 2 })}
                      </span>
                      <span className="block text-[10px] text-[#5e776a]">
                        IVA {rec.vatRatePercent}%
                      </span>
                    </td>

                    <td className="py-3 px-2.5 text-center whitespace-nowrap">
                      <span className={`text-[10px] font-medium px-2 py-0.5 rounded uppercase tracking-wider font-mono-brand ${
                        rec.status === 'saldato' ? 'bg-[#eef4f0] text-[#263e34]' :
                        rec.status === 'in_attesa' ? 'bg-amber-50 text-amber-800' :
                        'bg-red-50 text-red-800'
                      }`}>
                        {rec.status === 'saldato' ? 'Saldato' :
                         rec.status === 'in_attesa' ? 'In Attesa' :
                         'Scaduto'}
                      </span>
                    </td>

                    <td className="py-3 pl-2.5 text-[11px] text-[#5e776a] max-w-[200px] truncate" title={rec.botNote}>
                      {rec.handledByBot && (
                        <span className="text-[#263e34] font-medium mr-1 font-mono-brand">
                          [Bot]:
                        </span>
                      )}
                      {rec.botNote || 'Nessuna nota'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

      </div>

      {/* Modal: Programmable Bot Rules ("Programmabile su Misura per l'Interesse del Cliente") */}
      {isRulesModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#16221d]/60 backdrop-blur-sm">
          <div className="bg-white rounded-xl border border-[#ccdcd2] shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in duration-200">
            
            <div className="px-6 py-4 border-b border-[#ccdcd2] bg-[#f7faf8] flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-mono-brand text-[#5e776a]">
                  Personalizzazione Sartoriale
                </span>
                <h3 className="font-serif-brand text-2xl font-semibold text-[#16221d]">
                  Regole del Bot su Misura del Cliente
                </h3>
              </div>
              <button
                onClick={() => setIsRulesModalOpen(false)}
                className="p-1 text-[#5e776a] hover:text-[#16221d] rounded"
                aria-label="Chiudi regole"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-5 text-xs">
              
              <div className="p-3 bg-[#eef4f0] rounded-lg border border-[#ccdcd2] text-[#2c3b33] leading-relaxed">
                Configura le direttive che il tuo bot contabile deve rispettare per {companyName} ({selectedCounterparty !== 'ALL' ? selectedCounterparty : 'tutte le controparti'}).
              </div>

              {/* Toggles */}
              <div className="space-y-3">
                <label className="flex items-center justify-between p-3 rounded-lg border border-[#ccdcd2] bg-[#f7faf8] cursor-pointer">
                  <div>
                    <div className="font-semibold text-[#16221d]">Generazione Automatica Fatture Ricorrenti</div>
                    <div className="text-[#5e776a] text-[11px]">Emette e trasmette allo SDI le fatture dei clienti in abbonamento il 1° del mese</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={botSettings.autoInvoiceGeneration}
                    onChange={(e) => setBotSettings({ ...botSettings, autoInvoiceGeneration: e.target.checked })}
                    className="w-4 h-4 text-[#263e34] rounded focus:ring-[#263e34]"
                  />
                </label>

                <label className="flex items-center justify-between p-3 rounded-lg border border-[#ccdcd2] bg-[#f7faf8] cursor-pointer">
                  <div>
                    <div className="font-semibold text-[#16221d]">Riconciliazione Automatica Pagamenti &amp; Incassi</div>
                    <div className="text-[#5e776a] text-[11px]">Associa automaticamente i bonifici in ingresso alle fatture e chiude le partite su Zucchetti/SAP</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={botSettings.autoPaymentReconciliation}
                    onChange={(e) => setBotSettings({ ...botSettings, autoPaymentReconciliation: e.target.checked })}
                    className="w-4 h-4 text-[#263e34] rounded focus:ring-[#263e34]"
                  />
                </label>

                <label className="flex items-center justify-between p-3 rounded-lg border border-[#ccdcd2] bg-[#f7faf8] cursor-pointer">
                  <div>
                    <div className="font-semibold text-[#16221d]">Gestione Rinnovi Abbonamenti Ricorrenti (MRR)</div>
                    <div className="text-[#5e776a] text-[11px]">Rinnova automaticamente i canoni mensili/annuali e genera avviso di scadenza carta</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={botSettings.autoSubscriptionRenewal}
                    onChange={(e) => setBotSettings({ ...botSettings, autoSubscriptionRenewal: e.target.checked })}
                    className="w-4 h-4 text-[#263e34] rounded focus:ring-[#263e34]"
                  />
                </label>
              </div>

              {/* Threshold limits */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-[#465d50] mb-1">
                    Soglia Massima Spesa Senza Approvazione (€)
                  </label>
                  <input
                    type="number"
                    value={botSettings.autoExpenseAlertLimitEur}
                    onChange={(e) => setBotSettings({ ...botSettings, autoExpenseAlertLimitEur: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-[#ccdcd2] rounded-md font-mono-brand text-xs focus:outline-none focus:ring-1 focus:ring-[#263e34]"
                  />
                  <span className="text-[10px] text-[#5e776a] mt-0.5 block">
                    Le spese superiori richiederanno conferma da parte del responsabile.
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#465d50] mb-1">
                    Giorni di Tolleranza Prima del Sollecito
                  </label>
                  <input
                    type="number"
                    value={botSettings.autoReminderDaysOverdue}
                    onChange={(e) => setBotSettings({ ...botSettings, autoReminderDaysOverdue: parseInt(e.target.value) || 1 })}
                    className="w-full px-3 py-2 border border-[#ccdcd2] rounded-md font-mono-brand text-xs focus:outline-none focus:ring-1 focus:ring-[#263e34]"
                  />
                  <span className="text-[10px] text-[#5e776a] mt-0.5 block">
                    Giorni lavorativi dopo la scadenza fattura prima dell'invio sollecito.
                  </span>
                </div>
              </div>

              {/* Custom directives */}
              <div>
                <label className="block text-xs font-medium text-[#465d50] mb-1">
                  Direttive di Condotta Personalizzate per l'Interesse del Cliente
                </label>
                <textarea
                  rows={3}
                  value={botSettings.customClientDirectives}
                  onChange={(e) => setBotSettings({ ...botSettings, customClientDirectives: e.target.value })}
                  className="w-full p-3 border border-[#ccdcd2] rounded-md text-xs focus:outline-none focus:ring-1 focus:ring-[#263e34]"
                  placeholder="Scrivi qui istruzioni speciali per il bot..."
                />
              </div>

            </div>

            <div className="px-6 py-4 border-t border-[#ccdcd2] bg-[#f7faf8] flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsRulesModalOpen(false)}
                className="px-4 py-2 border border-[#ccdcd2] text-[#465d50] hover:text-[#16221d] rounded-md text-xs font-medium"
              >
                Chiudi
              </button>
              <button
                type="button"
                onClick={() => setIsRulesModalOpen(false)}
                className="px-5 py-2 bg-[#263e34] hover:bg-[#1a2d25] text-white rounded-md text-xs font-semibold tracking-wider uppercase transition-colors"
              >
                Salva Regole Bot
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Modal: New Record Creation Form */}
      {isNewRecordModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#16221d]/60 backdrop-blur-sm">
          <div className="bg-white rounded-xl border border-[#ccdcd2] shadow-2xl max-w-lg w-full overflow-hidden animate-in fade-in duration-200">
            
            <div className="px-6 py-4 border-b border-[#ccdcd2] bg-[#f7faf8] flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-mono-brand text-[#5e776a]">
                  Registrazione Movimento
                </span>
                <h3 className="font-serif-brand text-xl font-semibold text-[#16221d]">
                  {modalRecordType === 'fattura_attiva' ? 'Nuova Fattura Attiva' :
                   modalRecordType === 'spesa' ? 'Registra Spesa Fornitore' :
                   modalRecordType === 'incasso_pagamento' ? 'Registra Incasso / Pagamento' :
                   'Nuovo Abbonamento Ricorrente'}
                </h3>
              </div>
              <button
                onClick={() => setIsNewRecordModalOpen(false)}
                className="p-1 text-[#5e776a] hover:text-[#16221d] rounded"
                aria-label="Chiudi form"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateRecordSubmit} className="p-6 space-y-4 text-xs">
              
              <div>
                <label className="block text-xs font-medium text-[#465d50] mb-1">
                  Cliente o Fornitore
                </label>
                <input
                  type="text"
                  value={formClient}
                  onChange={(e) => setFormClient(e.target.value)}
                  placeholder={selectedCounterparty !== 'ALL' ? selectedCounterparty : 'Es. Studio Rossi S.r.l.'}
                  className="w-full px-3 py-2 border border-[#ccdcd2] rounded-md text-xs focus:outline-none focus:ring-1 focus:ring-[#263e34]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#465d50] mb-1">
                  Descrizione Operazione
                </label>
                <input
                  type="text"
                  required
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Es. Fornitura hardware, Consulenza mensile, Canone server..."
                  className="w-full px-3 py-2 border border-[#ccdcd2] rounded-md text-xs focus:outline-none focus:ring-1 focus:ring-[#263e34]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-[#465d50] mb-1">
                    Importo Lordo (€)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formAmount}
                    onChange={(e) => setFormAmount(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-[#ccdcd2] rounded-md font-mono-brand text-xs focus:outline-none focus:ring-1 focus:ring-[#263e34]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#465d50] mb-1">
                    Metodo di Pagamento
                  </label>
                  <select
                    value={formPaymentMethod}
                    onChange={(e) => setFormPaymentMethod(e.target.value)}
                    className="w-full px-3 py-2 border border-[#ccdcd2] rounded-md text-xs bg-white text-[#2c3b33] focus:outline-none focus:ring-1 focus:ring-[#263e34]"
                  >
                    <option value="Bonifico SEPA">Bonifico SEPA</option>
                    <option value="Addebito Diretto (SDD/RID)">Addebito Diretto (SDD/RID)</option>
                    <option value="Carta di Credito">Carta di Credito</option>
                    <option value="Ricevuta Bancaria (Ri.Ba)">Ricevuta Bancaria (Ri.Ba)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#465d50] mb-1">
                  Data di Scadenza o Valuta
                </label>
                <input
                  type="date"
                  value={formDueDate}
                  onChange={(e) => setFormDueDate(e.target.value)}
                  className="w-full px-3 py-2 border border-[#ccdcd2] rounded-md font-mono-brand text-xs focus:outline-none focus:ring-1 focus:ring-[#263e34]"
                />
              </div>

              <div className="pt-2 flex justify-end gap-3 border-t border-[#ccdcd2]">
                <button
                  type="button"
                  onClick={() => setIsNewRecordModalOpen(false)}
                  className="px-4 py-2 border border-[#ccdcd2] text-[#465d50] hover:text-[#16221d] rounded-md text-xs font-medium"
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#263e34] hover:bg-[#1a2d25] text-white rounded-md text-xs font-semibold tracking-wider uppercase transition-colors"
                >
                  Registra Movimento
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </section>
  );
};
