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

export interface Session {
  id: number;
  user_id: number;
  refresh_token_hash: string;
  expires_at: string;
  created_at: string;
}

export interface JwtAccessPayload {
  sub: number;
  email: string;
  role: Role;
  type: 'access';
}

export interface JwtRefreshPayload {
  sub: number;
  type: 'refresh';
}

declare global {
  namespace Express {
    interface Request {
      user?: JwtAccessPayload;
    }
  }
}
