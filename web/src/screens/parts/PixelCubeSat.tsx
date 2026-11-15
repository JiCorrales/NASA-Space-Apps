import type { ReactElement } from "react";

/**
 * The CubeSat of the design screen, drawn as pixel art from SVG rectangles.
 * It only reflects the player's choices; it computes nothing.
 */

export type SatSize = 1 | 3 | 6 | null;
export type SatPanels = "body" | "deployable" | "large" | null;
export type SatAntenna = "whip" | "patch" | null;
export type SatInstrument = "camera" | "multispectral" | "sensor" | null;

export interface PixelCubeSatProps {
  size: SatSize;
  panels: SatPanels;
  antenna: SatAntenna;
  instrument: SatInstrument;
  /** Rendered width in CSS pixels; the height follows. */
  width?: number;
}

const W = 84;
const H = 60;

const C = {
  frame: "#8fa3b8",
  frameDark: "#4b5a6b",
  face: "#1f2a38",
  cell: "#2c4fa8",
  cellLine: "#16285a",
  panelEdge: "#9fb2c6",
  antenna: "#e6e9ee",
  lens: "#0b0f16",
  lensRing: "#7ce7ff",
  ghost: "#3b5266",
};

export function PixelCubeSat({ size, panels, antenna, instrument, width = 420 }: PixelCubeSatProps) {
  const units = size ?? 3;
  const bodyW = units === 6 ? 20 : 10;
  const bodyH = units === 1 ? 10 : 30;
  const x0 = Math.round((W - bodyW) / 2);
  const y0 = Math.round((H - bodyH) / 2) + 2;
  const parts: ReactElement[] = [];
  let k = 0;
  const px = (x: number, y: number, w: number, h: number, fill: string) =>
    parts.push(<rect key={k++} x={x} y={y} width={w} height={h} fill={fill} />);

  // Deployable panels: wings on both sides, joined by a hinge.
  if (panels === "deployable" || panels === "large") {
    const wingW = panels === "large" ? 18 : 12;
    const wingH = Math.max(bodyH - 2, 8);
    const wy = y0 + 1;
    for (const side of [-1, 1]) {
      const wx = side < 0 ? x0 - wingW - 2 : x0 + bodyW + 2;
      px(side < 0 ? x0 - 2 : x0 + bodyW, y0 + Math.floor(bodyH / 2), 2, 1, C.panelEdge);
      px(wx, wy, wingW, wingH, C.panelEdge);
      px(wx + 1, wy + 1, wingW - 2, wingH - 2, C.cell);
      for (let gx = wx + 4; gx < wx + wingW - 1; gx += 4) px(gx, wy + 1, 1, wingH - 2, C.cellLine);
      for (let gy = wy + 4; gy < wy + wingH - 1; gy += 4) px(wx + 1, gy, wingW - 2, 1, C.cellLine);
    }
  }

  // The body: frame, rails at the corners, a face per unit.
  if (size === null) {
    for (let i = 0; i < bodyW; i += 2) {
      px(x0 + i, y0, 1, 1, C.ghost);
      px(x0 + i, y0 + bodyH - 1, 1, 1, C.ghost);
    }
    for (let j = 0; j < bodyH; j += 2) {
      px(x0, y0 + j, 1, 1, C.ghost);
      px(x0 + bodyW - 1, y0 + j, 1, 1, C.ghost);
    }
  } else {
    px(x0, y0, bodyW, bodyH, C.frame);
    px(x0 + 1, y0 + 1, bodyW - 2, bodyH - 2, C.face);
    for (let u = 1; u < bodyH / 10; u++) px(x0 + 1, y0 + u * 10, bodyW - 2, 1, C.frameDark);
    if (bodyW > 10) px(x0 + 10, y0 + 1, 1, bodyH - 2, C.frameDark);
    if (panels === "body") {
      for (let u = 0; u < bodyH / 10; u++) {
        for (let c = 0; c < bodyW / 10; c++) {
          px(x0 + c * 10 + 2, y0 + u * 10 + 2, 7, 7, C.cell);
          px(x0 + c * 10 + 5, y0 + u * 10 + 2, 1, 7, C.cellLine);
        }
      }
    }
  }

  // Antenna on top: whips for UHF, a patch for S-band.
  if (antenna === "whip") {
    px(x0 + 1, y0 - 9, 1, 9, C.antenna);
    px(x0 + bodyW - 2, y0 - 9, 1, 9, C.antenna);
  } else if (antenna === "patch") {
    px(x0 + Math.floor(bodyW / 2) - 3, y0 - 2, 6, 2, C.antenna);
    px(x0 + Math.floor(bodyW / 2) - 2, y0 - 3, 4, 1, C.lensRing);
  }

  // Instrument at the bottom, looking down at Earth.
  if (instrument) {
    const cx = x0 + Math.floor(bodyW / 2);
    const by = y0 + bodyH;
    px(cx - 3, by, 6, 3, C.frameDark);
    px(cx - 2, by + 1, 4, 2, instrument === "sensor" ? C.frame : C.lens);
    if (instrument === "multispectral") {
      px(cx - 2, by + 3, 1, 1, "#ff5d73");
      px(cx - 1, by + 3, 1, 1, "#5dff8a");
      px(cx, by + 3, 1, 1, "#5d9bff");
      px(cx + 1, by + 3, 1, 1, "#ffe45d");
    } else if (instrument === "camera") {
      px(cx - 1, by + 3, 2, 1, C.lensRing);
    }
  }

  return (
    <svg
      className="pixel-cubesat"
      width={width}
      height={Math.round((width * H) / W)}
      viewBox={`0 0 ${W} ${H}`}
      shapeRendering="crispEdges"
      role="img"
      aria-label={describe(size, panels, antenna, instrument)}
    >
      {parts}
    </svg>
  );
}

function describe(size: SatSize, panels: SatPanels, antenna: SatAntenna, instrument: SatInstrument) {
  const bits = [size ? `${size}U CubeSat` : "CubeSat, size not chosen"];
  if (panels === "body") bits.push("body-mounted solar cells");
  if (panels === "deployable") bits.push("deployable solar panels");
  if (panels === "large") bits.push("large deployable solar panels");
  if (antenna === "whip") bits.push("whip antennas");
  if (antenna === "patch") bits.push("patch antenna");
  if (instrument) bits.push(`${instrument} instrument`);
  return bits.join(", ");
}
