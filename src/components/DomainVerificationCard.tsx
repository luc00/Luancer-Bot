import React, { useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Clipboard,
  ClipboardCheck,
  Code2,
  FileText,
  Globe,
  KeyRound,
  Loader2,
  Lock,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
  Unlock,
} from 'lucide-react';
import { BusinessProfile, DomainVerificationMethod } from '../types/index.ts';
import { useAuth } from '../context/AuthContext.tsx';
import { parseJsonResponse } from '../utils/http.ts';

interface DomainVerificationCardProps {
  businessProfile: BusinessProfile;
  onUpdateBusinessProfile: (next: BusinessProfile) => void;
  challengeSignature: string;
  onChallengeGenerated: (payload: {
    domain: string;
    normalizedUrl: string;
    method: DomainVerificationMethod;
    token: string;
    challengeSignature: string;
  }) => void;
  onDomainVerified: (outcome: {
    verified: boolean;
    domain: string;
    method: DomainVerificationMethod;
    verifiedAt?: string;
  }) => void;
}

const VERIFICATION_METHODS: Array<{
  id: DomainVerificationMethod;
  label: string;
  shortDesc: string;
  icon: React.ReactNode;
}> = [
  {
    id: 'dns_txt',
    label: 'Record DNS TXT',
    shortDesc: 'Consigliato · Registro dominio',
    icon: <KeyRound className="w-3.5 h-3.5" />,
  },
  {
    id: 'meta_tag',
    label: 'Meta Tag HTML',
    shortDesc: 'Tag nella <head> homepage',
    icon: <Code2 className="w-3.5 h-3.5" />,
  },
  {
    id: 'well_known_file',
    label: '.well-known',
    shortDesc: 'File testo sulla root HTTPS',
    icon: <FileText className="w-3.5 h-3.5" />,
  },
];

const SITE_AUTOMATION_SCOPES: Array<{
  id: string;
  label: string;
  desc: string;
}> = [
  {
    id: 'widget_assistenza',
    label: 'Assistenza Clienti 24/7 sul sito',
    desc: 'Risponde ai visitatori su ordini, orari e tracking.',
  },
  {
    id: 'lead_preventivi',
    label: 'Qualificazione Lead & Preventivi',
    desc: 'Acquisisce richieste dal form e prepara bozze offerta.',
  },
  {
    id: 'ordini_fatture',
    label: 'Sincronizzazione Ordini & Fatture',
    desc: 'Allinea gli ordini e-commerce con Zucchetti / SDI.',
  },
  {
    id: 'audit_seo',
    label: 'Audit Tecnico, Conversioni & UX',
    desc: 'Monitora funnel, tempi di risposta e pagine chiave.',
  },
];

