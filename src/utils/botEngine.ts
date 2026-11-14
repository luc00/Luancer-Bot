import {
  BotInstance,
  BotTrigger,
  BotAction,
  ActivityLogEntry,
  Department,
  PricingPlan,
  ExecutiveReport,
  SoftwareIntegration,
  FinancialRecord,
  FinancialRecordType,
  FinancialStatus,
  ClientProfile,
  OmniBotFinancialSettings,
  BotFinishId,
  EmployeeModuleId,
  EmployeeSkillModule,
  EmployeeModuleCustomConfig,
  NonDelegableGuardrails,
  PurchasedBotConfig,
  BusinessProfile
} from '../types/index.ts';

export const HOURLY_LABOR_COST_DEFAULT_EUR = 35;

/**
 * Formats a monetary number into Italian currency string (e.g. "€ 2.940,20").
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('it-IT', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
}

/**
 * Calculates estimated cost savings based on hours saved and average hourly cost.
 */
export function calculateSavings(hoursSaved: number, hourlyRateEur: number = HOURLY_LABOR_COST_DEFAULT_EUR): number {
  if (hoursSaved < 0 || hourlyRateEur < 0) return 0;
  return Math.round(hoursSaved * hourlyRateEur);
}

/**
 * Calculates pricing details for a given plan and billing cadence.
 */
export function calculatePlanPricing(
  plan: PricingPlan, 
  billingCycle: 'monthly' | 'annual'
): {
  monthlyRate: number;
  totalAnnualBilled: number;
  annualSavingsEur: number;
  discountPercentage: number;
} {
  if (plan.id === 'su_misura') {
    return {
      monthlyRate: 0,
      totalAnnualBilled: 0,
      annualSavingsEur: 0,
      discountPercentage: 0
    };
  }

  const isAnnual = billingCycle === 'annual';
  const monthlyRate = isAnnual ? plan.annualMonthlyPrice : plan.monthlyPrice;
  const totalAnnualBilled = isAnnual ? plan.annualMonthlyPrice * 12 : plan.monthlyPrice * 12;
  const fullYearRegularCost = plan.monthlyPrice * 12;
  const annualSavingsEur = isAnnual ? Math.max(0, fullYearRegularCost - (plan.annualMonthlyPrice * 12)) : 0;
  const discountPercentage = plan.monthlyPrice > 0 
    ? Math.round(((plan.monthlyPrice - plan.annualMonthlyPrice) / plan.monthlyPrice) * 100)
    : 0;

  return {
    monthlyRate,
    totalAnnualBilled,
    annualSavingsEur,
    discountPercentage
  };
}

/**
 * Computes overall autonomy efficiency metrics from activity logs.
 */
export function computeAutonomyEfficiency(logs: ActivityLogEntry[]): {
  resolutionRate: number;
  totalActions: number;
  autonomousActions: number;
  supervisedActions: number;
  totalMinutesSaved: number;
  totalHoursSaved: number;
  averageConfidence: number;
} {
  if (!logs || logs.length === 0) {
    return {
      resolutionRate: 0,
      totalActions: 0,
      autonomousActions: 0,
      supervisedActions: 0,
      totalMinutesSaved: 0,
      totalHoursSaved: 0,
      averageConfidence: 0
    };
  }

  const totalActions = logs.length;
  const autonomousActions = logs.filter(l => l.status === 'completato_autonomo').length;
  const supervisedActions = logs.filter(l => l.status === 'approvato_supervisore').length;
  const totalMinutesSaved = logs.reduce((acc, l) => acc + (l.timeSavedMinutes || 0), 0);
  const totalConfidence = logs.reduce((acc, l) => acc + (l.confidenceScore || 0), 0);

  const resolutionRate = Math.round((autonomousActions / totalActions) * 1000) / 10;
  const averageConfidence = Math.round((totalConfidence / totalActions) * 10) / 10;
  const totalHoursSaved = Math.round((totalMinutesSaved / 60) * 10) / 10;

  return {
    resolutionRate,
    totalActions,
    autonomousActions,
    supervisedActions,
    totalMinutesSaved,
    totalHoursSaved,
    averageConfidence
  };
}

/**
 * Intelligent client/backend bot synthesizer that translates natural language intentions
 * into a fully structured, enterprise-ready bot specification with triggers and actions.
 */
