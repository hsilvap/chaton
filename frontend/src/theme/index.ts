import { createSystem, defaultConfig, defineConfig } from "@chakra-ui/react";
import { panelRecipe } from "./recipes/panel";

type Variants = { teletext?: string; modern?: string };

// Chakra's defaults are _light/_dark pairs that beat a plain `base`, so every condition is set.
const themed = (terminal: string, { teletext, modern }: Variants = {}) => ({
  value: {
    base: terminal,
    _light: terminal,
    _dark: terminal,
    _teletext: teletext ?? terminal,
    _modern: modern ?? terminal,
  },
});

const config = defineConfig({
  conditions: {
    teletext: "&[data-theme=teletext], [data-theme=teletext] &",
    modern: "&[data-theme=modern], [data-theme=modern] &",
  },

  globalCss: {
    "html, body, #root": { height: "100%", margin: 0 },
    body: {
      bg: "bg",
      color: "fg",
      fontFamily: "body",
      fontSize: "sm",
      overflow: "hidden",
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
        azure: { value: "#4f9dff" },
        tele: {
          black: { value: "#000000" },
          red: { value: "#ff4d4d" },
          green: { value: "#a6f04a" },
          yellow: { value: "#f2f25c" },
          blue: { value: "#4b3cf0" },
          magenta: { value: "#f05cf0" },
          cyan: { value: "#6ee6f0" },
          white: { value: "#f2f2f2" },
        },
      },
      fonts: {
        terminal: {
          value:
            '"CaskaydiaMono Nerd Font", "JetBrainsMono Nerd Font", "JetBrains Mono", "SF Mono", Menlo, monospace',
        },
        system: { value: 'system-ui, -apple-system, "Segoe UI", sans-serif' },
        teletext: { value: 'Bedstead, "SF Mono", Menlo, monospace' },
      },
    },

    semanticTokens: {
      colors: {
        bg: {
          DEFAULT: themed("{colors.ink.950}", {
            teletext: "{colors.tele.black}",
            modern: "{colors.ink.900}",
          }),
          panel: themed("{colors.ink.900}", {
            teletext: "{colors.tele.black}",
            modern: "{colors.ink.850}",
          }),
          muted: themed("{colors.ink.800}", {
            teletext: "{colors.tele.blue}",
          }),
        },
        fg: {
          DEFAULT: themed("{colors.ink.100}", {
            teletext: "{colors.tele.white}",
          }),
          muted: themed("{colors.ink.500}", {
            teletext: "{colors.tele.cyan}",
            modern: "{colors.ink.300}",
          }),
        },
        border: {
          DEFAULT: themed("{colors.ink.700}", {
            teletext: "{colors.tele.blue}",
          }),
          active: themed("{colors.azure}", {
            teletext: "{colors.tele.green}",
            modern: "{colors.ink.500}",
          }),
        },
        accent: {
          DEFAULT: themed("{colors.azure}", {
            teletext: "{colors.tele.green}",
          }),
          fg: themed("{colors.ink.950}", { teletext: "{colors.tele.black}" }),
        },
        terminal: {
          bg: themed("{colors.ink.900}", {
            teletext: "{colors.tele.black}",
            modern: "{colors.ink.950}",
          }),
          fg: themed("{colors.ink.100}", { teletext: "{colors.tele.white}" }),
        },
      },
      fonts: {
        body: themed("{fonts.terminal}", {
          teletext: "{fonts.teletext}",
          modern: "{fonts.system}",
        }),
        heading: themed("{fonts.terminal}", {
          teletext: "{fonts.teletext}",
          modern: "{fonts.system}",
        }),
        mono: themed("{fonts.terminal}"),
      },
      radii: {
        pane: themed("0", { modern: "8px" }),
      },
      borderWidths: {
        pane: themed("2px", { teletext: "0", modern: "1px" }),
      },
      spacing: {
        gap: themed("6px", { teletext: "8px", modern: "8px" }),
        titleRoom: themed("0.5lh", { teletext: "0px", modern: "0px" }),
        frame: themed("calc({spacing.gap} + {spacing.titleRoom})"),
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
