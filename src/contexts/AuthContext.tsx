'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { createClient } from '../lib/supabase/client';
import type { AuthUser, AuthResult } from '../types/auth';
import type { User } from '@supabase/supabase-js';

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  authError: string | null;
  signIn: (email: string, password: string) => Promise<AuthResult>;
  signUp: (email: string, password: string) => Promise<AuthResult>;
  logout: () => Promise<AuthResult>;
  resetPassword: (email: string) => Promise<AuthResult>;
  signInWithGoogle: () => Promise<AuthResult>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const useAuth = () => useContext(AuthContext);

function mapUser(u: User | null): AuthUser | null {
  if (!u) return null;
  return {
    uid: u.id,
    email: u.email ?? null,
    displayName:
      (typeof u.user_metadata?.full_name === 'string'
        ? u.user_metadata.full_name
        : null) ?? u.email ?? null,
  };
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return String(error);
}

function isConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  );
}

export const AuthContextProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(() => isConfigured());
  const [authError, setAuthError] = useState<string | null>(
    !isConfigured()
      ? 'Supabase não está configurado. Defina NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY em .env.local.'
      : null
  );

  useEffect(() => {
    if (!isConfigured()) {
      return;
    }

    const supabase = createClient();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(mapUser(session?.user ?? null));
      setLoading(false);
      setAuthError(null);
    });

    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        console.error('Erro ao obter sessão Supabase:', error);
        setAuthError(error.message);
      }
      setUser(mapUser(session?.user ?? null));
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    if (!isConfigured()) {
      return { success: false, error: 'Supabase não está configurado' };
    }
    const supabase = createClient();
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) return { success: false, error: error.message };
      return { success: true, user: mapUser(data.user) ?? undefined };
    } catch (error: unknown) {
      return { success: false, error: getErrorMessage(error) };
    }
  };

  const signUp = async (email: string, password: string) => {
    if (!isConfigured()) {
      return { success: false, error: 'Supabase não está configurado' };
    }
    const supabase = createClient();
    try {
      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) return { success: false, error: error.message };
      return { success: true, user: mapUser(data.user) ?? undefined };
    } catch (error: unknown) {
      return { success: false, error: getErrorMessage(error) };
    }
  };

  const logout = async () => {
    if (!isConfigured()) {
      return { success: false, error: 'Supabase não está configurado' };
    }
    const supabase = createClient();
    try {
      const { error } = await supabase.auth.signOut();
      if (error) return { success: false, error: error.message };
      return { success: true };
    } catch (error: unknown) {
      return { success: false, error: getErrorMessage(error) };
    }
  };

  const resetPassword = async (email: string) => {
    if (!isConfigured()) {
      return { success: false, error: 'Supabase não está configurado' };
    }
    const supabase = createClient();
    try {
      const origin = typeof window !== 'undefined' ? window.location.origin : '';
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${origin}/login`,
      });
      if (error) return { success: false, error: error.message };
      return { success: true };
    } catch (error: unknown) {
      return { success: false, error: getErrorMessage(error) };
    }
  };

  const signInWithGoogle = async () => {
    if (!isConfigured()) {
      return { success: false, error: 'Supabase não está configurado' };
    }
    const supabase = createClient();
    try {
      const origin = typeof window !== 'undefined' ? window.location.origin : '';
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${origin}/auth/callback`,
        },
      });
      if (error) return { success: false, error: error.message };
      if (data.url) {
        window.location.href = data.url;
      }
      return { success: true };
    } catch (error: unknown) {
      return { success: false, error: getErrorMessage(error) };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        authError,
        signIn,
        signUp,
        logout,
        resetPassword,
        signInWithGoogle,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