export function generateBotDraftFromPrompt(prompt: string, preferredDepartment?: Department): BotInstance {
  const text = prompt.toLowerCase();
  
  let dept: Department = preferredDepartment || 'amministrazione';
  let name = 'Assistente Operativo Autonomo';
  let code = `BOT-${Math.floor(100 + Math.random() * 900)}`;
  let description = prompt.trim() || 'Bot configurato per la gestione autonoma dei processi aziendali.';
  let software: string[] = ['Zucchetti', 'Fatture in Cloud'];
  let triggers: BotTrigger[] = [
    {
      id: 'tr-1',
      source: 'Rilevamento variazione stato record',
      condition: 'Quando una scadenza supera i termini senza accredito registrato',
      type: 'evento'
    },
    {
      id: 'tr-2',
      source: 'Sincronizzazione oraria ERP',
      condition: 'Ogni giorno alle ore 08:30 per riconciliazione estratti conto',
      type: 'schedulato'
    }
  ];
  let actions: BotAction[] = [
    {
      id: 'act-1',
      title: 'Verifica congruenza dati contabili',
      targetSoftware: 'Zucchetti',
      requiresApproval: false,
      description: 'Confronta il partitario contabile con gli incassi registrati e calcola scostamenti.'
    },
    {
      id: 'act-2',
      title: 'Generazione bozza comunicazione formale',
      targetSoftware: 'Mail Gateway & PEC',
      requiresApproval: true,
      description: 'Predispone la missiva personalizzata allegando estratto conto timbrato digitalmente.'
    }
  ];
  let directives = 'Opera con massima accuratezza e conformità contabile. Richiedi revisione umana solo per importi superiori a € 2.500.';

  // Department and purpose detection
  if (text.includes('fattur') || text.includes('pagament') || text.includes('credito') || text.includes('banca') || text.includes('fisco') || text.includes('contabil')) {
    dept = 'amministrazione';
    name = 'Luancer CashFlow & Crediti';
    code = 'BOT-ADM-04';
    software = ['Zucchetti', 'Fatture in Cloud', 'TeamSystem'];
    triggers = [
      { id: 'tr-1', source: 'Estratto conto e scadenziario ERP', condition: 'Scadenza fattura non incassata a +3 giorni lavorativi', type: 'evento' },
      { id: 'tr-2', source: 'Riconciliazione bancaria PSD2', condition: 'Accredito bonifico privo di causale univoca', type: 'webhook' }
    ];
    actions = [
      { id: 'act-1', title: 'Riconciliazione automatica partita cliente', targetSoftware: 'Zucchetti', requiresApproval: false, description: 'Riconcilia le partite aperte abbinando importo e anagrafica P.IVA.' },
      { id: 'act-2', title: 'Sollecito di cortesia su misura', targetSoftware: 'Mail / PEC', requiresApproval: false, description: 'Invia promemoria cordiale con link per quietanza o estratto conto.' },
      { id: 'act-3', title: 'Segnalazione scostamento insoluto', targetSoftware: 'TeamSystem', requiresApproval: true, description: 'Aggiorna fido cliente e notifica la direzione se il credito supera la soglia di rischio.' }
    ];
    directives = 'Mantieni tono istituzionale ed impeccabile. Verifica sempre la quietanza prima di ogni notifica.';
  } else if (text.includes('client') || text.includes('ticket') || text.includes('assistenz') || text.includes('support') || text.includes('reclamo')) {
    dept = 'assistenza';
    name = 'Luancer Concierge Clienti 24/7';
    code = 'BOT-AST-02';
    software = ['Salesforce', 'Zendesk', 'Slack'];
    triggers = [
      { id: 'tr-1', source: 'Ticket di assistenza inbound', condition: 'Nuova richiesta cliente su canale email o portale web', type: 'webhook' },
      { id: 'tr-2', source: 'SLA timer monitor', condition: 'Ticket prioritario non gestito entro 45 minuti', type: 'schedulato' }
    ];
    actions = [
      { id: 'act-1', title: 'Diagnosi e categorizzazione automatica', targetSoftware: 'Salesforce', requiresApproval: false, description: 'Estrae problema, livello urgenza e storico contrattuale del cliente.' },
      { id: 'act-2', title: 'Risoluzione autonoma quesito operativo', targetSoftware: 'Helpdesk / Email', requiresApproval: false, description: 'Risponde con guida mirata e istruzioni puntuali se il match supera il 95% di confidenza.' },
      { id: 'act-3', title: 'Escalation verso specialista dedicato', targetSoftware: 'Slack / Teams', requiresApproval: false, description: 'Inoltra dossier completo con sintesi al team leader in caso di caso complesso.' }
    ];
    directives = 'Empatia, precisione esecutiva e chiarezza immediata. Evita gergo robotico e prediligi un approccio sartoriale.';
  } else if (text.includes('magazzin') || text.includes('scort') || text.includes('fornitor') || text.includes('logist') || text.includes('ordini fornit')) {
    dept = 'magazzino';
    name = 'Luancer Sentinel Logistica';
    code = 'BOT-LOG-07';
    software = ['SAP S/4HANA', 'Danea Easyfatt'];
    triggers = [
      { id: 'tr-1', source: 'Giacenza minima di sicurezza', condition: 'Livello scorta SKU scende sotto 15 giorni di lead time medio', type: 'evento' },
      { id: 'tr-2', source: 'Arrivo bolla / DDT fornitore', condition: 'Rilevamento documento di trasporto in ingresso', type: 'webhook' }
    ];
    actions = [
      { id: 'act-1', title: 'Calcolo fabbisogno e ordine di riordino', targetSoftware: 'SAP S/4HANA', requiresApproval: true, description: 'Elabora il lotto economico ottimale basato sulla stagionalità e genera bozza d\'ordine.' },
      { id: 'act-2', title: 'Verifica conformità DDT vs Ordine d\'acquisto', targetSoftware: 'Danea Easyfatt', requiresApproval: false, description: 'Controlla quantitativi e prezzi pattuiti, segnalando eventuali discordanze.' }
    ];
    directives = 'Ottimizza i costi di stoccaggio e azzera i fermi produzione. Allerta tempestivamente per ritardi fornitore superiori a 24 ore.';
  } else if (text.includes('vendit') || text.includes('lead') || text.includes('preventiv') || text.includes('commercial') || text.includes('crm')) {
    dept = 'vendite';
    name = 'Luancer Deal Strategist';
    code = 'BOT-VND-03';
    software = ['HubSpot', 'Salesforce', 'Microsoft Dynamics 365'];
    triggers = [
      { id: 'tr-1', source: 'Nuovo contatto qualificato (Lead)', condition: 'Registrazione azienda con fatturato target sul portale', type: 'webhook' },
      { id: 'tr-2', source: 'Follow-up preventivo inevaso', condition: 'Proposta commerciale non visionata dopo 5 giorni dall\'invio', type: 'schedulato' }
    ];
    actions = [
      { id: 'act-1', title: 'Arricchimento anagrafico B2B', targetSoftware: 'Salesforce', requiresApproval: false, description: 'Interroga banche dati camerali e integra P.IVA, settore ATECO e numero dipendenti.' },
      { id: 'act-2', title: 'Preparazione bozza preventivo personalizzato', targetSoftware: 'Microsoft Dynamics 365', requiresApproval: true, description: 'Seleziona il listino dedicato e redige la proposta con clausole commerciali appropriate.' }
    ];
    directives = 'Massimizza il valore percepito dal cliente. Evidenzia sempre garanzie e affidabilità Luancer & Co.';
  } else if (text.includes('hr') || text.includes('personale') || text.includes('ferie') || text.includes('turni') || text.includes('dipendent')) {
    dept = 'hr';
    name = 'Luancer Human Resources Butler';
    code = 'BOT-HR-05';
    software = ['Zucchetti HR', 'TeamSystem'];
    triggers = [
      { id: 'tr-1', source: 'Richiesta piano ferie / permessi', condition: 'Inserimento richiesta assenza da parte di un collaboratore', type: 'evento' },
      { id: 'tr-2', source: 'Scadenza certificazioni obbligatorie', condition: 'Scadenza corsi sicurezza sul lavoro a 30 giorni', type: 'schedulato' }
    ];
    actions = [
      { id: 'act-1', title: 'Verifica copertura presidio reparto', targetSoftware: 'Zucchetti HR', requiresApproval: false, description: 'Analizza il calendario del team garantendo la presenza minima del 60% dell\'organico.' },
      { id: 'act-2', title: 'Approvazione o notifica al responsabile', targetSoftware: 'Zucchetti HR', requiresApproval: true, description: 'Approva in automatico le richieste conformi o invia notifica di alert per sovrapposizioni.' }
    ];
    directives = 'Tutela la trasparenza e il rispetto dei contratti collettivi. Gestione riservata e conforme al GDPR.';
  }

  return {
    id: `bot-inst-${Date.now()}`,
    name,
    code,
    department: dept,
    description,
    autonomyLevel: 'semi-autonomo',
    status: 'attivo',
    primarySoftware: software,
    triggers,
    actions,
    systemDirectives: directives,
    metrics: {
      actionsExecuted: 12,
      hoursSavedMonth: 8.5,
      accuracyPercent: 99.2,
      lastActive: 'Pochi istanti fa'
    },
    createdAt: new Date().toISOString()
  };
}

/**
 * Generates structured executive report data ready for rendering and export.
 */
export function generateExecutiveReportData(
  bots: BotInstance[],
  logs: ActivityLogEntry[],
  companyName: string = 'Azienda Cliente Luancer'
): ExecutiveReport {
  const efficiency = computeAutonomyEfficiency(logs);
  const totalCostSavings = calculateSavings(efficiency.totalHoursSaved);

  const departments: Department[] = ['amministrazione', 'assistenza', 'vendite', 'magazzino', 'hr', 'operations'];
  const deptLabels: Record<Department, string> = {
    amministrazione: 'Amministrazione & Tesoreria',
    assistenza: 'Assistenza & Relazioni Clienti',
    vendite: 'Vendite & Sviluppo Commerciale',
    magazzino: 'Logistica & Approvvigionamento',
    hr: 'Risorse Umane & Organizzazione',
    operations: 'Operazioni & Flussi di Lavoro'
  };

  const departmentBreakdown = departments.map(d => {
    const deptLogs = logs.filter(l => l.department === d);
    const deptMinutes = deptLogs.reduce((acc, l) => acc + (l.timeSavedMinutes || 0), 0);
    const deptHours = Math.round((deptMinutes / 60) * 10) / 10;
    const autonomousCount = deptLogs.filter(l => l.status === 'completato_autonomo').length;
    const efficiencyIndex = deptLogs.length > 0 
      ? Math.round((autonomousCount / deptLogs.length) * 100) 
      : 90;

    return {
      department: d,
      label: deptLabels[d],
      hoursSaved: deptHours,
      operationsCount: deptLogs.length,
      efficiencyIndex
    };
  });

  return {
    generatedAt: new Date().toLocaleDateString('it-IT', { 
      day: 'numeric', 
      month: 'long', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }),
    companyName,
    period: 'Ultimi 30 Giorni',
    totalHoursSaved: efficiency.totalHoursSaved,
    estimatedCostSavingsEur: totalCostSavings,
    autonomousResolutionRate: efficiency.resolutionRate,
    totalOperations: efficiency.totalActions,
    departmentBreakdown,
    keyInsights: [
      `Il tasso di risoluzione autonoma ha raggiunto il ${efficiency.resolutionRate}%, riducendo i tempi di risposta medi a meno di 140ms.`,
      `I bot di Amministrazione e Tesoreria hanno azzerato i ritardi nei solleciti di pagamento, recuperando il 24% del cash flow scaduto.`,
      `Zero errori riscontrati nelle trascrizioni tra ERP aziendale e software contabile.`,
      `Il tempo medio risparmiato per operazione è di ${Math.round(efficiency.totalMinutesSaved / (efficiency.totalActions || 1))} minuti.`
    ],
    recommendations: [
      'Espandere l\'autonomia del Bot di Gestione Magazzino dal livello semi-autonomo alla piena autonomia per ordini d\'acquisto sotto € 1.500.',
      'Attivare la sincronizzazione in tempo reale via Webhook per il gestionale Zucchetti per anticipare la chiusura contabile mensile.',
      'Integrare il canale PEC istituzionale per la gestione automatizzata dei ricorsi e delle comunicazioni legali.'
    ]
  };
}

