import { db } from '../db/database';
import { Session } from '../types';

export const SessionModel = {
  create(userId: number, refreshTokenHash: string, expiresAt: Date): Session {
    return db
      .prepare(
        'INSERT INTO sessions (user_id, refresh_token_hash, expires_at) VALUES (?, ?, ?) RETURNING *'
      )
      .get(userId, refreshTokenHash, expiresAt.toISOString()) as Session;
  },

  findByTokenHash(hash: string): Session | undefined {
    return db
      .prepare('SELECT * FROM sessions WHERE refresh_token_hash = ?')
      .get(hash) as Session | undefined;
  },

  deleteByTokenHash(hash: string): void {
    db.prepare('DELETE FROM sessions WHERE refresh_token_hash = ?').run(hash);
  },

  deleteByUserId(userId: number): void {
    db.prepare('DELETE FROM sessions WHERE user_id = ?').run(userId);
  },

  deleteExpired(): void {
    db.prepare("DELETE FROM sessions WHERE expires_at < datetime('now')").run();
  },
};
