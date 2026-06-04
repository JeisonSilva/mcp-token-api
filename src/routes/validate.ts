import { Router, Request, Response } from 'express';
import { authenticateApiKey } from '../middleware/apiKey';

const router = Router();

// POST /validate — validate an API key (key via X-Api-Key or Authorization header)
router.post('/', authenticateApiKey, (req: Request, res: Response): void => {
  res.json({
    valid: true,
    key_id: req.apiKey!.id,
    user_id: req.apiKey!.userId,
  });
});

export default router;
