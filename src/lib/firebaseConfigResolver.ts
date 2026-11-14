export interface FirebaseAppletConfig {
  projectId: string;
  appId: string;
  apiKey: string;
  authDomain: string;
  firestoreDatabaseId?: string;
  storageBucket?: string;
  messagingSenderId?: string;
}

export interface FirebaseEnvSource {
  VITE_FIREBASE_API_KEY?: string;
  VITE_FIREBASE_AUTH_DOMAIN?: string;
  VITE_FIREBASE_PROJECT_ID?: string;
  VITE_FIREBASE_STORAGE_BUCKET?: string;
  VITE_FIREBASE_MESSAGING_SENDER_ID?: string;
  VITE_FIREBASE_APP_ID?: string;
  VITE_FIREBASE_FIRESTORE_DATABASE_ID?: string;
}

function cleanStr(val: unknown): string | undefined {
  if (typeof val !== 'string') return undefined;
  const trimmed = val.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

export function resolveFirebaseConfigFromSources(
  env: FirebaseEnvSource | undefined | null,
  localModules: Record<string, { default?: Partial<FirebaseAppletConfig> } | undefined> | undefined | null
): FirebaseAppletConfig | null {
  try {
    const apiKey = cleanStr(env?.VITE_FIREBASE_API_KEY);
    const authDomain = cleanStr(env?.VITE_FIREBASE_AUTH_DOMAIN);
    const projectId = cleanStr(env?.VITE_FIREBASE_PROJECT_ID);
    const appId = cleanStr(env?.VITE_FIREBASE_APP_ID);

    if (apiKey && authDomain && projectId && appId) {
      return {
        apiKey,
        authDomain,
        projectId,
        appId,
        storageBucket: cleanStr(env?.VITE_FIREBASE_STORAGE_BUCKET),
        messagingSenderId: cleanStr(env?.VITE_FIREBASE_MESSAGING_SENDER_ID),
        firestoreDatabaseId: cleanStr(env?.VITE_FIREBASE_FIRESTORE_DATABASE_ID),
      };
    }

    const localRaw = localModules?.['/firebase-applet-config.json']?.default;
    const localApiKey = cleanStr(localRaw?.apiKey);
    const localProjectId = cleanStr(localRaw?.projectId);
    const localAppId = cleanStr(localRaw?.appId);
    const localAuthDomain = cleanStr(localRaw?.authDomain);

    if (localApiKey && localProjectId && localAppId && localAuthDomain) {
      return {
        apiKey: localApiKey,
        projectId: localProjectId,
        appId: localAppId,
        authDomain: localAuthDomain,
        storageBucket: cleanStr(localRaw?.storageBucket),
        messagingSenderId: cleanStr(localRaw?.messagingSenderId),
        firestoreDatabaseId: cleanStr(localRaw?.firestoreDatabaseId),
      };
    }
  } catch {
    return null;
  }

  return null;
}
