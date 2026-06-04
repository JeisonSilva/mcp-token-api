import { db } from '../db/database';
import { User, Role } from '../types';

export const UserModel = {
  findByEmail(email: string): User | undefined {
    return db.prepare('SELECT * FROM users WHERE email = ?').get(email) as User | undefined;
  },

  findById(id: number): User | undefined {
    return db.prepare('SELECT * FROM users WHERE id = ?').get(id) as User | undefined;
  },

  create(name: string, email: string, passwordHash: string, role: Role = 'operator'): User {
    const stmt = db.prepare(
      'INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?) RETURNING *'
    );
    return stmt.get(name, email, passwordHash, role) as User;
  },

  updateRole(id: number, role: Role): User | undefined {
    return db
      .prepare("UPDATE users SET role = ?, updated_at = datetime('now') WHERE id = ? RETURNING *")
      .get(role, id) as User | undefined;
  },

  list(): Omit<User, 'password_hash'>[] {
    return db
      .prepare('SELECT id, name, email, role, created_at, updated_at FROM users ORDER BY id')
      .all() as Omit<User, 'password_hash'>[];
  },
};