// Pre-seeded curated catalogue of business bots
export const INITIAL_BOTS: BotInstance[] = [
  {
    id: 'bot-adm-1',
    name: 'Luancer Riconciliazione & Solleciti',
    code: 'BOT-ADM-01',
    department: 'amministrazione',
    description: 'Monitora costantemente le scadenze fatture su Zucchetti e Fatture in Cloud, invia solleciti gentili e riconcilia le rimesse bancarie in autonomia.',
    autonomyLevel: 'piena-autonomia',
    status: 'attivo',
    primarySoftware: ['Zucchetti', 'Fatture in Cloud'],
    triggers: [
      { id: 't1', source: 'Scadenzario Clienti', condition: 'Fattura scaduta oltre 4 giorni', type: 'evento' },
      { id: 't2', source: 'Flusso CBI Bancario', condition: 'Incasso registrato con causale identificata', type: 'schedulato' }
    ],
    actions: [
      { id: 'a1', title: 'Abbinamento partita contabile', targetSoftware: 'Zucchetti', requiresApproval: false, description: 'Chiude la partita contabile senza intervento umano.' },
      { id: 'a2', title: 'Sollecito graduato di cortesia', targetSoftware: 'Mail / PEC', requiresApproval: false, description: 'Spedisce estratto conto aggiornato con coordinate bancarie.' }
    ],
    systemDirectives: 'Massima deferenza nei confronti dei clienti storici (rating AAA). Invia allerta al CFO per importi > € 5.000.',
    metrics: {
      actionsExecuted: 1420,
      hoursSavedMonth: 64.2,
      accuracyPercent: 99.8,
      lastActive: '4 minuti fa'
    },
    createdAt: '2026-02-15'
  },
  {
    id: 'bot-ast-1',
    name: 'Luancer Assistenza Clienti & SLA',
    code: 'BOT-AST-01',
    department: 'assistenza',
    description: 'Gestisce il primo livello di supporto, risponde a domande su ordini e spedizioni, aggiorna lo stato dei ticket su Salesforce.',
    autonomyLevel: 'semi-autonomo',
    status: 'attivo',
    primarySoftware: ['Salesforce', 'TeamSystem'],
    triggers: [
      { id: 't3', source: 'Form assistenza & Email', condition: 'Richiesta di tracciamento o stato reso', type: 'webhook' }
    ],
    actions: [
      { id: 'a3', title: 'Recupero codice spedizione dal corriere', targetSoftware: 'GLS / DHL API', requiresApproval: false, description: 'Interroga il webservice del corriere e restituisce tracking in tempo reale.' },
      { id: 'a4', title: 'Aggiornamento scheda cliente', targetSoftware: 'Salesforce', requiresApproval: false, description: 'Aggiorna note e chiude il ticket con soddisfazione utente.' }
    ],
    systemDirectives: 'Tono caldo, professionale, empatico. Non promettere sconti o rimborsi superiori a € 50 senza ok del customer success manager.',
    metrics: {
      actionsExecuted: 2890,
      hoursSavedMonth: 112.5,
      accuracyPercent: 98.6,
      lastActive: 'Adesso'
    },
    createdAt: '2026-02-10'
  },
  {
    id: 'bot-mag-1',
    name: 'Luancer Inventario & Riordino',
    code: 'BOT-MAG-01',
    department: 'magazzino',
    description: 'Calcola la velocità di rotazione delle merci su SAP e predispone gli ordini di fornitura ottimali prima che si verifichi uno stockout.',
    autonomyLevel: 'supervisionato',
    status: 'attivo',
    primarySoftware: ['SAP S/4HANA', 'Danea Easyfatt'],
    triggers: [
      { id: 't5', source: 'Rilevazione inventario fisico', condition: 'Scorta prevista sotto soglia minima nei 10gg successivi', type: 'schedulato' }
    ],
    actions: [
      { id: 'a5', title: 'Generazione bozza ordine fornitore', targetSoftware: 'SAP S/4HANA', requiresApproval: true, description: 'Compila l\'ordine applicando il listino prezzi concordato e lo sottopone al responsabile acquisti.' }
    ],
    systemDirectives: 'Valuta tempi di consegna storici dei fornitori prima di proporre il quantitativo.',
    metrics: {
      actionsExecuted: 640,
      hoursSavedMonth: 48.0,
      accuracyPercent: 100.0,
      lastActive: '12 minuti fa'
    },
    createdAt: '2026-01-20'
  }
];

// Seeded enterprise software integrations
export const INITIAL_INTEGRATIONS: SoftwareIntegration[] = [
  {
    id: 'zucchetti',
    name: 'Zucchetti Omnia & Gestionale 1',
    category: 'ERP & Contabilità',
    logoText: 'ZUCCHETTI',
    description: 'Integrazione bidirezionale per la sincronizzazione di fatture elettroniche, anagrafiche clienti/fornitori e partitari contabili.',
    supportedSync: ['Fatture elettroniche', 'Prima nota', 'Scadenzario', 'Estratti conto'],
    connected: true,
    apiKeyMasked: 'zk_live_••••••••9841',
    syncFrequency: 'realtime',
    lastSync: 'Oggi alle 12:44',
    recordsSyncedCount: 14290
  },
  {
    id: 'sap',
    name: 'SAP S/4HANA Cloud',
    category: 'ERP & Contabilità',
    logoText: 'SAP',
    description: 'Connettore per ordini d\'acquisto, anagrafica articoli di magazzino, cicli di produzione e allocazione centri di costo.',
    supportedSync: ['Ordini acquisto', 'Movimenti magazzino', 'Centri di costo', 'BOM distinte base'],
    connected: true,
    apiKeyMasked: 'sap_oauth2_••••••••3310',
    syncFrequency: '15min',
    lastSync: 'Oggi alle 12:40',
    recordsSyncedCount: 38240
  },
  {
    id: 'teamsystem',
    name: 'TeamSystem Enterprise / Alyante',
    category: 'ERP & Contabilità',
    logoText: 'TEAMSYSTEM',
    description: 'Interscambio dati per gestione documentale, adempimenti fiscali, cedolini paghe e contabilità analitica.',
    supportedSync: ['Anagrafiche contabili', 'Cespiti', 'Documenti trasporto', 'Presenze dipendenti'],
    connected: false,
    syncFrequency: 'orario',
    recordsSyncedCount: 0
  },
  {
    id: 'salesforce',
    name: 'Salesforce CRM & Service Cloud',
    category: 'CRM & Vendite',
    logoText: 'SALESFORCE',
    description: 'Sincronizzazione in tempo reale di lead, opportunità di vendita, account aziendali e casi di assistenza clienti.',
    supportedSync: ['Lead & Opportunità', 'Ticket di assistenza', 'Pipeline commerciale', 'Contratti attivi'],
    connected: true,
    apiKeyMasked: 'sfdc_tok_••••••••5512',
    syncFrequency: 'realtime',
    lastSync: 'Oggi alle 12:48',
    recordsSyncedCount: 8940
  },
  {
    id: 'fatture-in-cloud',
    name: 'Fatture in Cloud (TeamSystem)',
    category: 'ERP & Contabilità',
    logoText: 'FATTURE IN CLOUD',
    description: 'Ideale per PMI e professionisti: invio automatico preventivi, monitoraggio incassi e ricezione fatture SDI.',
    supportedSync: ['Preventivi', 'Fatture attive/passive', 'Riconciliazione TS Pay', 'Corrispettivi'],
    connected: true,
    apiKeyMasked: 'fic_api_••••••••1109',
    syncFrequency: 'realtime',
    lastSync: 'Oggi alle 12:45',
    recordsSyncedCount: 4210
  },
  {
    id: 'ms-dynamics',
    name: 'Microsoft Dynamics 365 Business Central',
    category: 'ERP & Contabilità',
    logoText: 'MS DYNAMICS',
    description: 'Piattaforma unificata per la gestione finanziaria aziendale, catena di fornitura e reporting direzionale.',
    supportedSync: ['Piani dei conti', 'Ordini di vendita', 'Inventario multi-deposito', 'Flussi di cassa'],
    connected: false,
    syncFrequency: 'orario',
    recordsSyncedCount: 0
  },
  {
    id: 'hubspot',
    name: 'HubSpot Marketing & CRM',
    category: 'CRM & Vendite',
    logoText: 'HUBSPOT',
    description: 'Gestione automatica di deal commerciali, sequenze di follow-up e scoring predittivo dei contatti in ingresso.',
    supportedSync: ['Contatti & Aziende', 'Trattative di vendita', 'Attività email', 'Punteggio lead'],
    connected: false,
    syncFrequency: '15min',
    recordsSyncedCount: 0
  },
  {
    id: 'custom-webhook',
    name: 'API Rest & Webhook Proprietari',
    category: 'Comunicazione & Task',
    logoText: 'REST / WEBHOOK',
    description: 'Connessione universale con software AS400, mainframe bancari, gestionali legacy e portali interni via JSON/XML.',
    supportedSync: ['Eventi su misura', 'Payload JSON bidirezionali', 'Chiamate REST sicure mTLS'],
    connected: true,
    apiKeyMasked: 'sec_wh_••••••••7721',
    syncFrequency: 'realtime',
    lastSync: 'Oggi alle 12:49',
    recordsSyncedCount: 65120
  }
];

