import { db } from '../db/database';
import { ApiKey } from '../types';

export const ApiKeyModel = {
  create(
    userId: number,
    name: string,
    keyHash: string,
    keyPrefix: string,
    expiresAt: Date | null
  ): ApiKey {
    return db
      .prepare(
        `INSERT INTO api_keys (user_id, name, key_hash, key_prefix, expires_at)
         VALUES (?, ?, ?, ?, ?) RETURNING *`
      )
      .get(userId, name, keyHash, keyPrefix, expiresAt ? expiresAt.toISOString() : null) as ApiKey;
  },

  findByHash(hash: string): ApiKey | undefined {
    return db
      .prepare('SELECT * FROM api_keys WHERE key_hash = ?')
      .get(hash) as ApiKey | undefined;
  },

  listByUser(userId: number): Omit<ApiKey, 'key_hash'>[] {
    return db
      .prepare(
        `SELECT id, user_id, name, key_prefix, last_used_at, expires_at, revoked_at, created_at
         FROM api_keys WHERE user_id = ? ORDER BY id`
      )
      .all(userId) as Omit<ApiKey, 'key_hash'>[];
  },

  findByIdAndUser(id: number, userId: number): ApiKey | undefined {
    return db
      .prepare('SELECT * FROM api_keys WHERE id = ? AND user_id = ?')
      .get(id, userId) as ApiKey | undefined;
  },

  revoke(id: number, userId: number): boolean {
    const result = db
      .prepare(
        `UPDATE api_keys SET revoked_at = datetime('now')
         WHERE id = ? AND user_id = ? AND revoked_at IS NULL`
      )
      .run(id, userId);
    return result.changes > 0;
  },

  touchLastUsed(id: number): void {
    db.prepare("UPDATE api_keys SET last_used_at = datetime('now') WHERE id = ?").run(id);
  },
};
