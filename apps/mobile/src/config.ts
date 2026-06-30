import { Platform } from 'react-native';
import Constants from 'expo-constants';

function getDefaultApiHost(): string {
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    return window.location.hostname || 'localhost';
  }
  return Constants.expoConfig?.hostUri?.split(':')[0] ?? 'localhost';
}

export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL ?? `http://${getDefaultApiHost()}:3001`;

/** Turn a relative API path (/uploads/...) into a full URL the client can load */
export function resolveApiUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  return `${API_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;
}
