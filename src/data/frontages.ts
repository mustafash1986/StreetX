import { BLD_STYLES, type Building, type Side } from "./street";
import type { ArtBounds, Illustration } from "../svg/library";

export interface FrontageSpec {
  art: Illustration;
  width: number;
  height: number;
  datumY: number;
  groundColor: string;
  repeat?: "water" | "grass" | "fence";
}

// Source-space dimensions and land-contact datums, in centimetres. A waterfront
// extends BELOW its land datum; aligning the bottom of its SVG would make it fly.
export function frontageSpec(building: Building, side: Side): FrontageSpec {
  if (building.kind === "waterfront") return {
    art: { path: "buildings/waterfront-right.svg" }, width: 610, height: 300,
    datumY: 170.46, groundColor: "#366387", repeat: "water",
  };
  if (building.kind === "residential") return {
    art: { path: `buildings/residential-${side}.svg` }, width: 980, height: 930,
    datumY: 914.76, groundColor: "#352d27",
  };
  if (building.kind === "parking") return {
    art: { path: `buildings/parking-lot-${side}.svg` }, width: 1100, height: 800,
    datumY: 784.76, groundColor: "#5d5e5f",
  };
  if (building.kind === "fence") return {
    art: { path: `buildings/fenced-lot-${side}.svg` }, width: 125, height: 240,
    datumY: 214.6, groundColor: "#352d26", repeat: "fence",
  };
  if (building.kind === "wall") return {
    art: { path: `buildings/compound-wall-${side}.svg` }, width: 160, height: 240,
    datumY: 224.76, groundColor: "#352d27",
  };
  if (building.kind === "green" || building.kind === "garden") return {
    art: { path: "buildings/grass.svg" }, width: 125, height: 60,
    datumY: 34.6, groundColor: "#352d26", repeat: "grass",
  };
  const style = BLD_STYLES.find((entry) => entry.key === building.style) ?? BLD_STYLES[0];
  const wide = building.style === "cream";
  const floors = Math.max(1, Math.min(8, Math.round(building.floors)));
  const height = 800 + (floors - 2) * 304.8;
  return {
    art: {
      path: `buildings/apartments-${wide ? "wide" : "narrow"}-${side}.svg`, floors,
      ...(style.key !== "cream" && !(style.key === "navy" && side === "left") ? { facadeColor: style.facade, facadeShadow: style.dark } : {}),
    },
    width: wide ? 980 : 550, height, datumY: height - 15.24, groundColor: "#352d27",
  };
}

export function frontageWidthMetres(building?: Building, side: Side = "left"): number {
  if (!building) return 6.1;
  const spec = frontageSpec(building, side);
  return spec.repeat === "grass" || spec.repeat === "fence" || building.kind === "wall"
    ? 6.1 : spec.width / 100;
}

export interface FrontagePanel { art: Illustration; x: number; y: number; viewBox: ArtBounds }
export const WATER_REPEAT: ArtBounds = { x: 304.965, y: 0, width: 305.67, height: 300 };

export function frontagePanels(spec: FrontageSpec, availableCm: number): FrontagePanel[] {
  const viewBox = { x: 0, y: 0, width: spec.width, height: spec.height };
  const first = { art: spec.art, x: 0, y: -spec.datumY, viewBox };
  if (spec.repeat === "water") {
    const count = Math.max(0, Math.ceil((availableCm - spec.width) / WATER_REPEAT.width));
    return [first, ...Array.from({ length: count }, (_, i) => ({
      art: { ...spec.art, onlyLayers: ["water-repeat"] },
      x: spec.width + i * WATER_REPEAT.width, y: -spec.datumY, viewBox: WATER_REPEAT,
    }))];
  }
  if (spec.repeat === "grass" || spec.repeat === "fence") {
    return Array.from({ length: Math.max(1, Math.ceil(availableCm / spec.width)) }, (_, i) => ({ ...first, x: i * spec.width }));
  }
  return [first];
}