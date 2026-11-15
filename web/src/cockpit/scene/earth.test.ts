import { describe, expect, it } from "vitest";
import {
  DEEP, EARTH_DEPTH, EARTH_PERIOD, EARTH_TARGET_D, FOREST, SEA_ICE, SHALLOW, bandPixels, classAt, isLand, paintBand, project,
  regionKey, regionPlaces,
} from "./earth";
import { EARTH_BANDS } from "./earthData";
import { SAT, SAT_BODY, SAT_SIZE, cubeSatBitmap, cubeSatFrames, getPx } from "./sprites";
import { CockpitScene, IDLE_SCENE, SAT_X, clearOfStruts, stationLabelX } from "./drawScene";
import { sceneInputFromFrame } from "../status";

const water = (c: number | null) => c === DEEP || c === SHALLOW;

describe("Earth bands (baked from NASA Blue Marble)", () => {
  it("decodes every band to its full size with only palette classes", () => {
    for (const region of ["costaRica", "amazon", "arctic"] as const) {
      const px = bandPixels(region);
      expect(px).toHaveLength(EARTH_PERIOD * EARTH_DEPTH);
      expect(Math.max(...px)).toBeLessThanOrEqual(7);
      expect(paintBand(region).length).toBeGreaterThan(px.length);
    }
  });

  it("known ocean points are ocean and known land points are land", () => {
    expect(water(classAt("costaRica", 5, -95))).toBe(true); // Pacific, west of Costa Rica
    expect(water(classAt("costaRica", 15, -78))).toBe(true); // Caribbean Sea
    expect(isLand(classAt("costaRica", 15, -87)!)).toBe(true); // Honduras
    expect(isLand(classAt("costaRica", 6, -73)!)).toBe(true); // Colombia
    expect(classAt("amazon", -6, -64)).toBe(FOREST); // Amazon basin
    expect(water(classAt("amazon", 5, -40))).toBe(true); // Atlantic, off Brazil
    expect(water(classAt("amazon", -8, -90))).toBe(true); // Pacific, off Peru
    expect(isLand(classAt("arctic", 75, -40)!)).toBe(true); // Greenland ice sheet
    expect(water(classAt("arctic", 73, 5))).toBe(true); // Norwegian Sea
    expect(classAt("arctic", 86, 0)).toBe(SEA_ICE); // pack ice (illustrative edge)
  });

  it("puts each region's target at the middle of its band, on the right kind of surface", () => {
    for (const region of ["costaRica", "amazon", "arctic"] as const) {
      const { target, station } = regionPlaces(region);
      expect(Math.abs(target.col - EARTH_PERIOD / 2)).toBeLessThanOrEqual(1);
      expect(target.row).toBe(EARTH_TARGET_D);
      const [lat, lon] = EARTH_BANDS[region].target;
      expect(region === "arctic" ? classAt(region, lat, lon) === SEA_ICE : isLand(classAt(region, lat, lon)!)).toBe(true);
      // The ground station stands on land, clear of the target marker.
      const [slat, slon] = EARTH_BANDS[region].station;
      expect(isLand(classAt(region, slat, slon)!)).toBe(true);
      expect(Math.abs(station.col - target.col)).toBeGreaterThan(50);
    }
    // Real places: Costa Rica 10 N 84 W, the Amazon near Manaus, the Arctic target north of 80 N.
    expect(EARTH_BANDS.costaRica.target[0]).toBeCloseTo(10, 0);
    expect(EARTH_BANDS.amazon.target[1]).toBeCloseTo(-62, 0);
    expect(EARTH_BANDS.arctic.target[0]).toBeGreaterThan(80);
  });

  it("does not show places on the far side or outside the band", () => {
    expect(project("costaRica", -10, 96)).toBeNull();
    expect(classAt("amazon", 60, -62)).toBeNull();
  });

  it("maps the bridge's region ids, with Costa Rica as the default", () => {
    expect(regionKey("costa-rica")).toBe("costaRica");
    expect(regionKey("costa-rica-forests")).toBe("costaRica");
    expect(regionKey("amazon")).toBe("amazon");
    expect(regionKey("arctic")).toBe("arctic");
    expect(regionKey("arctic-sea-ice")).toBe("arctic");
    expect(regionKey(null)).toBe("costaRica");
    expect(sceneInputFromFrame(null, { design: { region: "amazon" } } as never).region).toBe("amazon");
    expect(sceneInputFromFrame(null).region).toBe("costaRica");
  });
});

describe("CubeSat sprite", () => {
  it("is a 3U body of 10 x 34 pixels with two wings, antennas and a camera", () => {
    const b = cubeSatBitmap();
    const mid = SAT_SIZE / 2;
    const row = Array.from({ length: SAT_SIZE }, (_, x) => getPx(b, x, mid - 12));
    const body = row.filter((c) => c === SAT.frame || c === SAT.face);
    expect(body).toHaveLength(SAT_BODY.w);
    const col = Array.from({ length: SAT_SIZE }, (_, y) => getPx(b, mid - 5, y));
    expect(col.filter((c) => c === SAT.frame)).toHaveLength(SAT_BODY.h);
    expect(row.filter((c) => c === SAT.panelEdge).length).toBeGreaterThanOrEqual(4); // both wings
    expect(b.d.includes(SAT.antenna)).toBe(true);
    expect(b.d.includes(SAT.ring)).toBe(true);
  });

  it("every rotation frame keeps the palette and gains an outline", () => {
    for (const f of cubeSatFrames()) {
      expect(Math.max(...f.d)).toBeLessThanOrEqual(12);
      expect(f.d.includes(SAT.outline)).toBe(true);
    }
  });
});

describe("scene", () => {
  it("a capture brings the target under the CubeSat and a contact pass the station", () => {
    const scene = new CockpitScene();
    const { target, station } = regionPlaces("amazon");
    for (let i = 0; i < 200; i++) scene.step(0.05, { ...IDLE_SCENE, region: "amazon", speed: "detail", capturing: true });
    expect(Math.abs(scene.u - target.col)).toBeLessThan(1);
    for (let i = 0; i < 200; i++) scene.step(0.05, { ...IDLE_SCENE, region: "amazon", speed: "detail", contact: true });
    expect(Math.abs(scene.u - station.col)).toBeLessThan(1);
  });

  it("never lets the station label touch the target caption, in any region or state", () => {
    const caption = 17 * 8; // "IMAGE 19 CAPTURED", the widest text under the marker
    for (const region of ["costaRica", "amazon", "arctic"] as const) {
      const { target, station } = regionPlaces(region);
      let dx = station.col - target.col;
      dx -= EARTH_PERIOD * Math.round(dx / EARTH_PERIOD);
      for (const down of [false, true]) {
        const left = stationLabelX(dx, 0, "STATION", down); // target at 0, dish at dx
        const a = [left, left + 7 * 8], b = [-caption / 2, caption / 2];
        expect(a[0]! >= b[1]! || a[1]! <= b[0]!, `${region} down=${down}`).toBe(true);
      }
    }
  });

  it("moves a label that a window strut would cover", () => {
    expect(clearOfStruts(300, 80, 180)).toBe(300); // between the struts
    const moved = clearOfStruts(400, 80, 160);
    expect(moved === 400).toBe(false);
    expect(moved + 80 <= 429 || moved >= 445).toBe(true);
    expect(SAT_X).toBeGreaterThan(232);
  });
});
