import 'dotenv/config';
import './db/database';
import { seedAdmin } from './db/seed';
import app from './app';

const port = parseInt(process.env.PORT ?? '3000', 10);

seedAdmin().then(() => {
  app.listen(port, () => {
    console.log(`Server running on port ${port}`);
  });
});
