package main

import (
	"context"
	"fmt"
	"os"
	"path/filepath"
	"slices"
	"strings"
	"sync"

	"github.com/google/uuid"
	"github.com/wailsapp/wails/v3/pkg/application"

	"github.com/hsilvap/chaton/internal/pty"
	"github.com/hsilvap/chaton/schemas"
)

type PtyOutput struct {
	PaneID string `json:"paneId"`
	Data   []byte `json:"data"`
}

type PtyExit struct {
	PaneID string `json:"paneId"`
	Code   int    `json:"code"`
}

func init() {
	application.RegisterEvent[PtyOutput]("pty:output")
	application.RegisterEvent[PtyExit]("pty:exit")
}

type StartRequest struct {
	PaneID          string           `json:"paneId"`
	Path            string           `json:"path"`
	Kind            schemas.PaneKind `json:"kind"`
	ClaudeSessionID string           `json:"claudeSessionId"`
	Cols            int              `json:"cols"`
	Rows            int              `json:"rows"`
}

type BusyPane struct {
	PaneID string   `json:"paneId"`
	What   []string `json:"what"`
}

type TerminalService struct {
	ptys  *pty.Manager
	mu    sync.Mutex
	kinds map[string]schemas.PaneKind
}

func (s *TerminalService) kind(id string) schemas.PaneKind {
	s.mu.Lock()
	defer s.mu.Unlock()
	return s.kinds[id]
}

func NewTerminalService() *TerminalService {
	emit := func(name string, data any) {
		if app := application.Get(); app != nil {
			app.Event.Emit(name, data)
		}
	}
	return &TerminalService{
		ptys: pty.NewManager(
			func(id string, data []byte) { emit("pty:output", PtyOutput{PaneID: id, Data: data}) },
			func(id string, code int) { emit("pty:exit", PtyExit{PaneID: id, Code: code}) },
		),
		kinds: map[string]schemas.PaneKind{},
	}
}

func (s *TerminalService) ServiceShutdown() error {
	s.ptys.KillAll()
	return nil
}

// Start spawns the pane's process, or just resizes it if it's already running. It reports whether it spawned.
func (s *TerminalService) Start(req StartRequest) (bool, error) {
	if req.PaneID == "" {
		return false, fmt.Errorf("missing pane id")
	}
	args, err := commandFor(req)
	if err != nil {
		return false, err
	}
	started, err := s.ptys.Start(req.PaneID, pty.Spec{
		Args: args,
		Dir:  req.Path,
		Env:  terminalEnv(),
		Cols: clampSize(req.Cols, 80),
		Rows: clampSize(req.Rows, 24),
	})
	if started {
		s.mu.Lock()
		s.kinds[req.PaneID] = req.Kind
		s.mu.Unlock()
	}
	return started, err
}

func (s *TerminalService) Write(paneID, data string) error {
	return s.ptys.Write(paneID, []byte(data))
}

func (s *TerminalService) Resize(paneID string, cols, rows int) error {
	return s.ptys.Resize(paneID, clampSize(cols, 80), clampSize(rows, 24))
}

func (s *TerminalService) Kill(paneIDs []string) {
	for _, id := range paneIDs {
		s.ptys.Kill(id)
		s.mu.Lock()
		delete(s.kinds, id)
		s.mu.Unlock()
	}
}

// Busy reports which of the panes have something running that closing would kill.
func (s *TerminalService) Busy(ctx context.Context, paneIDs []string) ([]BusyPane, error) {
	busy := []BusyPane{}
	for _, id := range paneIDs {
		if !s.ptys.Running(id) {
			continue
		}
		if s.kind(id) == schemas.PaneClaude {
			busy = append(busy, BusyPane{PaneID: id, What: []string{"claude"}})
			continue
		}
		kids, err := s.ptys.Children(id)
		if err != nil {
			return nil, err
		}
		if len(kids) > 0 {
			busy = append(busy, BusyPane{PaneID: id, What: kids})
		}
	}
	return busy, nil
}

func userShell() string {
	if sh := os.Getenv("SHELL"); sh != "" {
		return sh
	}
	return "/bin/zsh"
}

func commandFor(req StartRequest) ([]string, error) {
	shell := userShell()
	switch req.Kind {
	case schemas.PaneShell:
		return []string{shell, "-l"}, nil
	case schemas.PaneClaude:
		if _, err := uuid.Parse(req.ClaudeSessionID); err != nil {
			return nil, fmt.Errorf("claude pane needs a session uuid: %w", err)
		}
		flag := "--session-id"
		if claudeConversationExists(req.ClaudeSessionID) {
			flag = "--resume"
		}
		return []string{shell, "-l", "-c", "exec claude " + flag + " " + req.ClaudeSessionID}, nil
	}
	return nil, fmt.Errorf("unknown pane kind %q", req.Kind)
}

func claudeConversationExists(id string) bool {
	home, err := os.UserHomeDir()
	if err != nil {
		return false
	}
	matches, _ := filepath.Glob(filepath.Join(home, ".claude", "projects", "*", id+".jsonl"))
	return len(matches) > 0
}

func terminalEnv() []string {
	env := slices.DeleteFunc(os.Environ(), func(kv string) bool {
		for _, drop := range []string{"TERM=", "COLORTERM=", "CLAUDECODE=", "CLAUDE_CODE_ENTRYPOINT="} {
			if strings.HasPrefix(kv, drop) {
				return true
			}
		}
		return false
	})
	env = append(env, "TERM=xterm-256color", "COLORTERM=truecolor")
	if os.Getenv("LANG") == "" {
		env = append(env, "LANG=en_US.UTF-8")
	}
	return env
}

func clampSize(n, fallback int) uint16 {
	if n <= 0 || n > 1000 {
		return uint16(fallback)
	}
	return uint16(n)
}
