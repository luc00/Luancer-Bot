import { DomainVerificationMethod } from '../types/index.ts';

export type DomainNormalizationResult =
  | { valid: true; domain: string; normalizedUrl: string }
  | { valid: false; error: string };

export interface DomainVerificationOutput {
  verified: boolean;
  domain: string;
  method: DomainVerificationMethod;
  checkedTargets: string[];
  foundPreview: string[];
  message: string;
  verifiedAt?: string;
}

export interface DomainVerificationProviders {
  resolveTxt: (hostname: string) => Promise<string[][]>;
  fetchText: (url: string) => Promise<{ ok: boolean; status: number; body: string }>;
}

const IPV4_LITERAL_RE = /^(\d{1,3}\.){3}\d{1,3}$/;
const HOSTNAME_RE = /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)+$/;

/**
 * Checks whether an IPv4 or IPv6 literal belongs to loopback, private, link-local, or reserved ranges (anti-SSRF).
 */
export function isPrivateOrReservedIp(rawIp: string): boolean {
  const ip = rawIp.trim().toLowerCase();
  if (!ip) return true;

  // Handle IPv4-mapped IPv6 addresses (e.g., ::ffff:127.0.0.1)
  const v4Candidate = ip.startsWith('::ffff:') ? ip.slice(7) : ip;

  if (IPV4_LITERAL_RE.test(v4Candidate)) {
    const parts = v4Candidate.split('.').map((n) => Number(n));
    if (parts.some((n) => Number.isNaN(n) || n < 0 || n > 255)) return true;
    const [a, b] = parts;
    if (a === 0 || a === 10 || a === 127) return true;
    if (a === 169 && b === 254) return true; // link-local / cloud metadata
    if (a === 172 && b >= 16 && b <= 31) return true; // RFC1918
    if (a === 192 && b === 168) return true; // RFC1918
    if (a === 100 && b >= 64 && b <= 127) return true; // CGNAT
    if (a >= 224) return true; // multicast / reserved
    return false;
  }

  // IPv6 loopback, unspecified, link-local, unique-local
  if (
    ip === '::' ||
    ip === '::1' ||
    ip.startsWith('fe80:') ||
    ip.startsWith('fc') ||
    ip.startsWith('fd')
  ) {
    return true;
  }

  return false;
}

/**
 * Normalizes and validates a user-submitted company website URL / domain.
 * Blocks loopback, raw IP literals, local hostnames, credentials, and non-standard ports.
 */
export function normalizeCompanyDomain(rawInput: string): DomainNormalizationResult {
  const trimmed = rawInput.trim();
  if (!trimmed) {
    return { valid: false, error: 'Inserisci l\'indirizzo web della tua azienda (es. https://www.tuaazienda.it).' };
  }

  const withScheme = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;

  let parsed: URL;
  try {
    parsed = new URL(withScheme);
  } catch {
    return { valid: false, error: 'Formato URL non valido. Inserisci un dominio come https://www.tuaazienda.it.' };
  }

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    return { valid: false, error: 'Sono supportati esclusivamente siti HTTP o HTTPS.' };
  }

  if (parsed.username || parsed.password) {
    return { valid: false, error: 'L\'URL non può contenere credenziali incorporate.' };
  }

  if (parsed.port && parsed.port !== '80' && parsed.port !== '443') {
    return { valid: false, error: 'Le porte personalizzate non sono ammesse per la verifica aziendale.' };
  }

  const hostname = parsed.hostname.toLowerCase().replace(/\.+$/, '');

  if (
    hostname === 'localhost' ||
    hostname.endsWith('.localhost') ||
    hostname.endsWith('.local') ||
    hostname.endsWith('.internal') ||
    hostname.endsWith('.arpa')
  ) {
    return { valid: false, error: 'Domini locali o interni non possono essere collegati ai bot.' };
  }

  if (IPV4_LITERAL_RE.test(hostname) || hostname.includes(':')) {
    return { valid: false, error: 'Inserisci un nome a dominio pubblico (non un indirizzo IP numerico).' };
  }

  if (!HOSTNAME_RE.test(hostname)) {
    return { valid: false, error: 'Nome a dominio non valido. Verifica l\'estensione (es. .it, .com, .eu).' };
  }

  return {
    valid: true,
    domain: hostname,
    normalizedUrl: `https://${hostname}`,
  };
}

/**
 * Extracts `content` attribute values for `<meta name="luancer-site-verification" ...>` regardless of attribute order.
 */
export function extractLuancerMetaContents(html: string): string[] {
  const matches: string[] = [];
  const metaTagRe = /<meta\b[^>]*>/gi;
  let tagMatch: RegExpExecArray | null;

  while ((tagMatch = metaTagRe.exec(html)) !== null) {
    const tag = tagMatch[0];
    const nameMatch = tag.match(/\b(?:name|property)\s*=\s*["']([^"']+)["']/i);
    if (!nameMatch || nameMatch[1].trim().toLowerCase() !== 'luancer-site-verification') {
      continue;
    }
    const contentMatch = tag.match(/\bcontent\s*=\s*["']([^"']+)["']/i);
    if (contentMatch && contentMatch[1].trim()) {
      matches.push(contentMatch[1].trim());
    }
  }

  return matches;
}

