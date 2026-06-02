import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { z } from 'zod';
import { UserModel } from '../models/user';
import { SessionModel } from '../models/session';
import { authenticate } from '../middleware/auth';
import { JwtAccessPayload, JwtRefreshPayload } from '../types';

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

function issueTokens(userId: number, email: string, role: string) {
  const accessPayload: JwtAccessPayload = { sub: userId, email, role: role as any, type: 'access' };
  const accessToken = jwt.sign(accessPayload, process.env.JWT_ACCESS_SECRET!, {
    expiresIn: (process.env.JWT_ACCESS_EXPIRES_IN ?? '15m') as any,
  });

  const rawRefresh = crypto.randomBytes(64).toString('hex');
  const refreshHash = crypto.createHash('sha256').update(rawRefresh).digest('hex');

  const expiresIn = process.env.JWT_REFRESH_EXPIRES_IN ?? '7d';
  const ms = parseDuration(expiresIn);
  const expiresAt = new Date(Date.now() + ms);

  SessionModel.deleteExpired();
  SessionModel.create(userId, refreshHash, expiresAt);

  const refreshPayload: JwtRefreshPayload = { sub: userId, type: 'refresh' };
  const refreshToken = jwt.sign(refreshPayload, process.env.JWT_REFRESH_SECRET!, {
    expiresIn: expiresIn as any,
  });

  // embed raw token in JWT so the client only handles one value, but we store its hash
  const signedRefresh = jwt.sign(
    { ...refreshPayload, jti: rawRefresh },
    process.env.JWT_REFRESH_SECRET!,
    { expiresIn: expiresIn as any }
  );

  // discard the plain refreshToken; use signedRefresh that carries jti
  void refreshToken;

  return { accessToken, refreshToken: signedRefresh };
}

function parseDuration(d: string): number {
  const map: Record<string, number> = { s: 1000, m: 60000, h: 3600000, d: 86400000 };
  const match = d.match(/^(\d+)([smhd])$/);
  if (!match) return 7 * 86400000;
  return parseInt(match[1]) * map[match[2]];
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

  const { accessToken, refreshToken } = issueTokens(user.id, user.email, user.role);

  res.status(201).json({
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
    access_token: accessToken,
    refresh_token: refreshToken,
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

  const { accessToken, refreshToken } = issueTokens(user.id, user.email, user.role);

  res.json({
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
    access_token: accessToken,
    refresh_token: refreshToken,
  });
});

// POST /auth/refresh
router.post('/refresh', (req: Request, res: Response): void => {
  const { refresh_token } = req.body as { refresh_token?: string };
  if (!refresh_token) {
    res.status(400).json({ error: 'refresh_token is required' });
    return;
  }

  let payload: JwtRefreshPayload & { jti?: string };
  try {
    payload = jwt.verify(refresh_token, process.env.JWT_REFRESH_SECRET!) as any;
    if (payload.type !== 'refresh') throw new Error('Wrong type');
  } catch {
    res.status(401).json({ error: 'Invalid or expired refresh token' });
    return;
  }

  if (!payload.jti) {
    res.status(401).json({ error: 'Malformed refresh token' });
    return;
  }

  const tokenHash = crypto.createHash('sha256').update(payload.jti).digest('hex');
  const session = SessionModel.findByTokenHash(tokenHash);

  if (!session || new Date(session.expires_at) < new Date()) {
    res.status(401).json({ error: 'Session not found or expired' });
    return;
  }

  const user = UserModel.findById(payload.sub);
  if (!user) {
    res.status(401).json({ error: 'User not found' });
    return;
  }

  // rotate: delete old session, issue new tokens
  SessionModel.deleteByTokenHash(tokenHash);
  const { accessToken, refreshToken: newRefreshToken } = issueTokens(user.id, user.email, user.role);

  res.json({ access_token: accessToken, refresh_token: newRefreshToken });
});

// POST /auth/logout
router.post('/logout', authenticate, (req: Request, res: Response): void => {
  const { refresh_token } = req.body as { refresh_token?: string };

  if (refresh_token) {
    try {
      const payload: any = jwt.verify(refresh_token, process.env.JWT_REFRESH_SECRET!);
      if (payload.jti) {
        const hash = crypto.createHash('sha256').update(payload.jti).digest('hex');
        SessionModel.deleteByTokenHash(hash);
      }
    } catch {
      // token invalid — silently continue
    }
  } else {
    // logout all sessions for this user
    SessionModel.deleteByUserId(req.user!.sub);
  }

  res.json({ message: 'Logged out successfully' });
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
