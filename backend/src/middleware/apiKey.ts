import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { ApiKeyModel } from '../models/apikey';

export function authenticateApiKey(req: Request, res: Response, next: NextFunction): void {
  let rawKey: string | undefined;

  // Accept from Authorization: Bearer mcp_sk_... or X-Api-Key header
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith('Bearer mcp_sk_')) {
    rawKey = authHeader.slice(7);
  } else {
    const xApiKey = req.headers['x-api-key'];
    if (typeof xApiKey === 'string' && xApiKey.startsWith('mcp_sk_')) {
      rawKey = xApiKey;
    }
  }

  if (!rawKey) {
    res.status(401).json({ error: 'Missing or invalid API key' });
    return;
  }

  const hash = crypto.createHash('sha256').update(rawKey).digest('hex');
  const apiKey = ApiKeyModel.findByHash(hash);

  if (!apiKey) {
    res.status(401).json({ error: 'Invalid API key' });
    return;
  }

  if (apiKey.revoked_at !== null) {
    res.status(401).json({ error: 'API key has been revoked' });
    return;
  }

  if (apiKey.expires_at !== null && new Date(apiKey.expires_at) < new Date()) {
    res.status(401).json({ error: 'API key has expired' });
    return;
  }

  ApiKeyModel.touchLastUsed(apiKey.id);

  req.apiKey = { id: apiKey.id, userId: apiKey.user_id };
  next();
}
