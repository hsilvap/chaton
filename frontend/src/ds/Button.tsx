import { chakra } from "@chakra-ui/react";

export const Button = chakra("button", {
  base: {
    px: "3",
    py: "1.5",
    fontFamily: "mono",
    lineHeight: "1",
    whiteSpace: "nowrap",
    cursor: "pointer",
    borderWidth: "1px",
    borderStyle: "solid",
    borderRadius: "pane",
    outline: "none",
    _disabled: { opacity: 0.4, cursor: "not-allowed" },
  },
  variants: {
    variant: {
      solid: {
        bg: "accent",
        color: "accent.fg",
        borderColor: "accent",
        _hover: { filter: "brightness(1.1)" },
        _focusVisible: { outline: "1px solid {colors.fg}", outlineOffset: "1px" },
      },
      ghost: {
        bg: "transparent",
        color: "fg",
        borderColor: "border",
        _hover: { borderColor: "fg.muted" },
        _focusVisible: { borderColor: "border.active" },
      },
    },
  },
  defaultVariants: { variant: "ghost" },
});
