package store

import (
	"context"
	"errors"
	"path/filepath"
	"testing"
)

const validLayout = `{"path":"/tmp","split":"horizontal","sizes":[1],"panes":[{"id":"p1","kind":"shell","created_at":1,"active":true}]}`

func open(t *testing.T) (*Store, context.Context) {
	t.Helper()
	ctx := context.Background()
	s, err := Open(ctx, filepath.Join(t.TempDir(), "test.db"))
	if err != nil {
		t.Fatal(err)
	}
	t.Cleanup(func() { s.Close() })
	return s, ctx
}

func onboard(t *testing.T, s *Store, ctx context.Context) User {
	t.Helper()
	u, err := s.CreateUser(ctx, "homero", "me@example.com")
	if err != nil {
		t.Fatal(err)
	}
	return u
}

func TestReopenKeepsData(t *testing.T) {
	ctx := context.Background()
	path := filepath.Join(t.TempDir(), "test.db")
	s, err := Open(ctx, path)
	if err != nil {
		t.Fatal(err)
	}
	onboard(t, s, ctx)
	s.Close()

	s, err = Open(ctx, path)
	if err != nil {
		t.Fatal(err)
	}
	defer s.Close()
	if _, err := s.User(ctx); err != nil {
		t.Fatalf("user after reopen: %v", err)
	}
}

func TestUserAndSettings(t *testing.T) {
	s, ctx := open(t)

	if _, err := s.User(ctx); !errors.Is(err, ErrNotFound) {
		t.Fatalf("want ErrNotFound before onboarding, got %v", err)
	}

	u := onboard(t, s, ctx)
	st, err := s.Settings(ctx, u.ID)
	if err != nil {
		t.Fatal(err)
	}
	if st.SelectedTheme != "modern" {
		t.Errorf("default theme = %q, want modern", st.SelectedTheme)
	}

	if err := s.SetTheme(ctx, u.ID, "teletext"); err != nil {
		t.Fatal(err)
	}
	st, _ = s.Settings(ctx, u.ID)
	if st.SelectedTheme != "teletext" {
		t.Errorf("theme = %q, want teletext", st.SelectedTheme)
	}
}

func TestSessionLifecycle(t *testing.T) {
	s, ctx := open(t)
	u := onboard(t, s, ctx)

	a, err := s.CreateSession(ctx, u.ID, "/a", []byte(validLayout))
	if err != nil {
		t.Fatal(err)
	}
	b, err := s.CreateSession(ctx, u.ID, "/b", []byte(validLayout))
	if err != nil {
		t.Fatal(err)
	}

	activeIDs := func() []string {
		sessions, err := s.OpenSessions(ctx, u.ID)
		if err != nil {
			t.Fatal(err)
		}
		var ids []string
		for _, x := range sessions {
			if x.Active {
				ids = append(ids, x.ID)
			}
		}
		return ids
	}

	if got := activeIDs(); len(got) != 1 || got[0] != b.ID {
		t.Fatalf("active after create = %v, want [%s]", got, b.ID)
	}

	if err := s.Activate(ctx, u.ID, a.ID); err != nil {
		t.Fatal(err)
	}
	if got := activeIDs(); len(got) != 1 || got[0] != a.ID {
		t.Fatalf("active after Activate = %v, want [%s]", got, a.ID)
	}

	if err := s.CloseSession(ctx, a.ID); err != nil {
		t.Fatal(err)
	}
	if err := s.CloseSession(ctx, a.ID); !errors.Is(err, ErrNotFound) {
		t.Errorf("closing twice: want ErrNotFound, got %v", err)
	}
	open, _ := s.OpenSessions(ctx, u.ID)
	if len(open) != 1 || open[0].ID != b.ID {
		t.Fatalf("open sessions = %v, want only b", open)
	}
	closed, _ := s.q.GetSession(ctx, a.ID)
	if closed.ClosedAt == nil || closed.Active {
		t.Errorf("closed session: closed_at=%v active=%v", closed.ClosedAt, closed.Active)
	}

	if err := s.Activate(ctx, u.ID, a.ID); !errors.Is(err, ErrNotFound) {
		t.Errorf("activating a closed session: want ErrNotFound, got %v", err)
	}

	paths, err := s.RecentPaths(ctx, u.ID, 10)
	if err != nil {
		t.Fatal(err)
	}
	if len(paths) != 2 || paths[0] != "/b" {
		t.Errorf("recent paths = %v, want [/b /a]", paths)
	}
}

func TestLayoutValidation(t *testing.T) {
	s, ctx := open(t)
	u := onboard(t, s, ctx)

	bad := []string{
		`not json`,
		`{}`,
		`{"path":"/tmp","split":"diagonal","sizes":[],"panes":[]}`,
		`{"path":"/tmp","split":"vertical","sizes":[],"panes":[{"id":"p1","kind":"vim","created_at":1,"active":true}]}`,
		`{"path":"/tmp","split":"vertical","sizes":[],"panes":[],"extra":1}`,
	}
	for _, layout := range bad {
		if _, err := s.CreateSession(ctx, u.ID, "/tmp", []byte(layout)); err == nil {
			t.Errorf("CreateSession accepted invalid layout %s", layout)
		}
	}

	sess, err := s.CreateSession(ctx, u.ID, "/tmp", []byte(validLayout))
	if err != nil {
		t.Fatal(err)
	}
	if err := s.UpdateLayout(ctx, sess.ID, []byte(`{}`)); err == nil {
		t.Error("UpdateLayout accepted invalid layout")
	}
	if err := s.UpdateLayout(ctx, sess.ID, []byte(validLayout)); err != nil {
		t.Errorf("UpdateLayout rejected valid layout: %v", err)
	}
}
