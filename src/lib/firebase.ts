import { initializeApp, type FirebaseApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, type Auth } from 'firebase/auth';
import { getFirestore, doc, getDocFromServer, type Firestore } from 'firebase/firestore';
import {
  resolveFirebaseConfigFromSources,
  type FirebaseAppletConfig,
} from './firebaseConfigResolver.ts';

function loadFirebaseConfig(): FirebaseAppletConfig | null {
  try {
    const localModules = import.meta.glob<{ default: Partial<FirebaseAppletConfig> }>(
      '/firebase-applet-config.json',
      { eager: true }
    );
    return resolveFirebaseConfigFromSources(
      {
        VITE_FIREBASE_API_KEY: import.meta.env.VITE_FIREBASE_API_KEY,
        VITE_FIREBASE_AUTH_DOMAIN: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
        VITE_FIREBASE_PROJECT_ID: import.meta.env.VITE_FIREBASE_PROJECT_ID,
        VITE_FIREBASE_STORAGE_BUCKET: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
        VITE_FIREBASE_MESSAGING_SENDER_ID: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
        VITE_FIREBASE_APP_ID: import.meta.env.VITE_FIREBASE_APP_ID,
        VITE_FIREBASE_FIRESTORE_DATABASE_ID: import.meta.env.VITE_FIREBASE_FIRESTORE_DATABASE_ID,
      },
      localModules
    );
  } catch {
    return null;
  }
}

const firebaseConfig = loadFirebaseConfig();

let appInstance: FirebaseApp | null = null;
let dbInstance: Firestore | null = null;
let authInstance: Auth | null = null;
let providerInstance: GoogleAuthProvider | null = null;

if (firebaseConfig) {
  try {
    appInstance = initializeApp(firebaseConfig);
    dbInstance = firebaseConfig.firestoreDatabaseId
      ? getFirestore(appInstance, firebaseConfig.firestoreDatabaseId)
      : getFirestore(appInstance);
    authInstance = getAuth(appInstance);
    providerInstance = new GoogleAuthProvider();
  } catch (err) {
    console.warn('Firebase initialization skipped:', err);
    appInstance = null;
    dbInstance = null;
    authInstance = null;
    providerInstance = null;
  }
}

export const isFirebaseConfigured = Boolean(appInstance && dbInstance && authInstance);
export const db: Firestore | null = dbInstance;
export const auth: Auth | null = authInstance;
export const googleAuthProvider: GoogleAuthProvider | null = providerInstance;

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const currentUser = authInstance?.currentUser;
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: currentUser?.uid,
      email: currentUser?.email,
      emailVerified: currentUser?.emailVerified,
      isAnonymous: currentUser?.isAnonymous,
      tenantId: currentUser?.tenantId,
      providerInfo:
        currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

async function testConnection() {
  if (!dbInstance) return;
  try {
    await getDocFromServer(doc(dbInstance, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error('Please check your Firebase configuration.');
    }
  }
}

if (dbInstance) {
  void testConnection();
}
