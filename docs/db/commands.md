# DB commands

Run from the repo root unless noted.

## Regenerate query code (sqlc)

After changing `internal/store/queries.sql` or adding a migration:

```sh
cd internal/store && go run github.com/sqlc-dev/sqlc/cmd/sqlc@v1.31.1 generate
```

Writes `db.go`, `models.go` and `queries.sql.go`. Don't edit those by hand.

## Add a migration

Create the next numbered file in `internal/store/migrations/`, e.g. `00002_add_foo.sql`:

```sql
-- +goose Up
ALTER TABLE sessions ADD COLUMN foo TEXT;

-- +goose Down
ALTER TABLE sessions DROP COLUMN foo;
```

Migrations run automatically when the app opens the DB. Never edit one that has already run, add a new one instead. Regenerate sqlc afterwards.

## Tests

```sh
go test ./internal/store
go test ./internal/store -run TestSessionLifecycle -v
```

## Inspect the local DB

macOS path: `~/Library/Application Support/chaton/chaton.db`

```sh
sqlite3 ~/Library/Application\ Support/chaton/chaton.db
```

```sql
.tables
.schema sessions
SELECT * FROM goose_db_version;
SELECT id, path, active, closed_at, layout FROM sessions WHERE closed_at IS NULL;
SELECT * FROM users;
SELECT * FROM settings;
```

## Reset

Deletes everything, including the user (onboarding shows again):

```sh
rm ~/Library/Application\ Support/chaton/chaton.db*
```
