import { chakra } from "@chakra-ui/react";

export const BorderButton = chakra("button", {
  base: {
    color: "fg.muted",
    cursor: "pointer",
    lineHeight: "1",
    _hover: { color: "accent" },
    _focusVisible: { color: "accent", outline: "none" },
    _teletext: {
      color: "inherit",
      _hover: { bg: "fg", color: "bg" },
      _focusVisible: { bg: "fg", color: "bg" },
    },
  },
});
