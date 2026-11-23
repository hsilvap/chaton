import {
  PaneKind,
  Split,
  type Layout,
  type Pane,
} from "../bindings/github.com/hsilvap/chaton/schemas";

export { PaneKind, Split };
export type { Layout, Pane };

export type OpenPane = { pane: Pane; index: number; size: number };

const MIN_SIZE = 5;

const panesOf = (layout: Layout) => layout.panes ?? [];
const sizesOf = (layout: Layout) => layout.sizes ?? [];

export function openPanes(layout: Layout): OpenPane[] {
  const sizes = sizesOf(layout);
  return panesOf(layout)
    .map((pane, index) => ({ pane, index }))
    .filter(({ pane }) => pane.closed_at == null)
    .map((p, k) => ({ ...p, size: sizes[k] ?? MIN_SIZE }));
}

export function canSplit(layout: Layout, split: Split) {
  return openPanes(layout).length < 2 || layout.split === split;
}

export type SplitDirection = "left" | "right" | "up" | "down";

export const splitAxis = (dir: SplitDirection) =>
  dir === "left" || dir === "right" ? Split.SplitHorizontal : Split.SplitVertical;

export function splitPane(
  layout: Layout,
  index: number,
  dir: SplitDirection,
): Layout {
  const k = openPanes(layout).findIndex((p) => p.index === index);
  const sizes = [...sizesOf(layout)];
  const half = sizes[k] / 2;
  sizes.splice(k, 1, half, half);

  const before = dir === "left" || dir === "up";
  const panes = panesOf(layout).map((p) => ({ ...p, active: false }));
  panes.splice(before ? index : index + 1, 0, {
    id: crypto.randomUUID(),
    kind: PaneKind.PaneShell,
    created_at: Date.now(),
    active: true,
  });
  return { ...layout, split: splitAxis(dir), sizes, panes };
}

// Gives the closed pane's space and focus to its neighbour (the one before it, if any).
export function closePane(layout: Layout, index: number): Layout {
  const open = openPanes(layout);
  const k = open.findIndex((p) => p.index === index);
  const neighbour = k > 0 ? k - 1 : k + 1;
  const sizes = [...sizesOf(layout)];
  sizes[neighbour] += sizes[k];
  sizes.splice(k, 1);

  const wasActive = open[k].pane.active;
  const panes = panesOf(layout).map((p, i) => {
    if (i === index) return { ...p, closed_at: Date.now(), active: false };
    if (wasActive && i === open[neighbour].index) return { ...p, active: true };
    return p;
  });
  return { ...layout, sizes, panes };
}

export function focusPane(layout: Layout, index: number): Layout {
  const panes = panesOf(layout);
  if (panes[index]?.active) return layout;
  return {
    ...layout,
    panes: panes.map((p, i) =>
      p.closed_at == null ? { ...p, active: i === index } : p,
    ),
  };
}

// fraction: how far the handle between open panes k and k+1 moved, relative to their combined size.
export function resize(start: number[], k: number, fraction: number): number[] {
  const pair = start[k] + start[k + 1];
  const min = Math.min(MIN_SIZE, pair / 2);
  const a = Math.min(pair - min, Math.max(min, start[k] + fraction * pair));
  const sizes = [...start];
  sizes[k] = a;
  sizes[k + 1] = pair - a;
  return sizes;
}
