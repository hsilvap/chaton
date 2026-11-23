import { useLayoutEffect, useState } from "react";

export const themes = ["terminal", "teletext", "modern"] as const;
export type ThemeName = (typeof themes)[number];

const storageKey = "chaton.theme";

const readStored = (): ThemeName => {
  try {
    const stored = localStorage.getItem(storageKey);
    return themes.includes(stored as ThemeName)
      ? (stored as ThemeName)
      : "modern";
  } catch {
    return "modern";
  }
};

export function useTheme() {
  const [theme, setTheme] = useState<ThemeName>(readStored);

  useLayoutEffect(() => {
    document.documentElement.dataset.theme = theme;
    try {
      localStorage.setItem(storageKey, theme);
    } catch {}
  }, [theme]);

  return [theme, setTheme] as const;
}
