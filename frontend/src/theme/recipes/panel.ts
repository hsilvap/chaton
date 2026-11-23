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

const inFlowBar: SystemStyleObject = {
  position: "static",
  flexShrink: 0,
  px: "2",
  py: "1.5",
  pointerEvents: "auto",
};

const teletextBar: SystemStyleObject = {
  ...inFlowBar,
  bg: "border",
  color: "fg",
  textTransform: "uppercase",
};

const teletextBarFocused: SystemStyleObject = {
  _teletext: { bg: "accent", color: "accent.fg" },
};

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
      bg: "var(--panel-bg)",
      borderWidth: "pane",
      borderStyle: "solid",
      borderColor: "border",
      borderRadius: "pane",
      _focusWithin: { borderColor: "border.active" },
      _modern: { overflow: "hidden" },
    },
    header: {
      ...borderBar,
      top: borderOffset,
      _teletext: teletextBar,
      _groupFocusWithin: teletextBarFocused,
      _modern: {
        ...inFlowBar,
        py: "2",
        borderBottomWidth: "1px",
        borderColor: "border",
      },
    },
    footer: {
      ...borderBar,
      bottom: borderOffset,
      _teletext: teletextBar,
      _groupFocusWithin: teletextBarFocused,
      _modern: { ...inFlowBar, borderTopWidth: "1px", borderColor: "border" },
    },
    title: {
      bg: "var(--panel-bg)",
      px: "1",
      color: "fg.muted",
      pointerEvents: "auto",
      _groupFocusWithin: {
        color: "accent",
        _teletext: { color: "inherit" },
        _modern: { color: "fg" },
      },
      _teletext: { bg: "transparent", px: "0", color: "inherit" },
      _modern: {
        bg: "transparent",
        px: "0",
        color: "fg",
        fontWeight: "medium",
      },
    },
    actions: {
      bg: "var(--panel-bg)",
      px: "1",
      display: "flex",
      gap: "2",
      pointerEvents: "auto",
      _teletext: { bg: "transparent", px: "0", gap: "3" },
      _modern: { bg: "transparent", px: "0", gap: "3" },
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
