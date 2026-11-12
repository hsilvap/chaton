package main

import (
	"errors"
	"fmt"
	"os"
	"path/filepath"
	"strings"

	"github.com/wailsapp/wails/v3/pkg/application"
)

type SessionService struct{}

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
