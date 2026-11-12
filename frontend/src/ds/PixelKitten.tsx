import { chakra } from "@chakra-ui/react";

// d outline · f fur · s stripe · p ear/nose pink · e eye · h eye glint · w muzzle
const ART = [
  ".d........d.",
  "dfd......dfd",
  "dpfd....dfpd",
  "dfffddddfffd",
  "dffsfssfsffd",
  "dffffffffffd",
  "dfeeffffeefd",
  "dfehffffehfd",
  "dffffppffffd",
  "dwwwwddwwwwd",
  ".dwwwwwwwwd.",
  "..dddddddd..",
];

const COATS = [
  { f: "#e0913f", s: "#b5662a", w: "#f3e3cc" },
  { f: "#9a9aa3", s: "#6c6c76", w: "#e4e4e7" },
  { f: "#34343c", s: "#34343c", w: "#e4e4e7" },
  { f: "#e8d6b5", s: "#c4a77a", w: "#faf3e6" },
  { f: "#d9d9de", s: "#b3b3bb", w: "#f7f7f9" },
  { f: "#7a5136", s: "#55372a", w: "#d8c3a8" },
];

const EYES = ["#8bc34a", "#e0a84f", "#6fa8dc", "#c9a0dc"];

const FIXED = { d: "#0c0c0d", p: "#e89aa8", h: "#ffffff" };

function hash(seed: string) {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

type PixelKittenProps = {
  seed: string;
  size?: number;
};

export function PixelKitten({ seed, size = 24 }: PixelKittenProps) {
  const h = hash(seed);
  const coat = COATS[h % COATS.length];
  const colors: Record<string, string> = {
    ...FIXED,
    ...coat,
    e: EYES[(h >>> 8) % EYES.length],
  };

  return (
    <chakra.svg
      viewBox="0 0 12 12"
      width={`${size}px`}
      height={`${size}px`}
      flexShrink={0}
      shapeRendering="crispEdges"
      aria-hidden
    >
      {ART.flatMap((row, y) =>
        [...row].map((c, x) =>
          c === "." ? null : (
            <rect
              key={`${x}-${y}`}
              x={x}
              y={y}
              width={1}
              height={1}
              fill={colors[c]}
            />
          ),
        ),
      )}
    </chakra.svg>
  );
}
