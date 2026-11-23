import { Fragment, useRef } from "react";
import { Flex, Text } from "@chakra-ui/react";
import { BorderButton, Panel, ResizeHandle, Tooltip } from "../ds";
import {
  canSplit,
  closePane,
  splitAxis,
  type SplitDirection,
  focusPane,
  openPanes,
  PaneKind,
  resize,
  Split,
  splitPane,
  type Layout,
  type Pane,
} from "../layout";
import { tildify } from "../paths";
import { TerminalView } from "./TerminalView";

type SessionPanesProps = {
  layout: Layout;
  path: string;
  visible: boolean;
  onChange: (layout: Layout, persist: boolean) => void;
  onCloseSession: () => void;
  confirmStop: (panes: Pane[], title: string) => Promise<boolean>;
};

export const kindLabel: Record<PaneKind, string> = {
  [PaneKind.$zero]: "",
  [PaneKind.PaneClaude]: "claude",
  [PaneKind.PaneShell]: "shell",
};

const splitButtons: { dir: SplitDirection; icon: string }[] = [
  { dir: "left", icon: "⇤" },
  { dir: "right", icon: "⇥" },
  { dir: "up", icon: "⤒" },
  { dir: "down", icon: "⤓" },
];

export function SessionPanes({
  layout,
  path,
  visible,
  onChange,
  onCloseSession,
  confirmStop,
}: SessionPanesProps) {
  const panes = openPanes(layout);
  const horizontal = layout.split !== Split.SplitVertical;
  const drag = useRef<{ start: number[]; sizes: number[] } | null>(null);

  const split = (index: number, dir: SplitDirection) =>
    onChange(splitPane(layout, index, dir), true);

  const close = async (pane: Pane, index: number) => {
    if (panes.length === 1) return onCloseSession();
    if (await confirmStop([pane], "close pane?")) {
      onChange(closePane(layout, index), true);
    }
  };

  const focus = (index: number) => {
    const next = focusPane(layout, index);
    if (next !== layout) onChange(next, true);
  };

  return (
    <Flex flex="1" minW={0} minH={0} direction="column">
      <Text
        color="fg.muted"
        fontFamily="mono"
        fontSize="xs"
        px="1"
        pb="frame"
        mt="calc(-1 * {spacing.titleRoom})"
        truncate
        title={path}
      >
        {tildify(path)}
      </Text>
      <Flex
        flex="1"
        minW={0}
        minH={0}
        direction={horizontal ? "row" : "column"}
      >
        {panes.map(({ pane, index, size }, k) => (
          <Fragment key={pane.id}>
            {k > 0 && (
              <ResizeHandle
                direction={horizontal ? "horizontal" : "vertical"}
                thickness={horizontal ? "gap" : "frame"}
                onResizeStart={() => {
                  const start = panes.map((p) => p.size);
                  drag.current = { start, sizes: start };
                }}
                onResize={(fraction) => {
                  if (!drag.current) return;
                  const sizes = resize(drag.current.start, k - 1, fraction);
                  drag.current.sizes = sizes;
                  onChange({ ...layout, sizes }, false);
                }}
                onResizeEnd={() => {
                  if (!drag.current) return;
                  const { sizes } = drag.current;
                  drag.current = null;
                  onChange({ ...layout, sizes }, true);
                }}
              />
            )}
            <Panel
              title={kindLabel[pane.kind]}
              surface="terminal"
              flex={`${size} 1 0`}
              minW={0}
              minH={0}
              onFocus={() => focus(index)}
              onPointerDown={() => focus(index)}
              bodyProps={{ p: "1", overflow: "hidden" }}
              actions={
                <>
                  {splitButtons.map(({ dir, icon }) => (
                    <Tooltip key={dir} content={`split ${dir}`}>
                      <BorderButton
                        onClick={() => split(index, dir)}
                        disabled={!canSplit(layout, splitAxis(dir))}
                        aria-label={`Split ${dir}`}
                        _disabled={{ opacity: 0.3, cursor: "not-allowed" }}
                      >
                        {icon}
                      </BorderButton>
                    </Tooltip>
                  ))}
                  <BorderButton
                    onClick={() => close(pane, index)}
                    aria-label={
                      panes.length === 1 ? "Close session" : "Close pane"
                    }
                  >
                    ×
                  </BorderButton>
                </>
              }
            >
              <TerminalView
                pane={pane}
                path={path}
                focused={visible && pane.active}
              />
            </Panel>
          </Fragment>
        ))}
      </Flex>
    </Flex>
  );
}
