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
        _psx: {
          bg: "transparent",
          bgImage:
            "linear-gradient(90deg, color-mix(in srgb, {colors.accent} 42%, transparent), transparent 85%)",
          color: "fg",
          textShadow: "0 0 8px {colors.accent}",
          animation: "psxFlicker 5s steps(1) infinite",
        },
        _modern: { color: "fg" },
      },
      false: {},
    },
  },
});
