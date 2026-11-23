package store

import (
	"context"
	"database/sql"
	"embed"
	"errors"
	"fmt"
	"io/fs"
	"os"
	"path/filepath"
	"time"

	"github.com/google/uuid"
	"github.com/pressly/goose/v3"
	_ "modernc.org/sqlite"

	"github.com/hsilvap/chaton/schemas"
)

//go:embed migrations/*.sql
var migrations embed.FS

var ErrNotFound = errors.New("not found")

type Store struct {
	db *sql.DB
	q  *Queries
}

func DefaultPath() (string, error) {
	dir, err := os.UserConfigDir()
	if err != nil {
		return "", err
	}
	return filepath.Join(dir, "chaton", "chaton.db"), nil
}

func Open(ctx context.Context, path string) (*Store, error) {
	if err := os.MkdirAll(filepath.Dir(path), 0o755); err != nil {
		return nil, err
	}
	dsn := "file:" + path + "?_pragma=foreign_keys(1)&_pragma=journal_mode(WAL)&_pragma=busy_timeout(5000)"
	db, err := sql.Open("sqlite", dsn)
	if err != nil {
		return nil, err
	}
	db.SetMaxOpenConns(1)

	if err := migrate(ctx, db); err != nil {
		db.Close()
		return nil, err
	}
	return &Store{db: db, q: New(db)}, nil
}

func migrate(ctx context.Context, db *sql.DB) error {
	sub, err := fs.Sub(migrations, "migrations")
	if err != nil {
		return err
	}
	provider, err := goose.NewProvider(goose.DialectSQLite3, db, sub)
	if err != nil {
		return err
	}
	if _, err := provider.Up(ctx); err != nil {
		return fmt.Errorf("migrate: %w", err)
	}
	return nil
}

func (s *Store) Close() error { return s.db.Close() }

func (s *Store) tx(ctx context.Context, fn func(q *Queries) error) error {
	tx, err := s.db.BeginTx(ctx, nil)
	if err != nil {
		return err
	}
	defer tx.Rollback()
	if err := fn(s.q.WithTx(tx)); err != nil {
		return err
	}
	return tx.Commit()
}

func newID() string { return uuid.Must(uuid.NewV7()).String() }

func now() int64 { return time.Now().UnixMilli() }

func notFound(err error) error {
	if errors.Is(err, sql.ErrNoRows) {
		return ErrNotFound
	}
	return err
}

func expectRow(n int64, err error) error {
	if err != nil {
		return err
	}
	if n == 0 {
		return ErrNotFound
	}
	return nil
}

// User returns ErrNotFound until onboarding has created one.
func (s *Store) User(ctx context.Context) (User, error) {
	u, err := s.q.GetUser(ctx)
	return u, notFound(err)
}

func (s *Store) CreateUser(ctx context.Context, name, email string) (User, error) {
	u := User{ID: newID(), PreferredName: name, Email: email, CreatedAt: now()}
	err := s.tx(ctx, func(q *Queries) error {
		if err := q.CreateUser(ctx, CreateUserParams(u)); err != nil {
			return err
		}
		return q.CreateSettings(ctx, CreateSettingsParams{ID: newID(), UserID: u.ID})
	})
	return u, err
}

func (s *Store) Settings(ctx context.Context, userID string) (Setting, error) {
	st, err := s.q.GetSettings(ctx, userID)
	return st, notFound(err)
}

func (s *Store) SetTheme(ctx context.Context, userID, theme string) error {
	return s.q.UpdateTheme(ctx, UpdateThemeParams{SelectedTheme: theme, UserID: userID})
}

// CreateSession inserts the session and makes it the active one.
func (s *Store) CreateSession(ctx context.Context, userID, path string, layout []byte) (Session, error) {
	if err := schemas.ValidateLayout(layout); err != nil {
		return Session{}, err
	}
	sess := Session{
		ID:        newID(),
		UserID:    userID,
		Path:      path,
		CreatedAt: now(),
		Active:    true,
		Layout:    string(layout),
		Version:   schemas.LayoutVersion,
	}
	err := s.tx(ctx, func(q *Queries) error {
		if err := q.ClearActive(ctx, userID); err != nil {
			return err
		}
		if err := q.CreateSession(ctx, CreateSessionParams{
			ID: sess.ID, UserID: userID, Path: path, CreatedAt: sess.CreatedAt,
			Layout: sess.Layout, Version: sess.Version,
		}); err != nil {
			return err
		}
		return expectRow(q.SetActive(ctx, SetActiveParams{ID: sess.ID, UserID: userID}))
	})
	return sess, err
}

func (s *Store) OpenSessions(ctx context.Context, userID string) ([]Session, error) {
	return s.q.ListOpenSessions(ctx, userID)
}

func (s *Store) RecentPaths(ctx context.Context, userID string, limit int64) ([]string, error) {
	return s.q.ListRecentPaths(ctx, ListRecentPathsParams{UserID: userID, Limit: limit})
}

func (s *Store) UpdateLayout(ctx context.Context, id string, layout []byte) error {
	if err := schemas.ValidateLayout(layout); err != nil {
		return err
	}
	return expectRow(s.q.UpdateLayout(ctx, UpdateLayoutParams{
		Layout: string(layout), Version: schemas.LayoutVersion, ID: id,
	}))
}

func (s *Store) CloseSession(ctx context.Context, id string) error {
	closedAt := now()
	return expectRow(s.q.CloseSession(ctx, CloseSessionParams{ClosedAt: &closedAt, ID: id}))
}

func (s *Store) Activate(ctx context.Context, userID, id string) error {
	return s.tx(ctx, func(q *Queries) error {
		if err := q.ClearActive(ctx, userID); err != nil {
			return err
		}
		return expectRow(q.SetActive(ctx, SetActiveParams{ID: id, UserID: userID}))
	})
}
