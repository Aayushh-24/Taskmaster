-- ============================================
-- TaskMaster — PostgreSQL Schema
-- ============================================

-- Create database (run as superuser)
-- CREATE DATABASE taskmaster;
-- \c taskmaster

-- Drop tables if re-running
DROP TABLE IF EXISTS tasks CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- ============================================
-- Users Table
-- ============================================
CREATE TABLE users (
    id          SERIAL PRIMARY KEY,
    username    VARCHAR(80)  NOT NULL UNIQUE,
    email       VARCHAR(120) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    created_at  TIMESTAMP    NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_users_email    ON users (email);
CREATE INDEX idx_users_username ON users (username);

-- ============================================
-- Tasks Table
-- ============================================
CREATE TYPE task_priority AS ENUM ('low', 'medium', 'high', 'critical');
CREATE TYPE task_status   AS ENUM ('pending', 'in_progress', 'completed', 'cancelled');

CREATE TABLE tasks (
    id          SERIAL PRIMARY KEY,
    title       VARCHAR(200)   NOT NULL,
    description TEXT,
    priority    task_priority  NOT NULL DEFAULT 'medium',
    status      task_status    NOT NULL DEFAULT 'pending',
    user_id     INTEGER        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at  TIMESTAMP      NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMP      NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_tasks_user_id  ON tasks (user_id);
CREATE INDEX idx_tasks_status   ON tasks (status);
CREATE INDEX idx_tasks_priority ON tasks (priority);

-- ============================================
-- Auto-update updated_at trigger
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_tasks_updated_at
    BEFORE UPDATE ON tasks
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- Sample seed data (optional)
-- ============================================
-- INSERT INTO users (username, email, password_hash) VALUES
--   ('demo', 'demo@example.com', '<bcrypt_hash_here>');
