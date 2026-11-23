package main

import (
	"context"
	"fmt"
	"slices"

	"github.com/hsilvap/chaton/internal/store"
)

var themes = []string{"terminal", "teletext", "modern"}

type Settings struct {
	Theme string `json:"theme"`
}

type SettingsService struct {
	store *store.Store
}

func (s *SettingsService) Get(ctx context.Context) (Settings, error) {
	userID, err := currentUserID(ctx, s.store)
	if err != nil {
		return Settings{}, err
	}
	st, err := s.store.Settings(ctx, userID)
	if err != nil {
		return Settings{}, err
	}
	return Settings{Theme: st.SelectedTheme}, nil
}

func (s *SettingsService) SetTheme(ctx context.Context, theme string) error {
	if !slices.Contains(themes, theme) {
		return fmt.Errorf("unknown theme %q", theme)
	}
	userID, err := currentUserID(ctx, s.store)
	if err != nil {
		return err
	}
	return s.store.SetTheme(ctx, userID, theme)
}
