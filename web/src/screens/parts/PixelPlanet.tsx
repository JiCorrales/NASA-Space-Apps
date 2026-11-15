import type { ReactElement } from "react";

/**
 * A planet drawn as pixel art from SVG rectangles. No image files.
 * The look is picked from the world id; unknown ids get a plain grey disc.
 */

interface PlanetLook {
  base: string;
  shade: string;
  detail: string;
  /** Returns true where a detail pixel goes (continents, bands, craters). */
  pattern: (x: number, y: number, size: number) => boolean;
  ring?: string;
}

const hash = (x: number, y: number): number => {
  const n = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
  return n - Math.floor(n);
};

const LOOKS: Record<string, PlanetLook> = {
  earth: {
    base: "#2d6fd0",
    shade: "#1b3f86",
    detail: "#3fa34d",
    pattern: (x, y, s) => {
      const u = x / s;
      const v = y / s;
      return (
        (u > 0.2 && u < 0.45 && v > 0.2 && v < 0.55 && hash(x, y) > 0.25) ||
        (u > 0.55 && u < 0.8 && v > 0.45 && v < 0.8 && hash(x + 3, y) > 0.3) ||
        (v < 0.12 || v > 0.9)
      );
    },
  },
  moon: {
    base: "#a7a9b4",
    shade: "#5f6272",
    detail: "#7d8090",
    pattern: (x, y) => hash(x, y) > 0.82,
  },
  mars: {
    base: "#c8553d",
    shade: "#7a2a1d",
    detail: "#e08a5a",
    pattern: (x, y, s) => y / s < 0.12 || hash(x * 2, y) > 0.8,
  },
  venus: {
    base: "#d9b26f",
    shade: "#8a6a35",
    detail: "#f1d39a",
    pattern: (_x, y) => y % 4 === 0,
  },
  jupiter: {
    base: "#c99a6b",
    shade: "#7c5636",
    detail: "#e7d1b0",
    pattern: (_x, y) => y % 5 < 2,
  },
  saturn: {
    base: "#d8c07a",
    shade: "#8c773d",
    detail: "#efe0a8",
    pattern: (_x, y) => y % 6 < 2,
    ring: "#b7a46a",
  },
};

const FALLBACK: PlanetLook = {
  base: "#7a7f8f",
  shade: "#454957",
  detail: "#9a9fae",
  pattern: (x, y) => hash(x, y) > 0.85,
};

export interface PixelPlanetProps {
  world: string;
  /** Side of the drawing in pixel cells. */
  cells?: number;
  /** Rendered size in CSS pixels. */
  size?: number;
  dimmed?: boolean;
}

export function PixelPlanet({ world, cells = 16, size = 96, dimmed = false }: PixelPlanetProps) {
  const look = LOOKS[world.toLowerCase()] ?? FALLBACK;
  const rects: ReactElement[] = [];
  const r = cells / 2;
  for (let y = 0; y < cells; y++) {
    // Merge runs of equal colour on each row to keep the SVG small.
    let runStart = -1;
    let runColour = "";
    const flush = (end: number) => {
      if (runStart >= 0 && runColour) {
        rects.push(
          <rect key={`${y}-${runStart}`} x={runStart} y={y} width={end - runStart} height={1} fill={runColour} />,
        );
      }
    };
    for (let x = 0; x <= cells; x++) {
      let colour = "";
      if (x < cells) {
        const dx = x + 0.5 - r;
        const dy = y + 0.5 - r;
        if (dx * dx + dy * dy <= r * r) {
          // Light comes from the upper left; the lower right edge is in shadow.
          const shadow = dx + dy > r * 0.75;
          colour = shadow ? look.shade : look.pattern(x, y, cells) ? look.detail : look.base;
        }
      }
      if (colour !== runColour) {
        flush(x);
        runStart = x;
        runColour = colour;
      }
    }
  }
  const pad = look.ring ? 3 : 0;
  return (
    <svg
      className="pixel-planet"
      width={size}
      height={size}
      viewBox={`${-pad} ${-pad} ${cells + pad * 2} ${cells + pad * 2}`}
      shapeRendering="crispEdges"
      aria-hidden="true"
      style={{ opacity: dimmed ? 0.6 : 1, filter: dimmed ? "grayscale(0.35)" : undefined }}
    >
      {rects}
      {look.ring && (
        <>
          <rect x={-pad} y={r - 1} width={pad + 1} height={1} fill={look.ring} />
          <rect x={cells - 1} y={r - 1} width={pad + 1} height={1} fill={look.ring} />
        </>
      )}
    </svg>
  );
}
