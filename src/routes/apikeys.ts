import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import { z } from 'zod';
import { authenticate } from '../middleware/auth';
import { ApiKeyModel } from '../models/apikey';

const router = Router();

const CreateApiKeySchema = z.object({
  name: z.string().min(1).max(100),
  expiresAt: z.string().datetime().optional(),
});

// POST /apikeys — create a new API key (requires JWT)
router.post('/', authenticate, (req: Request, res: Response): void => {
  const parsed = CreateApiKeySchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(422).json({ error: 'Validation error', details: parsed.error.flatten() });
    return;
  }

  const { name, expiresAt } = parsed.data;
  const userId = req.user!.sub;

  const rawKey = 'mcp_sk_' + crypto.randomBytes(24).toString('hex');
  const keyHash = crypto.createHash('sha256').update(rawKey).digest('hex');
  const keyPrefix = rawKey.slice(0, 14) + '...';

  const expiresAtDate = expiresAt ? new Date(expiresAt) : null;

  const apiKey = ApiKeyModel.create(userId, name, keyHash, keyPrefix, expiresAtDate);

  res.status(201).json({
    id: apiKey.id,
    name: apiKey.name,
    key: rawKey,
    key_prefix: apiKey.key_prefix,
    expires_at: apiKey.expires_at,
    created_at: apiKey.created_at,
  });
});

// GET /apikeys — list caller's API keys (no key_hash, no raw key)
router.get('/', authenticate, (req: Request, res: Response): void => {
  const userId = req.user!.sub;
  const keys = ApiKeyModel.listByUser(userId);
  res.json(keys);
});

// DELETE /apikeys/:id — revoke an API key (soft-delete via revoked_at)
router.delete('/:id', authenticate, (req: Request, res: Response): void => {
  const id = parseInt(
    Array.isArray(req.params.id) ? req.params.id[0] : req.params.id,
    10
  );
  if (isNaN(id)) {
    res.status(400).json({ error: 'Invalid API key id' });
    return;
  }

  const userId = req.user!.sub;
  const revoked = ApiKeyModel.revoke(id, userId);

  if (!revoked) {
    res.status(404).json({ error: 'API key not found or already revoked' });
    return;
  }

  res.status(204).end();
});

export default router;
