import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { pool } from '../config/db.js';
import { asyncHandler } from '../utils/asyncHandler.js';

function createToken(user) {
  return jwt.sign({ email: user.email }, process.env.JWT_SECRET, {
    subject: String(user.id),
    expiresIn: process.env.JWT_EXPIRES_IN || '1d',
  });
}

export const register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.validatedBody;
  const normalizedEmail = email.toLowerCase();
  const passwordHash = await bcrypt.hash(password, 12);
  try {
    const { rows } = await pool.query(
      'INSERT INTO users (name, email, password_hash) VALUES ($1, $2, $3) RETURNING id, name, email',
      [name, normalizedEmail, passwordHash],
    );
    const user = rows[0];
    res.status(201).json({ message: 'Account created successfully.', user, token: createToken(user) });
  } catch (error) {
    if (error.code === '23505') return res.status(409).json({ message: 'An account with this email already exists.' });
    throw error;
  }
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.validatedBody;
  const { rows } = await pool.query(
    'SELECT id, name, email, password_hash FROM users WHERE email = $1',
    [email.toLowerCase()],
  );
  const user = rows[0];
  if (!user || !(await bcrypt.compare(password, user.password_hash))) {
    return res.status(401).json({ message: 'Invalid email or password.' });
  }
  res.json({
    message: 'Login successful.',
    user: { id: user.id, name: user.name, email: user.email },
    token: createToken(user),
  });
});

export const me = asyncHandler(async (req, res) => {
  const { rows } = await pool.query('SELECT id, name, email FROM users WHERE id = $1', [req.user.id]);
  if (!rows[0]) return res.status(404).json({ message: 'User not found.' });
  res.json({ user: rows[0] });
});
