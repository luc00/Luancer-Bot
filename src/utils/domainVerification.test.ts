import test from 'node:test';
import assert from 'node:assert/strict';
import {
  extractLuancerMetaContents,
  isPrivateOrReservedIp,
  normalizeCompanyDomain,
  verifyDomainOwnershipWithProviders,
} from './domainVerification.ts';

test('normalizeCompanyDomain validates public domains and rejects local or SSRF targets', () => {
  const ok = normalizeCompanyDomain('https://www.OfficinaBeta.it/chi-siamo');
  assert.equal(ok.valid, true);
  if (ok.valid) {
    assert.equal(ok.domain, 'www.officinabeta.it');
    assert.equal(ok.normalizedUrl, 'https://www.officinabeta.it');
  }

  const bare = normalizeCompanyDomain('studiobianchi.it');
  assert.equal(bare.valid, true);
  if (bare.valid) {
    assert.equal(bare.domain, 'studiobianchi.it');
  }

  assert.equal(normalizeCompanyDomain('http://localhost:3000').valid, false);
  assert.equal(normalizeCompanyDomain('http://127.0.0.1').valid, false);
  assert.equal(normalizeCompanyDomain('http://192.168.1.10').valid, false);
  assert.equal(normalizeCompanyDomain('https://intranet.internal').valid, false);
  assert.equal(normalizeCompanyDomain('https://azienda.it:8080').valid, false);
  assert.equal(normalizeCompanyDomain('').valid, false);
});

test('isPrivateOrReservedIp blocks loopback, RFC1918, metadata IPs and allows public IPs', () => {
  assert.equal(isPrivateOrReservedIp('127.0.0.1'), true);
  assert.equal(isPrivateOrReservedIp('10.0.4.2'), true);
  assert.equal(isPrivateOrReservedIp('172.16.0.1'), true);
  assert.equal(isPrivateOrReservedIp('192.168.0.55'), true);
  assert.equal(isPrivateOrReservedIp('169.254.169.254'), true);
  assert.equal(isPrivateOrReservedIp('::1'), true);
  assert.equal(isPrivateOrReservedIp('::ffff:127.0.0.1'), true);
  assert.equal(isPrivateOrReservedIp('93.184.216.34'), false);
  assert.equal(isPrivateOrReservedIp('8.8.8.8'), false);
});

test('extractLuancerMetaContents parses meta tag regardless of attribute order', () => {
  const html = `
    <html><head>
      <meta charset="utf-8" />
      <meta content="luancer-verify=abc123" name="luancer-site-verification" />
      <meta name="description" content="Sito aziendale" />
    </head></html>
  `;
  assert.deepEqual(extractLuancerMetaContents(html), ['luancer-verify=abc123']);
});

test('verifyDomainOwnershipWithProviders passes only when real DNS TXT / Meta / Well-Known token matches', async () => {
  const expectedToken = 'luancer-verify=99aa88bb77cc';

  // 1. DNS TXT pass & fail
  const dnsPass = await verifyDomainOwnershipWithProviders(
    { domain: 'www.officinabeta.it', method: 'dns_txt', expectedToken },
    {
      resolveTxt: async (host) =>
        host === '_luancer-verification.officinabeta.it' ? [[expectedToken]] : [],
      fetchText: async () => ({ ok: false, status: 404, body: '' }),
    }
  );
  assert.equal(dnsPass.verified, true);

  const dnsFail = await verifyDomainOwnershipWithProviders(
    { domain: 'google.com', method: 'dns_txt', expectedToken },
    {
      resolveTxt: async () => [['v=spf1 include:_spf.google.com ~all']],
      fetchText: async () => ({ ok: false, status: 404, body: '' }),
    }
  );
  assert.equal(dnsFail.verified, false);

  // 2. Meta Tag pass & fail
  const metaPass = await verifyDomainOwnershipWithProviders(
    { domain: 'officinabeta.it', method: 'meta_tag', expectedToken },
    {
      resolveTxt: async () => [],
      fetchText: async () => ({
        ok: true,
        status: 200,
        body: `<html><head><meta name="luancer-site-verification" content="${expectedToken}"></head></html>`,
      }),
    }
  );
  assert.equal(metaPass.verified, true);

  // 3. Well-Known file pass & fail
  const filePass = await verifyDomainOwnershipWithProviders(
    { domain: 'officinabeta.it', method: 'well_known_file', expectedToken },
    {
      resolveTxt: async () => [],
      fetchText: async (url) =>
        url.endsWith('/.well-known/luancer-verify.txt')
          ? { ok: true, status: 200, body: `${expectedToken}\n` }
          : { ok: false, status: 404, body: '' },
    }
  );
  assert.equal(filePass.verified, true);

  const fileFail = await verifyDomainOwnershipWithProviders(
    { domain: 'competitor.it', method: 'well_known_file', expectedToken },
    {
      resolveTxt: async () => [],
      fetchText: async () => ({ ok: false, status: 404, body: 'Not Found' }),
    }
  );
  assert.equal(fileFail.verified, false);
});
