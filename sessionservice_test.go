package main

import (
	"os"
	"path/filepath"
	"strings"
	"testing"
)

func TestResolveDirectory(t *testing.T) {
	s := &SessionService{}
	home, _ := os.UserHomeDir()
	tmp := t.TempDir()
	file := filepath.Join(tmp, "file.txt")
	os.WriteFile(file, []byte("x"), 0o644)

	tests := []struct {
		name    string
		in      string
		want    string
		wantErr string
	}{
		{"absolute dir", tmp, tmp, ""},
		{"tilde", "~", home, ""},
		{"trailing slash and spaces", "  " + tmp + "/  ", tmp, ""},
		{"empty", "", "", "enter a directory"},
		{"relative", "some/dir", "", "absolute path"},
		{"missing", filepath.Join(tmp, "nope"), "", "doesn't exist"},
		{"file", file, "", "not a directory"},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got, err := s.ResolveDirectory(tt.in)
			if tt.wantErr != "" {
				if err == nil || !strings.Contains(err.Error(), tt.wantErr) {
					t.Fatalf("want error containing %q, got %v", tt.wantErr, err)
				}
				return
			}
			if err != nil {
				t.Fatalf("unexpected error: %v", err)
			}
			if got != tt.want {
				t.Fatalf("got %q, want %q", got, tt.want)
			}
		})
	}
}
