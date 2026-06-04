import bcrypt from 'bcryptjs';
import { db } from './database';

export async function seedAdmin(): Promise<void> {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;

  if (!email || !password) return;

  const existing = db.prepare('SELECT id, role FROM users WHERE email = ?').get(email) as
    | { id: number; role: string }
    | undefined;

  if (existing) {
    if (existing.role !== 'admin') {
      db.prepare("UPDATE users SET role = 'admin', updated_at = datetime('now') WHERE id = ?").run(
        existing.id
      );
      console.log(`[seed] User ${email} promoted to admin`);
    }
    return;
  }

  const passwordHash = await bcrypt.hash(password, 12);
  db.prepare("INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, 'admin')").run(
    'Admin',
    email,
    passwordHash
  );
  console.log(`[seed] Admin user created: ${email}`);
}
