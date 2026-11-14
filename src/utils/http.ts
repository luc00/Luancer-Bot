export async function parseJsonResponse<T = Record<string, unknown>>(res: Response): Promise<T> {
  const contentType = res.headers.get('content-type') || '';
  const text = await res.text();

  if (!text.trim()) {
    throw new Error(
      res.ok
        ? 'Risposta vuota ricevuta dal server.'
        : 'Endpoint backend /api non attivo su questo deploy statico: pubblica con server Node.js o serverless API.'
    );
  }

  if (contentType.includes('text/html') || text.trimStart().startsWith('<')) {
    throw new Error(
      'Endpoint backend /api non attivo su questo deploy statico: pubblica con server Node.js o serverless API.'
    );
  }

  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Error('Risposta non valida dal server (formato JSON non riconosciuto).');
  }
}
