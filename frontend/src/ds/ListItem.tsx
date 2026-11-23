import { chakra } from "@chakra-ui/react";

export const ListItem = chakra("button", {
  base: {
    display: "block",
    w: "full",
    textAlign: "left",
    px: "2",
    py: "1",
    cursor: "pointer",
    whiteSpace: "pre",
    color: "fg",
    _hover: { bg: "bg.muted" },
    _focusVisible: { bg: "bg.muted", outline: "none" },
    _modern: { borderRadius: "md" },
  },
  variants: {
    active: {
      true: {
        bg: "bg.muted",
        color: "accent",
        _teletext: {
          bg: "accent",
          color: "accent.fg",
          "--chakra-colors-fg-muted": "{colors.accent.fg}",
          _hover: { bg: "accent" },
        },
        _modern: { color: "fg" },
      },
      false: {},
    },
  },
});
