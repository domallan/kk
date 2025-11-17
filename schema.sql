-- Kris Kringle Database Schema
-- Note: Database is created automatically by Docker from POSTGRES_DB env var

-- Users table
CREATE TABLE IF NOT EXISTS users (
  user_id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  partner_id INTEGER NULL,
  phone_number VARCHAR(20) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (partner_id) REFERENCES users(user_id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_partner ON users(partner_id);

-- Assignments table (stores yearly KK assignments)
CREATE TABLE IF NOT EXISTS assignments (
  assignment_id SERIAL PRIMARY KEY,
  year INTEGER NOT NULL,
  giver_id INTEGER NOT NULL,
  receiver_id INTEGER NOT NULL,
  sms_sent_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (giver_id) REFERENCES users(user_id) ON DELETE CASCADE,
  FOREIGN KEY (receiver_id) REFERENCES users(user_id) ON DELETE CASCADE,
  UNIQUE (year, giver_id)
);

CREATE INDEX IF NOT EXISTS idx_year ON assignments(year);
CREATE INDEX IF NOT EXISTS idx_giver ON assignments(giver_id);
CREATE INDEX IF NOT EXISTS idx_receiver ON assignments(receiver_id);

