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

const chamfer = "10px";

const psxBar: SystemStyleObject = {
  ...inFlowBar,
  py: "2",
  fontFamily: "heading",
  fontSize: "xs",
  textTransform: "uppercase",
  letterSpacing: "0.25em",
  bgImage: "linear-gradient(90deg, {colors.bg.muted}, transparent 85%)",
  borderBottomWidth: "1px",
  borderColor: "border",
};

const psxBarFocused: SystemStyleObject = {
  _psx: {
    bgImage:
      "linear-gradient(90deg, color-mix(in srgb, {colors.accent} 38%, transparent), transparent 80%)",
  },
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
      _psx: {
        overflow: "hidden",
        clipPath: `polygon(${chamfer} 0, 100% 0, 100% calc(100% - ${chamfer}), calc(100% - ${chamfer}) 100%, 0 100%, 0 ${chamfer})`,
        bgImage:
          "repeating-conic-gradient(transparent 0 25%, rgb(255 255 255 / 0.025) 0 50%), linear-gradient(165deg, rgb(255 255 255 / 0.05), transparent 45%)",
        bgSize: "2px 2px, 100% 100%",
        boxShadow:
          "inset 1px 1px 0 rgb(255 255 255 / 0.07), inset -1px -1px 0 rgb(0 0 0 / 0.6)",
      },
    },
    header: {
      ...borderBar,
      top: borderOffset,
      _teletext: teletextBar,
      _psx: psxBar,
      _groupFocusWithin: { ...teletextBarFocused, ...psxBarFocused },
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
      _psx: { ...psxBar, borderBottomWidth: 0, borderTopWidth: "1px" },
      _groupFocusWithin: { ...teletextBarFocused, ...psxBarFocused },
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
        _psx: {
          color: "fg",
          textShadow: "0 0 8px {colors.accent}, 0 0 2px {colors.fg}",
        },
      },
      _teletext: { bg: "transparent", px: "0", color: "inherit" },
      _psx: { bg: "transparent", px: "0", color: "fg.muted" },
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
      _psx: {
        bg: "transparent",
        px: "0",
        gap: "3",
        fontFamily: "body",
        letterSpacing: "0.05em",
      },
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
