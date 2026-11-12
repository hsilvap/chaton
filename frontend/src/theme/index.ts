import { createSystem, defaultConfig, defineConfig } from "@chakra-ui/react";
import { panelRecipe } from "./recipes/panel";

/*
 * chaton's design system, built on Chakra v3.
 *
 * Layers:
 *   tokens         → raw values (the palette). PLACEHOLDER: neutral grays plus one
 *                    accent until the real chaton palette exists. Swap them here.
 *   semanticTokens → what components use (bg, fg, border, accent...), each
 *                    declared with themed(terminalValue, modernValue).
 *   recipes        → styled components (see ./recipes).
 *
 * Theme switch: <html data-theme="modern"> activates every `_modern` value.
 * Absent or "terminal" uses the terminal values.
 */

/**
 * A themed value: `terminal` is the default, `modern` applies under
 * data-theme="modern". Chakra's defaults are written as _light/_dark pairs,
 * which beat a plain `base`, so we set all of them.
 */
const themed = (terminal: string, modern: string = terminal) => ({
  value: { base: terminal, _light: terminal, _dark: terminal, _modern: modern },
});

const config = defineConfig({
  conditions: {
    // Matches when <html> itself has the attribute (that's where the CSS vars live)
    // or when any ancestor has it.
    modern: "&[data-theme=modern], [data-theme=modern] &",
  },

  globalCss: {
    "html, body, #root": { height: "100%", margin: 0 },
    body: {
      bg: "bg",
      color: "fg",
      fontFamily: "body",
      fontSize: "sm",
      overflow: "hidden", // the app is the window; nothing scrolls the page
    },
  },

  theme: {
    tokens: {
      colors: {
        ink: {
          950: { value: "#0c0c0d" },
          900: { value: "#121214" },
          850: { value: "#17171a" },
          800: { value: "#1d1d21" },
          700: { value: "#2a2a30" },
          500: { value: "#5c5c66" },
          300: { value: "#a1a1aa" },
          100: { value: "#e4e4e7" },
        },
        signal: { value: "#e0a84f" }, // placeholder accent
      },
      fonts: {
        terminal: {
          value:
            '"CaskaydiaMono Nerd Font", "JetBrainsMono Nerd Font", "JetBrains Mono", "SF Mono", Menlo, monospace',
        },
        system: { value: 'system-ui, -apple-system, "Segoe UI", sans-serif' },
      },
    },

    // Chakra's own components read bg / fg / border too, so overriding those
    // names (instead of inventing new ones) makes them match our theme for free.
    semanticTokens: {
      colors: {
        bg: {
          DEFAULT: themed("{colors.ink.950}", "{colors.ink.900}"), // behind panes
          panel: themed("{colors.ink.900}", "{colors.ink.850}"), // pane surface
          muted: themed("{colors.ink.800}", "{colors.ink.800}"), // hover/selected
        },
        fg: {
          DEFAULT: themed("{colors.ink.100}"),
          muted: themed("{colors.ink.500}", "{colors.ink.300}"),
        },
        border: {
          DEFAULT: themed("{colors.ink.700}"),
          active: themed("{colors.signal}", "{colors.ink.500}"),
        },
        accent: {
          DEFAULT: themed("{colors.signal}"),
          fg: themed("{colors.ink.950}"),
        },
        terminal: {
          bg: themed("{colors.ink.900}", "{colors.ink.950}"),
          fg: themed("{colors.ink.100}"),
        },
      },
      fonts: {
        body: themed("{fonts.terminal}", "{fonts.system}"),
        heading: themed("{fonts.terminal}", "{fonts.system}"),
        mono: themed("{fonts.terminal}"),
      },
      radii: {
        pane: themed("0", "8px"),
      },
      borderWidths: {
        pane: themed("2px", "1px"),
      },
      spacing: {
        gap: themed("6px"), // between panes, tiling-WM style
      },
    },

    keyframes: {
      blink: { "50%": { opacity: 0 } },
    },

    slotRecipes: {
      panel: panelRecipe,
    },
  },
});

export const system = createSystem(defaultConfig, config);
