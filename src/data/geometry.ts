import { BASE_PIXELS_PER_METRE } from "../svg/library";
import { streetWidth, type Building, type Segment } from "./street";
import { frontageWidthMetres } from "./frontages";

export interface SceneGeometry {
  ppm: number;
  streetW: number;
  rowW: number;
  origin: number;
  buildingScale: number;
  leftBuilding: number;
  rightBuilding: number;
  leftMarginWidth: number;
  rightMarginWidth: number;
  offsets: number[];
}

export function sceneGeometry(segments: Segment[], viewportWidth: number, zoom: number, frontages?: { left: Building; right: Building }): SceneGeometry {
  // Only the explicit camera zoom changes scale. Street width and viewport width
  // affect the canvas extent, never the physical size of an illustration.
  const ppm = BASE_PIXELS_PER_METRE * zoom;
  const streetW = streetWidth(segments) * ppm;
  const buildingScale = 0.9 * zoom;
  const leftReserve = frontageWidthMetres(frontages?.left, "left") * ppm + 16;
  const rightReserve = frontageWidthMetres(frontages?.right, "right") * ppm + 16;
  const rowW = Math.max(viewportWidth, streetW + leftReserve + rightReserve);
  const origin = leftReserve + Math.max(0, rowW - streetW - leftReserve - rightReserve) / 2;
  let offset = 0;
  const offsets = segments.map((segment) => {
    const current = offset;
    offset += segment.w * ppm;
    return current;
  });
  return { ppm, streetW, rowW, origin, buildingScale, offsets,
    leftBuilding: origin - 200 * buildingScale - 10,
    rightBuilding: origin + streetW + 10,
    leftMarginWidth: origin,
    rightMarginWidth: rowW - (origin + streetW) };
}

export function insertionIndex(x: number, segments: Segment[], ppm: number): number {
  let offset = 0;
  for (let i = 0; i < segments.length; i++) {
    if (x < offset + segments[i].w * ppm / 2) return i;
    offset += segments[i].w * ppm;
  }
  return segments.length;
}