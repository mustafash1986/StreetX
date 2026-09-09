import type { Segment } from "./street";

export const ROAD_BAND_PX = 46;
export const LABEL_BAND_PX = 96;

// The endpoints are the source of truth. The centre elevation and crossfall are
// derived on every edit, eliminating cumulative rounding gaps between segments.
export function surfaceLevelAt(segment: Segment, xM: number): number {
  return segment.levelStart + (segment.levelEnd - segment.levelStart) * (xM / Math.max(segment.w, .01));
}

export function edgeLevels(segment: Segment) {
  return { left: segment.levelStart, right: segment.levelEnd };
}

export function formatLevel(level: number): string {
  const rounded = Math.round(level * 1000) / 1000;
  if (Object.is(rounded, -0) || rounded === 0) return "0.00";
  const decimals = Math.abs(rounded * 100 - Math.round(rounded * 100)) < 0.00001 ? 2 : 3;
  return `${rounded > 0 ? "+" : ""}${rounded.toFixed(decimals)}`;
}

export function profileGeometry(segments: Segment[], ppm: number) {
  const edges = segments.map(edgeLevels);
  const min = Math.min(0, ...edges.flatMap((edge) => [edge.left, edge.right]));
  const baseDepth = ROAD_BAND_PX + Math.max(0, -min * ppm);
  return { baseDepth, edges, datumBottom: LABEL_BAND_PX + baseDepth };
}

export function surfacePolygon(segment: Segment, ppm: number, baseDepth: number) {
  const edge = edgeLevels(segment);
  const top = Math.max(edge.left, edge.right);
  const height = baseDepth + top * ppm;
  const leftInset = (top - edge.left) * ppm;
  const rightInset = (top - edge.right) * ppm;
  return { height, leftInset, rightInset, width: segment.w * ppm,
    clipPath: `polygon(0 ${leftInset}px, 100% ${rightInset}px, 100% 100%, 0 100%)` };
}