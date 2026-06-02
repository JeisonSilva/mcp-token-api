import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { UserModel } from '../models/user';
import { authenticate, requireRole } from '../middleware/auth';
import { Role } from '../types';

const router = Router();

const RoleSchema = z.object({
  role: z.enum(['operator', 'admin']),
});

// GET /users  — admin only
router.get('/', authenticate, requireRole('admin'), (_req: Request, res: Response): void => {
  res.json(UserModel.list());
});

// PATCH /users/:id/role  — admin only
router.patch('/:id/role', authenticate, requireRole('admin'), (req: Request, res: Response): void => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  if (isNaN(id)) {
    res.status(400).json({ error: 'Invalid user id' });
    return;
  }

  const parsed = RoleSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(422).json({ error: 'Validation error', details: parsed.error.flatten() });
    return;
  }

  const updated = UserModel.updateRole(id, parsed.data.role as Role);
  if (!updated) {
    res.status(404).json({ error: 'User not found' });
    return;
  }

  res.json({ id: updated.id, name: updated.name, email: updated.email, role: updated.role });
});

export default router;
