import 'react-native-url-polyfill/auto';
import { Platform } from 'react-native';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as QueryParams from 'expo-auth-session/build/QueryParams';
import { makeRedirectUri } from 'expo-auth-session';

const AsyncStorageAdapter = {
  getItem: (key: string) => AsyncStorage.getItem(key),
  setItem: (key: string, value: string) => AsyncStorage.setItem(key, value),
  removeItem: (key: string) => AsyncStorage.removeItem(key),
};

function readEnv() {
  return {
    url: (process.env.EXPO_PUBLIC_SUPABASE_URL ?? '').trim(),
    key: (process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '').trim(),
  };
}

let client: SupabaseClient | null = null;

export function isSupabaseConfigured(): boolean {
  const { url, key } = readEnv();
  return Boolean(url && key);
}

export function getSupabase(): SupabaseClient {
  if (client) return client;

  const { url, key } = readEnv();
  if (!url || !key) {
    throw new Error(
      'Supabase is not configured. Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY in the root .env file, then restart Expo (npm run dev:mobile).'
    );
  }

  client = createClient(url, key, {
    auth: {
      storage: AsyncStorageAdapter,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: Platform.OS === 'web',
    },
  });

  return client;
}

export async function createSessionFromUrl(url: string) {
  const { params, errorCode } = QueryParams.getQueryParams(url);
  if (errorCode) throw new Error(errorCode);

  const { access_token, refresh_token } = params;
  if (!access_token) return null;

  const { data, error } = await getSupabase().auth.setSession({
    access_token,
    refresh_token,
  });
  if (error) throw error;
  return data.session;
}

/** OAuth / password-reset redirect target for the current platform */
export function getAuthRedirectUrl(path = 'auth/callback'): string {
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    if (path === 'auth/callback') return window.location.origin;
    return `${window.location.origin}/${path.replace(/^\//, '')}`;
  }

  return makeRedirectUri({
    scheme: 'household-inventory',
    path,
  });
}
