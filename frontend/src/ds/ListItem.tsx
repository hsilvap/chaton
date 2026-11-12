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
  },
  variants: {
    active: {
      true: { bg: "bg.muted", color: "accent" },
      false: {},
    },
  },
});
