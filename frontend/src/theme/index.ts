import { createSystem, defaultConfig, defineConfig } from "@chakra-ui/react";
import { panelRecipe } from "./recipes/panel";

type Variants = { teletext?: string; modern?: string; psx?: string };

// Chakra's defaults are _light/_dark pairs that beat a plain `base`, so every condition is set.
const themed = (
  terminal: string,
  { teletext, modern, psx }: Variants = {},
) => ({
  value: {
    base: terminal,
    _light: terminal,
    _dark: terminal,
    _teletext: teletext ?? terminal,
    _modern: modern ?? terminal,
    _psx: psx ?? terminal,
  },
});

const config = defineConfig({
  conditions: {
    teletext: "&[data-theme=teletext], [data-theme=teletext] &",
    modern: "&[data-theme=modern], [data-theme=modern] &",
    psx: "&[data-theme=psx], [data-theme=psx] &",
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
    "[data-theme=psx] body::before": {
      content: '""',
      position: "fixed",
      inset: "-15%",
      zIndex: -1,
      pointerEvents: "none",
      backgroundImage: [
        "repeating-linear-gradient(0deg, rgb(82 88 242 / 0.75) 0 9px, rgb(47 47 150 / 0.35) 9px 13px, transparent 13px 22px)",
        "radial-gradient(ellipse 90% 60% at 50% 110%, rgb(82 88 242 / 0.35), transparent 70%)",
      ].join(", "),
      maskImage: "linear-gradient(to top, black 15%, transparent 70%)",
      filter: "blur(1.5px)",
      animation: "psxFog 30s ease-in-out infinite alternate",
    },
    "[data-theme=psx] body::after": {
      content: '""',
      position: "fixed",
      inset: "-100px",
      zIndex: 9999,
      pointerEvents: "none",
      opacity: 0.09,
      backgroundImage: `repeating-linear-gradient(0deg, rgb(0 0 0 / 0.9) 0 1px, transparent 1px 3px), url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='180' height='180'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
      animation: "psxGrain 0.5s steps(1) infinite",
    },
    "[data-theme=psx] body::before, [data-theme=psx] body::after, [data-theme=psx] *":
      { _motionReduce: { animation: "none !important" } },
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
        psx: {
          void: { value: "#0b0c09" },
          ash: { value: "rgb(11 11 16 / 0.82)" },
          indigo: { value: "#1d1c55" },
          band: { value: "#2f2f96" },
          lavender: { value: "#9593d6" },
          white: { value: "#f2f0fa" },
          violet: { value: "#5258f2" },
          tube: { value: "#09090d" },
        },
      },
      fonts: {
        terminal: {
          value:
            '"CaskaydiaMono Nerd Font", "JetBrainsMono Nerd Font", "JetBrains Mono", "SF Mono", Menlo, monospace',
        },
        system: { value: 'system-ui, -apple-system, "Segoe UI", sans-serif' },
        teletext: { value: 'Bedstead, "SF Mono", Menlo, monospace' },
        psxSerif: { value: '"Times New Roman", Times, Georgia, serif' },
        psxSans: { value: '"Helvetica Neue", Arial, sans-serif' },
      },
    },

    semanticTokens: {
      colors: {
        bg: {
          DEFAULT: themed("{colors.ink.950}", {
            teletext: "{colors.tele.black}",
            modern: "{colors.ink.900}",
            psx: "{colors.psx.void}",
          }),
          panel: themed("{colors.ink.900}", {
            teletext: "{colors.tele.black}",
            modern: "{colors.ink.850}",
            psx: "{colors.psx.ash}",
          }),
          muted: themed("{colors.ink.800}", {
            teletext: "{colors.tele.blue}",
            psx: "{colors.psx.indigo}",
          }),
        },
        fg: {
          DEFAULT: themed("{colors.ink.100}", {
            teletext: "{colors.tele.white}",
            psx: "{colors.psx.white}",
          }),
          muted: themed("{colors.ink.500}", {
            teletext: "{colors.tele.cyan}",
            modern: "{colors.ink.300}",
            psx: "{colors.psx.lavender}",
          }),
        },
        border: {
          DEFAULT: themed("{colors.ink.700}", {
            teletext: "{colors.tele.blue}",
            psx: "{colors.psx.band}",
          }),
          active: themed("{colors.azure}", {
            teletext: "{colors.tele.green}",
            modern: "{colors.ink.500}",
            psx: "{colors.psx.violet}",
          }),
        },
        accent: {
          DEFAULT: themed("{colors.azure}", {
            teletext: "{colors.tele.green}",
            psx: "{colors.psx.violet}",
          }),
          fg: themed("{colors.ink.950}", {
            teletext: "{colors.tele.black}",
            psx: "{colors.psx.white}",
          }),
        },
        terminal: {
          bg: themed("{colors.ink.900}", {
            teletext: "{colors.tele.black}",
            modern: "{colors.ink.950}",
            psx: "{colors.psx.tube}",
          }),
          fg: themed("{colors.ink.100}", {
            teletext: "{colors.tele.white}",
            psx: "{colors.psx.white}",
          }),
        },
      },
      fonts: {
        body: themed("{fonts.terminal}", {
          teletext: "{fonts.teletext}",
          modern: "{fonts.system}",
          psx: "{fonts.psxSans}",
        }),
        heading: themed("{fonts.terminal}", {
          teletext: "{fonts.teletext}",
          modern: "{fonts.system}",
          psx: "{fonts.psxSerif}",
        }),
        mono: themed("{fonts.terminal}"),
      },
      radii: {
        pane: themed("0", { modern: "8px" }),
      },
      borderWidths: {
        pane: themed("2px", { teletext: "0", modern: "1px", psx: "1px" }),
      },
      spacing: {
        gap: themed("6px", { teletext: "8px", modern: "8px", psx: "10px" }),
        titleRoom: themed("0.5lh", {
          teletext: "0px",
          modern: "0px",
          psx: "0px",
        }),
        frame: themed("calc({spacing.gap} + {spacing.titleRoom})"),
      },
    },

    keyframes: {
      blink: { "50%": { opacity: 0 } },
      psxFog: {
        from: { transform: "translate3d(0, 0, 0)" },
        to: { transform: "translate3d(0, -44px, 0)" },
      },
      psxGrain: {
        "0%": { transform: "translate(0, 0)" },
        "25%": { transform: "translate(-37px, 21px)" },
        "50%": { transform: "translate(18px, -44px)" },
        "75%": { transform: "translate(-12px, 33px)" },
      },
      psxFlicker: {
        "0%, 100%": { opacity: 1 },
        "92%": { opacity: 0.82 },
        "94%": { opacity: 1 },
        "96%": { opacity: 0.9 },
      },
    },

    slotRecipes: {
      panel: panelRecipe,
    },
  },
});

export const system = createSystem(defaultConfig, config);