/**
 * Executes domain ownership verification against DNS TXT, HTML Meta Tag, or `.well-known/luancer-verify.txt`.
 */
export async function verifyDomainOwnershipWithProviders(
  params: {
    domain: string;
    method: DomainVerificationMethod;
    expectedToken: string;
  },
  providers: DomainVerificationProviders
): Promise<DomainVerificationOutput> {
  const cleanDomain = params.domain.trim().toLowerCase();
  const apexDomain = cleanDomain.startsWith('www.') ? cleanDomain.slice(4) : cleanDomain;
  const expectedToken = params.expectedToken.trim();

  if (!cleanDomain || !expectedToken) {
    return {
      verified: false,
      domain: cleanDomain,
      method: params.method,
      checkedTargets: [],
      foundPreview: [],
      message: 'Dominio o codice di verifica mancante.',
    };
  }

  if (params.method === 'dns_txt') {
    const hostsToCheck = Array.from(
      new Set([`_luancer-verification.${apexDomain}`, apexDomain, cleanDomain])
    );
    const checkedTargets: string[] = [];
    const foundValues: string[] = [];

    for (const host of hostsToCheck) {
      checkedTargets.push(`TXT ${host}`);
      try {
        const records = await providers.resolveTxt(host);
        for (const chunks of records) {
          const joined = chunks.join('').trim();
          if (joined) foundValues.push(joined);
          if (joined === expectedToken) {
            return {
              verified: true,
              domain: cleanDomain,
              method: 'dns_txt',
              checkedTargets,
              foundPreview: [joined],
              message: `Proprietà verificata via record DNS TXT su ${host}. I tuoi bot sono autorizzati ad operare sul sito.`,
              verifiedAt: new Date().toISOString(),
            };
          }
        }
      } catch {
        // Ignore NXDOMAIN/NODATA per candidate host and continue inspecting fallback hosts
      }
    }

    return {
      verified: false,
      domain: cleanDomain,
      method: 'dns_txt',
      checkedTargets,
      foundPreview: foundValues.slice(0, 3),
      message: `Verifica DNS fallita: il record TXT "${expectedToken}" non è stato trovato su ${hostsToCheck.join(' o ')}. Collegamento bot bloccato per sicurezza.`,
    };
  }

  if (params.method === 'meta_tag') {
    const urls = Array.from(new Set([`https://${cleanDomain}/`, `https://${apexDomain}/`]));
    const checkedTargets: string[] = [];
    const foundTags: string[] = [];

    for (const url of urls) {
      checkedTargets.push(url);
      try {
        const res = await providers.fetchText(url);
        if (!res.ok) continue;
        const metaValues = extractLuancerMetaContents(res.body);
        foundTags.push(...metaValues);
        if (metaValues.some((val) => val === expectedToken)) {
          return {
            verified: true,
            domain: cleanDomain,
            method: 'meta_tag',
            checkedTargets,
            foundPreview: [expectedToken],
            message: `Proprietà verificata via Meta Tag HTML su ${url}. I tuoi bot possono ora operare in autonomia sul sito.`,
            verifiedAt: new Date().toISOString(),
          };
        }
      } catch {
        // Continue to alternate URL
      }
    }

    return {
      verified: false,
      domain: cleanDomain,
      method: 'meta_tag',
      checkedTargets,
      foundPreview: foundTags.slice(0, 3),
      message: `Verifica Meta Tag fallita: nessuna corrispondenza per <meta name="luancer-site-verification" content="${expectedToken}"> su ${cleanDomain}. Collegamento bloccato.`,
    };
  }

  // well_known_file
  const fileUrls = Array.from(
    new Set([
      `https://${cleanDomain}/.well-known/luancer-verify.txt`,
      `https://${apexDomain}/.well-known/luancer-verify.txt`,
    ])
  );
  const checkedTargets: string[] = [];
  const foundLines: string[] = [];

  for (const fileUrl of fileUrls) {
    checkedTargets.push(fileUrl);
    try {
      const res = await providers.fetchText(fileUrl);
      if (!res.ok) continue;
      const lines = res.body
        .split(/\r?\n/)
        .map((l) => l.trim())
        .filter(Boolean);
      foundLines.push(...lines);
      if (lines.some((line) => line === expectedToken)) {
        return {
          verified: true,
          domain: cleanDomain,
          method: 'well_known_file',
          checkedTargets,
          foundPreview: [expectedToken],
          message: `Proprietà verificata via file pubblico ${fileUrl}. Connessione autonoma autorizzata.`,
          verifiedAt: new Date().toISOString(),
        };
      }
    } catch {
      // Continue
    }
  }

  return {
    verified: false,
    domain: cleanDomain,
    method: 'well_known_file',
    checkedTargets,
    foundPreview: foundLines.slice(0, 3),
    message: `Verifica file fallita: ${fileUrls[0]} non restituisce il codice "${expectedToken}". Impossibile collegare bot a siti non verificati.`,
  };
}