export const DomainVerificationCard: React.FC<DomainVerificationCardProps> = ({
  businessProfile,
  onUpdateBusinessProfile,
  challengeSignature,
  onChallengeGenerated,
  onDomainVerified,
}) => {
  const { idToken, getFreshToken } = useAuth();
  const [isGenerating, setIsGenerating] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [copiedSnippet, setCopiedSnippet] = useState(false);
  const [copiedEmbed, setCopiedEmbed] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error' | 'info';
    message: string;
    checkedTargets?: string[];
  } | null>(null);

  const isVerified =
    businessProfile.verificationStatus === 'verificato' &&
    Boolean(businessProfile.verifiedDomain);

  const activeMethod: DomainVerificationMethod = businessProfile.verificationMethod || 'dns_txt';

  const getInstructionSnippet = (): { title: string; subtitle: string; code: string } => {
    const token = businessProfile.verificationToken || '';
    const domain =
      businessProfile.websiteUrl
        .replace(/^https?:\/\//i, '')
        .split('/')[0]
        .trim() || 'tuaazienda.it';

    if (activeMethod === 'meta_tag') {
      return {
        title: 'Incolla questo tag dentro <head> della homepage del tuo sito:',
        subtitle: `Deve essere visibile pubblicamente su https://${domain}/`,
        code: `<meta name="luancer-site-verification" content="${token}" />`,
      };
    }

    if (activeMethod === 'well_known_file') {
      return {
        title: `Carica un file di testo accessibile su https://${domain}/.well-known/luancer-verify.txt`,
        subtitle: 'Contenuto esatto del file (plain text):',
        code: token,
      };
    }

    return {
      title: `Aggiungi un record TXT nei DNS di "${domain}" (hostname "@" oppure "_luancer-challenge.${domain}"):`,
      subtitle: 'Valore del record DNS TXT:',
      code: token,
    };
  };

  const handleCopyText = async (text: string, which: 'snippet' | 'embed') => {
    try {
      await navigator.clipboard.writeText(text);
      if (which === 'snippet') {
        setCopiedSnippet(true);
        window.setTimeout(() => setCopiedSnippet(false), 1800);
      } else {
        setCopiedEmbed(true);
        window.setTimeout(() => setCopiedEmbed(false), 1800);
      }
    } catch {
      // Clipboard may be unavailable in headless environments
    }
  };

  const handleWebsiteChange = (rawUrl: string) => {
    setFeedback(null);
    const stripped = rawUrl.trim().toLowerCase().replace(/^https?:\/\//, '').split('/')[0];
    const domainChanged =
      Boolean(businessProfile.verifiedDomain) && stripped !== businessProfile.verifiedDomain;

    onUpdateBusinessProfile({
      ...businessProfile,
      websiteUrl: rawUrl,
      ...(domainChanged
        ? {
            verifiedDomain: '',
            verificationStatus: 'non_verificato',
            verificationToken: '',
            verifiedAt: undefined,
          }
        : {}),
    });
  };

  const handleMethodChange = (method: DomainVerificationMethod) => {
    setFeedback(null);
    onUpdateBusinessProfile({
      ...businessProfile,
      verificationMethod: method,
      ...(businessProfile.verificationStatus === 'in_attesa'
        ? { verificationToken: '', verificationStatus: 'non_verificato' }
        : {}),
    });
  };

  const handleGenerateChallenge = async () => {
    if (isGenerating) return;
    setIsGenerating(true);
    setFeedback(null);

    try {
      const token = (await getFreshToken()) || idToken;
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers.Authorization = `Bearer ${token}`;

      const res = await fetch('/api/domain/challenge', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          websiteUrl: businessProfile.websiteUrl,
          method: activeMethod,
          ownerName: businessProfile.ownerName,
        }),
      });
      const data = await parseJsonResponse<{
        error?: string;
        domain?: string;
        normalizedUrl?: string;
        method?: DomainVerificationMethod;
        token?: string;
        challengeSignature?: string;
      }>(res);

      if (!res.ok || !data.domain || !data.normalizedUrl || !data.method || !data.token || !data.challengeSignature) {
        setFeedback({
          type: 'error',
          message: data.error || 'Impossibile generare il codice di verifica per questo indirizzo.',
        });
        return;
      }

      onChallengeGenerated({
        domain: data.domain,
        normalizedUrl: data.normalizedUrl,
        method: data.method,
        token: data.token,
        challengeSignature: data.challengeSignature,
      });

      setFeedback({
        type: 'info',
        message: `Codice generato per "${data.domain}". Pubblicalo sul tuo sito o DNS, poi clicca "Verifica Proprietà Sito".`,
      });
    } catch (err) {
      setFeedback({
        type: 'error',
        message:
          err instanceof Error
            ? err.message
            : 'Errore di rete durante la generazione della sfida di verifica.',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleVerifyOwnership = async () => {
    if (isVerifying) return;
    setIsVerifying(true);
    setFeedback(null);

    try {
      const token = (await getFreshToken()) || idToken;
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers.Authorization = `Bearer ${token}`;

      const res = await fetch('/api/domain/verify', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          websiteUrl: businessProfile.websiteUrl,
          method: activeMethod,
          token: businessProfile.verificationToken,
          challengeSignature,
        }),
      });
      const data = await parseJsonResponse<{
        verified?: boolean;
        domain?: string;
        method?: DomainVerificationMethod;
        checkedAt?: string;
        message?: string;
        checkedTargets?: string[];
      }>(res);

      if (data.verified && data.domain && data.method) {
        onDomainVerified({
          verified: true,
          domain: data.domain,
          method: data.method,
          verifiedAt: data.checkedAt,
        });
        setFeedback({
          type: 'success',
          message:
            data.message ||
            `Proprietà del dominio ${data.domain} verificata! I tuoi bot sono ora autorizzati.`,
          checkedTargets: Array.isArray(data.checkedTargets) ? data.checkedTargets : undefined,
        });
      } else {
        setFeedback({
          type: 'error',
          message:
            data.message ||
            'Verifica proprietà fallita: token non trovato. Il collegamento resta bloccato per sicurezza.',
          checkedTargets: Array.isArray(data.checkedTargets) ? data.checkedTargets : undefined,
        });
      }
    } catch (err) {
      setFeedback({
        type: 'error',
        message:
          err instanceof Error
            ? err.message
            : 'Errore durante la verifica sul server. Controlla la connessione e riprova.',
      });
    } finally {
      setIsVerifying(false);
    }
  };

  const handleToggleScope = (scopeId: string) => {
    const current = businessProfile.siteAutomationScopes || [];
    const exists = current.includes(scopeId);
    const nextScopes = exists ? current.filter((s) => s !== scopeId) : [...current, scopeId];
    onUpdateBusinessProfile({
      ...businessProfile,
      siteAutomationScopes: nextScopes,
    });
  };

  const snippet = getInstructionSnippet();
  const embedScript = `<script src="https://cdn.luancer.it/agent.js" data-domain="${
    businessProfile.verifiedDomain
  }" data-owner="${businessProfile.ownerName || 'Titolare'}" data-scopes="${(
    businessProfile.siteAutomationScopes || []
  ).join(',')}" async></script>`;

  return (
    <div
      data-testid="domain-verification-card"
      className={`rounded-xl border p-5 space-y-4 transition-colors ${
        isVerified
          ? 'bg-[#f4f8f5] border-[#263e34]/40'
          : 'bg-[#f8f9f8] border-[#ccdcd2]'
      }`}
    >
      {/* Header + Verification Status Badge */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#e2ece6]">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2 text-[11px] font-mono-brand uppercase tracking-wider font-semibold text-[#263e34]">
            <Globe className="w-3.5 h-3.5" />
            <span>Collegamento &amp; Verifica Proprietà Sito Aziendale</span>
          </div>
          <p className="text-xs text-[#465d50]">
            Collega il sito della tua azienda affinché i tuoi bot possano gestirne le attività in autonomia. Verifica reale obbligatoria anti-abuso.
          </p>
        </div>

        <span
          data-testid="domain-status-badge"
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[11px] font-semibold shrink-0 border ${
            isVerified
              ? 'bg-[#eef4f0] border-[#263e34]/30 text-[#263e34]'
              : businessProfile.verificationStatus === 'in_attesa'
                ? 'bg-amber-50 border-amber-300 text-amber-900'
                : 'bg-[#f9f2ef] border-[#c48d7a]/50 text-[#7c3525]'
          }`}
        >
          {isVerified ? (
            <>
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Sito Verificato &amp; Connesso ({businessProfile.verifiedDomain})</span>
            </>
          ) : businessProfile.verificationStatus === 'in_attesa' ? (
            <>
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>In Attesa di Verifica DNS / HTML</span>
            </>
          ) : (
            <>
              <Lock className="w-3.5 h-3.5" />
              <span>Verifica Proprietà Richiesta (Blocco Sicurezza)</span>
            </>
          )}
        </span>
      </div>

      {/* URL Input + Method Selector */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-end">
        <div className="lg:col-span-4">
          <label className="block text-[10px] font-semibold uppercase tracking-wider text-[#5e776a] mb-1">
            Sito Web Ufficiale della Tua Azienda
          </label>
          <input
            type="url"
            value={businessProfile.websiteUrl}
            onChange={(e) => handleWebsiteChange(e.target.value)}
            data-testid="company-website-input"
            placeholder="https://www.tuaazienda.it"
            className="w-full px-3 py-2 border border-[#ccdcd2] rounded-md text-xs font-mono-brand bg-white focus:outline-none focus:ring-1 focus:ring-[#263e34]"
          />
        </div>

        <div className="lg:col-span-5">
          <label className="block text-[10px] font-semibold uppercase tracking-wider text-[#5e776a] mb-1">
            Metodo di Controllo Proprietà
          </label>
          <div className="grid grid-cols-3 gap-1.5">
            {VERIFICATION_METHODS.map((m) => {
              const selected = activeMethod === m.id;
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => handleMethodChange(m.id)}
                  data-testid={`verify-method-${m.id}`}
                  title={m.shortDesc}
                  className={`px-2 py-2 rounded-md border text-[11px] font-medium flex items-center justify-center gap-1 transition-colors ${
                    selected
                      ? 'bg-[#263e34] border-[#263e34] text-white'
                      : 'bg-white border-[#ccdcd2] text-[#465d50] hover:border-[#263e34]'
                  }`}
                >
                  {m.icon}
                  <span className="whitespace-nowrap">{m.label.replace('Record ', '')}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="lg:col-span-3">
          <button
            type="button"
            onClick={handleGenerateChallenge}
            disabled={isGenerating}
            data-testid="generate-domain-challenge-btn"
            className="w-full py-2 px-3 rounded-md bg-[#263e34] hover:bg-[#1a2d25] disabled:opacity-50 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
          >
            {isGenerating ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <KeyRound className="w-3.5 h-3.5" />
            )}
            <span>Genera Codice di Verifica</span>
          </button>
        </div>
      </div>

      {/* Challenge Token Instructions & Real Server Verification Trigger */}
      {businessProfile.verificationToken && !isVerified && (
        <div
          data-testid="domain-challenge-box"
          className="rounded-lg bg-white border border-[#ccdcd2] p-4 space-y-3"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <div className="text-xs font-semibold text-[#16221d]">{snippet.title}</div>
              <div className="text-[11px] text-[#5e776a]">{snippet.subtitle}</div>
            </div>
            <button
              type="button"
              onClick={() => handleCopyText(snippet.code, 'snippet')}
              className="px-2.5 py-1.5 rounded border border-[#ccdcd2] bg-[#f7faf8] hover:border-[#263e34] text-[11px] font-medium text-[#263e34] flex items-center gap-1 self-start sm:self-auto shrink-0"
            >
              {copiedSnippet ? (
                <>
                  <ClipboardCheck className="w-3.5 h-3.5" />
                  <span>Copiato</span>
                </>
              ) : (
                <>
                  <Clipboard className="w-3.5 h-3.5" />
                  <span>Copia Token</span>
                </>
              )}
            </button>
          </div>

          <pre
            data-testid="domain-verification-token"
            className="p-2.5 rounded bg-[#16221d] text-[#eef4f0] font-mono-brand text-[11px] overflow-x-auto select-all"
          >
            {snippet.code}
          </pre>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
            <span className="text-[11px] text-[#5e776a]">
              Dopo aver pubblicato il codice, avvia il controllo reale dal server Luancer:
            </span>
            <button
              type="button"
              onClick={handleVerifyOwnership}
              disabled={isVerifying}
              data-testid="verify-domain-ownership-btn"
              className="px-4 py-2 rounded-md bg-[#16221d] hover:bg-[#263e34] disabled:opacity-50 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors shrink-0"
            >
              {isVerifying ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Controllo DNS / HTTPS in corso...</span>
                </>
              ) : (
                <>
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Verifica Proprietà Sito</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Server Verification Result / Error Feedback */}
      {feedback && (
        <div
          data-testid="domain-verify-feedback"
          className={`rounded-lg border p-3 text-xs space-y-1.5 ${
            feedback.type === 'success'
              ? 'bg-[#eef4f0] border-[#263e34]/40 text-[#16221d]'
              : feedback.type === 'error'
                ? 'bg-[#fdf2f0] border-[#c48d7a]/60 text-[#7c3525]'
                : 'bg-white border-[#ccdcd2] text-[#263e34]'
          }`}
        >
          <div className="flex items-start gap-2 font-medium">
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-[#263e34] shrink-0 mt-0.5" />
            ) : feedback.type === 'error' ? (
              <ShieldAlert className="w-4 h-4 text-[#9a3d29] shrink-0 mt-0.5" />
            ) : (
              <KeyRound className="w-4 h-4 text-[#263e34] shrink-0 mt-0.5" />
            )}
            <span>{feedback.message}</span>
          </div>
          {feedback.checkedTargets && feedback.checkedTargets.length > 0 && (
            <div className="pl-6 text-[10px] font-mono-brand opacity-85">
              Endpoint controllati: {feedback.checkedTargets.join(' · ')}
            </div>
          )}
        </div>
      )}

      {/* Anti-Abuse Lock vs Unlocked Autonomous Site Operations */}
      {!isVerified ? (
        <div
          data-testid="domain-security-lock-notice"
          className="rounded-lg bg-white border border-dashed border-[#c48d7a]/70 p-3 flex items-start gap-2.5 text-[11px] text-[#5e4238]"
        >
          <Lock className="w-4 h-4 text-[#9a3d29] shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold text-[#7c3525]">
              Blocco Sicurezza Anti-Abuso Attivo:
            </span>{' '}
            i bot non possono eseguire azioni automatiche su siti esterni o di terzi finché non dimostri di esserne il proprietario legittimo. Puoi comunque configurare e simulare i flussi internamente nella Console Operativa.
          </div>
        </div>
      ) : (
        <div
          data-testid="domain-unlocked-operations"
          className="rounded-lg bg-white border border-[#263e34]/30 p-4 space-y-3"
        >
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-[#263e34]">
              <Unlock className="w-3.5 h-3.5" />
              <span>
                Azioni Autonome Abilitate sul Sito ({businessProfile.verifiedDomain})
              </span>
            </div>
            {businessProfile.verifiedAt && (
              <span className="text-[10px] font-mono-brand text-[#5e776a]">
                Verificato il {businessProfile.verifiedAt.split('T')[0]}
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {SITE_AUTOMATION_SCOPES.map((scope) => {
              const checked = (businessProfile.siteAutomationScopes || []).includes(scope.id);
              return (
                <label
                  key={scope.id}
                  className={`p-2.5 rounded-md border text-xs flex items-start gap-2 cursor-pointer transition-colors ${
                    checked
                      ? 'bg-[#f7faf8] border-[#263e34]/40'
                      : 'bg-white border-[#e2ece6] opacity-75'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => handleToggleScope(scope.id)}
                    className="mt-0.5 accent-[#263e34]"
                  />
                  <div>
                    <div className="font-semibold text-[#16221d]">{scope.label}</div>
                    <div className="text-[11px] text-[#5e776a]">{scope.desc}</div>
                  </div>
                </label>
              );
            })}
          </div>

          <div className="pt-2 border-t border-[#e2ece6] space-y-1.5">
            <div className="flex items-center justify-between text-[11px]">
              <span className="font-semibold text-[#16221d]">
                Snippet Connettore per il Tuo Sito (autorizzato per {businessProfile.ownerName || 'Titolare'})
              </span>
              <button
                type="button"
                onClick={() => handleCopyText(embedScript, 'embed')}
                className="text-[#263e34] hover:underline font-medium flex items-center gap-1"
              >
                {copiedEmbed ? (
                  <>
                    <ClipboardCheck className="w-3 h-3" />
                    <span>Copiato</span>
                  </>
                ) : (
                  <>
                    <Clipboard className="w-3 h-3" />
                    <span>Copia Snippet</span>
                  </>
                )}
              </button>
            </div>
            <pre className="p-2 rounded bg-[#16221d] text-[#eef4f0] font-mono-brand text-[10px] overflow-x-auto">
              {embedScript}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
};