// Seeded activity logs showing real operational results
export const INITIAL_ACTIVITY_LOGS: ActivityLogEntry[] = [
  {
    id: 'log-1',
    timestamp: '12:48:12',
    botId: 'bot-ast-1',
    botName: 'Luancer Assistenza Clienti & SLA',
    department: 'assistenza',
    actionTaken: 'Risoluzione autonoma richiesta stato spedizione',
    targetSoftware: 'Salesforce & DHL API',
    status: 'completato_autonomo',
    confidenceScore: 99.4,
    timeSavedMinutes: 18,
    details: 'Cliente Cereria Rossi SpA: inoltrato tracking e confermata consegna stimata per oggi entro le 17:30.'
  },
  {
    id: 'log-2',
    timestamp: '12:42:05',
    botId: 'bot-adm-1',
    botName: 'Luancer Riconciliazione & Solleciti',
    department: 'amministrazione',
    actionTaken: 'Riconciliazione automatica bonifico SEPA',
    targetSoftware: 'Zucchetti Omnia',
    status: 'completato_autonomo',
    confidenceScore: 100.0,
    timeSavedMinutes: 25,
    details: 'Incasso di € 4.350,00 da Forniture Meccaniche srl abbinato con fattura FT-2026/089. Partita chiusa.'
  },
  {
    id: 'log-3',
    timestamp: '12:21:44',
    botId: 'bot-mag-1',
    botName: 'Luancer Inventario & Riordino',
    department: 'magazzino',
    actionTaken: 'Predisposta bozza ordine acquisto per scorta minima',
    targetSoftware: 'SAP S/4HANA',
    status: 'approvato_supervisore',
    confidenceScore: 97.2,
    timeSavedMinutes: 45,
    details: 'Bozza approvata dal responsabile logistica. Ordine di 400 unità imballi inviato al fornitore.'
  },
  {
    id: 'log-4',
    timestamp: '11:58:19',
    botId: 'bot-adm-1',
    botName: 'Luancer Riconciliazione & Solleciti',
    department: 'amministrazione',
    actionTaken: 'Spedizione sollecito di cortesia scadenza fattura',
    targetSoftware: 'Fatture in Cloud',
    status: 'completato_autonomo',
    confidenceScore: 98.9,
    timeSavedMinutes: 15,
    details: 'Inviato estratto conto cordiale con scadenza a 5 giorni a Studio Legale Bianchi.'
  },
  {
    id: 'log-5',
    timestamp: '11:15:02',
    botId: 'bot-ast-1',
    botName: 'Luancer Assistenza Clienti & SLA',
    department: 'assistenza',
    actionTaken: 'Aggiornamento anagrafica e classificazione ticket urgente',
    targetSoftware: 'Salesforce',
    status: 'completato_autonomo',
    confidenceScore: 96.5,
    timeSavedMinutes: 20,
    details: 'Contratto SLA Gold identificato. Notificato team leader via canale prioritario.'
  },
  {
    id: 'log-6',
    timestamp: '10:40:30',
    botId: 'bot-adm-1',
    botName: 'Luancer Riconciliazione & Solleciti',
    department: 'amministrazione',
    actionTaken: 'Controllo coerenza scadenziario fornitori',
    targetSoftware: 'Zucchetti Omnia',
    status: 'completato_autonomo',
    confidenceScore: 99.1,
    timeSavedMinutes: 30,
    details: 'Verificate 38 fatture passive in scadenza, predisposto file distinta SEPA per la tesoreria.'
  }
];

// Pricing plans for scalable business sizes
export const PRICING_PLANS: PricingPlan[] = [
  {
    id: 'artigiano',
    name: 'Artigiano & Professionista',
    tagline: 'Per studi professionali, artigiani e micro-imprese fino a 5 addetti.',
    monthlyPrice: 89,
    annualMonthlyPrice: 71, // 20% discount
    targetAudience: '1 - 5 Collaboratori',
    features: {
      activeBots: 'Fino a 3 Bot Autonomi attivi',
      autonomousCalls: '2.500 operazioni al mese',
      erpIntegrations: '1 Software Gestionale connesso (es. Fatture in Cloud o Zucchetti)',
      reporting: 'Report prestazioni settimanale via email & PDF',
      support: 'Assistenza via ticket entro 24 ore',
      customRules: 'Configurazione guidata senza codice'
    }
  },
  {
    id: 'atelier',
    name: 'Atelier Aziendale (PMI)',
    tagline: 'La soluzione d\'eccellenza per aziende in crescita con più reparti operativi.',
    monthlyPrice: 249,
    annualMonthlyPrice: 199, // 20% discount
    targetAudience: '6 - 50 Collaboratori',
    isPopular: true,
    features: {
      activeBots: 'Fino a 10 Bot Autonomi attivi',
      autonomousCalls: '15.000 operazioni al mese',
      erpIntegrations: 'Fino a 4 Gestionali contemporanei (Zucchetti, SAP, Salesforce, ecc.)',
      reporting: 'Analisi & Report in tempo reale + Esportazione Dossier Esecutivo',
      support: 'Supporto prioritario con Atelierista AI dedicato',
      customRules: 'Regole personalizzate su misura & Workflow multi-step'
    }
  },
  {
    id: 'corporate',
    name: 'Impresa & Strutturata',
    tagline: 'Per medie e grandi imprese con esigenze di compliance, audit e multi-sede.',
    monthlyPrice: 599,
    annualMonthlyPrice: 479, // 20% discount
    targetAudience: '50 - 250 Collaboratori',
    features: {
      activeBots: 'Fino a 30 Bot Autonomi attivi',
      autonomousCalls: '60.000 operazioni al mese',
      erpIntegrations: 'Integrazioni illimitate + Webhook personalizzati / AS400',
      reporting: 'Piattaforma BI in tempo reale con drill-down per reparto',
      support: 'Account Manager dedicato & SLA di risposta 2 ore',
      customRules: 'Audit log crittografato & Piena conformità ISO 27001 / GDPR'
    }
  },
  {
    id: 'su_misura',
    name: 'Bespoke Enterprise',
    tagline: 'Architettura dedicata, modelli personalizzati on-premise o cloud sovrano.',
    monthlyPrice: 0, // Custom
    annualMonthlyPrice: 0,
    targetAudience: 'Oltre 250 Collaboratori o Gruppi Industriali',
    features: {
      activeBots: 'Bot e agenti illimitati',
      autonomousCalls: 'Volume transazioni personalizzato',
      erpIntegrations: 'Connettori ad hoc per mainframe proprietari e legacy',
      reporting: 'Analisi predittiva su misura e cruscotto direzionale unificato',
      support: 'Consulenza continua in presenza & Ingegneri dedicati',
      customRules: 'Installazione in ambiente isolato / On-Premise'
    }
  }
];

/**
 * Calculates aggregated financial figures: incomes, expenses, net earnings, overdue receivables, and subscription MRR.
 */
export function calculateFinancialTotals(records: FinancialRecord[]) {
  let totalIncomeEur = 0;
  let totalExpensesEur = 0;
  let pendingInvoicesEur = 0;
  let overdueInvoicesEur = 0;
  let recurringMrrEur = 0;

  for (const r of records) {
    if (r.direction === 'entrata') {
      if (r.status === 'saldato' || r.type === 'incasso_pagamento' || r.type === 'abbonamento') {
        totalIncomeEur += r.amountGrossEur;
      }
      if (r.type === 'fattura_attiva') {
        if (r.status === 'in_attesa') pendingInvoicesEur += r.amountGrossEur;
        if (r.status === 'scaduto') overdueInvoicesEur += r.amountGrossEur;
      }
      if (r.type === 'abbonamento') {
        recurringMrrEur += r.amountGrossEur;
      }
    } else if (r.direction === 'uscita') {
      totalExpensesEur += r.amountGrossEur;
    }
  }

  const netProfitEur = totalIncomeEur - totalExpensesEur;
  const profitMarginPercent = totalIncomeEur > 0 
    ? Math.round(((netProfitEur) / totalIncomeEur) * 1000) / 10 
    : 0;

  return {
    totalIncomeEur: Math.round(totalIncomeEur * 100) / 100,
    totalExpensesEur: Math.round(totalExpensesEur * 100) / 100,
    netProfitEur: Math.round(netProfitEur * 100) / 100,
    profitMarginPercent,
    pendingInvoicesEur: Math.round(pendingInvoicesEur * 100) / 100,
    overdueInvoicesEur: Math.round(overdueInvoicesEur * 100) / 100,
    recurringMrrEur: Math.round(recurringMrrEur * 100) / 100
  };
}

/**
 * Processes natural language financial instructions for the programmable bot.
 */
