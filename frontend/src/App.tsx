import { useEffect, useState } from "react";
import { Box, Flex } from "@chakra-ui/react";
import { Sidebar } from "./components/Sidebar";
import { Settings } from "./components/Settings";
import { NewSessionModal } from "./components/NewSessionModal";
import { Panel } from "./ds";
import type { Session } from "./types";
import { mockSessions } from "./mocks";
import { tildify } from "./paths";

const borderTextRoom = "calc({spacing.gap} + 0.5lh)";

function App() {
  const [collapsed, setCollapsed] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [newSessionOpen, setNewSessionOpen] = useState(false);
  const [sessions, setSessions] = useState<Session[]>(mockSessions);
  const [activeId, setActiveId] = useState<string | null>(
    mockSessions[0]?.id ?? null,
  );

  const active = sessions.find((s) => s.id === activeId) ?? null;

  useEffect(() => {
    if (!settingsOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSettingsOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [settingsOpen]);

  const recentDirs = [...new Set(sessions.map((s) => s.dir))];

  const createSession = (dir: string) => {
    const session: Session = { id: crypto.randomUUID(), dir };
    setSessions((prev) => [...prev, session]);
    setActiveId(session.id);
  };

  const closeSession = (id: string) => {
    const index = sessions.findIndex((s) => s.id === id);
    const remaining = sessions.filter((s) => s.id !== id);
    setSessions(remaining);
    if (id === activeId) {
      const next = remaining[Math.min(index, remaining.length - 1)];
      setActiveId(next?.id ?? null);
    }
  };

  const layout = {
    h: "full",
    gap: "gap",
    py: borderTextRoom,
    px: "gap",
  } as const;

  return (
    <>
      {/* hidden, not unmounted: terminals must survive opening settings */}
      <Flex {...layout} display={settingsOpen ? "none" : "flex"}>
        <Sidebar
          collapsed={collapsed}
          onToggle={() => setCollapsed((c) => !c)}
          sessions={sessions}
          activeId={activeId}
          onSelect={setActiveId}
          onClose={closeSession}
          onNewSession={() => setNewSessionOpen(true)}
          onOpenSettings={() => setSettingsOpen(true)}
        />

        <Flex as="main" flex="1" minW={0}>
          <Panel
            title={active ? tildify(active.dir) : "terminal"}
            surface="terminal"
            flex="1"
          >
            <Box h="full" tabIndex={0} outline="none">
              <Box as="span" color="accent">
                ❯
              </Box>{" "}
              <Box as="span" animation="blink 1s steps(1) infinite">
                █
              </Box>
            </Box>
          </Panel>
        </Flex>
      </Flex>

      <NewSessionModal
        open={newSessionOpen}
        onClose={() => setNewSessionOpen(false)}
        recentDirs={recentDirs}
        onCreate={createSession}
      />

      {settingsOpen && (
        <Flex {...layout}>
          <Settings onClose={() => setSettingsOpen(false)} />
        </Flex>
      )}
    </>
  );
}

export default App;
