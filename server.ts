import 'dotenv/config';
import crypto from 'node:crypto';
import dns from 'node:dns/promises';
import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import { requireAuth, optionalAuth, AuthRequest } from './src/middleware/auth.ts';
import {
  getOrCreateUser,
  updateUserPlan,
  updateUserBusinessIdentity,
  saveDomainChallenge,
  markDomainVerified,
} from './src/db/users.ts';
import {
  listUserPurchasedBots,
  createPurchasedBot,
  updatePurchasedBot,
  deletePurchasedBot,
  recordUserTransaction,
} from './src/db/bots.ts';
import {
  normalizeCompanyDomain,
  isPrivateOrReservedIp,
  verifyDomainOwnershipWithProviders,
} from './src/utils/domainVerification.ts';
import { DomainVerificationMethod } from './src/types/index.ts';

const PORT = Number(process.env.PORT) || 3000;
const DOMAIN_HMAC_SECRET =
  process.env.DOMAIN_VERIFY_SECRET || process.env.GEMINI_API_KEY || 'luancer-domain-hmac-dev-key';

function signChallengePayload(domain: string, method: string, token: string): string {
  return crypto
    .createHmac('sha256', DOMAIN_HMAC_SECRET)
    .update(`${domain}|${method}|${token}`)
    .digest('hex');
}

function safeEqualHex(a: string, b: string): boolean {
  if (!a || !b || a.length !== b.length) return false;
  try {
    return crypto.timingSafeEqual(Buffer.from(a, 'hex'), Buffer.from(b, 'hex'));
  } catch {
    return false;
  }
}

async function assertPublicHostResolution(hostname: string): Promise<void> {
  const addresses = await dns.lookup(hostname, { all: true });
  if (!addresses || addresses.length === 0) {
    throw new Error(`Nessun record DNS trovato per ${hostname}.`);
  }
  for (const addr of addresses) {
    if (isPrivateOrReservedIp(addr.address)) {
      throw new Error(`L'indirizzo IP risolto per ${hostname} non è pubblico e non è consentito.`);
    }
  }
}

async function fetchPublicTextSafely(rawUrl: string): Promise<{ ok: boolean; status: number; body: string }> {
  let currentUrl = rawUrl;
  for (let hops = 0; hops < 3; hops++) {
    const parsed = new URL(currentUrl);
    await assertPublicHostResolution(parsed.hostname);

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 5500);
    try {
      const response = await fetch(currentUrl, {
        method: 'GET',
        redirect: 'manual',
        signal: controller.signal,
        headers: {
          'User-Agent': 'LuancerDomainVerifier/1.0 (+https://luancer.it)',
          Accept: 'text/html,text/plain;q=0.9,*/*;q=0.5',
        },
      });

      if (response.status >= 300 && response.status < 400) {
        const location = response.headers.get('location');
        if (!location) return { ok: false, status: response.status, body: '' };
        const nextParsed = new URL(location, currentUrl);
        const norm = normalizeCompanyDomain(nextParsed.toString());
        if (!norm.valid) {
          throw new Error('Redirect verso destinazione non consentita.');
        }
        currentUrl = nextParsed.toString();
        continue;
      }

      const text = await response.text();
      return { ok: response.ok, status: response.status, body: text.slice(0, 262144) };
    } finally {
      clearTimeout(timer);
    }
  }
  return { ok: false, status: 310, body: '' };
}

