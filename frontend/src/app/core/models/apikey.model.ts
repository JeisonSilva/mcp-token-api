export interface ApiKey {
  id: number;
  user_id: number;
  name: string;
  key_prefix: string;
  scopes: string;
  last_used_at: string | null;
  expires_at: string | null;
  revoked_at: string | null;
  created_at: string;
}

export interface CreateApiKeyRequest {
  name: string;
  scopes: string[];
  expires_at?: string;
}

export interface CreateApiKeyResponse {
  apiKey: ApiKey;
  rawKey: string;
}
