import dotenv from 'dotenv';
dotenv.config();
import app from './app.js';
import { pool } from './config/db.js';
import { initializeDatabase } from './config/initDb.js';

const port = Number(process.env.PORT || 5000);
if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
  console.error('JWT_SECRET must be set and contain at least 32 characters.');
  process.exit(1);
}
try {
  await pool.query('SELECT 1');
  await initializeDatabase();
  app.listen(port, () => console.log(`Sweety API running at http://localhost:${port}`));
} catch (error) {
  console.error('Unable to start server. Check PostgreSQL credentials and database:', error.message);
  process.exit(1);
}
