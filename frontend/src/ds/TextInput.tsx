import { chakra } from "@chakra-ui/react";

export const TextInput = chakra("input", {
  base: {
    w: "full",
    px: "2",
    py: "1.5",
    bg: "bg",
    color: "fg",
    fontFamily: "mono",
    borderWidth: "1px",
    borderStyle: "solid",
    borderColor: "border",
    borderRadius: "pane",
    outline: "none",
    _placeholder: { color: "fg.muted" },
    _focus: { borderColor: "border.active" },
  },
  variants: {
    invalid: {
      true: { borderColor: "red.500", _focus: { borderColor: "red.500" } },
      false: {},
    },
  },
});
