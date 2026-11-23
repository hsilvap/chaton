//go:build !windows

package pty

import (
	"os"
	"slices"
	"strings"
	"sync"
	"testing"
	"time"
)

type recorder struct {
	mu   sync.Mutex
	out  strings.Builder
	exit chan int
}

func newManager() (*Manager, *recorder) {
	r := &recorder{exit: make(chan int, 1)}
	m := NewManager(
		func(_ string, data []byte) {
			r.mu.Lock()
			r.out.Write(data)
			r.mu.Unlock()
		},
		func(_ string, code int) { r.exit <- code },
	)
	return m, r
}

func (r *recorder) output() string {
	r.mu.Lock()
	defer r.mu.Unlock()
	return r.out.String()
}

func waitFor(t *testing.T, cond func() bool) {
	t.Helper()
	deadline := time.Now().Add(5 * time.Second)
	for !cond() {
		if time.Now().After(deadline) {
			t.Fatal("timed out")
		}
		time.Sleep(20 * time.Millisecond)
	}
}

func spec(script string) Spec {
	return Spec{Args: []string{"/bin/sh", "-c", script}, Dir: os.TempDir(), Env: os.Environ(), Cols: 80, Rows: 24}
}

func TestEchoInputAndExit(t *testing.T) {
	m, r := newManager()
	started, err := m.Start("p1", spec(`printf 'ready\n'; read x; printf "got %s\n" "$x"; exit 3`))
	if err != nil || !started {
		t.Fatalf("start: %v %v", started, err)
	}
	if again, _ := m.Start("p1", spec("true")); again {
		t.Fatal("second Start should not spawn")
	}
	waitFor(t, func() bool { return strings.Contains(r.output(), "ready") })

	if err := m.Resize("p1", 120, 40); err != nil {
		t.Fatal(err)
	}
	if err := m.Write("p1", []byte("hello\n")); err != nil {
		t.Fatal(err)
	}
	select {
	case code := <-r.exit:
		if code != 3 {
			t.Errorf("exit code %d, want 3", code)
		}
	case <-time.After(5 * time.Second):
		t.Fatal("process didn't exit")
	}
	if !strings.Contains(r.output(), "got hello") {
		t.Errorf("output %q", r.output())
	}
	if m.Running("p1") {
		t.Error("still marked running after exit")
	}
}

func TestOutputIsBatched(t *testing.T) {
	var mu sync.Mutex
	events, total := 0, 0
	exit := make(chan int, 1)
	m := NewManager(
		func(_ string, data []byte) {
			mu.Lock()
			events++
			total += strings.Count(string(data), "x")
			mu.Unlock()
		},
		func(_ string, code int) { exit <- code },
	)
	if _, err := m.Start("p1", spec(`i=0; while [ $i -lt 2000 ]; do printf x; i=$((i+1)); done`)); err != nil {
		t.Fatal(err)
	}
	<-exit
	mu.Lock()
	defer mu.Unlock()
	t.Logf("2000 writes -> %d events", events)
	if total != 2000 {
		t.Errorf("got %d x's, want 2000", total)
	}
	if events > 200 {
		t.Errorf("%d events for 2000 tiny writes, batching isn't working", events)
	}
}

func TestChildrenAndKill(t *testing.T) {
	m, r := newManager()
	if _, err := m.Start("p1", spec("sleep 30 & wait")); err != nil {
		t.Fatal(err)
	}
	waitFor(t, func() bool {
		kids, _ := m.Children("p1")
		return slices.Contains(kids, "sleep")
	})

	start := time.Now()
	m.Kill("p1")
	if time.Since(start) > 3*time.Second {
		t.Error("kill took too long")
	}
	<-r.exit
	if m.Running("p1") {
		t.Error("still running after Kill")
	}
	if _, err := m.Children("p1"); err != ErrNotRunning {
		t.Errorf("Children after kill: %v", err)
	}
}
