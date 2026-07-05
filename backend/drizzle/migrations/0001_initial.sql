-- Migration: 0001_initial
-- Creates the todos table.

CREATE TABLE IF NOT EXISTS todos (
    id          TEXT        PRIMARY KEY,
    title       TEXT        NOT NULL,
    description TEXT,
    status      INTEGER     NOT NULL DEFAULT 0,  -- 0 = pending, 1 = completed
    created_at  TEXT        NOT NULL DEFAULT (datetime('now')),
    updated_at  TEXT        NOT NULL DEFAULT (datetime('now'))
);

-- Index for common filter patterns
CREATE INDEX IF NOT EXISTS idx_todos_status     ON todos (status);
CREATE INDEX IF NOT EXISTS idx_todos_created_at ON todos (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_todos_title      ON todos (title);
