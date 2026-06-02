import 'dotenv/config';
import './db/database'; // initializes DB and runs migrations
import app from './app';

const port = parseInt(process.env.PORT ?? '3000', 10);

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
