import { useCallback, useEffect, useRef, useState } from "react";
import { Box, Flex, Text } from "@chakra-ui/react";
import {
  SessionService,
  SettingsService,
  TerminalService,
  UserService,
} from "../bindings/github.com/hsilvap/chaton";
import { Sidebar } from "./components/Sidebar";
import { Settings } from "./components/Settings";
import { NewSessionModal } from "./components/NewSessionModal";
import { Onboarding } from "./components/Onboarding";
import { kindLabel, SessionPanes } from "./components/SessionPanes";
import { ConfirmModal } from "./components/ConfirmModal";
import { Panel } from "./ds";
import type { Session } from "./types";
import { openPanes, type Layout, type Pane, type PaneKind } from "./layout";
import { errorMessage } from "./errors";
import { homePage, sessionPage, settingsPage } from "./pages";
import { themes, useTheme, type ThemeName } from "./theme/useTheme";
import { TeletextHeader } from "./components/TeletextHeader";

type Boot = "loading" | "onboarding" | "ready";

type Confirm = {
  title: string;
  lines: string[];
  resolve: (ok: boolean) => void;
};

// Runs DB writes one after another, so a later save can't land before an earlier one.
function useSerialQueue() {
  const tail = useRef<Promise<unknown>>(Promise.resolve());
  return useCallback(<T,>(fn: () => Promise<T>): Promise<T> => {
    const run = tail.current.then(fn);
    tail.current = run.catch(() => {});
    return run;
  }, []);
}

