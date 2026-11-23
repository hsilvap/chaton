package main

import (
	"context"
	"errors"
	"fmt"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/wailsapp/wails/v3/pkg/application"

	"github.com/hsilvap/chaton/internal/store"
	"github.com/hsilvap/chaton/schemas"
)

type Session struct {
	ID     string         `json:"id"`
	Path   string         `json:"path"`
	Active bool           `json:"active"`
	Layout schemas.Layout `json:"layout"`
}

type SessionService struct {
	store *store.Store
}

func toSession(row store.Session) (Session, error) {
	layout, err := schemas.ParseLayout(row.Layout)
	if err != nil {
		return Session{}, fmt.Errorf("session %s: %w", row.ID, err)
	}
	return Session{ID: row.ID, Path: row.Path, Active: row.Active, Layout: layout}, nil
}

// List returns the sessions that are still open, oldest first.
func (s *SessionService) List(ctx context.Context) ([]Session, error) {
	userID, err := currentUserID(ctx, s.store)
	if err != nil {
		return nil, err
	}
	rows, err := s.store.OpenSessions(ctx, userID)
	if err != nil {
		return nil, err
	}
	sessions := make([]Session, 0, len(rows))
	for _, row := range rows {
		sess, err := toSession(row)
		if err != nil {
			return nil, err
		}
		if sess.Layout.Upgrade() || row.Version != schemas.LayoutVersion {
			if err := s.UpdateLayout(ctx, sess.ID, sess.Layout); err != nil {
				return nil, fmt.Errorf("upgrade session %s: %w", sess.ID, err)
			}
		}
		sessions = append(sessions, sess)
	}
	return sessions, nil
}

func (s *SessionService) RecentPaths(ctx context.Context) ([]string, error) {
	userID, err := currentUserID(ctx, s.store)
	if err != nil {
		return nil, err
	}
	return s.store.RecentPaths(ctx, userID, 20)
}

// Create resolves path, starts the session with one pane of the given kind and makes it active.
func (s *SessionService) Create(ctx context.Context, path string, kind schemas.PaneKind) (Session, error) {
	if kind != schemas.PaneClaude && kind != schemas.PaneShell {
		return Session{}, fmt.Errorf("unknown pane kind %q", kind)
	}
	userID, err := currentUserID(ctx, s.store)
	if err != nil {
		return Session{}, err
	}
	dir, err := s.ResolveDirectory(path)
	if err != nil {
		return Session{}, err
	}
	raw, err := schemas.NewLayout(dir, kind, time.Now().UnixMilli()).Marshal()
	if err != nil {
		return Session{}, err
	}
	row, err := s.store.CreateSession(ctx, userID, dir, raw)
	if err != nil {
		return Session{}, err
	}
	return toSession(row)
}

func (s *SessionService) UpdateLayout(ctx context.Context, id string, layout schemas.Layout) error {
	raw, err := layout.Marshal()
	if err != nil {
		return err
	}
	return s.store.UpdateLayout(ctx, id, raw)
}

func (s *SessionService) Activate(ctx context.Context, id string) error {
	userID, err := currentUserID(ctx, s.store)
	if err != nil {
		return err
	}
	return s.store.Activate(ctx, userID, id)
}

func (s *SessionService) Close(ctx context.Context, id string) error {
	return s.store.CloseSession(ctx, id)
}

// PickDirectory returns "" if the user cancelled.
func (s *SessionService) PickDirectory() (string, error) {
	return application.Get().Dialog.OpenFile().
		SetTitle("Choose a working directory").
		SetButtonText("Open here").
		CanChooseDirectories(true).
		CanChooseFiles(false).
		CanCreateDirectories(true).
		PromptForSingleSelection()
}

// ResolveDirectory expands ~ and returns the cleaned absolute path,
// or an error if it isn't an existing directory.
func (s *SessionService) ResolveDirectory(path string) (string, error) {
	path = strings.TrimSpace(path)
	if path == "" {
		return "", errors.New("enter a directory")
	}

	if path == "~" || strings.HasPrefix(path, "~/") {
		home, err := os.UserHomeDir()
		if err != nil {
			return "", err
		}
		path = filepath.Join(home, path[1:])
	}

	if !filepath.IsAbs(path) {
		return "", errors.New("use an absolute path or start with ~")
	}
	path = filepath.Clean(path)

	info, err := os.Stat(path)
	if errors.Is(err, os.ErrNotExist) {
		return "", fmt.Errorf("%s doesn't exist", path)
	}
	if err != nil {
		return "", err
	}
	if !info.IsDir() {
		return "", fmt.Errorf("%s is not a directory", path)
	}
	return path, nil
}
