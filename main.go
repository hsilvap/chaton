package main

import (
	"context"
	"embed"
	"log"

	"github.com/hsilvap/chaton/internal/store"

	"github.com/wailsapp/wails/v3/pkg/application"
)

//go:embed all:frontend/dist
var assets embed.FS

func main() {
	dbPath, err := store.DefaultPath()
	if err != nil {
		log.Fatal(err)
	}
	st, err := store.Open(context.Background(), dbPath)
	if err != nil {
		log.Fatal(err)
	}
	defer st.Close()

	app := application.New(application.Options{
		Name:        "chaton",
		Description: "A desktop harness for coding agents",
		// Services: Go structs whose exported methods the frontend can call.
		Services: []application.Service{
			application.NewService(&UserService{store: st}),
			application.NewService(&SettingsService{store: st}),
			application.NewService(&SessionService{store: st}),
			application.NewService(NewTerminalService()),
		},
		Assets: application.AssetOptions{
			Handler: application.AssetFileServerFS(assets),
		},
		Mac: application.MacOptions{
			ApplicationShouldTerminateAfterLastWindowClosed: true,
		},
	})

	app.Window.NewWithOptions(application.WebviewWindowOptions{
		Title:  "chaton",
		Width:  1200,
		Height: 800,
		URL:    "/",
	})

	if err := app.Run(); err != nil {
		log.Fatal(err)
	}
}
