import React, { useState } from 'react';
import { 
  BotInstance, 
  ActivityLogEntry, 
  Department, 
  ExecutiveReport 
} from '../types/index.ts';
import { 
  computeAutonomyEfficiency, 
  calculateSavings, 
  generateExecutiveReportData 
} from '../utils/botEngine.ts';
import { 
  FileText, 
  TrendingUp, 
  Clock, 
  CheckCircle, 
  AlertTriangle, 
  Download, 
  Printer, 
  Filter, 
  RefreshCw,
  Building,
  Check,
  ChevronRight,
  ShieldCheck,
  X
} from 'lucide-react';

interface PerformanceDashboardProps {
  bots: BotInstance[];
  activityLogs: ActivityLogEntry[];
  companyName?: string;
}

export const PerformanceDashboard: React.FC<PerformanceDashboardProps> = ({
  bots,
  activityLogs,
  companyName: propCompanyName,
}) => {
  const [selectedDeptFilter, setSelectedDeptFilter] = useState<string>('tutti');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('tutti');
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const companyName = propCompanyName?.trim() || 'La Mia Azienda';
  const [activeReport, setActiveReport] = useState<ExecutiveReport | null>(null);

  const efficiency = computeAutonomyEfficiency(activityLogs);
  const totalCostSavings = calculateSavings(efficiency.totalHoursSaved);

  const filteredLogs = activityLogs.filter(log => {
    if (selectedDeptFilter !== 'tutti' && log.department !== selectedDeptFilter) return false;
    if (selectedStatusFilter !== 'tutti' && log.status !== selectedStatusFilter) return false;
    return true;
  });

  const handleOpenReport = () => {
    const report = generateExecutiveReportData(bots, activityLogs, companyName);
    setActiveReport(report);
    setReportModalOpen(true);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <section className="py-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      
      {/* Header and Report CTA */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8 pb-6 border-b border-[#ccdcd2]">
        <div>
          <div className="text-xs font-semibold tracking-widest text-[#5e776a] uppercase mb-1">
            Analitica Direzionale &amp; Telemetria
          </div>
          <h2 className="font-serif-brand text-3xl sm:text-4xl font-semibold text-[#16221d]">
            Performance Operative in Tempo Reale
          </h2>
          <p className="text-sm text-[#465d50] mt-1 max-w-2xl">
            Rilevamento continuo dei flussi di lavoro gestiti in autonomia, ore uomo liberate e precisione di esecuzione sui software aziendali.
          </p>
        </div>

        <button
          onClick={handleOpenReport}
          className="px-5 py-2.5 text-xs font-semibold tracking-wider uppercase text-[#f7faf8] bg-[#263e34] hover:bg-[#1a2d25] rounded-md transition-all shadow-sm flex items-center gap-2 shrink-0 self-start sm:self-auto"
        >
          <FileText className="w-4 h-4" />
          Genera Report Esecutivo
        </button>
      </div>

      {/* Top 4 Real-Time Operational KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        
        {/* KPI 1 */}
        <div className="bg-white p-5 rounded-xl border border-[#ccdcd2] shadow-sm">
          <div className="flex items-center justify-between text-xs text-[#5e776a] mb-2">
            <span>Ore Uomo Risparmiate</span>
            <Clock className="w-4 h-4 text-[#263e34]" />
          </div>
          <div className="font-mono-brand text-3xl font-semibold text-[#16221d]">
            {efficiency.totalHoursSaved}h
          </div>
          <div className="text-[11px] text-[#5e776a] mt-2 flex items-center justify-between border-t border-[#f0f4f1] pt-2">
            <span>Ripartite su {bots.length} bot attivi</span>
            <span className="font-mono-brand text-[#263e34]">+{efficiency.totalMinutesSaved} min</span>
          </div>
        </div>

        {/* KPI 2 */}
        <div className="bg-white p-5 rounded-xl border border-[#ccdcd2] shadow-sm">
          <div className="flex items-center justify-between text-xs text-[#5e776a] mb-2">
            <span>Valore Economico Stimato</span>
            <TrendingUp className="w-4 h-4 text-[#263e34]" />
          </div>
          <div className="font-mono-brand text-3xl font-semibold text-[#16221d]">
            € {totalCostSavings.toLocaleString('it-IT')}
          </div>
          <div className="text-[11px] text-[#5e776a] mt-2 flex items-center justify-between border-t border-[#f0f4f1] pt-2">
            <span>Base € 35/h costo medio lavoro</span>
            <span className="text-[#263e34] font-medium">ROI 4.2x</span>
          </div>
        </div>

        {/* KPI 3 */}
        <div className="bg-white p-5 rounded-xl border border-[#ccdcd2] shadow-sm">
          <div className="flex items-center justify-between text-xs text-[#5e776a] mb-2">
            <span>Tasso Risoluzione Autonoma</span>
            <ShieldCheck className="w-4 h-4 text-[#263e34]" />
          </div>
          <div className="font-mono-brand text-3xl font-semibold text-[#16221d]">
            {efficiency.resolutionRate}%
          </div>
          <div className="text-[11px] text-[#5e776a] mt-2 flex items-center justify-between border-t border-[#f0f4f1] pt-2">
            <span>{efficiency.autonomousActions} autonome su {efficiency.totalActions}</span>
            <span className="text-[#263e34] font-medium">Zero deviazioni</span>
          </div>
        </div>

        {/* KPI 4 */}
        <div className="bg-white p-5 rounded-xl border border-[#ccdcd2] shadow-sm">
          <div className="flex items-center justify-between text-xs text-[#5e776a] mb-2">
            <span>Accuratezza Media Algoritmica</span>
            <CheckCircle className="w-4 h-4 text-[#263e34]" />
          </div>
          <div className="font-mono-brand text-3xl font-semibold text-[#16221d]">
            {efficiency.averageConfidence}%
          </div>
          <div className="text-[11px] text-[#5e776a] mt-2 flex items-center justify-between border-t border-[#f0f4f1] pt-2">
            <span>Convalida cross-check ERP</span>
            <span className="text-[#263e34] font-medium">Conforme GDPR</span>
          </div>
        </div>

      </div>

      {/* Two Column Layout: Departmental Efficiency on Left, Live Activity Feed on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left: Departmental Breakdown */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white p-6 rounded-xl border border-[#ccdcd2] shadow-sm">
            <h3 className="text-sm font-semibold text-[#16221d] uppercase tracking-wider mb-4">
              Indice di Rendimento per Reparto
            </h3>

            <div className="space-y-4">
              {[
                { name: 'Amministrazione & Tesoreria', pct: 98, hours: '64.2h', ops: '1.420 op', color: 'bg-[#263e34]' },
                { name: 'Assistenza Clienti 24/7', pct: 95, hours: '112.5h', ops: '2.890 op', color: 'bg-[#3b5e50]' },
                { name: 'Logistica & Magazzino', pct: 91, hours: '48.0h', ops: '640 op', color: 'bg-[#557e6c]' },
                { name: 'Vendite & Preventivazione', pct: 89, hours: '32.4h', ops: '410 op', color: 'bg-[#739d8b]' },
                { name: 'Risorse Umane & Contratti', pct: 94, hours: '21.0h', ops: '290 op', color: 'bg-[#8faea0]' }
              ].map((item, idx) => (
                <div key={idx} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-[#16221d]">{item.name}</span>
                    <span className="font-mono-brand text-[#5e776a] text-[11px]">
                      {item.hours} · {item.pct}% autonomia
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-[#eef4f0] overflow-hidden">
                    <div 
                      className={`h-full rounded-full ${item.color} transition-all duration-500`} 
                      style={{ width: `${item.pct}%` }} 
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 pt-4 border-t border-[#ccdcd2]/60 text-xs text-[#5e776a] leading-relaxed">
              I dati sono calcolati analizzando le risposte convalidate, le transazioni contabili registrate nei gestionali e il tempo medio di evasione pratiche.
            </div>
          </div>
        </div>

        {/* Right: Real-Time Live Activity Stream */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-white rounded-xl border border-[#ccdcd2] shadow-sm p-6">
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 pb-3 border-b border-[#ccdcd2]">
              <div>
                <h3 className="text-sm font-semibold text-[#16221d] uppercase tracking-wider">
                  Registro Attività in Tempo Reale
                </h3>
                <span className="text-xs text-[#5e776a]">
                  Tracciamento conforme per audit interno
                </span>
              </div>

              {/* Filters */}
              <div className="flex items-center gap-2 text-xs">
                <select
                  value={selectedDeptFilter}
                  onChange={(e) => setSelectedDeptFilter(e.target.value)}
                  className="px-2.5 py-1.5 border border-[#ccdcd2] rounded-md text-xs bg-white text-[#2c3b33] focus:outline-none focus:ring-1 focus:ring-[#263e34]"
                >
                  <option value="tutti">Tutti i reparti</option>
                  <option value="amministrazione">Amministrazione</option>
                  <option value="assistenza">Assistenza</option>
                  <option value="magazzino">Magazzino</option>
                </select>

                <select
                  value={selectedStatusFilter}
                  onChange={(e) => setSelectedStatusFilter(e.target.value)}
                  className="px-2.5 py-1.5 border border-[#ccdcd2] rounded-md text-xs bg-white text-[#2c3b33] focus:outline-none focus:ring-1 focus:ring-[#263e34]"
                >
                  <option value="tutti">Tutti gli stati</option>
                  <option value="completato_autonomo">Autonomi</option>
                  <option value="approvato_supervisore">Supervisionati</option>
                </select>
              </div>
            </div>

            {/* List of activity items */}
            <div className="space-y-3 max-h-[460px] overflow-y-auto pr-1">
              {filteredLogs.map(log => (
                <div
                  key={log.id}
                  className="p-3.5 rounded-lg border border-[#ccdcd2]/70 bg-[#f7faf8] hover:bg-[#f0f6f2] transition-colors text-xs"
                >
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className="font-mono-brand text-[11px] text-[#5e776a]">
                        {log.timestamp}
                      </span>
                      <span className="text-xs font-semibold text-[#16221d]">
                        {log.botName}
                      </span>
                    </div>

                    <span className={`text-[11px] font-mono-brand ${
                      log.status === 'completato_autonomo' 
                        ? 'text-[#263e34] font-medium' 
                        : 'text-amber-800'
                    }`}>
                      {log.status === 'completato_autonomo' ? 'Risolto Autonomamente' : 'Approvato da Supervisore'}
                    </span>
                  </div>

                  <p className="text-[#2c3b33] font-medium mb-1.5">
                    {log.actionTaken}
                  </p>

                  <p className="text-[11px] text-[#5e776a] leading-relaxed mb-2">
                    {log.details}
                  </p>

                  <div className="flex items-center justify-between text-[11px] text-[#5e776a] pt-2 border-t border-[#e5eee8]">
                    <span className="font-mono-brand">
                      Software: {log.targetSoftware}
                    </span>
                    <span className="font-mono-brand text-[#263e34]">
                      +{log.timeSavedMinutes} min salvati · Confidenza {log.confidenceScore}%
                    </span>
                  </div>
                </div>
              ))}
            </div>

          </div>
        </div>

      </div>

      {/* Printable / Downloadable Executive Report Modal */}
      {reportModalOpen && activeReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#16221d]/70 backdrop-blur-sm">
          <div className="bg-white rounded-xl border border-[#ccdcd2] shadow-2xl max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden">
            
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-[#ccdcd2] bg-[#f7faf8] flex items-center justify-between print:hidden">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-[#263e34]" />
                <span className="font-serif-brand text-xl font-semibold text-[#16221d]">
                  Dossier Esecutivo sulle Prestazioni
                </span>
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handlePrint}
                  className="px-3 py-1.5 border border-[#ccdcd2] hover:bg-[#eef4f0] text-xs font-medium rounded-md flex items-center gap-1.5 text-[#263e34] transition-colors"
                >
                  <Printer className="w-3.5 h-3.5" />
                  Stampa / Salva PDF
                </button>
                <button
                  type="button"
                  onClick={() => setReportModalOpen(false)}
                  className="p-1 text-[#5e776a] hover:text-[#16221d] rounded"
                  aria-label="Chiudi report"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Document Body (Printable Formatted Dossier) */}
            <div className="p-8 sm:p-10 overflow-y-auto space-y-8 text-xs leading-relaxed text-[#16221d] print:p-0">
              
              {/* Document Letterhead */}
              <div className="flex items-start justify-between border-b-2 border-[#16221d] pb-6">
                <div>
                  <div className="font-serif-brand text-2xl font-bold tracking-wider text-[#16221d]">
                    LUANCER &amp; CO.
                  </div>
                  <div className="text-[10px] tracking-[0.25em] text-[#5e776a] uppercase">
                    QUALITY YOU CAN TRUST · ATELIER DI AUTOMAZIONE AZIENDALE
                  </div>
                </div>

                <div className="text-right text-[11px] text-[#5e776a] font-mono-brand space-y-0.5">
                  <div>Rif: DOSSIER-PERF-{new Date().getFullYear()}</div>
                  <div>Generato: {activeReport.generatedAt}</div>
                  <div>Ambito: {activeReport.period}</div>
                </div>
              </div>

              {/* Title & Company Name */}
              <div>
                <h3 className="font-serif-brand text-2xl sm:text-3xl font-semibold text-[#16221d] mb-2">
                  Rapporto Direzionale sulle Prestazioni dei Bot Autonomi
                </h3>
                <p className="text-xs text-[#5e776a]">
                  Documento di sintesi predisposto per il Comitato di Direzione e i Responsabili di Reparto.
                </p>
              </div>

              {/* Executive Summary Metrics Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-5 rounded-lg bg-[#f7faf8] border border-[#ccdcd2]">
                <div>
                  <div className="text-[11px] text-[#5e776a] uppercase font-semibold">Ore Uomo Totali</div>
                  <div className="font-mono-brand text-2xl font-bold text-[#16221d] mt-1">
                    {activeReport.totalHoursSaved} ore
                  </div>
                  <div className="text-[10px] text-[#5e776a] mt-0.5">Liberate per task strategici</div>
                </div>

                <div>
                  <div className="text-[11px] text-[#5e776a] uppercase font-semibold">Risparmio Economico</div>
                  <div className="font-mono-brand text-2xl font-bold text-[#263e34] mt-1">
                    € {activeReport.estimatedCostSavingsEur.toLocaleString('it-IT')}
                  </div>
                  <div className="text-[10px] text-[#5e776a] mt-0.5">Costo lavoro reinvestito</div>
                </div>

                <div>
                  <div className="text-[11px] text-[#5e776a] uppercase font-semibold">Tasso di Autonomia</div>
                  <div className="font-mono-brand text-2xl font-bold text-[#16221d] mt-1">
                    {activeReport.autonomousResolutionRate}%
                  </div>
                  <div className="text-[10px] text-[#5e776a] mt-0.5">Senza supervisione umana</div>
                </div>

                <div>
                  <div className="text-[11px] text-[#5e776a] uppercase font-semibold">Operazioni Totali</div>
                  <div className="font-mono-brand text-2xl font-bold text-[#16221d] mt-1">
                    {activeReport.totalOperations}
                  </div>
                  <div className="text-[10px] text-[#5e776a] mt-0.5">Eseguite su ERP / CRM</div>
                </div>
              </div>

              {/* Key Insights Section */}
              <div className="space-y-3">
                <h4 className="font-serif-brand text-lg font-semibold text-[#16221d] border-b border-[#ccdcd2] pb-1">
                  01. Evidenze Principali e Impatto Organizzativo
                </h4>
                <ul className="space-y-2 list-none">
                  {activeReport.keyInsights.map((insight, idx) => (
                    <li key={idx} className="flex items-start gap-2.5 text-xs text-[#2c3b33]">
                      <span className="font-mono-brand text-[#263e34] font-bold">·</span>
                      <span>{insight}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Departmental Table */}
              <div className="space-y-3">
                <h4 className="font-serif-brand text-lg font-semibold text-[#16221d] border-b border-[#ccdcd2] pb-1">
                  02. Dettaglio di Efficienza per Centro di Costo
                </h4>
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-[#ccdcd2] text-[#5e776a] font-semibold">
                      <th className="py-2">Dipartimento</th>
                      <th className="py-2 text-right">Ore Salvate</th>
                      <th className="py-2 text-right">Operazioni</th>
                      <th className="py-2 text-right">Indice Autonomia</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#f0f4f1]">
                    {activeReport.departmentBreakdown.map((row, idx) => (
                      <tr key={idx} className="hover:bg-[#f7faf8]">
                        <td className="py-2.5 font-medium text-[#16221d]">{row.label}</td>
                        <td className="py-2.5 text-right font-mono-brand text-[#263e34] font-semibold">{row.hoursSaved}h</td>
                        <td className="py-2.5 text-right font-mono-brand text-[#5e776a]">{row.operationsCount}</td>
                        <td className="py-2.5 text-right font-mono-brand text-[#16221d]">{row.efficiencyIndex}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Recommendations Section */}
              <div className="space-y-3">
                <h4 className="font-serif-brand text-lg font-semibold text-[#16221d] border-b border-[#ccdcd2] pb-1">
                  03. Raccomandazioni Strategiche Luancer &amp; Co.
                </h4>
                <div className="space-y-2">
                  {activeReport.recommendations.map((rec, idx) => (
                    <div key={idx} className="p-3 bg-[#f7faf8] border border-[#ccdcd2] rounded-md text-xs text-[#2c3b33]">
                      {rec}
                    </div>
                  ))}
                </div>
              </div>

              {/* Signature Block */}
              <div className="pt-8 border-t border-[#ccdcd2] flex items-center justify-between text-[11px] text-[#5e776a]">
                <div>
                  Certificato da: <strong>Luancer Automated Quality Engine</strong>
                </div>
                <div className="text-right">
                  Firma di Convalida Direzionale: ____________________________
                </div>
              </div>

            </div>

          </div>
        </div>
      )}

    </section>
  );
};
