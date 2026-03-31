'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  signInWithPopup,
  GoogleAuthProvider
} from 'firebase/auth';
import { auth } from '../lib/firebase';
import type { AuthUser, AuthResult } from '../types/auth';

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  firebaseError: string | null;
  signIn: (email: string, password: string) => Promise<AuthResult>;
  signUp: (email: string, password: string) => Promise<AuthResult>;
  logout: () => Promise<AuthResult>;
  resetPassword: (email: string) => Promise<AuthResult>;
  signInWithGoogle: () => Promise<AuthResult>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const useAuth = () => useContext(AuthContext);

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return String(error);
}

function getFirebaseErrorCode(error: unknown): string | undefined {
  if (typeof error === 'object' && error !== null && 'code' in error) {
    return String(error.code);
  }
  return undefined;
}

export const AuthContextProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(!auth);
  const [firebaseError, setFirebaseError] = useState<string | null>(
    !auth ? 'Firebase não está configurado. Por favor, configure as variáveis de ambiente.' : null
  );

  useEffect(() => {
    // Se Firebase não está configurado, não fazer nada
    if (!auth) {
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUser({
          uid: user.uid,
          email: user.email,
          displayName: user.displayName
        });
      } else {
        setUser(null);
      }
      setLoading(false);
      setFirebaseError(null);
    }, (error) => {
      console.error('Erro no Firebase Auth:', error);
      setFirebaseError(error.message);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    if (!auth) {
      return { success: false, error: 'Firebase não está configurado' };
    }
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      return { success: true, user: userCredential.user };
    } catch (error: unknown) {
      return { success: false, error: getFirebaseErrorCode(error) || getErrorMessage(error) };
    }
  };

  const signUp = async (email: string, password: string) => {
    if (!auth) {
      return { success: false, error: 'Firebase não está configurado' };
    }
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      return { success: true, user: userCredential.user };
    } catch (error: unknown) {
      return { success: false, error: getFirebaseErrorCode(error) || getErrorMessage(error) };
    }
  };

  const logout = async () => {
    if (!auth) {
      return { success: false, error: 'Firebase não está configurado' };
    }
    try {
      await signOut(auth);
      return { success: true };
    } catch (error: unknown) {
      return { success: false, error: getErrorMessage(error) };
    }
  };

  const resetPassword = async (email: string) => {
    if (!auth) {
      return { success: false, error: 'Firebase não está configurado' };
    }
    try {
      await sendPasswordResetEmail(auth, email);
      return { success: true };
    } catch (error: unknown) {
      return { success: false, error: getFirebaseErrorCode(error) || getErrorMessage(error) };
    }
  };

  const signInWithGoogle = async () => {
    if (!auth) {
      return { success: false, error: 'Firebase não está configurado' };
    }
    try {
      const provider = new GoogleAuthProvider();
      const userCredential = await signInWithPopup(auth, provider);
      return { success: true, user: userCredential.user };
    } catch (error: unknown) {
      return { success: false, error: getFirebaseErrorCode(error) || getErrorMessage(error) };
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      loading, 
      firebaseError,
      signIn, 
      signUp, 
      logout, 
      resetPassword,
      signInWithGoogle 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

