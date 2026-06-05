export type Role = 'operator' | 'admin';

export interface User {
  id: number;
  name: string;
  email: string;
  password_hash: string;
  role: Role;
  created_at: string;
  updated_at: string;
}

export interface ApiKey {
  id: number;
  user_id: number;
  name: string;
  key_hash: string;       // SHA-256 do token bruto
  key_prefix: string;
  last_used_at: string | null;
  expires_at: string | null;
  revoked_at: string | null;
  created_at: string;
}

export interface JwtAccessPayload {
  sub: number;
  email: string;
  role: Role;
  type: 'access';
}

declare global {
  namespace Express {
    interface Request {
      user?: JwtAccessPayload;
      apiKey?: { id: number; userId: number };
    }
  }
}
