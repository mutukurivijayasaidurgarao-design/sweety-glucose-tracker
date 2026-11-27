import { pool } from '../config/db.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { getReportRange, isValidDateString, utcToday } from '../utils/dates.js';

function getSelectedDate(value) {
  const date = value || utcToday();
  if (!isValidDateString(date)) {
    const error = new Error('Please provide a valid date in YYYY-MM-DD format.');
    error.status = 400;
    throw error;
  }
  if (date > utcToday()) {
    const error = new Error('Date cannot be in the future.');
    error.status = 400;
    throw error;
  }
  return date;
}

async function buildReport(userId, type, selectedDate, includeEntries = false) {
  const { startDate, endDate } = getReportRange(type, selectedDate);
  const summary = await pool.query(
    `SELECT MAX(glucose_value)::int AS highest,
            MIN(glucose_value)::int AS lowest,
            ROUND(AVG(glucose_value), 1)::numeric AS average,
            COUNT(*)::int AS "readingCount"
     FROM readings
     WHERE user_id = $1 AND reading_date BETWEEN $2 AND $3`,
    [userId, startDate, endDate],
  );
  let readings = [];
  if (includeEntries) {
    const result = await pool.query(
      `SELECT id, reading_date AS "readingDate", time_slot AS "timeSlot",
              glucose_value AS "glucoseValue"
       FROM readings WHERE user_id = $1 AND reading_date BETWEEN $2 AND $3
       ORDER BY reading_date ASC, CASE time_slot
         WHEN 'morning_fasting' THEN 1 WHEN 'after_breakfast' THEN 2
         WHEN 'after_lunch' THEN 3 ELSE 4 END`,
      [userId, startDate, endDate],
    );
    readings = result.rows;
  }
  return { type, startDate, endDate, ...summary.rows[0], readings };
}

export const dailyReport = asyncHandler(async (req, res) => {
  const date = getSelectedDate(req.query.date);
  const report = await buildReport(req.user.id, 'daily', date, true);
  res.json({ report });
});
export const monthToDateReport = asyncHandler(async (req, res) => {
  const date = getSelectedDate(req.query.date);
  const report = await buildReport(req.user.id, 'month-to-date', date);
  res.json({ report });
});
export const monthlyReport = asyncHandler(async (req, res) => {
  const date = getSelectedDate(req.query.date);
  const report = await buildReport(req.user.id, 'monthly', date);
  res.json({ report });
});
