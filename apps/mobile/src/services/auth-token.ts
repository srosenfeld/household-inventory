import { getSupabase, isSupabaseConfigured } from '../lib/supabase';

export async function getAccessToken(): Promise<string | null> {
  if (!isSupabaseConfigured()) return null;
  const { data } = await getSupabase().auth.getSession();
  return data.session?.access_token ?? null;
}
