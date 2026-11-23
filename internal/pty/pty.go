//go:build !windows

package pty

import (
	"bufio"
	"bytes"
	"errors"
	"fmt"
	"os"
	"os/exec"
	"strings"
	"sync"
	"syscall"
	"time"

	"github.com/creack/pty"
)

var ErrNotRunning = errors.New("pane has no running process")

type Spec struct {
	Args []string
	Dir  string
	Env  []string
	Cols uint16
	Rows uint16
}

type proc struct {
	cmd  *exec.Cmd
	tty  *os.File
	done chan struct{}
}

type Manager struct {
	mu       sync.Mutex
	procs    map[string]*proc
	onOutput func(id string, data []byte)
	onExit   func(id string, code int)
}

func NewManager(onOutput func(id string, data []byte), onExit func(id string, code int)) *Manager {
	return &Manager{procs: map[string]*proc{}, onOutput: onOutput, onExit: onExit}
}

// Start is a no-op (apart from resizing) when the pane already has a process.
func (m *Manager) Start(id string, spec Spec) (started bool, err error) {
	m.mu.Lock()
	defer m.mu.Unlock()

	size := &pty.Winsize{Cols: spec.Cols, Rows: spec.Rows}
	if p, ok := m.procs[id]; ok {
		return false, pty.Setsize(p.tty, size)
	}

	cmd := exec.Command(spec.Args[0], spec.Args[1:]...)
	cmd.Dir = spec.Dir
	cmd.Env = spec.Env
	tty, err := pty.StartWithSize(cmd, size)
	if err != nil {
		return false, err
	}

	p := &proc{cmd: cmd, tty: tty, done: make(chan struct{})}
	m.procs[id] = p
	go m.pump(id, p)
	return true, nil
}

const (
	flushDelay = 5 * time.Millisecond
	flushSize  = 64 * 1024
)

func (m *Manager) pump(id string, p *proc) {
	chunks := make(chan []byte, 64)
	go func() {
		buf := make([]byte, 32*1024)
		for {
			n, err := p.tty.Read(buf)
			if n > 0 {
				chunks <- bytes.Clone(buf[:n])
			}
			if err != nil {
				close(chunks)
				return
			}
		}
	}()

	// Coalesce bursts of small reads into one event, so a redrawing TUI doesn't flood the webview.
	var pending []byte
	var tick <-chan time.Time
	flush := func() {
		if len(pending) > 0 {
			m.onOutput(id, pending)
			pending = nil
		}
		tick = nil
	}
	for open := true; open; {
		select {
		case chunk, ok := <-chunks:
			if !ok {
				open = false
				break
			}
			pending = append(pending, chunk...)
			if len(pending) >= flushSize {
				flush()
			} else if tick == nil {
				tick = time.After(flushDelay)
			}
		case <-tick:
			flush()
		}
	}
	flush()

	code := 0
	if err := p.cmd.Wait(); err != nil {
		var exitErr *exec.ExitError
		code = -1
		if errors.As(err, &exitErr) {
			code = exitErr.ExitCode()
		}
	}
	p.tty.Close()

	m.mu.Lock()
	if m.procs[id] == p {
		delete(m.procs, id)
	}
	m.mu.Unlock()

	close(p.done)
	m.onExit(id, code)
}

func (m *Manager) get(id string) (*proc, error) {
	m.mu.Lock()
	defer m.mu.Unlock()
	p, ok := m.procs[id]
	if !ok {
		return nil, ErrNotRunning
	}
	return p, nil
}

func (m *Manager) Running(id string) bool {
	_, err := m.get(id)
	return err == nil
}

func (m *Manager) Write(id string, data []byte) error {
	p, err := m.get(id)
	if err != nil {
		return err
	}
	_, err = p.tty.Write(data)
	return err
}

func (m *Manager) Resize(id string, cols, rows uint16) error {
	p, err := m.get(id)
	if err != nil {
		return err
	}
	return pty.Setsize(p.tty, &pty.Winsize{Cols: cols, Rows: rows})
}

// Kill hangs up the process group, like closing a terminal window, and escalates to SIGKILL if it lingers.
func (m *Manager) Kill(id string) {
	p, err := m.get(id)
	if err != nil {
		return
	}
	pgid := -p.cmd.Process.Pid
	syscall.Kill(pgid, syscall.SIGHUP)
	select {
	case <-p.done:
	case <-time.After(2 * time.Second):
		syscall.Kill(pgid, syscall.SIGKILL)
		<-p.done
	}
}

func (m *Manager) KillAll() {
	m.mu.Lock()
	ids := make([]string, 0, len(m.procs))
	for id := range m.procs {
		ids = append(ids, id)
	}
	m.mu.Unlock()

	var wg sync.WaitGroup
	for _, id := range ids {
		wg.Go(func() { m.Kill(id) })
	}
	wg.Wait()
}

// Children lists the names of the processes the pane's process has started, e.g. ["npm"] for a busy shell.
func (m *Manager) Children(id string) ([]string, error) {
	p, err := m.get(id)
	if err != nil {
		return nil, err
	}
	out, err := exec.Command("pgrep", "-lP", fmt.Sprint(p.cmd.Process.Pid)).Output()
	var exitErr *exec.ExitError
	if errors.As(err, &exitErr) && exitErr.ExitCode() == 1 {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	var names []string
	sc := bufio.NewScanner(bytes.NewReader(out))
	for sc.Scan() {
		if _, name, ok := strings.Cut(sc.Text(), " "); ok {
			names = append(names, name)
		}
	}
	return names, nil
}
