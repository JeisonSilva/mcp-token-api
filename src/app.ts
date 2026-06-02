import express from 'express';
import authRouter from './routes/auth';
import usersRouter from './routes/users';
import apiKeysRouter from './routes/apikeys';
import validateRouter from './routes/validate';

const app = express();

app.use(express.json());

app.get('/health', (_req, res) => res.json({ status: 'ok' }));

app.use('/auth', authRouter);
app.use('/users', usersRouter);
app.use('/apikeys', apiKeysRouter);
app.use('/validate', validateRouter);

app.use((_req, res) => res.status(404).json({ error: 'Not found' }));

app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

export default app;
