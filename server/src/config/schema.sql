CREATE TABLE IF NOT EXISTS users (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS readings (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reading_date DATE NOT NULL,
  time_slot VARCHAR(30) NOT NULL CHECK (time_slot IN (
    'morning_fasting', 'after_breakfast', 'after_lunch', 'after_dinner'
  )),
  glucose_value INTEGER NOT NULL CHECK (glucose_value BETWEEN 40 AND 600),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT one_reading_per_slot_per_day UNIQUE (user_id, reading_date, time_slot)
);

CREATE INDEX IF NOT EXISTS idx_readings_user_date ON readings(user_id, reading_date);
