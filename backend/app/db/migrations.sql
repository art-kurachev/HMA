-- Fallback DDL migrations for hookah-assistant
-- Run manually if SQLAlchemy create_all is not used

CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    telegram_id BIGINT UNIQUE NOT NULL,
    provider_group TEXT NULL,
    welcome_requests_used INTEGER DEFAULT 0,
    last_weekly_refill DATE NULL,
    created_at TIMESTAMP DEFAULT now()
);

-- Migration: add quota columns to existing users table
-- ALTER TABLE users ADD COLUMN IF NOT EXISTS welcome_requests_used INTEGER DEFAULT 0;
-- ALTER TABLE users ADD COLUMN IF NOT EXISTS last_weekly_refill DATE NULL;
-- Migration: friday bonus (каждую пятницу 19:00 +1, если остаток ≤3)
-- ALTER TABLE users ADD COLUMN IF NOT EXISTS friday_bonus INTEGER DEFAULT 0;
-- Migration: paid_generations (куплено за Telegram Stars)
-- ALTER TABLE users ADD COLUMN IF NOT EXISTS paid_generations INTEGER DEFAULT 0;
CREATE INDEX IF NOT EXISTS ix_users_telegram_id ON users(telegram_id);

CREATE TABLE IF NOT EXISTS daily_usage (
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    count INTEGER DEFAULT 0,
    PRIMARY KEY (user_id, date)
);

CREATE TABLE IF NOT EXISTS sessions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    params JSONB NOT NULL,
    created_at TIMESTAMP DEFAULT now()
);

CREATE TABLE IF NOT EXISTS generated_mixes (
    id SERIAL PRIMARY KEY,
    session_id INTEGER NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    mix_json JSONB NOT NULL,
    provider VARCHAR(50) NOT NULL,
    llm_model_used VARCHAR(64) NULL,
    created_at TIMESTAMP DEFAULT now()
);

-- Migration for existing DB:
-- ALTER TABLE generated_mixes ADD COLUMN IF NOT EXISTS llm_model_used VARCHAR(64) NULL;

CREATE TABLE IF NOT EXISTS feedback (
    id SERIAL PRIMARY KEY,
    mix_id INTEGER NOT NULL REFERENCES generated_mixes(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    rating BOOLEAN NOT NULL,
    reason TEXT NULL,
    created_at TIMESTAMP DEFAULT now()
);

CREATE TABLE IF NOT EXISTS app_settings (
    key VARCHAR(64) PRIMARY KEY,
    value TEXT NOT NULL
);
