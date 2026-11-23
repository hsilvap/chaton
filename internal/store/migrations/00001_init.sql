-- +goose Up
CREATE TABLE users (
    id             TEXT PRIMARY KEY,
    preferred_name TEXT NOT NULL,
    email          TEXT NOT NULL,
    created_at     INTEGER NOT NULL
);

CREATE TABLE settings (
    id             TEXT PRIMARY KEY,
    user_id        TEXT NOT NULL UNIQUE REFERENCES users (id) ON DELETE CASCADE,
    selected_theme TEXT NOT NULL DEFAULT 'modern'
);

CREATE TABLE sessions (
    id         TEXT PRIMARY KEY,
    user_id    TEXT NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    path       TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    closed_at  INTEGER,
    active     INTEGER NOT NULL DEFAULT 0,
    layout     TEXT NOT NULL,
    version    TEXT NOT NULL
);

CREATE UNIQUE INDEX sessions_one_active ON sessions (user_id) WHERE active = 1;
CREATE INDEX sessions_open ON sessions (user_id, created_at) WHERE closed_at IS NULL;

-- +goose Down
DROP TABLE sessions;
DROP TABLE settings;
DROP TABLE users;
