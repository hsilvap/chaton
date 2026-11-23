package schemas

import "testing"

func TestLayoutMarshal(t *testing.T) {
	closed := int64(5)
	tests := []struct {
		name    string
		layout  Layout
		wantErr bool
	}{
		{"new layout", NewLayout("/tmp", PaneClaude, 1), false},
		{"closed pane has no size", Layout{
			Path: "/tmp", Split: SplitVertical, Sizes: []float64{100},
			Panes: []Pane{
				{ID: "a", Kind: PaneClaude, ClaudeSessionID: "9a3f3c3e-5a8c-4c1e-9a43-2f1d7b8f2b11", CreatedAt: 1, ClosedAt: &closed},
				{ID: "b", Kind: PaneShell, CreatedAt: 2, Active: true},
			},
		}, false},
		{"sizes mismatch", Layout{
			Path: "/tmp", Split: SplitVertical, Sizes: []float64{50, 50},
			Panes: []Pane{{ID: "a", Kind: PaneShell, CreatedAt: 1}},
		}, true},
		{"two active panes", Layout{
			Path: "/tmp", Split: SplitVertical, Sizes: []float64{50, 50},
			Panes: []Pane{{ID: "a", Kind: PaneShell, CreatedAt: 1, Active: true}, {ID: "b", Kind: PaneShell, CreatedAt: 2, Active: true}},
		}, true},
		{"bad split", Layout{Path: "/tmp", Split: "diagonal"}, true},
		{"bad kind", Layout{
			Path: "/tmp", Split: SplitVertical, Sizes: []float64{100},
			Panes: []Pane{{ID: "a", Kind: "vim", CreatedAt: 1}},
		}, true},
		{"empty path", Layout{Split: SplitVertical}, true},
		{"missing pane id", Layout{
			Path: "/tmp", Split: SplitVertical, Sizes: []float64{100},
			Panes: []Pane{{Kind: PaneShell, CreatedAt: 1}},
		}, true},
		{"bad claude session id", Layout{
			Path: "/tmp", Split: SplitVertical, Sizes: []float64{100},
			Panes: []Pane{{ID: "a", Kind: PaneClaude, ClaudeSessionID: "nope", CreatedAt: 1}},
		}, true},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			_, err := tt.layout.Marshal()
			if (err != nil) != tt.wantErr {
				t.Errorf("err = %v, wantErr %v", err, tt.wantErr)
			}
		})
	}
}

func TestUpgradeFrom001(t *testing.T) {
	l, err := ParseLayout(`{"path":"/tmp","split":"horizontal","sizes":[50,50],"panes":[{"kind":"claude","created_at":1,"active":true},{"kind":"shell","created_at":2,"active":false}]}`)
	if err != nil {
		t.Fatal(err)
	}
	if _, err := l.Marshal(); err == nil {
		t.Fatal("0-0-1 layout should not pass the 0-0-2 schema before upgrading")
	}
	if !l.Upgrade() {
		t.Fatal("Upgrade reported no change")
	}
	if l.Panes[0].ClaudeSessionID == "" || l.Panes[1].ClaudeSessionID != "" {
		t.Errorf("claude session ids: %+v", l.Panes)
	}
	if _, err := l.Marshal(); err != nil {
		t.Fatalf("upgraded layout invalid: %v", err)
	}
	if l.Upgrade() {
		t.Error("second Upgrade should be a no-op")
	}
}
