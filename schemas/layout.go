package schemas

import (
	"encoding/json"
	"errors"
	"fmt"

	"github.com/google/uuid"
)

type Split string

const (
	SplitHorizontal Split = "horizontal"
	SplitVertical   Split = "vertical"
)

type PaneKind string

const (
	PaneClaude PaneKind = "claude"
	PaneShell  PaneKind = "shell"
)

type Pane struct {
	ID              string   `json:"id"`
	Kind            PaneKind `json:"kind"`
	ClaudeSessionID string   `json:"claude_session_id,omitempty"`
	CreatedAt       int64    `json:"created_at"`
	ClosedAt        *int64   `json:"closed_at,omitempty"`
	Active          bool     `json:"active"`
}

func NewPane(kind PaneKind, now int64) Pane {
	p := Pane{ID: newID(), Kind: kind, CreatedAt: now}
	if kind == PaneClaude {
		p.ClaudeSessionID = uuid.NewString()
	}
	return p
}

func newID() string { return uuid.Must(uuid.NewV7()).String() }

// Sizes line up with the open panes only; closed panes are kept for history.
type Layout struct {
	Path  string    `json:"path"`
	Split Split     `json:"split"`
	Sizes []float64 `json:"sizes"`
	Panes []Pane    `json:"panes"`
}

func NewLayout(path string, kind PaneKind, now int64) Layout {
	l := Layout{
		Path:  path,
		Split: SplitHorizontal,
		Sizes: []float64{100},
		Panes: []Pane{NewPane(kind, now)},
	}
	l.Panes[0].Active = true
	return l
}

// Upgrade fills in what older layout versions lack; it reports whether anything changed.
func (l *Layout) Upgrade() bool {
	changed := false
	for i := range l.Panes {
		p := &l.Panes[i]
		if p.ID == "" {
			p.ID = newID()
			changed = true
		}
		if p.Kind == PaneClaude && p.ClaudeSessionID == "" {
			p.ClaudeSessionID = uuid.NewString()
			changed = true
		}
	}
	return changed
}

// Marshal validates against the JSON schema plus the rules the schema can't express.
func (l Layout) Marshal() ([]byte, error) {
	open, active := 0, 0
	for _, p := range l.Panes {
		if p.ClosedAt == nil {
			open++
			if p.Active {
				active++
			}
		}
	}
	if len(l.Sizes) != open {
		return nil, fmt.Errorf("layout has %d sizes for %d open panes", len(l.Sizes), open)
	}
	if active > 1 {
		return nil, errors.New("layout has more than one active pane")
	}
	if l.Sizes == nil {
		l.Sizes = []float64{}
	}
	if l.Panes == nil {
		l.Panes = []Pane{}
	}
	raw, err := json.Marshal(l)
	if err != nil {
		return nil, err
	}
	if err := ValidateLayout(raw); err != nil {
		return nil, err
	}
	return raw, nil
}

func ParseLayout(raw string) (Layout, error) {
	var l Layout
	err := json.Unmarshal([]byte(raw), &l)
	return l, err
}
