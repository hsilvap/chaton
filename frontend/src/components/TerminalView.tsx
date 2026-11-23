import { useEffect, useRef } from "react";
import { Box } from "@chakra-ui/react";
import { Terminal } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import "@xterm/xterm/css/xterm.css";
import { Events } from "@wailsio/runtime";
import { TerminalService } from "../../bindings/github.com/hsilvap/chaton";
import type { Pane } from "../layout";
import { errorMessage } from "../errors";
import { cmdChordSequence } from "../keys";

type TerminalViewProps = {
  pane: Pane;
  path: string;
  focused: boolean;
};

function decode(base64: string) {
  const raw = atob(base64);
  const bytes = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) bytes[i] = raw.charCodeAt(i);
  return bytes;
}


function themeFromTokens() {
  const css = getComputedStyle(document.documentElement);
  const token = (name: string) => css.getPropertyValue(name).trim();
  return {
    fontFamily: token("--chakra-fonts-mono") || "monospace",
    theme: {
      background: token("--chakra-colors-terminal-bg"),
      foreground: token("--chakra-colors-terminal-fg"),
      cursor: token("--chakra-colors-accent"),
      selectionBackground: token("--chakra-colors-border-active"),
    },
  };
}

export function TerminalView({ pane, path, focused }: TerminalViewProps) {
  const el = useRef<HTMLDivElement>(null);
  const term = useRef<Terminal | null>(null);

  useEffect(() => {
    const host = el.current!;
    const { fontFamily, theme } = themeFromTokens();
    const xterm = new Terminal({
      fontFamily,
      theme,
      fontSize: 13,
      cursorBlink: true,
      scrollback: 5000,
      macOptionIsMeta: true,
    });
    const fit = new FitAddon();
    xterm.loadAddon(fit);
    xterm.open(host);
    term.current = xterm;

    const fitIfVisible = () => {
      if (host.offsetWidth > 0 && host.offsetHeight > 0) fit.fit();
    };
    fitIfVisible();

    let exited = false;
    const start = () =>
      TerminalService.Start({
        paneId: pane.id,
        path,
        kind: pane.kind,
        claudeSessionId: pane.claude_session_id ?? "",
        cols: xterm.cols,
        rows: xterm.rows,
      }).catch((err) =>
        xterm.write(`\r\n\x1b[31m${errorMessage(err)}\x1b[0m\r\n`),
      );

    const offOutput = Events.On("pty:output", (ev) => {
      if (ev.data.paneId === pane.id && ev.data.data) {
        xterm.write(decode(ev.data.data));
      }
    });
    const offExit = Events.On("pty:exit", (ev) => {
      if (ev.data.paneId !== pane.id) return;
      exited = true;
      xterm.write(
        `\r\n\x1b[2m[exited (code ${ev.data.code}), press enter to restart]\x1b[0m\r\n`,
      );
    });

    xterm.attachCustomKeyEventHandler((e) => {
      const seq = cmdChordSequence(e);
      if (seq === null) return true;
      if (e.type === "keydown" && !exited) {
        e.preventDefault();
        TerminalService.Write(pane.id, seq).catch(() => {});
      }
      return false;
    });

    const input = xterm.onData((data) => {
      if (exited) {
        if (data === "\r") {
          exited = false;
          xterm.reset();
          start();
        }
        return;
      }
      TerminalService.Write(pane.id, data).catch(() => {});
    });
    const resized = xterm.onResize(({ cols, rows }) => {
      TerminalService.Resize(pane.id, cols, rows).catch(() => {});
    });

    let frame = 0;
    const sizeWatcher = new ResizeObserver(() => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(fitIfVisible);
    });
    sizeWatcher.observe(host);

    const themeWatcher = new MutationObserver(() => {
      const next = themeFromTokens();
      xterm.options.fontFamily = next.fontFamily;
      xterm.options.theme = next.theme;
      fitIfVisible();
    });
    themeWatcher.observe(document.documentElement, {
      attributeFilter: ["data-theme"],
    });

    start();

    return () => {
      cancelAnimationFrame(frame);
      sizeWatcher.disconnect();
      themeWatcher.disconnect();
      offOutput();
      offExit();
      input.dispose();
      resized.dispose();
      xterm.dispose();
      term.current = null;
    };
    // the process outlives re-renders; only a different pane means a different terminal
  }, [pane.id]);

  useEffect(() => {
    if (focused) term.current?.focus();
  }, [focused]);

  return <Box ref={el} h="full" w="full" overflow="hidden" />;
}