export function executeBotFinancialCommand(
  rawCommand: string,
  currentRecords: FinancialRecord[],
  selectedClient?: string
): {
  updatedRecords: FinancialRecord[];
  replyMessage: string;
  actionSummary: string;
} {
  const text = rawCommand.toLowerCase().trim();
  const today = new Date().toISOString().split('T')[0];

  // Helper: extract numeric amount from prompt
  const amountMatch = text.match(/(\d+[\d.,]*)\s*(€|euro)?/i);
  let parsedAmount = 500;
  if (amountMatch) {
    const rawNum = amountMatch[1].replace(/\./g, '').replace(',', '.');
    const val = parseFloat(rawNum);
    if (!isNaN(val) && val > 0) parsedAmount = val;
  }

  // 1. SOLLECITA FATTURE SCADUTE
  if (text.includes('sollecit') || text.includes('recuper') || text.includes('scadut')) {
    const overdue = currentRecords.filter(r => r.type === 'fattura_attiva' && r.status === 'scaduto');
    if (overdue.length === 0) {
      return {
        updatedRecords: currentRecords,
        replyMessage: 'Nessuna fattura risulta attualmente scaduta. Lo scadenzario è in perfetto equilibrio!',
        actionSummary: 'Controllo conformità crediti eseguito: 0 anomalie'
      };
    }

    const updated = currentRecords.map(r => {
      if (r.type === 'fattura_attiva' && r.status === 'scaduto') {
        return {
          ...r,
          botNote: `Sollecito inviato con estratto conto allegato il ${today}`
        };
      }
      return r;
    });

    const totalOverdueEur = overdue.reduce((sum, r) => sum + r.amountGrossEur, 0);
    return {
      updatedRecords: updated,
      replyMessage: `Il bot ha inviato solleciti formali per ${overdue.length} fatture scadute (Totale: € ${totalOverdueEur.toLocaleString('it-IT')}) allegando coordinate bancarie e calcolo interessi.`,
      actionSummary: `Sollecitati ${overdue.length} crediti insoluti su Zucchetti & PEC`
    };
  }

  // 2. REGISTRA FATTURA
  if (text.includes('fattur') || text.includes('emetti')) {
    const clientName = selectedClient || 'Cliente Direzionale';
    const newDocNum = `FT-${new Date().getFullYear()}/${Math.floor(100 + Math.random() * 900)}`;
    const net = Math.round((parsedAmount / 1.22) * 100) / 100;
    
    const newInvoice: FinancialRecord = {
      id: `rec-inv-${Date.now()}`,
      date: today,
      type: 'fattura_attiva',
      docNumber: newDocNum,
      clientOrVendor: clientName,
      description: text.includes('per') ? rawCommand.slice(text.indexOf('per') + 4).trim() : 'Fornitura beni e servizi aziendali',
      category: 'Vendite & Servizi',
      amountGrossEur: parsedAmount,
      amountNetEur: net,
      vatRatePercent: 22,
      direction: 'entrata',
      status: 'in_attesa',
      paymentMethod: 'Bonifico SEPA 30gg',
      dueDate: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
      handledByBot: true,
      botNote: 'Emessa in automatico dal bot su Zucchetti e registrata nel cassetto fiscale SDI'
    };

    return {
      updatedRecords: [newInvoice, ...currentRecords],
      replyMessage: `Fattura attiva ${newDocNum} di € ${parsedAmount.toLocaleString('it-IT')} emessa con successo per ${clientName}. Registrata in contabilità con scadenza 30 giorni.`,
      actionSummary: `Emissione e trasmissione SDI fattura ${newDocNum}`
    };
  }

  // 3. REGISTRA SPESA
  if (text.includes('spesa') || text.includes('costo') || text.includes('paga fornitore') || text.includes('uscita')) {
    const newDocNum = `SP-${Math.floor(1000 + Math.random() * 9000)}`;
    const vendor = selectedClient || 'Fornitore di Riferimento';
    const net = Math.round((parsedAmount / 1.22) * 100) / 100;

    const newExpense: FinancialRecord = {
      id: `rec-exp-${Date.now()}`,
      date: today,
      type: 'spesa',
      docNumber: newDocNum,
      clientOrVendor: vendor,
      description: text.includes('per') ? rawCommand.slice(text.indexOf('per') + 4).trim() : 'Spesa operativa aziendale',
      category: 'Costi Operativi & Forniture',
      amountGrossEur: parsedAmount,
      amountNetEur: net,
      vatRatePercent: 22,
      direction: 'uscita',
      status: 'saldato',
      paymentMethod: 'Addebito Diretto / Bonifico',
      dueDate: today,
      handledByBot: true,
      botNote: 'Registrata in prima nota e imputata al centro di costo di competenza'
    };

    return {
      updatedRecords: [newExpense, ...currentRecords],
      replyMessage: `Spesa di € ${parsedAmount.toLocaleString('it-IT')} registrata correttamente sotto ${vendor}. Parametri di deducibilità fiscale applicati.`,
      actionSummary: `Registrazione costo ${newDocNum} e scarico prima nota`
    };
  }

  // 4. REGISTRA INCASSO O PAGAMENTO
  if (text.includes('incasso') || text.includes('pagato') || text.includes('bonifico ricevuto') || text.includes('saldat')) {
    // Check if there is an overdue or pending invoice to reconcile
    let reconciledDoc = '';
    const updated = currentRecords.map(r => {
      if (!reconciledDoc && r.type === 'fattura_attiva' && r.status !== 'saldato' && (!selectedClient || r.clientOrVendor === selectedClient)) {
        reconciledDoc = r.docNumber;
        return {
          ...r,
          status: 'saldato' as const,
          botNote: `Partita chiusa dal bot in data ${today} a seguito di accredito bancario SEPA.`
        };
      }
      return r;
    });

    const newPayment: FinancialRecord = {
      id: `rec-pay-${Date.now()}`,
      date: today,
      type: 'incasso_pagamento',
      docNumber: `INC-${Math.floor(1000 + Math.random() * 9000)}`,
      clientOrVendor: selectedClient || 'Cliente Accreditante',
      description: reconciledDoc ? `Incasso a saldo fattura ${reconciledDoc}` : 'Accredito bonifico cliente',
      category: 'Incassi & Tesoreria',
      amountGrossEur: parsedAmount,
      amountNetEur: parsedAmount,
      vatRatePercent: 0,
      direction: 'entrata',
      status: 'saldato',
      paymentMethod: 'Bonifico SEPA Bancario',
      dueDate: today,
      handledByBot: true,
      botNote: `Riconciliato automaticamente con estratto conto PSD2`
    };

    return {
      updatedRecords: [newPayment, ...updated],
      replyMessage: `Incasso di € ${parsedAmount.toLocaleString('it-IT')} registrato e riconciliato! ${reconciledDoc ? `Partita della fattura ${reconciledDoc} chiusa a saldo.` : 'Credito registrato a bilancio.'}`,
      actionSummary: `Riconciliazione bancaria e abbinamento partita contabile`
    };
  }

  // 5. NUOVO ABBONAMENTO CLIENTE
  if (text.includes('abbonament') || text.includes('ricorrent') || text.includes('canone')) {
    const clientName = selectedClient || 'Cliente Abbonato';
    const newDocNum = `SUB-${Math.floor(100 + Math.random() * 900)}`;

    const newSub: FinancialRecord = {
      id: `rec-sub-${Date.now()}`,
      date: today,
      type: 'abbonamento',
      docNumber: newDocNum,
      clientOrVendor: clientName,
      description: 'Canone di abbonamento ricorrente mensile servizi aziendali',
      category: 'Ricavi Ricorrenti (MRR)',
      amountGrossEur: parsedAmount,
      amountNetEur: Math.round((parsedAmount / 1.22) * 100) / 100,
      vatRatePercent: 22,
      direction: 'entrata',
      status: 'saldato',
      paymentMethod: 'Addebito Diretto SEPA (SDD)',
      dueDate: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
      handledByBot: true,
      botNote: 'Abbonamento attivo con rinnovo automatico e generazione fattura programmata'
    };

    return {
      updatedRecords: [newSub, ...currentRecords],
      replyMessage: `Abbonamento ricorrente di € ${parsedAmount.toLocaleString('it-IT')}/mese attivato per ${clientName}. Il bot genererà ed incasserà la quota mensile in automatico.`,
      actionSummary: `Attivazione canone ricorrente ${newDocNum}`
    };
  }

  // 6. DEFAULT GENERAL INQUIRY / GUADAGNI
  const totals = calculateFinancialTotals(currentRecords);
  return {
    updatedRecords: currentRecords,
    replyMessage: `Analisi finanziaria in tempo reale: Ricavi totali pari a € ${totals.totalIncomeEur.toLocaleString('it-IT')}, Spese a € ${totals.totalExpensesEur.toLocaleString('it-IT')}, per un Guadagno Netto di € ${totals.netProfitEur.toLocaleString('it-IT')} (Margine utile: ${totals.profitMarginPercent}%). ${totals.overdueInvoicesEur > 0 ? `Attenzione: rilevati € ${totals.overdueInvoicesEur.toLocaleString('it-IT')} di fatture scadute da sollecitare.` : 'Tutti i crediti risultano regolari.'}`,
    actionSummary: 'Audit direzionale e bilancio istantaneo generato'
  };
}

