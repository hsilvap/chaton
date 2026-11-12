# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

**chaton** ("kitty" in French) is a desktop harness for running and managing coding-agent sessions, in the spirit of herdr. It starts as an orchestrator: it runs existing agent CLIs (Claude Code first) in pseudo-terminals and renders them in a desktop UI, without calling LLMs itself. Later it grows its own agent (see Roadmap).

It's also a **learning project**. The owner is experienced in TypeScript and is learning Go and harness/tooling internals. Prefer small, understandable steps over big drops of code. Explain the non-obvious parts (PTYs, goroutines and channels, Wails bindings) in chat, not in code comments, and avoid opaque abstractions or libraries that hide the core mechanics.

## Code style

- **Keep comments to a minimum.** Write one only when it's explicitly necessary, e.g. enum values that need a description, or a workaround that would look wrong without one. No narrating comments, and no doc comments that restate the name.

### Roadmap

- **Phase 1 (current):** better management of Claude Code instances. Spawn sessions in PTYs, render them, switch between them, and detect each session's state (working / idle / needs input).
- **Phase 2+:** an OpenCode-style built-in agent: chaton runs its own agent loop (model calls, tool use, context) against custom endpoints and providers, alongside the managed Claude Code sessions. Phase 1 code shouldn't assume every session is an external CLI in a PTY. Keep the session abstraction open to an in-process agent.

## Stack

- **Go + Wails v3** (`github.com/wailsapp/wails/v3`) for the backend and native window
- **React + TypeScript + Vite + Chakra UI v3** in `frontend/`
- Planned: `creack/pty` for spawning agents, xterm.js for rendering terminals

## Commands

```
wails3 dev        # run with hot reload (Go + Vite)
wails3 build      # production build → bin/chaton (macOS also gets a .app)
go build ./...    # compile Go only (needs frontend/dist to exist, because of go:embed)
go test ./...     # Go tests; single test: go test ./internal/<pkg> -run TestName
cd frontend && npx tsc --noEmit   # typecheck frontend
```

There's no linter or test suite set up yet.

Wails v3 template names differ from v2. `react` is already React + TS, and there's no `react-ts`. An unknown `-t` value is treated as a remote git URL, which produces a confusing "invalid remote git URL" error.

## Architecture

- `main.go` creates the Wails app and window. The frontend is embedded via `//go:embed all:frontend/dist`, so the frontend must be built before a Go-only build.
- **Go ↔ frontend:**
  - Go structs registered in `application.Options.Services` get their exported methods exposed to the frontend.
  - `wails3 generate bindings` (run automatically by `wails3 dev` and `wails3 build`) writes typed TS wrappers into `frontend/bindings/<module path>/`. That folder is generated and gitignored, so don't edit it by hand.
  - For streaming data such as PTY output, use events: `app.Event.Emit(...)` in Go and `Events.On(...)` from `@wailsio/runtime` in TS. Register event payload types with `application.RegisterEvent[T]("name")` to get typed bindings.
- **Build orchestration** is done with Task:
  - The root `Taskfile.yml` dispatches to `build/<os>/Taskfile.yml` based on `GOOS`, and `build/Taskfile.yml` holds the shared tasks (frontend install and build, bindings, icons).
  - App metadata lives in `build/config.yml`. `wails3 task common:update:build-assets` regenerates the plists and manifests from it, overwriting any manual edits.
  - The mobile, Docker and server-mode targets were deliberately removed. Only darwin, linux and windows remain.
- Planned Go layout: `internal/` packages for PTY spawning, session management and state detection.

## UI direction

- **The default look is terminal / tiling-WM, Omarchy-style.** Monospace everywhere, flat (no shadows or gradients), thin borders, gaps between panes, pane titles sitting in the top border (lazygit / btop style), and the focused pane gets the accent border. **Not** Win95/classic-desktop retro, which was tried and rejected. There's also a switchable **modern** theme.
- **The palette is a placeholder** (neutral `ink` grays plus one `signal` accent). The owner will design chaton's own palette, so don't copy an existing theme like Tokyo Night or Catppuccin.
- **Styling is Chakra UI v3**, via the system in `frontend/src/theme/`. Use style props, tokens and recipes, not CSS files.
  - Every semantic token is declared with `themed(terminal, modern)`. Chakra's defaults are `_light`/`_dark` pairs that beat a plain `base`, which is why that helper exists.
  - `<html data-theme="modern">` switches theme, using the custom `_modern` condition. `<html class="dark">` stays on so Chakra's built-in components render dark.
  - Semantic tokens reuse Chakra's names (`bg`, `bg.panel`, `fg`, `fg.muted`, `border`) plus our own (`border.active`, `accent`, `terminal.*`), so Chakra components match the theme automatically.
  - Reusable, app-agnostic components live in `frontend/src/ds/` and are imported from `"../ds"`. App-specific components go in `frontend/src/components/`. Their styles are either a `chakra("el", {...})` style config (simple, no slots) or a slot recipe in `theme/recipes/` wired up with `createSlotRecipeContext` (multi-part with variants, like `Panel`, the base primitive for any bordered pane, with variant `surface: panel | terminal`).
- **We'll have our own design system. Do NOT use shadcn/ui** or anything that produces the generic shadcn look. Chakra UI v3 is acceptable if a component library is needed, but prefer our own components.
