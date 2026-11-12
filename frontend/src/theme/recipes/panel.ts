import { defineSlotRecipe, type SystemStyleObject } from "@chakra-ui/react";

const borderBar: SystemStyleObject = {
  position: "absolute",
  insetInline: "2",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  lineHeight: "1",
  pointerEvents: "none",
};

const borderOffset = "calc(-0.5lh - {borderWidths.pane} / 2)";

export const panelRecipe = defineSlotRecipe({
  className: "panel",
  slots: ["root", "header", "footer", "title", "actions", "body"],
  base: {
    root: {
      position: "relative",
      display: "flex",
      flexDirection: "column",
      minW: 0,
      minH: 0,
      // title/actions paint this over the border line to "cut" it
      bg: "var(--panel-bg)",
      borderWidth: "pane",
      borderStyle: "solid",
      borderColor: "border",
      borderRadius: "pane",
      _focusWithin: { borderColor: "border.active" },
    },
    header: { ...borderBar, top: borderOffset },
    footer: { ...borderBar, bottom: borderOffset },
    title: {
      bg: "var(--panel-bg)",
      px: "1",
      color: "fg.muted",
      pointerEvents: "auto",
      _groupFocusWithin: { color: "accent" },
    },
    actions: {
      bg: "var(--panel-bg)",
      px: "1",
      display: "flex",
      gap: "2",
      pointerEvents: "auto",
    },
    body: {
      flex: 1,
      minH: 0,
      overflow: "auto",
      p: "2",
    },
  },
  variants: {
    surface: {
      panel: {
        root: { "--panel-bg": "{colors.bg.panel}" },
      },
      terminal: {
        root: {
          "--panel-bg": "{colors.terminal.bg}",
          color: "terminal.fg",
          fontFamily: "mono",
        },
      },
    },
  },
  defaultVariants: { surface: "panel" },
});
