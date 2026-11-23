package main

import (
	"context"
	"errors"
	"net/mail"
	"strings"

	"github.com/hsilvap/chaton/internal/store"
)

type User struct {
	ID            string `json:"id"`
	PreferredName string `json:"preferredName"`
	Email         string `json:"email"`
}

type UserService struct {
	store *store.Store
}

// Current returns nil until onboarding is done.
func (s *UserService) Current(ctx context.Context) (*User, error) {
	u, err := s.store.User(ctx)
	if errors.Is(err, store.ErrNotFound) {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	return &User{ID: u.ID, PreferredName: u.PreferredName, Email: u.Email}, nil
}

func (s *UserService) Onboard(ctx context.Context, name, email string) (User, error) {
	name, email = strings.TrimSpace(name), strings.TrimSpace(email)
	if name == "" {
		return User{}, errors.New("enter a name")
	}
	if addr, err := mail.ParseAddress(email); err != nil || addr.Address != email {
		return User{}, errors.New("enter a valid email")
	}
	if _, err := s.store.User(ctx); err == nil {
		return User{}, errors.New("already onboarded")
	}
	u, err := s.store.CreateUser(ctx, name, email)
	if err != nil {
		return User{}, err
	}
	return User{ID: u.ID, PreferredName: u.PreferredName, Email: u.Email}, nil
}

func currentUserID(ctx context.Context, st *store.Store) (string, error) {
	u, err := st.User(ctx)
	if errors.Is(err, store.ErrNotFound) {
		return "", errors.New("finish onboarding first")
	}
	return u.ID, err
}
