package main

import (
	"context"
	"os"
	"path/filepath"
	"testing"

	"github.com/hsilvap/chaton/internal/store"
	"github.com/hsilvap/chaton/schemas"
)

func TestServicesEndToEnd(t *testing.T) {
	ctx := context.Background()
	dbPath := filepath.Join(t.TempDir(), "chaton.db")
	st, err := store.Open(ctx, dbPath)
	if err != nil {
		t.Fatal(err)
	}
	users := &UserService{store: st}
	settings := &SettingsService{store: st}
	sessions := &SessionService{store: st}

	if u, err := users.Current(ctx); err != nil || u != nil {
		t.Fatalf("before onboarding: user=%v err=%v", u, err)
	}
	if _, err := sessions.List(ctx); err == nil {
		t.Fatal("List should fail before onboarding")
	}
	if _, err := users.Onboard(ctx, "homero", "not-an-email"); err == nil {
		t.Fatal("Onboard accepted a bad email")
	}
	if _, err := users.Onboard(ctx, "homero", "me@example.com"); err != nil {
		t.Fatal(err)
	}
	if _, err := users.Onboard(ctx, "again", "me@example.com"); err == nil {
		t.Fatal("Onboard ran twice")
	}

	got, _ := settings.Get(ctx)
	if got.Theme != "modern" {
		t.Errorf("default theme %q", got.Theme)
	}
	if err := settings.SetTheme(ctx, "win95"); err == nil {
		t.Error("SetTheme accepted unknown theme")
	}

	dir := t.TempDir()
	a, err := sessions.Create(ctx, dir, schemas.PaneClaude)
	if err != nil {
		t.Fatal(err)
	}
	if _, err := sessions.Create(ctx, dir, "vim"); err == nil {
		t.Error("Create accepted unknown kind")
	}
	b, err := sessions.Create(ctx, dir, schemas.PaneShell)
	if err != nil {
		t.Fatal(err)
	}

	layout := a.Layout
	layout.Panes[0].Active = false
	layout.Panes = append(layout.Panes, schemas.NewPane(schemas.PaneShell, 2))
	layout.Panes[1].Active = true
	layout.Sizes = []float64{30, 70}
	if err := sessions.UpdateLayout(ctx, a.ID, layout); err != nil {
		t.Fatal(err)
	}
	if err := sessions.Activate(ctx, a.ID); err != nil {
		t.Fatal(err)
	}
	if err := sessions.Close(ctx, b.ID); err != nil {
		t.Fatal(err)
	}
	st.Close()

	st, err = store.Open(ctx, dbPath)
	if err != nil {
		t.Fatal(err)
	}
	defer st.Close()
	sessions = &SessionService{store: st}
	open, err := sessions.List(ctx)
	if err != nil {
		t.Fatal(err)
	}
	if len(open) != 1 || open[0].ID != a.ID || !open[0].Active {
		t.Fatalf("restored sessions = %+v", open)
	}
	if s := open[0].Layout.Sizes; len(s) != 2 || s[0] != 30 {
		t.Errorf("restored sizes = %v", s)
	}
	recent, _ := sessions.RecentPaths(ctx)
	if len(recent) != 1 || recent[0] != dir {
		t.Errorf("recent = %v", recent)
	}
}

func TestTerminalCommand(t *testing.T) {
	t.Setenv("SHELL", "/bin/zsh")
	t.Setenv("HOME", t.TempDir())
	id := "9a3f3c3e-5a8c-4c1e-9a43-2f1d7b8f2b11"

	args, err := commandFor(StartRequest{Kind: schemas.PaneClaude, ClaudeSessionID: id})
	if err != nil || args[3] != "exec claude --session-id "+id {
		t.Fatalf("fresh claude: %v %v", args, err)
	}

	dir := filepath.Join(os.Getenv("HOME"), ".claude", "projects", "-tmp-x")
	os.MkdirAll(dir, 0o755)
	os.WriteFile(filepath.Join(dir, id+".jsonl"), []byte("{}"), 0o644)
	args, _ = commandFor(StartRequest{Kind: schemas.PaneClaude, ClaudeSessionID: id})
	if args[3] != "exec claude --resume "+id {
		t.Errorf("existing conversation: %v", args)
	}

	if _, err := commandFor(StartRequest{Kind: schemas.PaneClaude, ClaudeSessionID: "x; rm -rf ~"}); err == nil {
		t.Error("accepted a non-uuid session id")
	}
	if args, _ := commandFor(StartRequest{Kind: schemas.PaneShell}); len(args) != 2 || args[1] != "-l" {
		t.Errorf("shell: %v", args)
	}
}
