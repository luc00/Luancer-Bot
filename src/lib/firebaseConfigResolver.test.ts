import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveFirebaseConfigFromSources } from './firebaseConfigResolver.ts';
import { parseJsonResponse } from '../utils/http.ts';

test('resolveFirebaseConfigFromSources returns null cleanly when env and local file are missing', () => {
  const result = resolveFirebaseConfigFromSources({}, {});
  assert.equal(result, null);
});

test('resolveFirebaseConfigFromSources returns null when env vars are empty or whitespace', () => {
  const result = resolveFirebaseConfigFromSources(
    {
      VITE_FIREBASE_API_KEY: '   ',
      VITE_FIREBASE_AUTH_DOMAIN: '',
      VITE_FIREBASE_PROJECT_ID: 'proj',
      VITE_FIREBASE_APP_ID: 'app',
    },
    null
  );
  assert.equal(result, null);
});

test('resolveFirebaseConfigFromSources prioritizes valid VITE_FIREBASE_* env vars', () => {
  const result = resolveFirebaseConfigFromSources(
    {
      VITE_FIREBASE_API_KEY: 'public-web-key',
      VITE_FIREBASE_AUTH_DOMAIN: 'example.firebaseapp.com',
      VITE_FIREBASE_PROJECT_ID: 'example-proj',
      VITE_FIREBASE_APP_ID: '1:123:web:abc',
      VITE_FIREBASE_FIRESTORE_DATABASE_ID: 'custom-db',
    },
    {
      '/firebase-applet-config.json': {
        default: {
          apiKey: 'local-key',
          authDomain: 'local.firebaseapp.com',
          projectId: 'local-proj',
          appId: '1:999:web:xyz',
        },
      },
    }
  );
  assert.deepEqual(result, {
    apiKey: 'public-web-key',
    authDomain: 'example.firebaseapp.com',
    projectId: 'example-proj',
    appId: '1:123:web:abc',
    storageBucket: undefined,
    messagingSenderId: undefined,
    firestoreDatabaseId: 'custom-db',
  });
});

test('resolveFirebaseConfigFromSources falls back to local config when env is unset', () => {
  const result = resolveFirebaseConfigFromSources(undefined, {
    '/firebase-applet-config.json': {
      default: {
        apiKey: 'local-key',
        authDomain: 'local.firebaseapp.com',
        projectId: 'local-proj',
        appId: '1:999:web:xyz',
      },
    },
  });
  assert.equal(result?.projectId, 'local-proj');
  assert.equal(result?.apiKey, 'local-key');
});

test('parseJsonResponse parses valid JSON and throws clean Italian error for HTML 404 responses', async () => {
  const validRes = new Response(JSON.stringify({ ok: true, domain: 'azienda.it' }), {
    status: 200,
    headers: { 'content-type': 'application/json' },
  });
  const parsed = await parseJsonResponse<{ ok: boolean; domain: string }>(validRes);
  assert.equal(parsed.ok, true);
  assert.equal(parsed.domain, 'azienda.it');

  const html404 = new Response('<!doctype html><html><body>404 Not Found</body></html>', {
    status: 404,
    headers: { 'content-type': 'text/html; charset=utf-8' },
  });
  await assert.rejects(
    () => parseJsonResponse(html404),
    /Endpoint backend \/api non attivo su questo deploy statico/
  );
});