// Starter counterparties & business financial records for the client's own business
export const DEFAULT_BUSINESS_PROFILE: BusinessProfile = {
  companyName: 'La Mia Azienda',
  sector: 'Studi professionali e PMI in Italia',
  vatNumber: '',
  ownerName: '',
  websiteUrl: '',
  verifiedDomain: '',
  verificationStatus: 'non_verificato',
  verificationMethod: 'dns_txt',
  verificationToken: '',
  siteAutomationScopes: ['widget_assistenza', 'lead_preventivi', 'ordini_fatture', 'audit_seo'],
};

export const INITIAL_CLIENTS: ClientProfile[] = [
  {
    id: 'cli-all',
    name: 'Tutte le Controparti (Bilancio Aziendale)',
    vatNumber: 'RIEPILOGO',
    sector: 'Tutti i movimenti della tua azienda',
    email: 'amministrazione@miaazienda.it',
    activePlan: 'Vista Aziendale',
    totalVolumeEur: 24500
  },
  {
    id: 'cli-alfa',
    name: 'Studio Tecnico Arch. Rossi',
    vatNumber: 'IT04481920152',
    sector: 'Cliente Commerciale',
    email: 'amministrazione@studiorossi.it',
    activePlan: 'Cliente B2B',
    totalVolumeEur: 8400
  },
  {
    id: 'cli-sartori',
    name: 'Officine Meccaniche Sartori S.p.A.',
    vatNumber: 'IT01928374650',
    sector: 'Cliente Industriale',
    email: 'contabilita@sartorimeccanica.it',
    activePlan: 'Cliente Abbonato',
    totalVolumeEur: 12200
  },
  {
    id: 'cli-fornitore',
    name: 'Fornitore Servizi & Cloud Italia',
    vatNumber: 'IT08765432109',
    sector: 'Fornitore Operativo',
    email: 'fatture@fornitorecloud.it',
    activePlan: 'Fornitore',
    totalVolumeEur: 2513
  }
];

export const INITIAL_FINANCIAL_RECORDS: FinancialRecord[] = [
  {
    id: 'rec-1',
    date: '2026-11-08',
    type: 'fattura_attiva',
    docNumber: 'FT-2026/088',
    clientOrVendor: 'Studio Tecnico Arch. Rossi',
    description: 'Fornitura servizi professionali e consulenza mensile',
    category: 'Vendite & Servizi',
    amountGrossEur: 3660.00,
    amountNetEur: 3000.00,
    vatRatePercent: 22,
    direction: 'entrata',
    status: 'in_attesa',
    paymentMethod: 'Bonifico Bancario SEPA',
    dueDate: '2026-11-30',
    handledByBot: true,
    botNote: 'Emessa dal tuo Dipendente 05 e trasmessa al cassetto SDI.'
  },
  {
    id: 'rec-2',
    date: '2026-11-07',
    type: 'incasso_pagamento',
    docNumber: 'INC-9912',
    clientOrVendor: 'Officine Meccaniche Sartori S.p.A.',
    description: 'Incasso bonifico a saldo fattura FT-2026/074',
    category: 'Incassi Clienti',
    amountGrossEur: 7800.00,
    amountNetEur: 7800.00,
    vatRatePercent: 0,
    direction: 'entrata',
    status: 'saldato',
    paymentMethod: 'Bonifico SEPA',
    dueDate: '2026-11-07',
    handledByBot: true,
    botNote: 'Riconciliato automaticamente dal tuo bot con l\'estratto conto aziendale.'
  },
  {
    id: 'rec-3',
    date: '2026-11-06',
    type: 'spesa',
    docNumber: 'SP-3104',
    clientOrVendor: 'Fornitore Servizi & Cloud Italia',
    description: 'Infrastruttura IT aziendale e strumenti operativi',
    category: 'Infrastruttura & IT',
    amountGrossEur: 683.20,
    amountNetEur: 560.00,
    vatRatePercent: 22,
    direction: 'uscita',
    status: 'saldato',
    paymentMethod: 'Carta Aziendale',
    dueDate: '2026-11-06',
    handledByBot: true,
    botNote: 'Spesa sotto soglia approvata e registrata in prima nota.'
  },
  {
    id: 'rec-4',
    date: '2026-11-05',
    type: 'abbonamento',
    docNumber: 'SUB-2026/012',
    clientOrVendor: 'Officine Meccaniche Sartori S.p.A.',
    description: 'Canone di assistenza programmata mensile erogata dalla tua azienda',
    category: 'Ricavi Ricorrenti (MRR)',
    amountGrossEur: 976.00,
    amountNetEur: 800.00,
    vatRatePercent: 22,
    direction: 'entrata',
    status: 'saldato',
    paymentMethod: 'Addebito Diretto SEPA (SDD)',
    dueDate: '2026-11-05',
    handledByBot: true,
    botNote: 'Rinnovo periodico cliente gestito in autonomia.'
  },
  {
    id: 'rec-5',
    date: '2026-11-04',
    type: 'fattura_attiva',
    docNumber: 'FT-2026/082',
    clientOrVendor: 'Studio Tecnico Arch. Rossi',
    description: 'Saldo progetto fornitura ottobre',
    category: 'Vendite & Servizi',
    amountGrossEur: 2196.00,
    amountNetEur: 1800.00,
    vatRatePercent: 22,
    direction: 'entrata',
    status: 'scaduto',
    paymentMethod: 'Bonifico SEPA a 30gg',
    dueDate: '2026-10-31',
    handledByBot: true,
    botNote: 'Scaduta da 8 giorni: pronta per sollecito cortese automatico.'
  }
];

export const DEFAULT_OMNIBOT_SETTINGS: OmniBotFinancialSettings = {
  autoInvoiceGeneration: true,
  autoPaymentReconciliation: true,
  autoExpenseAlertLimitEur: 1500,
  autoSubscriptionRenewal: true,
  autoReminderDaysOverdue: 3,
  customClientDirectives: 'Tutela la liquidità della mia azienda. Invia solleciti cortesi ai clienti in ritardo e segnalalami spese superiori a € 1.500.'
};

export const ALL_IN_ONE_BOT_MONTHLY_EUR = 199;
export const ALL_IN_ONE_BOT_ANNUAL_MONTHLY_EUR = 159; // 20% annual discount

export const BOT_FINISH_PRESETS: Array<{
  id: BotFinishId;
  label: string;
  subtitle: string;
  swatchHex: string;
  accentHex: string;
}> = [
  {
    id: 'sage_brass',
    label: 'Ottone & Salvia Atelier',
    subtitle: 'Scocca salvia opaca con finiture in ottone spazzolato',
    swatchHex: '#263e34',
    accentHex: '#b38b59',
  },
  {
    id: 'charcoal_titanium',
    label: 'Titanio & Carbone',
    subtitle: 'Chassis antracite satinato e leghe aerospaziali',
    swatchHex: '#1d2421',
    accentHex: '#8d9b95',
  },
  {
    id: 'brushed_gold',
    label: 'Oro Spazzolato Direzionale',
    subtitle: 'Edizione presidenziale in metallo anodizzato caldo',
    swatchHex: '#9e7d53',
    accentHex: '#e4d5ba',
  },
  {
    id: 'ivory_ceramic',
    label: 'Ceramica Avorio & Bronzo',
    subtitle: 'Superficie ceramica chiara con giunti in bronzo lucido',
    swatchHex: '#e7ece8',
    accentHex: '#7d6242',
  },
];

