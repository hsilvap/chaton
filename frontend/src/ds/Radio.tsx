import type { ReactNode } from "react";
import { chakra } from "@chakra-ui/react";

const Label = chakra("label", {
  base: {
    display: "flex",
    alignItems: "center",
    gap: "2",
    px: "2",
    py: "1",
    cursor: "pointer",
    color: "fg",
    whiteSpace: "pre",
    _hover: { bg: "bg.muted" },
    _focusWithin: { bg: "bg.muted" },
    _modern: { borderRadius: "md" },
    "&:has(input:checked)": {
      color: "accent",
      _teletext: {
        bg: "accent",
        color: "accent.fg",
        "--chakra-colors-fg-muted": "{colors.accent.fg}",
      },
      _modern: { color: "fg" },
    },
  },
});

const HiddenInput = chakra("input", {
  base: {
    position: "absolute",
    opacity: 0,
    w: "1px",
    h: "1px",
    pointerEvents: "none",
  },
});

type RadioProps = {
  name: string;
  value: string;
  checked: boolean;
  onChange: (value: string) => void;
  children: ReactNode;
};

export function Radio({ name, value, checked, onChange, children }: RadioProps) {
  return (
    <Label>
      <HiddenInput
        type="radio"
        name={name}
        value={value}
        checked={checked}
        onChange={() => onChange(value)}
      />
      <span aria-hidden>{checked ? "●" : "○"}</span>
      {children}
    </Label>
  );
}
