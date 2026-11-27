import dotenv from 'dotenv';
dotenv.config();
import bcrypt from 'bcrypt';
import { pool } from './config/db.js';
import { initializeDatabase } from './config/initDb.js';

const demo = { name: 'Sweety Demo', email: 'demo@sweety.local', password: 'SweetyDemo123!' };
try {
  await initializeDatabase();
  const hash = await bcrypt.hash(demo.password, 12);
  const userResult = await pool.query(
    `INSERT INTO users (name, email, password_hash)
     VALUES ($1, $2, $3)
     ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name
     RETURNING id`,
    [demo.name, demo.email, hash],
  );
  const userId = userResult.rows[0].id;
  const count = await pool.query('SELECT COUNT(*)::int AS count FROM readings WHERE user_id = $1', [userId]);
  if (count.rows[0].count === 0) {
    const today = new Date().toISOString().slice(0, 10);
    const samples = [
      ['morning_fasting', 108],
      ['after_breakfast', 142],
      ['after_lunch', 136],
      ['after_dinner', 128],
    ];
    for (const [slot, value] of samples) {
      await pool.query(
        'INSERT INTO readings (user_id, reading_date, time_slot, glucose_value) VALUES ($1, $2, $3, $4)',
        [userId, today, slot, value],
      );
    }
  }
  console.log(`Demo user ready: ${demo.email} / ${demo.password}`);
} catch (error) {
  console.error('Seed failed:', error.message);
  process.exitCode = 1;
} finally {
  await pool.end();
}