export const SIX_EMPLOYEES_CATALOG: EmployeeSkillModule[] = [
  {
    id: 'emp-1',
    order: 1,
    code: 'DIP-01',
    roleTitle: 'Analista di Mercato',
    shortLabel: 'Mercato & Competitor',
    department: 'vendite',
    subtitle: 'Studia il mercato reale prima di investire un euro: competitor, fasce di prezzo, traffico e spazi scoperti.',
    pluginStack: ['competitive-analysis', 'seo-audit', 'Google Search Live'],
    connectors: ['Google Search Grounding', 'Similarweb', 'Semrush'],
    defaultPrompt: 'Analizza il mercato del mio settore in Italia: player principali, posizionamento, fasce di prezzo, segmenti scoperti e 3 possibili angoli di posizionamento.',
    scheduleNote: 'Analisi su richiesta & aggiornamento settimanale lunedì ore 08:00',
    monthlyStandaloneEur: 49,
    annualMonthlyStandaloneEur: 39,
  },
  {
    id: 'emp-2',
    order: 2,
    code: 'DIP-02',
    roleTitle: 'Direttore Marketing',
    shortLabel: 'Brand Voice & Offerta',
    department: 'vendite',
    subtitle: 'Definisce cliente ideale, offerta a 3 fasce di prezzo, messaggio homepage/ads e scrive con la tua voce autentica.',
    pluginStack: ['brand-review', 'campaign-plan', 'skill-creator (Voce Umana)'],
    connectors: ['Canva', 'Higgsfield', 'Meta & LinkedIn'],
    defaultPrompt: 'Partendo dal report di mercato, costruisci il posizionamento: cliente ideale, offerta a 3 fasce, messaggio homepage e ads con il mio ritmo di scrittura personale.',
    scheduleNote: 'Piano editoriale ogni lunedì + revisione creatività su approvazione',
    monthlyStandaloneEur: 55,
    annualMonthlyStandaloneEur: 44,
  },
  {
    id: 'emp-3',
    order: 3,
    code: 'DIP-03',
    roleTitle: 'CTO & Prodotto',
    shortLabel: 'Siti, Landing & Tool',
    department: 'operations',
    subtitle: 'Progetta e mette online landing page, portali clienti e micro-strumenti operativi collegati ai tuoi flussi.',
    pluginStack: ['frontend-design', 'Superpowers', 'deploy-to-vercel'],
    connectors: ['Vercel', 'GitHub', 'Webhook & API REST'],
    defaultPrompt: 'Crea una landing page e un flusso operativo per l\'offerta approvata. Prima di partire chiedimi tono, struttura e call to action.',
    scheduleNote: 'Build su richiesta con controllo di qualità prima della messa online',
    monthlyStandaloneEur: 69,
    annualMonthlyStandaloneEur: 55,
  },
  {
    id: 'emp-4',
    order: 4,
    code: 'DIP-04',
    roleTitle: 'Customer Care 24/7',
    shortLabel: 'Supporto & Telegram',
    department: 'assistenza',
    subtitle: 'Controlla email, Instagram e Messenger. Risponde alla routine, ti scrive su Telegram per le decisioni e invia il riepilogo alle 20:00.',
    pluginStack: ['Cowork Customer Skill', 'Escalation Telegram', 'Riepilogo 20:00'],
    connectors: ['Gmail', 'Instagram', 'Facebook Messenger', 'Telegram Bot'],
    defaultPrompt: 'Rispondi con tono amichevole a prezzi, orari e funzionamento. Mai promettere sconti o date non autorizzate. Se serve una mia decisione scrivimi su Telegram.',
    scheduleNote: 'Presidio continuo 24/7 + Riepilogo serale ogni giorno alle 20:00',
    monthlyStandaloneEur: 45,
    annualMonthlyStandaloneEur: 36,
  },
  {
    id: 'emp-5',
    order: 5,
    code: 'DIP-05',
    roleTitle: 'Data Analyst & Contabilità',
    shortLabel: 'Numeri, Fatture & Margini',
    department: 'amministrazione',
    subtitle: 'Legge conversioni e traffico, sollecita fatture non pagate, analizza margini, prepara chiusure mensili e scadenze fiscali.',
    pluginStack: ['PostHog MCP', 'Small Business Finance (15 workflow)', 'Analisi Margini'],
    connectors: ['Zucchetti', 'Fatture in Cloud', 'PostHog', 'QuickBooks / PayPal'],
    defaultPrompt: 'Confronta fonti di traffico e conversioni degli ultimi 30 giorni; verifica fatture scadute, spese fuori soglia, margini netti e prepara la chiusura mensile.',
    scheduleNote: 'Monitoraggio giornaliero flussi + chiusura mensile automatica',
    monthlyStandaloneEur: 59,
    annualMonthlyStandaloneEur: 47,
  },
  {
    id: 'emp-6',
    order: 6,
    code: 'DIP-06',
    roleTitle: 'Direttore Operativo (COO)',
    shortLabel: 'Morning Brief 07:00',
    department: 'operations',
    subtitle: 'Coordina tutti gli altri dipendenti in automatico e ti consegna alle 07:00 su Telegram un brief da 30 secondi con le 3 priorità.',
    pluginStack: ['Morning Brief', 'Orchestrazione Multi-Reparto', 'Agenda & Priorità'],
    connectors: ['Telegram Brief', 'Google Calendar', 'Tutti i 5 Reparti AI'],
    defaultPrompt: 'Ogni mattina alle 07:00 nei giorni feriali riassumi customer care, variazioni landing, calendario e prepara le 3 priorità assolute leggibili in 30 secondi.',
    scheduleNote: 'Briefing esecutivo feriale alle 07:00 su Telegram',
    monthlyStandaloneEur: 59,
    annualMonthlyStandaloneEur: 47,
  },
];

export const NON_DELEGABLE_PILLARS: Array<{
  key: keyof NonDelegableGuardrails;
  title: string;
  rule: string;
  defaultValue: string;
}> = [
  {
    key: 'priorities',
    title: '1. Le Priorità',
    rule: 'La macchina esegue ciò che le indichi: se le dai l\'obiettivo sbagliato, lo farà a velocità doppia.',
    defaultValue: 'Il titolare conferma ogni lunedì alle 08:30 le 3 priorità settimanali proposte dal COO.',
  },
  {
    key: 'decisions',
    title: '2. Le Decisioni',
    rule: 'L\'analista prepara i dati e gli scenari, ma la scelta strategica resta sempre umana.',
    defaultValue: 'Nessuna spesa > € 1.500 o variazione di listino viene approvata senza conferma esplicita.',
  },
  {
    key: 'relationships',
    title: '3. Le Relazioni',
    rule: 'Il cliente critico, la partnership importante e la trattativa delicata restano tue.',
    defaultValue: 'Escalation immediata su Telegram per clienti VIP, reclami ad alta priorità o trattative.',
  },
  {
    key: 'qualityControl',
    title: '4. Il Controllo Qualità',
    rule: 'Revisionare è molto più veloce che produrre: è così che una sola persona vale per cinque.',
    defaultValue: 'Bozze marketing, preventivi chiave e landing page passano in revisione rapida prima dell\'invio.',
  },
];

export function createDefaultModuleConfigs(): Record<EmployeeModuleId, EmployeeModuleCustomConfig> {
  return {
    'emp-1': {
      enabled: true,
      directives: SIX_EMPLOYEES_CATALOG[0].defaultPrompt,
      schedule: 'Lunedì ore 08:00',
      channel: 'Cartella Aziendale + Google Search Live',
    },
    'emp-2': {
      enabled: true,
      directives: SIX_EMPLOYEES_CATALOG[1].defaultPrompt,
      schedule: 'Lunedì & Giovedì ore 09:30',
      channel: 'Canva + Campagne Brand Voice',
    },
    'emp-3': {
      enabled: true,
      directives: SIX_EMPLOYEES_CATALOG[2].defaultPrompt,
      schedule: 'Su richiesta / Deploy controllato',
      channel: 'Vercel + Repository Aziendale',
    },
    'emp-4': {
      enabled: true,
      directives: SIX_EMPLOYEES_CATALOG[3].defaultPrompt,
      schedule: 'Continuo 24/7 · Riepilogo 20:00',
      channel: 'Gmail + Instagram + Telegram',
    },
    'emp-5': {
      enabled: true,
      directives: SIX_EMPLOYEES_CATALOG[4].defaultPrompt,
      schedule: 'Quotidiano ore 18:30',
      channel: 'Zucchetti + Fatture in Cloud + PostHog',
    },
    'emp-6': {
      enabled: true,
      directives: SIX_EMPLOYEES_CATALOG[5].defaultPrompt,
      schedule: 'Feriali ore 07:00',
      channel: 'Telegram Morning Brief (30 sec)',
    },
  };
}

export function createDefaultGuardrails(): NonDelegableGuardrails {
  return {
    priorities: NON_DELEGABLE_PILLARS[0].defaultValue,
    decisions: NON_DELEGABLE_PILLARS[1].defaultValue,
    relationships: NON_DELEGABLE_PILLARS[2].defaultValue,
    qualityControl: NON_DELEGABLE_PILLARS[3].defaultValue,
  };
}

/**
 * Pure pricing calculation for paid customizable bots:
 * Supports either the single All-in-One 6-in-1 complete company bot OR custom selection of individual employee bots.
 */
