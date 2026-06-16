import { createRemoteJWKSet, decodeProtectedHeader, jwtVerify } from 'jose';

export interface SupabaseJwtPayload {
  sub: string;
  email?: string;
  user_metadata?: {
    first_name?: string;
    last_name?: string;
    avatar_url?: string;
  };
}

function getSupabaseUrl(): string {
  const url = process.env.SUPABASE_URL?.trim();
  if (!url) {
    throw new Error('SUPABASE_URL is not configured');
  }
  return url.replace(/\/$/, '');
}

let jwks: ReturnType<typeof createRemoteJWKSet> | null = null;

function getJwks() {
  if (!jwks) {
    const baseUrl = getSupabaseUrl();
    jwks = createRemoteJWKSet(new URL(`${baseUrl}/auth/v1/.well-known/jwks.json`));
  }
  return jwks;
}

export async function verifySupabaseToken(token: string): Promise<SupabaseJwtPayload> {
  const header = decodeProtectedHeader(token);
  const baseUrl = getSupabaseUrl();

  let payload;

  if (header.alg === 'HS256') {
    const secret = process.env.SUPABASE_JWT_SECRET?.trim();
    if (!secret) {
      throw new Error('SUPABASE_JWT_SECRET is required for legacy HS256 tokens');
    }
    ({ payload } = await jwtVerify(token, new TextEncoder().encode(secret), {
      algorithms: ['HS256'],
    }));
  } else {
    // New Supabase projects use asymmetric signing (ES256) via JWKS
    ({ payload } = await jwtVerify(token, getJwks(), {
      issuer: `${baseUrl}/auth/v1`,
    }));
  }

  if (!payload.sub) {
    throw new Error('Invalid token: missing subject');
  }

  return {
    sub: payload.sub,
    email: typeof payload.email === 'string' ? payload.email : undefined,
    user_metadata: payload.user_metadata as SupabaseJwtPayload['user_metadata'],
  };
}
