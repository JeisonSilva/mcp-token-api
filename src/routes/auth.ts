import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { UserModel } from '../models/user';
import { authenticate } from '../middleware/auth';
import { JwtAccessPayload } from '../types';

const router = Router();

const RegisterSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  password: z.string().min(8),
});

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

function issueAccessToken(userId: number, email: string, role: string): string {
  const payload: JwtAccessPayload = { sub: userId, email, role: role as any, type: 'access' };
  return jwt.sign(payload, process.env.JWT_ACCESS_SECRET!, {
    expiresIn: (process.env.JWT_ACCESS_EXPIRES_IN ?? '1h') as any,
  });
}

// POST /auth/register
router.post('/register', async (req: Request, res: Response): Promise<void> => {
  const parsed = RegisterSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(422).json({ error: 'Validation error', details: parsed.error.flatten() });
    return;
  }

  const { name, email, password } = parsed.data;

  if (UserModel.findByEmail(email)) {
    res.status(409).json({ error: 'Email already registered' });
    return;
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const user = UserModel.create(name, email, passwordHash);
  const accessToken = issueAccessToken(user.id, user.email, user.role);

  res.status(201).json({
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
    access_token: accessToken,
  });
});

// POST /auth/login
router.post('/login', async (req: Request, res: Response): Promise<void> => {
  const parsed = LoginSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(422).json({ error: 'Validation error', details: parsed.error.flatten() });
    return;
  }

  const { email, password } = parsed.data;
  const user = UserModel.findByEmail(email);

  if (!user || !(await bcrypt.compare(password, user.password_hash))) {
    res.status(401).json({ error: 'Invalid credentials' });
    return;
  }

  const accessToken = issueAccessToken(user.id, user.email, user.role);

  res.json({
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
    access_token: accessToken,
  });
});

// POST /auth/logout — JWT is stateless; client discards token
router.post('/logout', authenticate, (_req: Request, res: Response): void => {
  res.status(204).end();
});

// GET /auth/me
router.get('/me', authenticate, (req: Request, res: Response): void => {
  const user = UserModel.findById(req.user!.sub);
  if (!user) {
    res.status(404).json({ error: 'User not found' });
    return;
  }
  res.json({ id: user.id, name: user.name, email: user.email, role: user.role });
});

export default router;