const ai = process.env.GEMINI_API_KEY
  ? new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    })
  : null;

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '1mb' }));

  // Healthcheck
  app.get('/api/health', (_req, res) => {
    res.json({ ok: true, service: 'luancer-orchestration-api' });
  });

  // Sync user & load purchased customizable bots (PostgreSQL + Firebase Auth)
  app.get('/api/me', requireAuth, async (req: AuthRequest, res) => {
    try {
      const uid = req.user!.uid;
      const email = req.user!.email || `${uid}@luancer.local`;
      const name = typeof req.user!.name === 'string' ? req.user!.name : undefined;

      const user = await getOrCreateUser(uid, email, name);
      const bots = await listUserPurchasedBots(uid);
      res.json({ user, bots });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Errore interno del server.';
      res.status(500).json({ error: message });
    }
  });

  // Purchase and persist a customizable bot (either 6-in-1 All-in-One or modular selection)
  app.post('/api/bots/purchase', requireAuth, async (req: AuthRequest, res) => {
    try {
      const uid = req.user!.uid;
      const email = req.user!.email || `${uid}@luancer.local`;
      const displayName = typeof req.user!.name === 'string' ? req.user!.name : undefined;

      await getOrCreateUser(uid, email, displayName);

      const {
        botCode,
        name,
        bundleType,
        billingCycle,
        priceEur,
        autonomyLevel,
        finishId,
        selectedEmployees,
        moduleConfigs,
        guardrails,
        customDirectives,
        connectedSoftware,
      } = req.body ?? {};

      if (!name || typeof name !== 'string' || !Array.isArray(selectedEmployees) || selectedEmployees.length === 0) {
        return res.status(400).json({ error: 'Dati del bot incompleti: specifica nome e almeno un modulo dipendente.' });
      }

      const safePrice = typeof priceEur === 'number' && priceEur > 0 ? Math.round(priceEur) : 199;
      const safeBundle = bundleType === 'all_in_one' ? 'all_in_one' : 'modular';
      const safeCycle = billingCycle === 'monthly' ? 'monthly' : 'annual';

      const createdBot = await createPurchasedBot({
        userUid: uid,
        botCode: typeof botCode === 'string' && botCode.trim() ? botCode.trim() : `BOT-${Date.now().toString().slice(-4)}`,
        name: name.trim().slice(0, 120),
        bundleType: safeBundle,
        billingCycle: safeCycle,
        priceEur: safePrice,
        autonomyLevel: typeof autonomyLevel === 'string' ? autonomyLevel : 'semi-autonomo',
        finishId: typeof finishId === 'string' ? finishId : 'sage_brass',
        selectedEmployees: selectedEmployees.slice(0, 6),
        moduleConfigs: moduleConfigs && typeof moduleConfigs === 'object' ? moduleConfigs : {},
        guardrails:
          guardrails && typeof guardrails === 'object'
            ? guardrails
            : {
                priorities: 'Conferma settimanale delle 3 priorità dal titolare',
                decisions: 'Analisi AI preparata, scelta finale al titolare',
                relationships: 'Trattative strategiche e reclami critici gestiti dal titolare',
                qualityControl: 'Revisione rapida output prima della pubblicazione',
              },
        customDirectives: typeof customDirectives === 'string' ? customDirectives.slice(0, 2000) : '',
        connectedSoftware: Array.isArray(connectedSoftware) ? connectedSoftware.slice(0, 12) : ['Zucchetti'],
      });

      await recordUserTransaction({
        userUid: uid,
        docNumber: `ORD-${new Date().getFullYear()}/${createdBot.id}`,
        clientOrVendor: email,
        recordType: 'abbonamento',
        description: `Attivazione ${createdBot.name} (${safeCycle === 'annual' ? 'Annuale' : 'Mensile'})`,
        amountGrossEur: Math.round(safePrice * 1.22 * 100) / 100,
        direction: 'entrata',
        status: 'saldato',
      });

      res.status(201).json({ bot: createdBot });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Errore durante la registrazione dell\'acquisto.';
      res.status(500).json({ error: message });
    }
  });

  // Update customization of a purchased bot
  app.patch('/api/bots/:id', requireAuth, async (req: AuthRequest, res) => {
    try {
      const id = Number(req.params.id);
      if (!Number.isInteger(id) || id <= 0) {
        return res.status(400).json({ error: 'Identificativo bot non valido.' });
      }

      const uid = req.user!.uid;
      const allowedUpdates: Record<string, unknown> = {};
      const fields = [
        'name',
        'autonomyLevel',
        'finishId',
        'selectedEmployees',
        'moduleConfigs',
        'guardrails',
        'customDirectives',
        'connectedSoftware',
        'status',
      ] as const;

      for (const field of fields) {
        if (req.body && req.body[field] !== undefined) {
          allowedUpdates[field] = req.body[field];
        }
      }

      const updated = await updatePurchasedBot(id, uid, allowedUpdates);
      if (!updated) {
        return res.status(404).json({ error: 'Bot non trovato per questo account.' });
      }

      res.json({ bot: updated });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Errore aggiornamento bot.';
      res.status(500).json({ error: message });
    }
  });

  // Remove a purchased bot configuration
  app.delete('/api/bots/:id', requireAuth, async (req: AuthRequest, res) => {
    try {
      const id = Number(req.params.id);
      if (!Number.isInteger(id) || id <= 0) {
        return res.status(400).json({ error: 'Identificativo bot non valido.' });
      }

      const deleted = await deletePurchasedBot(id, req.user!.uid);
      if (!deleted) {
        return res.status(404).json({ error: 'Bot non trovato.' });
      }

      res.json({ deletedId: id });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Errore eliminazione bot.';
      res.status(500).json({ error: message });
    }
  });

  // Activate company subscription plan
  app.post('/api/subscriptions/activate', requireAuth, async (req: AuthRequest, res) => {
    try {
      const uid = req.user!.uid;
      const email = req.user!.email || `${uid}@luancer.local`;
      const name = typeof req.user!.name === 'string' ? req.user!.name : undefined;

      await getOrCreateUser(uid, email, name);

      const { planId, billingCycle, monthlyEur, companyName } = req.body ?? {};
      if (!planId || typeof planId !== 'string') {
        return res.status(400).json({ error: 'Piano selezionato non valido.' });
      }

      const safeCycle = billingCycle === 'monthly' ? 'monthly' : 'annual';
      const user = await updateUserPlan(uid, planId, safeCycle, typeof companyName === 'string' ? companyName : undefined);

      if (typeof monthlyEur === 'number' && monthlyEur > 0) {
        await recordUserTransaction({
          userUid: uid,
          docNumber: `SUB-${new Date().getFullYear()}/${Date.now().toString().slice(-4)}`,
          clientOrVendor: email,
          recordType: 'abbonamento',
          description: `Piano aziendale ${planId} (${safeCycle === 'annual' ? 'Annuale' : 'Mensile'})`,
          amountGrossEur: Math.round(monthlyEur * (safeCycle === 'annual' ? 12 : 1) * 1.22 * 100) / 100,
          direction: 'entrata',
          status: 'saldato',
        });
      }

      res.json({ user });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Errore attivazione abbonamento.';
      res.status(500).json({ error: message });
    }
  });

  // Update authenticated client's business identity (companyName, ownerName, websiteUrl)
  app.post('/api/profile', requireAuth, async (req: AuthRequest, res) => {
    try {
      const uid = req.user!.uid;
      const email = req.user!.email || `${uid}@luancer.local`;
      const name = typeof req.user!.name === 'string' ? req.user!.name : undefined;
      const currentUser = await getOrCreateUser(uid, email, name);

      const { companyName, ownerName, websiteUrl } = req.body ?? {};
      if (companyName !== undefined && (typeof companyName !== 'string' || companyName.trim().length < 2)) {
        return res.status(400).json({ error: 'Inserisci una ragione sociale valida.' });
      }

      let normalizedWebsite: string | undefined;
      let shouldResetVerification = false;
      if (typeof websiteUrl === 'string') {
        const trimmedUrl = websiteUrl.trim();
        if (!trimmedUrl) {
          normalizedWebsite = '';
          shouldResetVerification = Boolean(currentUser.verifiedDomain);
        } else {
          const norm = normalizeCompanyDomain(trimmedUrl);
          if (!norm.valid) {
            return res.status(400).json({ error: norm.error });
          }
          normalizedWebsite = norm.normalizedUrl;
          if (currentUser.verifiedDomain && currentUser.verifiedDomain !== norm.domain) {
            shouldResetVerification = true;
          }
        }
      }

      const user = await updateUserBusinessIdentity(uid, {
        companyName: typeof companyName === 'string' ? companyName : undefined,
        ownerName: typeof ownerName === 'string' ? ownerName : undefined,
        websiteUrl: normalizedWebsite,
        resetVerification: shouldResetVerification,
      });
      res.json({ user });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Errore aggiornamento profilo azienda.';
      res.status(500).json({ error: message });
    }
  });

  // Generate domain ownership verification challenge bound to owner & domain
  app.post('/api/domain/challenge', optionalAuth, async (req: AuthRequest, res) => {
    try {
      const { websiteUrl, method, ownerName } = req.body ?? {};
      const norm = normalizeCompanyDomain(typeof websiteUrl === 'string' ? websiteUrl : '');
      if (!norm.valid) {
        return res.status(400).json({ error: norm.error });
      }

      const cleanOwner = typeof ownerName === 'string' ? ownerName.trim() : '';
      if (cleanOwner.length < 2) {
        return res.status(400).json({
          error: 'Inserisci prima il tuo Nome e Cognome: i bot aziendali devono essere intestati a nome proprio.',
        });
      }

      const safeMethod: DomainVerificationMethod =
        method === 'meta_tag' || method === 'well_known_file' ? method : 'dns_txt';

      const identitySeed = req.user?.uid || cleanOwner.toLowerCase();
      const digest = crypto
        .createHmac('sha256', DOMAIN_HMAC_SECRET)
        .update(`${identitySeed}|${norm.domain}|${safeMethod}`)
        .digest('hex')
        .slice(0, 20);
      const token = `luancer-verify=${digest}`;
      const challengeSignature = signChallengePayload(norm.domain, safeMethod, token);

      if (req.user) {
        const email = req.user.email || `${req.user.uid}@luancer.local`;
        const name = typeof req.user.name === 'string' ? req.user.name : undefined;
        await getOrCreateUser(req.user.uid, email, name);
        await saveDomainChallenge(req.user.uid, {
          websiteUrl: norm.normalizedUrl,
          method: safeMethod,
          token,
        });
      }

      res.json({
        domain: norm.domain,
        normalizedUrl: norm.normalizedUrl,
        method: safeMethod,
        token,
        challengeSignature,
        status: 'in_attesa',
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Errore generazione sfida verifica dominio.';
      res.status(500).json({ error: message });
    }
  });

  // Verify real ownership of the client's website via DNS TXT, HTML meta tag, or .well-known file
  app.post('/api/domain/verify', optionalAuth, async (req: AuthRequest, res) => {
    try {
      const { websiteUrl, method, token, challengeSignature } = req.body ?? {};
      const norm = normalizeCompanyDomain(typeof websiteUrl === 'string' ? websiteUrl : '');
      if (!norm.valid) {
        return res.status(400).json({ verified: false, error: norm.error, message: norm.error });
      }

      const safeMethod: DomainVerificationMethod =
        method === 'meta_tag' || method === 'well_known_file' ? method : 'dns_txt';
      const expectedToken = typeof token === 'string' ? token.trim() : '';

      if (!expectedToken) {
        return res.status(400).json({
          verified: false,
          message: 'Genera prima un codice di verifica per questo dominio.',
        });
      }

      // Prevent client-side token forgery or cross-domain replay
      const expectedSig = signChallengePayload(norm.domain, safeMethod, expectedToken);
      if (typeof challengeSignature !== 'string' || !safeEqualHex(challengeSignature, expectedSig)) {
        return res.status(403).json({
          verified: false,
          message: 'Firma di verifica non valida o dominio modificato. Rigenera il codice di verifica.',
        });
      }

      // Check DNS public resolution upfront for HTTP-based methods (anti-SSRF)
      if (safeMethod !== 'dns_txt') {
        try {
          await assertPublicHostResolution(norm.domain);
        } catch (ssrfErr: unknown) {
          const msg = ssrfErr instanceof Error ? ssrfErr.message : 'Host non raggiungibile o privato.';
          return res.status(400).json({
            verified: false,
            domain: norm.domain,
            method: safeMethod,
            checkedTargets: [norm.normalizedUrl],
            foundPreview: [],
            message: msg,
          });
        }
      }

      const outcome = await verifyDomainOwnershipWithProviders(
        {
          domain: norm.domain,
          method: safeMethod,
          expectedToken,
        },
        {
          resolveTxt: (host) => dns.resolveTxt(host),
          fetchText: fetchPublicTextSafely,
        }
      );

      if (outcome.verified && req.user) {
        await markDomainVerified(req.user.uid, {
          domain: outcome.domain,
          websiteUrl: norm.normalizedUrl,
          method: outcome.method,
        });
      }

      res.json(outcome);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Errore durante il controllo di proprietà dominio.';
      res.status(500).json({ verified: false, message });
    }
  });

  // Dipendente 1: Analista di Mercato Live with Gemini Google Search Grounding
  app.post('/api/market-research', async (req, res) => {
    try {
      const { sector, focus, companyIdea } = req.body ?? {};
      if (!sector || typeof sector !== 'string' || sector.trim().length < 2) {
        return res.status(400).json({ error: 'Inserisci un settore aziendale valido da analizzare.' });
      }

      if (!ai) {
        return res.status(503).json({
          error: 'Servizio di ricerca di mercato non disponibile: chiave GEMINI_API_KEY non configurata nell\'ambiente.',
        });
      }

      const cleanSector = sector.trim().slice(0, 180);
      const cleanFocus = typeof focus === 'string' ? focus.trim().slice(0, 180) : 'competitor, prezzi e segmenti scoperti';
      const cleanIdea = typeof companyIdea === 'string' ? companyIdea.trim().slice(0, 240) : '';

      const prompt = [
        `Analizza in tempo reale il mercato "${cleanSector}" in Italia.`,
        cleanIdea ? `Contesto offerta dell'impresa cliente: "${cleanIdea}".` : '',
        `Focus prioritario richiesto: ${cleanFocus}.`,
        'Fornisci un report operativo in italiano suddiviso chiaramente in 4 sezioni:',
        '1. Player Principali e Posizionamento (reali sul mercato italiano)',
        '2. Fasce di Prezzo e Modelli di Offerta riscontrati',
        '3. Segmenti Scoperti e Opportunità di Mercato',
        '4. Tre Angoli di Posizionamento Differenzianti pronti per il Direttore Marketing e il CTO',
      ]
        .filter(Boolean)
        .join('\n\n');

      let usedModel = 'gemini-4-hydrogen';
      let response;
      try {
        response = await ai.models.generateContent({
          model: usedModel,
          contents: prompt,
          config: {
            systemInstruction:
              'Sei il Dipendente 1 (Analista di Mercato Senior) di Luancer & Co. Rispondi in italiano professionale, concreto, orientato alle PMI e alle aziende italiane. Basati esclusivamente su dati reali verificati tramite Google Search.',
            tools: [{ googleSearch: {} }],
          },
        });
      } catch (primaryErr: unknown) {
        const msg = primaryErr instanceof Error ? primaryErr.message : '';
        if (msg.includes('429') || msg.includes('RESOURCE_EXHAUSTED')) {
          usedModel = 'gemini-3.1-flash-lite';
          response = await ai.models.generateContent({
            model: usedModel,
            contents: prompt,
            config: {
              systemInstruction:
                'Sei il Dipendente 1 (Analista di Mercato Senior) di Luancer & Co. Rispondi in italiano professionale, concreto, orientato alle PMI e alle aziende italiane. Basati esclusivamente su dati reali verificati tramite Google Search.',
              tools: [{ googleSearch: {} }],
            },
          });
        } else {
          throw primaryErr;
        }
      }

      const rawChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks ?? [];
      const seenUris = new Set<string>();
      const sources: Array<{ title: string; uri: string }> = [];

      for (const chunk of rawChunks) {
        const uri = chunk.web?.uri;
        const title = chunk.web?.title || uri || 'Fonte Web Verificata';
        if (uri && !seenUris.has(uri)) {
          seenUris.add(uri);
          sources.push({ title, uri });
        }
      }

      res.json({
        sector: cleanSector,
        focus: cleanFocus,
        reportMarkdown: response.text || 'Analisi completata ma nessun testo generato.',
        sources,
        model: usedModel,
        generatedAt: new Date().toISOString(),
      });
    } catch (error: unknown) {
      console.error('Market research error:', error);
      const rawMessage = error instanceof Error ? error.message : '';
      const isQuota = rawMessage.includes('429') || rawMessage.includes('RESOURCE_EXHAUSTED');
      if (isQuota) {
        return res.status(429).json({
          error:
            'Quota delle richieste AI temporaneamente esaurita sul progetto collegato. Attendi qualche istante e riprova, oppure verifica i limiti nel pannello Google AI Studio.',
        });
      }
      res.status(500).json({
        error: 'Servizio di ricerca di mercato temporaneamente non raggiungibile. Riprova tra qualche istante.',
      });
    }
  });

  // Vite dev middleware vs production static serve
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(import.meta.dirname, 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Luancer & Co. server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Fatal server startup error:', err);
  process.exit(1);
});
