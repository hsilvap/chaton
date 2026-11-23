-- name: GetUser :one
SELECT * FROM users LIMIT 1;

-- name: CreateUser :exec
INSERT INTO users (id, preferred_name, email, created_at) VALUES (?, ?, ?, ?);

-- name: CreateSettings :exec
INSERT INTO settings (id, user_id) VALUES (?, ?);

-- name: GetSettings :one
SELECT * FROM settings WHERE user_id = ?;

-- name: UpdateTheme :exec
UPDATE settings SET selected_theme = ? WHERE user_id = ?;

-- name: CreateSession :exec
INSERT INTO sessions (id, user_id, path, created_at, layout, version) VALUES (?, ?, ?, ?, ?, ?);

-- name: GetSession :one
SELECT * FROM sessions WHERE id = ?;

-- name: ListOpenSessions :many
SELECT * FROM sessions WHERE user_id = ? AND closed_at IS NULL ORDER BY created_at;

-- name: ListRecentPaths :many
SELECT path FROM sessions WHERE user_id = ? GROUP BY path ORDER BY MAX(created_at) DESC LIMIT ?;

-- name: UpdateLayout :execrows
UPDATE sessions SET layout = ?, version = ? WHERE id = ? AND closed_at IS NULL;

-- name: CloseSession :execrows
UPDATE sessions SET closed_at = ?, active = 0 WHERE id = ? AND closed_at IS NULL;

-- name: ClearActive :exec
UPDATE sessions SET active = 0 WHERE user_id = ? AND active = 1;

-- name: SetActive :execrows
UPDATE sessions SET active = 1 WHERE id = ? AND user_id = ? AND closed_at IS NULL;
