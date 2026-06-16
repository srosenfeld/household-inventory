import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Platform } from 'react-native';
import type { Session, User } from '@supabase/supabase-js';
import * as WebBrowser from 'expo-web-browser';
import * as AppleAuthentication from 'expo-apple-authentication';
import { makeRedirectUri } from 'expo-auth-session';
import { createSessionFromUrl, getSupabase, isSupabaseConfigured } from '../lib/supabase';

WebBrowser.maybeCompleteAuthSession();

const redirectTo = makeRedirectUri({
  scheme: 'household-inventory',
  path: 'auth/callback',
});

interface AuthContextValue {
  session: Session | null;
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (params: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
  }) => Promise<{ needsEmailConfirmation: boolean }>;
  signOut: () => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signInWithApple: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updateEmail: (email: string) => Promise<void>;
  updatePassword: (password: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isSupabaseConfigured()) {
      setLoading(false);
      return;
    }

    getSupabase().auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });

    const { data: subscription } = getSupabase().auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
    });

    return () => subscription.subscription.unsubscribe();
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const { error } = await getSupabase().auth.signInWithPassword({ email, password });
    if (error) throw error;
  }, []);

  const signUp = useCallback(
    async (params: { email: string; password: string; firstName: string; lastName: string }) => {
      const { data, error } = await getSupabase().auth.signUp({
        email: params.email,
        password: params.password,
        options: {
          data: {
            first_name: params.firstName,
            last_name: params.lastName,
          },
        },
      });
      if (error) throw error;
      return { needsEmailConfirmation: !data.session };
    },
    []
  );

  const signOut = useCallback(async () => {
    const { error } = await getSupabase().auth.signOut();
    if (error) throw error;
  }, []);

  const signInWithGoogle = useCallback(async () => {
    const { data, error } = await getSupabase().auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo, skipBrowserRedirect: true },
    });
    if (error) throw error;
    if (!data.url) throw new Error('Google sign-in URL missing');

    const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
    if (result.type === 'success') {
      await createSessionFromUrl(result.url);
    }
  }, []);

  const signInWithApple = useCallback(async () => {
    if (Platform.OS !== 'ios') {
      throw new Error('Apple Sign In is only available on iOS');
    }

    const credential = await AppleAuthentication.signInAsync({
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        AppleAuthentication.AppleAuthenticationScope.EMAIL,
      ],
    });

    if (!credential.identityToken) {
      throw new Error('Apple Sign In failed: no identity token');
    }

    const { error } = await getSupabase().auth.signInWithIdToken({
      provider: 'apple',
      token: credential.identityToken,
    });
    if (error) throw error;
  }, []);

  const resetPassword = useCallback(async (email: string) => {
    const resetRedirect = makeRedirectUri({
      scheme: 'household-inventory',
      path: 'auth/reset',
    });
    const { error } = await getSupabase().auth.resetPasswordForEmail(email, {
      redirectTo: resetRedirect,
    });
    if (error) throw error;
  }, []);

  const updateEmail = useCallback(async (email: string) => {
    const { error } = await getSupabase().auth.updateUser({ email });
    if (error) throw error;
  }, []);

  const updatePassword = useCallback(async (password: string) => {
    const { error } = await getSupabase().auth.updateUser({ password });
    if (error) throw error;
  }, []);

  const value = useMemo(
    () => ({
      session,
      user: session?.user ?? null,
      loading,
      signIn,
      signUp,
      signOut,
      signInWithGoogle,
      signInWithApple,
      resetPassword,
      updateEmail,
      updatePassword,
    }),
    [
      session,
      loading,
      signIn,
      signUp,
      signOut,
      signInWithGoogle,
      signInWithApple,
      resetPassword,
      updateEmail,
      updatePassword,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