function App() {
  const [theme, setTheme] = useTheme();
  const [boot, setBoot] = useState<Boot>("loading");
  const [error, setError] = useState<string | null>(null);
  const [collapsed, setCollapsed] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [newSessionOpen, setNewSessionOpen] = useState(false);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<Confirm | null>(null);
  const enqueue = useSerialQueue();

  const report = useCallback((err: unknown) => {
    console.error(err);
    setError(errorMessage(err));
  }, []);
  const save = (fn: () => Promise<unknown>) => enqueue(fn).catch(report);

  const load = useCallback(async () => {
    const [settings, list] = await Promise.all([
      SettingsService.Get(),
      SessionService.List(),
    ]);
    if (themes.includes(settings.theme as ThemeName)) {
      setTheme(settings.theme as ThemeName);
    }
    const open = list ?? [];
    setSessions(open);
    setActiveId((open.find((s) => s.active) ?? open[0])?.id ?? null);
    setBoot("ready");
  }, [setTheme]);

  useEffect(() => {
    UserService.Current()
      .then((user) => (user ? load() : setBoot("onboarding")))
      .catch(report);
  }, [load, report]);

  const activeIndex = sessions.findIndex((s) => s.id === activeId);
  const page = settingsOpen
    ? settingsPage
    : activeIndex >= 0
      ? sessionPage(activeIndex)
      : homePage;

  useEffect(() => {
    if (!settingsOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSettingsOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [settingsOpen]);

  const finishOnboarding = async () => {
    await enqueue(() => SettingsService.SetTheme(theme));
    await load();
  };

  const changeTheme = (t: ThemeName) => {
    setTheme(t);
    save(() => SettingsService.SetTheme(t));
  };

  const createSession = async (path: string, kind: PaneKind) => {
    const session = await enqueue(() => SessionService.Create(path, kind));
    setSessions((prev) => [...prev, session]);
    setActiveId(session.id);
  };

  const selectSession = (id: string) => {
    if (id === activeId) return;
    setActiveId(id);
    save(() => SessionService.Activate(id));
  };

  const ask = (title: string, lines: string[]) =>
    new Promise<boolean>((resolve) => setConfirm({ title, lines, resolve }));

  const confirmStop = async (panes: Pane[], title: string) => {
    const ids = panes.map((p) => p.id);
    const busy = (await TerminalService.Busy(ids)) ?? [];
    if (busy.length > 0) {
      const lines = busy.map((b) => {
        const pane = panes.find((p) => p.id === b.paneId);
        const what = (b.what ?? []).join(", ");
        return pane && kindLabel[pane.kind] !== what
          ? `${kindLabel[pane.kind]}: ${what}`
          : what;
      });
      if (!(await ask(title, lines))) return false;
    }
    TerminalService.Kill(ids).catch(report);
    return true;
  };

  const closeSession = async (id: string) => {
    const session = sessions.find((s) => s.id === id);
    if (!session) return;
    const panes = openPanes(session.layout).map((p) => p.pane);
    if (!(await confirmStop(panes, "close session?"))) return;

    const index = sessions.findIndex((s) => s.id === id);
    const remaining = sessions.filter((s) => s.id !== id);
    setSessions(remaining);
    const next =
      id === activeId ? remaining[Math.min(index, remaining.length - 1)] : null;
    if (id === activeId) setActiveId(next?.id ?? null);
    save(async () => {
      await SessionService.Close(id);
      if (next) await SessionService.Activate(next.id);
    });
  };

  const changeLayout = (id: string, layout: Layout, persist: boolean) => {
    setSessions((prev) =>
      prev.map((s) => (s.id === id ? { ...s, layout } : s)),
    );
    if (persist) save(() => SessionService.UpdateLayout(id, layout));
  };

  const frame = {
    flex: "1",
    minH: 0,
    gap: "gap",
    py: "frame",
    px: "gap",
  } as const;

  const errorBar = error && (
    <Text
      as="button"
      onClick={() => setError(null)}
      color="red.400"
      fontSize="xs"
      px="gap"
      pb="1"
      textAlign="left"
      title="dismiss"
    >
      ! {error} ×
    </Text>
  );

  if (boot !== "ready") {
    return (
      <Flex direction="column" h="full">
        {boot === "onboarding" && <Onboarding onDone={() => finishOnboarding().catch(report)} />}
        {errorBar}
      </Flex>
    );
  }

  return (
    <Flex direction="column" h="full">
      {theme === "teletext" && <TeletextHeader page={page} />}

      {/* hidden, not unmounted: terminals must survive opening settings */}
      <Flex {...frame} display={settingsOpen ? "none" : "flex"}>
        <Sidebar
          collapsed={collapsed}
          onToggle={() => setCollapsed((c) => !c)}
          sessions={sessions}
          activeId={activeId}
          onSelect={selectSession}
          onClose={(id) => closeSession(id).catch(report)}
          onNewSession={() => setNewSessionOpen(true)}
          onOpenSettings={() => setSettingsOpen(true)}
        />

        <Flex as="main" flex="1" minW={0}>
          {sessions.length === 0 && (
            <Panel title="terminal" surface="terminal" flex="1">
              <Box color="fg.muted">~ no open sessions, hit + to start one</Box>
            </Panel>
          )}
          {sessions.map((s) => (
            <Flex
              key={s.id}
              flex="1"
              minW={0}
              display={s.id === activeId ? "flex" : "none"}
            >
              <SessionPanes
                path={s.path}
                layout={s.layout}
                visible={s.id === activeId && !settingsOpen}
                confirmStop={confirmStop}
                onChange={(layout, persist) =>
                  changeLayout(s.id, layout, persist)
                }
                onCloseSession={() => closeSession(s.id).catch(report)}
              />
            </Flex>
          ))}
        </Flex>
      </Flex>

      {errorBar}

      <NewSessionModal
        open={newSessionOpen}
        onClose={() => setNewSessionOpen(false)}
        onCreate={createSession}
      />

      {confirm && (
        <ConfirmModal
          title={confirm.title}
          lines={confirm.lines}
          confirmLabel="stop & close"
          onAnswer={(ok) => {
            confirm.resolve(ok);
            setConfirm(null);
          }}
        />
      )}

      {settingsOpen && (
        <Flex {...frame}>
          <Settings
            onClose={() => setSettingsOpen(false)}
            theme={theme}
            onThemeChange={changeTheme}
          />
        </Flex>
      )}
    </Flex>
  );
}

export default App;
