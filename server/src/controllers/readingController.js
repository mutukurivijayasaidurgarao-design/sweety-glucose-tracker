import { pool } from '../config/db.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const listReadings = asyncHandler(async (req, res) => {
  const values = [req.user.id];
  let where = 'user_id = $1';
  if (req.query.date) {
    values.push(req.query.date);
    where += ` AND reading_date = $${values.length}`;
  }
  const { rows } = await pool.query(
    `SELECT id, reading_date AS "readingDate", time_slot AS "timeSlot",
            glucose_value AS "glucoseValue", created_at AS "createdAt", updated_at AS "updatedAt"
     FROM readings WHERE ${where} ORDER BY reading_date DESC, time_slot ASC`,
    values,
  );
  res.json({ readings: rows });
});

export const createReading = asyncHandler(async (req, res) => {
  const { readingDate, timeSlot, glucoseValue } = req.validatedBody;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const countResult = await client.query(
      'SELECT COUNT(*)::int AS count FROM readings WHERE user_id = $1 AND reading_date = $2',
      [req.user.id, readingDate],
    );
    const existingSlot = await client.query(
      'SELECT 1 FROM readings WHERE user_id = $1 AND reading_date = $2 AND time_slot = $3',
      [req.user.id, readingDate, timeSlot],
    );
    if (existingSlot.rowCount) {
      await client.query('ROLLBACK');
      return res.status(409).json({ message: `You already have a ${slotLabel(timeSlot)} reading for this date.` });
    }
    if (countResult.rows[0].count >= 4) {
      await client.query('ROLLBACK');
      return res.status(409).json({ message: 'You can add only 4 readings per day.' });
    }
    const result = await client.query(
      `INSERT INTO readings (user_id, reading_date, time_slot, glucose_value)
       VALUES ($1, $2, $3, $4)
       RETURNING id, reading_date AS "readingDate", time_slot AS "timeSlot", glucose_value AS "glucoseValue"`,
      [req.user.id, readingDate, timeSlot, glucoseValue],
    );
    await client.query('COMMIT');
    res.status(201).json({ message: 'Reading saved successfully.', reading: result.rows[0] });
  } catch (error) {
    await client.query('ROLLBACK');
    if (error.code === '23505') return res.status(409).json({ message: `You already have a ${slotLabel(timeSlot)} reading for this date.` });
    throw error;
  } finally {
    client.release();
  }
});

export const updateReading = asyncHandler(async (req, res) => {
  const { readingDate, timeSlot, glucoseValue } = req.validatedBody;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const current = await client.query('SELECT id FROM readings WHERE id = $1 AND user_id = $2 FOR UPDATE', [req.params.id, req.user.id]);
    if (!current.rowCount) {
      await client.query('ROLLBACK');
      return res.status(404).json({ message: 'Reading not found.' });
    }
    const duplicate = await client.query(
      'SELECT 1 FROM readings WHERE user_id = $1 AND reading_date = $2 AND time_slot = $3 AND id <> $4',
      [req.user.id, readingDate, timeSlot, req.params.id],
    );
    if (duplicate.rowCount) {
      await client.query('ROLLBACK');
      return res.status(409).json({ message: `You already have a ${slotLabel(timeSlot)} reading for this date.` });
    }
    const dayCount = await client.query(
      'SELECT COUNT(*)::int AS count FROM readings WHERE user_id = $1 AND reading_date = $2 AND id <> $3',
      [req.user.id, readingDate, req.params.id],
    );
    if (dayCount.rows[0].count >= 4) {
      await client.query('ROLLBACK');
      return res.status(409).json({ message: 'You can add only 4 readings per day.' });
    }
    const result = await client.query(
      `UPDATE readings SET reading_date = $1, time_slot = $2, glucose_value = $3, updated_at = NOW()
       WHERE id = $4 AND user_id = $5
       RETURNING id, reading_date AS "readingDate", time_slot AS "timeSlot", glucose_value AS "glucoseValue"`,
      [readingDate, timeSlot, glucoseValue, req.params.id, req.user.id],
    );
    await client.query('COMMIT');
    res.json({ message: 'Reading updated successfully.', reading: result.rows[0] });
  } catch (error) {
    await client.query('ROLLBACK');
    if (error.code === '23505') return res.status(409).json({ message: `You already have a ${slotLabel(timeSlot)} reading for this date.` });
    throw error;
  } finally {
    client.release();
  }
});

export const deleteReading = asyncHandler(async (req, res) => {
  const result = await pool.query('DELETE FROM readings WHERE id = $1 AND user_id = $2 RETURNING id', [req.params.id, req.user.id]);
  if (!result.rowCount) return res.status(404).json({ message: 'Reading not found.' });
  res.json({ message: 'Reading deleted successfully.' });
});

function slotLabel(slot) {
  return ({
    morning_fasting: 'Morning (fasting)',
    after_breakfast: 'After breakfast',
    after_lunch: 'After lunch',
    after_dinner: 'After dinner',
  })[slot] || slot;
}
