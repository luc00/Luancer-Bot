import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import {
  User,
  onAuthStateChanged,
  signInWithPopup,
  signOut,
} from 'firebase/auth';
import {
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
  collection,
  onSnapshot,
  query,
  where,
} from 'firebase/firestore';
import {
  auth,
  db,
  googleAuthProvider,
  handleFirestoreError,
  isFirebaseConfigured,
  OperationType,
} from '../lib/firebase.ts';

export interface FirestoreBotPreset {
  id: string;
  ownerId: string;
  botCode: string;
  name: string;
  bundleType: 'all_in_one' | 'modular';
  finishId: 'sage_brass' | 'charcoal_titanium' | 'brushed_gold' | 'ivory_ceramic';
  autonomyLevel: 'supervisionato' | 'semi-autonomo' | 'piena-autonomia';
  selectedEmployees: string[];
  customDirectives: string;
  status: 'attivo' | 'in_pausa';
}

interface AuthContextValue {
  user: User | null;
  idToken: string | null;
  authReady: boolean;
  isSigningIn: boolean;
  authError: string | null;
  isFirebaseAvailable: boolean;
  cloudPresets: FirestoreBotPreset[];
  signInWithGoogle: () => Promise<User | null>;
  signOutUser: () => Promise<void>;
  getFreshToken: () => Promise<string | null>;
  syncBotPresetToFirestore: (preset: Omit<FirestoreBotPreset, 'ownerId'>) => Promise<void>;
  clearAuthError: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [idToken, setIdToken] = useState<string | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [cloudPresets, setCloudPresets] = useState<FirestoreBotPreset[]>([]);

  const ensureUserDocs = useCallback(async (u: User) => {
    if (!db) return;
    const publicPath = `users/${u.uid}`;
    const privatePath = `users/${u.uid}/private/info`;
    try {
      const publicRef = doc(db, 'users', u.uid);
      const snap = await getDoc(publicRef);
      const safeName = (u.displayName || u.email?.split('@')[0] || 'Imprenditore').slice(0, 100);
      if (!snap.exists()) {
        await setDoc(publicRef, {
          uid: u.uid,
          displayName: safeName,
          companyName: 'Azienda Cliente',
          activePlanId: 'atelier',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }
    } catch (error) {
      // Only log/propagate permission issues visibly without breaking offline fallback
      if (error instanceof Error && error.message.toLowerCase().includes('permission')) {
        handleFirestoreError(error, OperationType.WRITE, publicPath);
      }
    }

    try {
      const privateRef = doc(db, 'users', u.uid, 'private', 'info');
      const privSnap = await getDoc(privateRef);
      if (!privSnap.exists() && u.email) {
        await setDoc(privateRef, {
          uid: u.uid,
          email: u.email.slice(0, 160),
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }
    } catch (error) {
      if (error instanceof Error && error.message.toLowerCase().includes('permission')) {
        handleFirestoreError(error, OperationType.WRITE, privatePath);
      }
    }
  }, []);

  useEffect(() => {
    if (!isFirebaseConfigured || !auth) {
      setUser(null);
      setIdToken(null);
      setCloudPresets([]);
      setAuthReady(true);
      return;
    }

    const unsub = onAuthStateChanged(auth, async (nextUser) => {
      setUser(nextUser);
      if (nextUser) {
        try {
          const token = await nextUser.getIdToken();
          setIdToken(token);
          await ensureUserDocs(nextUser);
        } catch (err) {
          console.error('Token or user profile initialization warning:', err);
        }
      } else {
        setIdToken(null);
        setCloudPresets([]);
      }
      setAuthReady(true);
    });

    return () => unsub();
  }, [ensureUserDocs]);

  // Real-time Firestore listener for user's customized bot presets
  useEffect(() => {
    if (!authReady || !user || !db) return;

    const colPath = `users/${user.uid}/botConfigs`;
    const q = query(collection(db, colPath), where('ownerId', '==', user.uid));

    const unsub = onSnapshot(
      q,
      (snapshot) => {
        const items: FirestoreBotPreset[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          items.push({
            id: docSnap.id,
            ownerId: String(data.ownerId || user.uid),
            botCode: String(data.botCode || 'BOT-01'),
            name: String(data.name || 'Bot Aziendale'),
            bundleType: data.bundleType === 'all_in_one' ? 'all_in_one' : 'modular',
            finishId: data.finishId || 'sage_brass',
            autonomyLevel: data.autonomyLevel || 'semi-autonomo',
            selectedEmployees: Array.isArray(data.selectedEmployees) ? data.selectedEmployees : ['emp-1'],
            customDirectives: String(data.customDirectives || ''),
            status: data.status === 'in_pausa' ? 'in_pausa' : 'attivo',
          });
        });
        setCloudPresets(items);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, colPath);
      }
    );

    return () => unsub();
  }, [authReady, user]);

  const signInWithGoogle = useCallback(async () => {
    if (!isFirebaseConfigured || !auth || !googleAuthProvider) {
      setAuthError(
        'Accesso Google non ancora configurato su questo host: imposta le variabili VITE_FIREBASE_* nelle impostazioni del progetto Vercel.'
      );
      return null;
    }

    setIsSigningIn(true);
    setAuthError(null);
    try {
      const cred = await signInWithPopup(auth, googleAuthProvider);
      const token = await cred.user.getIdToken();
      setIdToken(token);
      await ensureUserDocs(cred.user);
      return cred.user;
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Accesso con Google annullato o non riuscito.';
      setAuthError(msg);
      return null;
    } finally {
      setIsSigningIn(false);
    }
  }, [ensureUserDocs]);

  const signOutUser = useCallback(async () => {
    if (auth) {
      await signOut(auth);
    }
    setIdToken(null);
    setCloudPresets([]);
  }, []);

  const getFreshToken = useCallback(async () => {
    if (!auth?.currentUser) return null;
    const token = await auth.currentUser.getIdToken();
    setIdToken(token);
    return token;
  }, []);

  const syncBotPresetToFirestore = useCallback(
    async (preset: Omit<FirestoreBotPreset, 'ownerId'>) => {
      if (!db || !auth?.currentUser) return;
      const uid = auth.currentUser.uid;
      const safeDocId = preset.id.replace(/[^a-zA-Z0-9_-]/g, '-').slice(0, 128);
      const docPath = `users/${uid}/botConfigs/${safeDocId}`;
      try {
        await setDoc(doc(db, 'users', uid, 'botConfigs', safeDocId), {
          ownerId: uid,
          botCode: preset.botCode.replace(/[^a-zA-Z0-9_-]/g, '-').slice(0, 40),
          name: preset.name.slice(0, 120),
          bundleType: preset.bundleType,
          finishId: preset.finishId,
          autonomyLevel: preset.autonomyLevel,
          selectedEmployees: preset.selectedEmployees.slice(0, 6),
          customDirectives: preset.customDirectives.slice(0, 2000),
          status: preset.status,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, docPath);
      }
    },
    []
  );

  const clearAuthError = useCallback(() => {
    setAuthError(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        idToken,
        authReady,
        isSigningIn,
        authError,
        isFirebaseAvailable: isFirebaseConfigured,
        cloudPresets,
        signInWithGoogle,
        signOutUser,
        getFreshToken,
        syncBotPresetToFirestore,
        clearAuthError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
