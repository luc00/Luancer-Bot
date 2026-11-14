import React, { useState } from 'react';
import {
  AutonomyLevel,
  BotFinishId,
  EmployeeModuleId,
  NonDelegableGuardrails,
  PurchasedBotConfig,
} from '../types/index.ts';
import {
  BOT_FINISH_PRESETS,
  NON_DELEGABLE_PILLARS,
  SIX_EMPLOYEES_CATALOG,
} from '../utils/botEngine.ts';
import { Check, ShieldAlert, SlidersHorizontal, X } from 'lucide-react';

interface PaidBotCustomizerModalProps {
  bot: PurchasedBotConfig;
  initialEmployeeId?: EmployeeModuleId;
  onClose: () => void;
  onSave: (updatedBot: PurchasedBotConfig) => Promise<void> | void;
}

const SOFTWARE_OPTIONS = [
  'Zucchetti',
  'Fatture in Cloud',
  'SAP S/4HANA',
  'Salesforce',
  'TeamSystem',
  'Telegram Bot',
  'PostHog',
  'Vercel',
  'Gmail & PEC',
];

export const PaidBotCustomizerModal: React.FC<PaidBotCustomizerModalProps> = ({
  bot,
  initialEmployeeId = 'emp-1',
  onClose,
  onSave,
}) => {
  const [draft, setDraft] = useState<PurchasedBotConfig>(() => JSON.parse(JSON.stringify(bot)));
  const [activeEmployeeId, setActiveEmployeeId] = useState<EmployeeModuleId>(initialEmployeeId);
  const [isSaving, setIsSaving] = useState(false);

  const activeModuleMeta =
    SIX_EMPLOYEES_CATALOG.find((m) => m.id === activeEmployeeId) || SIX_EMPLOYEES_CATALOG[0];
  const activeModuleCfg = draft.moduleConfigs[activeEmployeeId];

  const handleToggleEmployee = (id: EmployeeModuleId) => {
    setDraft((prev) => {
      const exists = prev.selectedEmployees.includes(id);
      if (exists && prev.selectedEmployees.length <= 1) return prev;
      const nextSelected = exists
        ? prev.selectedEmployees.filter((item) => item !== id)
        : [...prev.selectedEmployees, id];
      return {
        ...prev,
        selectedEmployees: nextSelected,
        moduleConfigs: {
          ...prev.moduleConfigs,
          [id]: {
            ...prev.moduleConfigs[id],
            enabled: !exists,
          },
        },
      };
    });
  };

  const handleToggleSoftware = (sw: string) => {
    setDraft((prev) => {
      const exists = prev.connectedSoftware.includes(sw);
      return {
        ...prev,
        connectedSoftware: exists
          ? prev.connectedSoftware.filter((s) => s !== sw)
          : [...prev.connectedSoftware, sw],
      };
    });
  };

  const handleUpdateGuardrail = (key: keyof NonDelegableGuardrails, value: string) => {
    setDraft((prev) => ({
      ...prev,
      guardrails: {
        ...prev.guardrails,
        [key]: value,
      },
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await onSave(draft);
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#16221d]/65 backdrop-blur-sm">
      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-2xl border border-[#ccdcd2] shadow-2xl max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div className="px-6 py-4 bg-[#f7faf8] border-b border-[#ccdcd2] flex items-center justify-between">
          <div>
            <div className="text-[11px] font-mono-brand uppercase tracking-wider text-[#263e34] font-semibold">
              Personalizzazione Sartoriale · {draft.botCode}
            </div>
            <h3 className="font-serif-brand text-2xl font-semibold text-[#16221d]">
              Configura i 6 Dipendenti &amp; Regole Non Delegabili
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Chiudi personalizzazione bot"
            className="p-1.5 rounded text-[#5e776a] hover:text-[#16221d] hover:bg-[#eef4f0]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
          {/* 1. Identity, Autonomy & 3D Finish */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-[11px] font-semibold text-[#465d50] mb-1">
                Nome Bot Aziendale
              </label>
              <input
                type="text"
                value={draft.name}
                onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                className="w-full px-3 py-2 border border-[#ccdcd2] rounded-md text-xs bg-white focus:outline-none focus:ring-1 focus:ring-[#263e34]"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-[#465d50] mb-1">
                Grado di Autonomia
              </label>
              <select
                value={draft.autonomyLevel}
                onChange={(e) => setDraft({ ...draft, autonomyLevel: e.target.value as AutonomyLevel })}
                className="w-full px-3 py-2 border border-[#ccdcd2] rounded-md text-xs bg-white focus:outline-none focus:ring-1 focus:ring-[#263e34]"
              >
                <option value="supervisionato">Supervisionato (Conferma umana)</option>
                <option value="semi-autonomo">Semi-Autonomo (Routine automatica)</option>
                <option value="piena-autonomia">Piena Autonomia 24/7</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-[#465d50] mb-1">
                Stile Atelier Luancer
              </label>
              <select
                value={draft.finishId}
                onChange={(e) => setDraft({ ...draft, finishId: e.target.value as BotFinishId })}
                className="w-full px-3 py-2 border border-[#ccdcd2] rounded-md text-xs bg-white focus:outline-none focus:ring-1 focus:ring-[#263e34]"
              >
                {BOT_FINISH_PRESETS.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* 2. Software Gestionali */}
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-wider text-[#5e776a] mb-2">
              Gestionali &amp; Canali Collegati
            </div>
            <div className="flex flex-wrap gap-2">
              {SOFTWARE_OPTIONS.map((sw) => {
                const active = draft.connectedSoftware.includes(sw);
                return (
                  <button
                    key={sw}
                    type="button"
                    onClick={() => handleToggleSoftware(sw)}
                    className={`px-3 py-1.5 rounded-md border text-[11px] font-medium flex items-center gap-1.5 transition-colors ${
                      active
                        ? 'bg-[#263e34] text-white border-[#263e34]'
                        : 'bg-[#f7faf8] text-[#465d50] border-[#ccdcd2] hover:border-[#263e34]'
                    }`}
                  >
                    {active && <Check className="w-3 h-3" />}
                    <span>{sw}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3. Interactive 6-Employee Customizer */}
          <div className="rounded-xl border border-[#ccdcd2] overflow-hidden">
            <div className="px-4 py-3 bg-[#f7faf8] border-b border-[#ccdcd2] flex items-center justify-between">
              <div className="flex items-center gap-2 font-semibold text-[#16221d]">
                <SlidersHorizontal className="w-4 h-4 text-[#263e34]" />
                <span>Personalizza Ciascuno dei 6 Dipendenti AI</span>
              </div>
              <span className="text-[11px] font-mono-brand text-[#5e776a]">
                {draft.selectedEmployees.length}/6 moduli abilitati
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12">
              {/* Employee selector sidebar */}
              <div className="md:col-span-5 border-b md:border-b-0 md:border-r border-[#ccdcd2] divide-y divide-[#eef4f0]">
                {SIX_EMPLOYEES_CATALOG.map((emp) => {
                  const isActiveTab = activeEmployeeId === emp.id;
                  const isIncluded = draft.selectedEmployees.includes(emp.id);
                  return (
                    <div
                      key={emp.id}
                      onClick={() => setActiveEmployeeId(emp.id)}
                      className={`p-3 cursor-pointer flex items-center justify-between gap-2 transition-colors ${
                        isActiveTab ? 'bg-[#eef4f0]' : 'bg-white hover:bg-[#f7faf8]'
                      }`}
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-mono-brand text-[10px] font-bold text-[#263e34]">
                            {emp.code}
                          </span>
                          <span className="font-semibold text-[#16221d] truncate">
                            {emp.roleTitle}
                          </span>
                        </div>
                        <div className="text-[11px] text-[#5e776a] truncate mt-0.5">
                          {emp.shortLabel}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleEmployee(emp.id);
                        }}
                        className={`px-2 py-1 rounded text-[10px] font-semibold shrink-0 border ${
                          isIncluded
                            ? 'bg-[#263e34] text-white border-[#263e34]'
                            : 'bg-white text-[#5e776a] border-[#ccdcd2]'
                        }`}
                      >
                        {isIncluded ? 'Attivo' : 'Escluso'}
                      </button>
                    </div>
                  );
                })}
              </div>

              {/* Active employee detail editor */}
              <div className="md:col-span-7 p-4 space-y-4 bg-white">
                <div>
                  <div className="text-[11px] font-mono-brand text-[#263e34] font-semibold">
                    {activeModuleMeta.code} · {activeModuleMeta.pluginStack.join(' · ')}
                  </div>
                  <h4 className="font-serif-brand text-lg font-semibold text-[#16221d]">
                    {activeModuleMeta.roleTitle}
                  </h4>
                  <p className="text-[11px] text-[#5e776a] mt-0.5 leading-relaxed">
                    {activeModuleMeta.subtitle}
                  </p>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-[#465d50] mb-1">
                    Direttive Operative &amp; Voce Aziendale
                  </label>
                  <textarea
                    rows={3}
                    value={activeModuleCfg?.directives || ''}
                    onChange={(e) =>
                      setDraft((prev) => ({
                        ...prev,
                        moduleConfigs: {
                          ...prev.moduleConfigs,
                          [activeEmployeeId]: {
                            ...prev.moduleConfigs[activeEmployeeId],
                            directives: e.target.value,
                          },
                        },
                      }))
                    }
                    className="w-full p-2.5 border border-[#ccdcd2] rounded-md text-xs focus:outline-none focus:ring-1 focus:ring-[#263e34]"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-[#465d50] mb-1">
                      Orario / Frequenza Automatica
                    </label>
                    <input
                      type="text"
                      value={activeModuleCfg?.schedule || ''}
                      onChange={(e) =>
                        setDraft((prev) => ({
                          ...prev,
                          moduleConfigs: {
                            ...prev.moduleConfigs,
                            [activeEmployeeId]: {
                              ...prev.moduleConfigs[activeEmployeeId],
                              schedule: e.target.value,
                            },
                          },
                        }))
                      }
                      className="w-full px-3 py-1.5 border border-[#ccdcd2] rounded-md text-xs focus:outline-none focus:ring-1 focus:ring-[#263e34]"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-[#465d50] mb-1">
                      Canale di Esecuzione &amp; Report
                    </label>
                    <input
                      type="text"
                      value={activeModuleCfg?.channel || ''}
                      onChange={(e) =>
                        setDraft((prev) => ({
                          ...prev,
                          moduleConfigs: {
                            ...prev.moduleConfigs,
                            [activeEmployeeId]: {
                              ...prev.moduleConfigs[activeEmployeeId],
                              channel: e.target.value,
                            },
                          },
                        }))
                      }
                      className="w-full px-3 py-1.5 border border-[#ccdcd2] rounded-md text-xs focus:outline-none focus:ring-1 focus:ring-[#263e34]"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 4. Le 4 Cose Che Non Si Delegano */}
          <div className="rounded-xl border border-[#ccdcd2] bg-[#f7faf8] p-4 space-y-3">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-[#9e7d53]" />
              <h4 className="text-xs font-semibold uppercase tracking-wider text-[#16221d]">
                Le 4 Cose Che Non Si Delegano (Regole di Salvaguardia del Titolare)
              </h4>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {NON_DELEGABLE_PILLARS.map((pillar) => (
                <div key={pillar.key} className="bg-white p-3 rounded-lg border border-[#ccdcd2]">
                  <div className="font-semibold text-[#263e34] text-xs">{pillar.title}</div>
                  <div className="text-[11px] text-[#5e776a] mb-2">{pillar.rule}</div>
                  <input
                    type="text"
                    value={draft.guardrails[pillar.key]}
                    onChange={(e) => handleUpdateGuardrail(pillar.key, e.target.value)}
                    className="w-full px-2.5 py-1.5 border border-[#ccdcd2] rounded text-[11px] focus:outline-none focus:ring-1 focus:ring-[#263e34]"
                  />
                </div>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-[#465d50] mb-1">
              Note Generali &amp; Tono Sartoriale del Bot
            </label>
            <textarea
              rows={2}
              value={draft.customDirectives}
              onChange={(e) => setDraft({ ...draft, customDirectives: e.target.value })}
              className="w-full p-2.5 border border-[#ccdcd2] rounded-md text-xs focus:outline-none focus:ring-1 focus:ring-[#263e34]"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-[#f7faf8] border-t border-[#ccdcd2] flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-[#ccdcd2] rounded-md text-xs font-medium text-[#465d50] hover:text-[#16221d]"
          >
            Annulla
          </button>
          <button
            type="submit"
            disabled={isSaving || !draft.name.trim()}
            data-testid="save-custom-bot-btn"
            className="px-5 py-2 bg-[#263e34] hover:bg-[#1a2d25] disabled:opacity-50 text-white rounded-md text-xs font-semibold uppercase tracking-wider"
          >
            {isSaving ? 'Salvataggio su Cloud...' : 'Salva Personalizzazione'}
          </button>
        </div>
      </form>
    </div>
  );
};
