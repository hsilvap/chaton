package pty

import "errors"

var ErrNotRunning = errors.New("pane has no running process")

var errUnsupported = errors.New("terminals are not supported on windows yet")

type Spec struct {
	Args []string
	Dir  string
	Env  []string
	Cols uint16
	Rows uint16
}

type Manager struct{}

func NewManager(func(string, []byte), func(string, int)) *Manager { return &Manager{} }

func (m *Manager) Start(string, Spec) (bool, error)    { return false, errUnsupported }
func (m *Manager) Running(string) bool                 { return false }
func (m *Manager) Write(string, []byte) error          { return ErrNotRunning }
func (m *Manager) Resize(string, uint16, uint16) error { return ErrNotRunning }
func (m *Manager) Kill(string)                         {}
func (m *Manager) KillAll()                            {}
func (m *Manager) Children(string) ([]string, error)   { return nil, ErrNotRunning }