export function calculateCustomBotOrderPricing(
  bundleType: 'all_in_one' | 'modular',
  selectedEmployees: EmployeeModuleId[],
  billingCycle: 'monthly' | 'annual'
): {
  monthlyUnitEur: number;
  totalBilledTodayEur: number;
  vatAmountEur: number;
  totalWithVatEur: number;
  bundleSavingsMonthlyEur: number;
  effectiveEmployeeCount: number;
} {
  const uniqueIds = Array.from(new Set(selectedEmployees));
  const standaloneMonthlySum = uniqueIds.reduce((acc, id) => {
    const mod = SIX_EMPLOYEES_CATALOG.find((m) => m.id === id);
    return acc + (mod ? mod.monthlyStandaloneEur : 0);
  }, 0);
  const allSixMonthlySum = SIX_EMPLOYEES_CATALOG.reduce((acc, m) => acc + m.monthlyStandaloneEur, 0);

  let monthlyUnitEur = 0;
  let bundleSavingsMonthlyEur = 0;

  if (bundleType === 'all_in_one') {
    monthlyUnitEur = billingCycle === 'annual' ? ALL_IN_ONE_BOT_ANNUAL_MONTHLY_EUR : ALL_IN_ONE_BOT_MONTHLY_EUR;
    bundleSavingsMonthlyEur = Math.max(0, allSixMonthlySum - monthlyUnitEur);
  } else {
    if (billingCycle === 'annual') {
      monthlyUnitEur = uniqueIds.reduce((acc, id) => {
        const mod = SIX_EMPLOYEES_CATALOG.find((m) => m.id === id);
        return acc + (mod ? mod.annualMonthlyStandaloneEur : 0);
      }, 0);
      bundleSavingsMonthlyEur = Math.max(0, standaloneMonthlySum - monthlyUnitEur);
    } else {
      monthlyUnitEur = standaloneMonthlySum;
      bundleSavingsMonthlyEur = 0;
    }
  }

  const totalBilledTodayEur = billingCycle === 'annual' ? monthlyUnitEur * 12 : monthlyUnitEur;
  const vatAmountEur = Math.round(totalBilledTodayEur * 0.22 * 100) / 100;
  const totalWithVatEur = Math.round((totalBilledTodayEur + vatAmountEur) * 100) / 100;

  return {
    monthlyUnitEur,
    totalBilledTodayEur,
    vatAmountEur,
    totalWithVatEur,
    bundleSavingsMonthlyEur,
    effectiveEmployeeCount: bundleType === 'all_in_one' ? 6 : uniqueIds.length,
  };
}

export const INITIAL_PURCHASED_BOTS: PurchasedBotConfig[] = [];

/**
 * Provisions a self-service PurchasedBotConfig draft directly from a PricingPlan selection,
 * so buying any plan immediately unlocks and configures the client's own business workspace.
 */
export function buildBotDraftFromPricingPlan(
  plan: PricingPlan,
  billingCycle: 'monthly' | 'annual',
  companyName: string = 'La Mia Azienda',
  ownerName: string = '',
  boundDomain: string = ''
): Omit<PurchasedBotConfig, 'id' | 'isPaid' | 'paidAt'> {
  const cleanCompany = companyName.trim() || 'La Mia Azienda';
  const cleanOwner = ownerName.trim();
  const cleanDomain = boundDomain.trim();
  const monthlyUnitEur =
    plan.id === 'su_misura'
      ? 0
      : billingCycle === 'annual'
        ? plan.annualMonthlyPrice
        : plan.monthlyPrice;

  const isArtigiano = plan.id === 'artigiano';
  const isCorporate = plan.id === 'corporate' || plan.id === 'su_misura';

  const selectedEmployees: EmployeeModuleId[] = isArtigiano
    ? ['emp-1', 'emp-4', 'emp-5']
    : ['emp-1', 'emp-2', 'emp-3', 'emp-4', 'emp-5', 'emp-6'];

  const moduleConfigs = createDefaultModuleConfigs();
  for (const emp of SIX_EMPLOYEES_CATALOG) {
    moduleConfigs[emp.id].enabled = selectedEmployees.includes(emp.id);
  }

  const ownerNote = cleanOwner ? ` Intestato a ${cleanOwner}.` : '';
  const domainNote = cleanDomain
    ? ` Autorizzato a operare autonomamente sul sito verificato "${cleanDomain}".`
    : ' Collegamento sito aziendale in attesa di verifica proprietà.';

  return {
    botCode: `PLAN-${plan.id.toUpperCase()}`,
    name: `${plan.name} · ${cleanCompany}`,
    ownerFullName: cleanOwner || undefined,
    boundDomain: cleanDomain || undefined,
    bundleType: isArtigiano ? 'modular' : 'all_in_one',
    billingCycle,
    priceEur: monthlyUnitEur > 0 ? monthlyUnitEur : ALL_IN_ONE_BOT_ANNUAL_MONTHLY_EUR,
    autonomyLevel: isCorporate ? 'piena-autonomia' : 'semi-autonomo',
    finishId: isCorporate ? 'brushed_gold' : 'sage_brass',
    selectedEmployees,
    moduleConfigs,
    guardrails: createDefaultGuardrails(),
    customDirectives: `Configurazione autonoma per "${cleanCompany}".${ownerNote}${domainNote} Esegui i flussi operativi selezionati rispettando le 4 regole non delegabili del titolare.`,
    connectedSoftware: isArtigiano
      ? ['Fatture in Cloud', 'Telegram Bot']
      : isCorporate
        ? ['Zucchetti', 'SAP S/4HANA', 'Salesforce', 'Fatture in Cloud', 'Telegram Bot', 'PostHog']
        : ['Zucchetti', 'Fatture in Cloud', 'Telegram Bot', 'PostHog'],
    status: 'attivo',
  };
}

/**
 * Derives runnable operational bot agents for the client's private workspace (`BotStudio`)
 * directly from the client's purchased bot plans and custom employee configurations.
 */
export function deriveOperationalBotsFromPurchased(
  purchasedBots: PurchasedBotConfig[],
  customBots: BotInstance[],
  businessProfileOrCompanyName: string | BusinessProfile = 'La Mia Azienda'
): BotInstance[] {
  const isProfileObject = typeof businessProfileOrCompanyName === 'object' && businessProfileOrCompanyName !== null;
  const cleanCompany =
    (isProfileObject
      ? businessProfileOrCompanyName.companyName
      : businessProfileOrCompanyName
    ).trim() || 'La Mia Azienda';
  const profileOwner = isProfileObject ? businessProfileOrCompanyName.ownerName.trim() : '';
  const profileVerifiedDomain =
    isProfileObject && businessProfileOrCompanyName.verificationStatus === 'verificato'
      ? businessProfileOrCompanyName.verifiedDomain.trim()
      : '';

  const derived: BotInstance[] = [];

  for (const purchased of purchasedBots) {
    const effectiveOwner = purchased.ownerFullName?.trim() || profileOwner;
    const effectiveDomain = purchased.boundDomain?.trim() || profileVerifiedDomain;

    for (const empId of purchased.selectedEmployees) {
      const empMeta = SIX_EMPLOYEES_CATALOG.find((e) => e.id === empId);
      if (!empMeta) continue;
      const customCfg = purchased.moduleConfigs[empId];
      if (customCfg && !customCfg.enabled) continue;

      const primarySoftware =
        purchased.connectedSoftware.length > 0
          ? purchased.connectedSoftware.slice(0, 3)
          : empMeta.connectors.slice(0, 3);

      const directivesParts = [
        effectiveOwner ? `Titolare: ${effectiveOwner}` : '',
        effectiveDomain
          ? `Sito verificato: ${effectiveDomain}`
          : 'Sito aziendale non ancora verificato (esecuzione live bloccata)',
        purchased.customDirectives || purchased.guardrails.decisions,
      ].filter(Boolean);

      derived.push({
        id: `${purchased.id}-${empMeta.id}`,
        name: `${empMeta.roleTitle} · ${cleanCompany}`,
        code: empMeta.code,
        department: empMeta.department,
        description: customCfg?.directives || empMeta.defaultPrompt,
        autonomyLevel: purchased.autonomyLevel,
        status: purchased.status === 'in_pausa' ? 'in_pausa' : 'attivo',
        primarySoftware: effectiveDomain ? [effectiveDomain, ...primarySoftware.slice(0, 2)] : primarySoftware,
        triggers: [
          {
            id: `tr-${empMeta.id}-1`,
            source: customCfg?.channel || empMeta.connectors[0] || 'Gestionale Aziendale',
            condition: customCfg?.schedule || empMeta.scheduleNote,
            type: 'schedulato',
          },
        ],
        actions: [
          {
            id: `act-${empMeta.id}-1`,
            title: effectiveDomain
              ? `Esecuzione autonoma ${empMeta.shortLabel} su ${effectiveDomain}`
              : `Esecuzione autonoma ${empMeta.shortLabel} per ${cleanCompany}`,
            targetSoftware: effectiveDomain || primarySoftware[0] || 'Gestionale',
            requiresApproval: !effectiveDomain || purchased.autonomyLevel === 'supervisionato',
            description: empMeta.subtitle,
          },
        ],
        systemDirectives: directivesParts.join(' · '),
        metrics: {
          actionsExecuted: 0,
          hoursSavedMonth: 0,
          accuracyPercent: 99.4,
          lastActive: purchased.status === 'attivo' ? 'Pronto all\'uso' : 'In pausa',
        },
        createdAt: purchased.paidAt || new Date().toISOString().split('T')[0],
      });
    }
  }

  return [...derived, ...customBots];
}


