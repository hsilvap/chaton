// Cmd chords that stay with the app instead of going to the terminal.
const appChords = new Set(["c", "v", "q", "h", "m"]);

const punctuation: Record<string, string> = {
  BracketLeft: "[",
  BracketRight: "]",
  Slash: "/",
  Backslash: "\\",
  Period: ".",
  Comma: ",",
  Semicolon: ";",
  Quote: "'",
  Minus: "-",
  Equal: "=",
  Backquote: "`",
  Space: " ",
};

const special: Record<string, number> = {
  Enter: 13,
  Tab: 9,
  Backspace: 127,
  Escape: 27,
};

const arrows: Record<string, string> = {
  ArrowUp: "A",
  ArrowDown: "B",
  ArrowRight: "C",
  ArrowLeft: "D",
  Home: "H",
  End: "F",
};

// The unshifted key a physical key produces, e.g. "f" for Cmd+Shift+F, "[" for Cmd+Shift+[.
function baseKey(code: string): string | null {
  if (/^Key[A-Z]$/.test(code)) return code.slice(3).toLowerCase();
  if (/^Digit[0-9]$/.test(code)) return code.slice(5);
  return punctuation[code] ?? null;
}

type Chord = Pick<
  KeyboardEvent,
  "code" | "metaKey" | "shiftKey" | "altKey" | "ctrlKey"
>;

// Encodes a Cmd chord the way Ghostty/kitty do (CSI u with the "super" modifier), which nvim reads as <D-…>.
// Returns null for keys the terminal or the app should handle normally.
export function cmdChordSequence(e: Chord): string | null {
  if (!e.metaKey) return null;
  const mods =
    1 + (e.shiftKey ? 1 : 0) + (e.altKey ? 2 : 0) + (e.ctrlKey ? 4 : 0) + 8;

  const key = baseKey(e.code);
  if (key !== null) {
    if (appChords.has(key) && !e.shiftKey && !e.altKey && !e.ctrlKey) {
      return null;
    }
    return `\x1b[${key.codePointAt(0)};${mods}u`;
  }
  if (e.code in special) return `\x1b[${special[e.code]};${mods}u`;
  if (e.code in arrows) return `\x1b[1;${mods}${arrows[e.code]}`;
  return null;
}
