import type { Illustration } from "../svg/library";
import { WIDTH_RULES, roundMetres, type WidthRuleId } from "./standards";
import { hasTurnChoices, isLaneMovement, type LaneMovement } from "./directions";

export type Dir = "in" | "out";
export type Side = "left" | "right";
export type Group = "Walking" | "Cycling" | "Traffic" | "Transit" | "Planting" | "Infrastructure";
export const GROUPS: Group[] = ["Walking", "Cycling", "Traffic", "Transit", "Planting", "Infrastructure"];
export type Surface = "walk" | "running" | "road" | "green" | "red" | "planting" | "partition" | "buffer" | "rail";
export type Marking = "drive" | "turn" | "parking" | "bike" | "bus" | "shared" | "rail" | "boarding" | "accessible" | "loading" | "running";

export interface Variant {
  id: string;
  label: string;
  art?: Illustration;
  rule?: WidthRuleId;
}

export interface SegDef {
  id: string;
  label: string;
  group: Group;
  surface: Surface;
  rule: WidthRuleId;
  defaultWidth: number;
  variants: Variant[];
  marking?: Marking;
  directional?: boolean;
  sideControl?: "door" | "orientation";
  paintable?: boolean;
  layout?: "shared" | "loading" | "protected" | "two-way" | "drainage" | "boarding";
  pole?: boolean;
  canopy?: boolean;
}

const illustration = (path: string, anchor: Illustration["anchor"] = "center"): Illustration => ({ path, anchor });
const v = (id: string, label: string, path: string, anchor?: Illustration["anchor"]): Variant =>
  ({ id, label, art: illustration(path, anchor) });
const direction = { directional: true } as const;
const car = (id: string, label: string, file: string): Variant => v(id, label, `vehicles/${file}-{dir}.svg`, "source-center");
const transit = (id: string, label: string, file: string): Variant => v(id, label, `transit/${file}-{dir}.svg`, "source-center");
const standard = (label: string, path: string): Variant[] => [v("standard", label, path)];
const blank: Variant[] = [{ id: "standard", label: "Standard" }];
const cyclists = [v("commuter", "Commuter", "bikes/biker-02-{dir}.svg"), v("sport", "Sport cyclist", "bikes/biker-01-{dir}.svg")];

const definitions: SegDef[] = [
  { id: "walk", label: "Clear sidewalk", group: "Walking", surface: "walk", rule: "sidewalk", defaultWidth: 1.8,
    variants: [
      ...Array.from({ length: 31 }, (_, i) => v(`person-${i + 1}`, `Adult pedestrian ${String(i + 1).padStart(2, "0")}`, `people/people-${String(i + 1).padStart(2, "0")}.svg`)),
      v("kid-johnny-1", "Child — Johnny 1", "people/johnny-01.svg"),
      v("kid-johnny-2", "Child — Johnny 2", "people/johnny-02.svg"),
      v("kid-junebug-1", "Child — Junebug 1", "people/junebug-01.svg"),
      v("kid-junebug-2", "Child — Junebug 2", "people/junebug-02.svg"),
    ] },
  { id: "benchwalk", label: "Bench zone", group: "Walking", surface: "walk", rule: "bench", defaultWidth: 1.8, sideControl: "orientation",
    variants: [v("side", "Side-facing bench", "furniture/bench-{side}.svg"), v("front", "Front-facing bench", "furniture/bench-center.svg")] },
  { id: "cafewalk", label: "Outdoor dining", group: "Walking", surface: "walk", rule: "dining", defaultWidth: 2.4,
    variants: [v("cafe", "Cafe seating", "furniture/cafe-seating.svg"), v("occupied", "Occupied cafe", "furniture/cafe-seating-occupied.svg")] },
  { id: "parklet", label: "Parklet", group: "Walking", surface: "walk", rule: "parklet", defaultWidth: 2.6, sideControl: "orientation",
    variants: [v("classic", "Seating parklet", "parklet/yerba-buena-parklet-{side}.svg"), v("garden", "Garden parklet", "parklet/yerba-buena-parklet-{side}-v02.svg")] },
  { id: "vendor", label: "Street vendor", group: "Walking", surface: "walk", rule: "dining", defaultWidth: 2.4,
    variants: [v("table", "Vendor table", "vendors/vendor-table.svg"), v("cart", "Vendor handcart", "vendors/vendor-handcart.svg"), v("mat", "Market vendor on mat", "vendors/vendor-tarp.svg"), v("platform", "Vendor platform", "vendors/vendor-platform.svg")] },
  { id: "wayfinding", label: "Wayfinding", group: "Walking", surface: "walk", rule: "wayfinding", defaultWidth: 1.6,
    variants: [v("small", "Small pylon", "wayfinding/nyc-wayfinding-pylon-small.svg"), v("medium", "Medium pylon", "wayfinding/nyc-wayfinding-pylon-medium.svg"), v("large", "Large pylon", "wayfinding/nyc-wayfinding-pylon-large.svg")] },
  { id: "pickup-sign", label: "Pick-up sign", group: "Walking", surface: "walk", rule: "lamp", defaultWidth: 1, sideControl: "orientation",
    variants: standard("Pick-up sign", "curb/pickup-sign-{side}.svg") },
  { id: "waiting", label: "Waiting area", group: "Walking", surface: "walk", rule: "sidewalk", defaultWidth: 1.8, sideControl: "orientation",
    variants: standard("Waiting passenger", "curb/person-waiting-01-{side}.svg") },
  { id: "peoplewalk", label: "People sidewalk", group: "Walking", surface: "walk", rule: "sidewalk", defaultWidth: 2.4,
    variants: [v("group-a", "Mixed group A — adults", "people/people-06.svg"), v("group-b", "Mixed group B — adults", "people/people-18.svg"), v("group-c", "Mixed group C — adults + child", "people/people-27.svg")] },
  { id: "running", label: "Running lane", group: "Walking", surface: "running", rule: "running", defaultWidth: 1.8, marking: "running", ...direction,
    variants: [v("runner-a", "Runner A", "people/people-03.svg"), v("runner-b", "Runner B", "people/people-22.svg"), v("runner-c", "Runner C", "people/people-29.svg")] },

  { id: "bike", label: "Bike lane", group: "Cycling", surface: "road", rule: "bike", defaultWidth: 1.8, marking: "bike", paintable: true, ...direction, variants: cyclists },
  { id: "protected-bike", label: "Protected bike lane", group: "Cycling", surface: "green", rule: "protectedBike", defaultWidth: 2.8, marking: "bike", layout: "protected", ...direction, variants: cyclists },
  { id: "two-way-bike", label: "Two-way cycleway", group: "Cycling", surface: "green", rule: "twoWayBike", defaultWidth: 4.6, marking: "bike", layout: "two-way", variants: [cyclists[0]] },
  { id: "scooter", label: "Scooter lane", group: "Cycling", surface: "road", rule: "bike", defaultWidth: 1.8, marking: "bike", paintable: true, ...direction,
    variants: standard("Scooter rider", "scooters/scooter-{dir}.svg") },
  { id: "scooter-parking", label: "Scooter parking", group: "Cycling", surface: "walk", rule: "scooterParking", defaultWidth: 1.8, sideControl: "orientation",
    variants: standard("Parked scooter", "scooters/scooter-{side}-docked.svg") },
  { id: "bikerack", label: "Bike rack", group: "Cycling", surface: "walk", rule: "bikeRack", defaultWidth: 2.4, sideControl: "orientation",
    variants: [v("perpendicular", "Perpendicular rack", "bikes/bike-rack-perpendicular-{side}.svg"), v("parallel", "Parallel rack", "bikes/bike-rack-parallel-{side}.svg")] },
  { id: "bikeshare", label: "Bike share dock", group: "Cycling", surface: "walk", rule: "bikeRack", defaultWidth: 2.4, sideControl: "orientation",
    variants: standard("Bike share dock", "bikes/bikeshare-{side}.svg") },

  { id: "drive", label: "Drive lane", group: "Traffic", surface: "road", rule: "drive", defaultWidth: 3.05, marking: "drive", ...direction,
    variants: [car("sedan", "Sedan", "car"), car("van", "Microvan", "microvan"), car("autonomous", "Autonomous car", "av")] },
  { id: "turn", label: "Turn lane", group: "Traffic", surface: "road", rule: "drive", defaultWidth: 3.05, marking: "turn", ...direction,
    variants: [car("sedan", "Sedan", "car"), car("van", "Microvan", "microvan"), car("autonomous", "Autonomous car", "av")] },
  { id: "truck", label: "Freight lane", group: "Traffic", surface: "road", rule: "bus", defaultWidth: 3.5, marking: "drive", ...direction,
    variants: [car("truck", "Truck", "truck")] },
  { id: "parking", label: "Parking bay", group: "Traffic", surface: "road", rule: "parking", defaultWidth: 2.3, marking: "parking", ...direction, sideControl: "orientation",
    variants: [
      { ...car("parallel", "Parallel parking", "car"), rule: "parking" },
      { ...v("angled-front", "Inclined / angled — front in", "vehicles/car-angled-front-{side}.svg"), rule: "angledParking" },
      { ...v("angled-rear", "Inclined / angled — rear in", "vehicles/car-angled-rear-{side}.svg"), rule: "angledParking" },
      { ...v("perpendicular", "Perpendicular parking", "vehicles/car-sideways-{side}.svg"), rule: "perpendicularParking" },
    ] },
  // Legacy separate bays — kept so older saved streets still load. New bays use
  // the unified "Parking bay" above; these are hidden from the element bar.
  { id: "angled-parking", label: "Angled parking (legacy)", group: "Traffic", surface: "road", rule: "angledParking", defaultWidth: 4.8, marking: "parking", sideControl: "orientation",
    variants: [v("front", "Angled front", "vehicles/car-angled-front-{side}.svg"), v("rear", "Angled rear", "vehicles/car-angled-rear-{side}.svg")] },
  { id: "perpendicular-parking", label: "Perpendicular parking (legacy)", group: "Traffic", surface: "road", rule: "perpendicularParking", defaultWidth: 5, marking: "parking", sideControl: "orientation",
    variants: standard("Perpendicular car", "vehicles/car-sideways-{side}.svg") },
  { id: "accessible-parking", label: "Accessible parking", group: "Traffic", surface: "road", rule: "accessibleParking", defaultWidth: 4, marking: "accessible", ...direction,
    variants: [car("sedan", "Accessible space", "car")] },
  { id: "taxilane", label: "Taxi drop-off", group: "Traffic", surface: "road", rule: "loading", defaultWidth: 4, marking: "loading", layout: "loading", sideControl: "door", ...direction,
    variants: [v("taxi", "Taxi", "vehicles/taxi-{dir}-door-{side}.svg", "source-center")] },
  { id: "rideshare", label: "Ridehail drop-off", group: "Traffic", surface: "road", rule: "loading", defaultWidth: 4, marking: "loading", layout: "loading", sideControl: "door", ...direction,
    variants: [v("rideshare", "Ridehail car", "vehicles/rideshare-{dir}-door-{side}.svg", "source-center"), v("car", "Passenger car", "vehicles/car-{dir}-door-{side}.svg", "source-center")] },
  { id: "foodtruck", label: "Food-truck bay", group: "Traffic", surface: "road", rule: "foodtruck", defaultWidth: 3.2, sideControl: "orientation",
    variants: standard("Food truck", "vehicles/foodtruck-{side}.svg") },

  { id: "bus", label: "Bus lane", group: "Transit", surface: "red", rule: "bus", defaultWidth: 3.5, marking: "bus", ...direction,
    variants: [transit("standard", "City bus", "bus"), v("alternate", "Alternate bus", "transit/bus-{dir}-alt.svg", "source-center")] },
  { id: "sharedbus", label: "Shared bus / bike lane", group: "Transit", surface: "road", rule: "sharedBus", defaultWidth: 3.6, marking: "shared", layout: "shared", ...direction,
    variants: [transit("standard", "Bus and bicycle", "bus")] },
  { id: "double-bus", label: "Double-decker bus", group: "Transit", surface: "red", rule: "bus", defaultWidth: 3.5, marking: "bus", ...direction,
    variants: [transit("standard", "Double-decker", "double-decker-bus")] },
  { id: "brt", label: "Bus rapid transit", group: "Transit", surface: "red", rule: "bus", defaultWidth: 3.5, marking: "bus", ...direction,
    variants: [transit("standard", "BRT bus", "brt-bus")] },
  { id: "shuttle", label: "Autonomous shuttle", group: "Transit", surface: "red", rule: "bus", defaultWidth: 3.5, marking: "bus", ...direction,
    variants: [transit("standard", "Shuttle", "av-shuttle")] },
  { id: "tram", label: "Streetcar lane", group: "Transit", surface: "rail", rule: "rail", defaultWidth: 3.6, marking: "rail", ...direction,
    variants: [transit("standard", "Streetcar", "streetcar")] },
  { id: "light-rail", label: "Light rail", group: "Transit", surface: "rail", rule: "rail", defaultWidth: 3.6, marking: "rail", ...direction,
    variants: [transit("standard", "Light rail", "light-rail")] },
  { id: "train", label: "Train track", group: "Transit", surface: "rail", rule: "train", defaultWidth: 4.5, marking: "rail", ...direction,
    variants: [v("locomotive", "Locomotive", "secret/inception-train.svg", "source-center")] },
  { id: "shelter", label: "Transit shelter", group: "Transit", surface: "walk", rule: "shelter", defaultWidth: 2.6, sideControl: "orientation",
    variants: [v("classic", "Classic shelter", "transit/transit-shelter-01-{side}.svg"), v("modern", "Modern shelter", "transit/transit-shelter-02-{side}.svg")] },
  { id: "brt-station", label: "BRT station", group: "Transit", surface: "walk", rule: "station", defaultWidth: 3.6, sideControl: "orientation",
    variants: [v("side", "Side station", "transit/brt-station-{side}.svg"), v("center", "Center station", "transit/brt-station-center.svg")] },
  { id: "boarding", label: "Clear boarding area", group: "Transit", surface: "walk", rule: "boarding", defaultWidth: 2.44, marking: "boarding", layout: "boarding", variants: blank },

  { id: "treebed", label: "Tree planting strip", group: "Planting", surface: "planting", rule: "tree", defaultWidth: 1.8, canopy: true,
    variants: [v("tree", "Street tree", "trees/tree.svg"), v("palm", "Palm tree", "trees/palm-tree.svg")] },
  { id: "planter", label: "Raised planter", group: "Planting", surface: "planting", rule: "planter", defaultWidth: 1.4,
    variants: [
      v("red", "Red flowers", "dividers/planter-box.svg"),
      ...[{ id: "yellow", label: "Yellow flowers", color: "#efc14b" }, { id: "white", label: "White flowers", color: "#f4f2ed" }, { id: "orange", label: "Orange flowers", color: "#e98644" }, { id: "blue", label: "Blue flowers", color: "#567dad" }].map((entry) => ({ id: entry.id, label: entry.label, art: { ...illustration("dividers/planter-box.svg"), flowerColor: entry.color } })),
      { id: "grass", label: "Grass planter", art: { ...illustration("dividers/planter-box.svg"), removeLayers: ["flowers"] } },
      { id: "empty", label: "Empty planter", art: { ...illustration("dividers/planter-box.svg"), removeLayers: ["flowers", "grass"] } },
    ] },
  { id: "shrubbed", label: "Shrub planting bed", group: "Planting", surface: "planting", rule: "landscape", defaultWidth: 1.4,
    variants: standard("Shrub bed", "plants/bush.svg") },
  { id: "flowerbed", label: "In-ground flower bed", group: "Planting", surface: "planting", rule: "landscape", defaultWidth: 1.4,
    variants: ["red", "yellow", "white", "orange", "blue"].map((color) => v(color, `${color[0].toUpperCase()}${color.slice(1)} flowers`, `plants/flowers-${color}.svg`)) },
  { id: "grass", label: "Grass strip", group: "Planting", surface: "planting", rule: "grass", defaultWidth: 1.2,
    variants: standard("Groundcover", "plants/grass.svg") },

  { id: "lamp", label: "Modern lighting", group: "Infrastructure", surface: "walk", rule: "lamp", defaultWidth: 1, sideControl: "orientation", pole: true,
    variants: [v("single", "Single-arm lamp", "lamps/lamp-modern-{side}.svg"), v("double", "Double-arm lamp", "lamps/lamp-modern-both.svg")] },
  { id: "traditional-lamp", label: "Traditional lighting", group: "Infrastructure", surface: "walk", rule: "lamp", defaultWidth: 1, sideControl: "orientation", pole: true,
    variants: [v("center", "Lantern lamp", "lamps/lamp-traditional-center.svg"), v("single", "Side lantern", "lamps/lamp-traditional-{side}.svg"), v("double", "Double lantern", "lamps/lamp-traditional-both.svg")] },
  { id: "utilityseg", label: "Utility pole strip", group: "Infrastructure", surface: "partition", rule: "lamp", defaultWidth: 1, sideControl: "orientation", pole: true,
    variants: standard("Utility pole", "utilities/utility-pole-{side}.svg") },
  { id: "buffer", label: "Painted buffer", group: "Infrastructure", surface: "buffer", rule: "separator", defaultWidth: 0.92, variants: blank },
  { id: "bollard", label: "Bollard separator", group: "Infrastructure", surface: "buffer", rule: "separator", defaultWidth: 0.92,
    variants: standard("Flexible bollard", "dividers/bollard.svg") },
  { id: "dome", label: "Dome separator", group: "Infrastructure", surface: "buffer", rule: "separator", defaultWidth: 0.92,
    variants: standard("Dome", "dividers/dome.svg") },
  { id: "bike-divider", label: "Cycle-lane separator", group: "Infrastructure", surface: "buffer", rule: "separator", defaultWidth: 0.92,
    variants: standard("Low separator", "dividers/bike-lane-divider.svg") },
  { id: "barrier", label: "Safety barrier", group: "Infrastructure", surface: "buffer", rule: "works", defaultWidth: 1.4,
    variants: [v("concrete", "Concrete barrier", "construction/jersey-barrier-concrete.svg"), v("plastic", "Water-filled barrier", "construction/jersey-barrier-plastic.svg")] },
  { id: "roadwork", label: "Work-zone equipment", group: "Infrastructure", surface: "buffer", rule: "works", defaultWidth: 1.4,
    variants: [v("cone", "Traffic cone", "construction/cone.svg"), v("barricade", "Barricade", "construction/barricade.svg")] },
  { id: "drainage", label: "Drainage channel", group: "Infrastructure", surface: "partition", rule: "drainage", defaultWidth: 1.2, layout: "drainage", variants: blank },
  { id: "lowcurb", label: "Curb", group: "Infrastructure", surface: "partition", rule: "curb", defaultWidth: 0.3, variants: blank },
];

export const DEFS: Record<string, SegDef> = Object.fromEntries(definitions.map((definition) => [definition.id, definition]));
export const DEFINITIONS = definitions;

export interface Segment {
  id: string;
  type: string;
  w: number;
  variant: string;
  dir: Dir;
  side: Side;
  paint: boolean;
  movement: LaneMovement;
  /** Surface level at the physical left/start edge, relative to datum 0.00 m. */
  levelStart: number;
  /** Surface level at the physical right/end edge, relative to datum 0.00 m. */
  levelEnd: number;
  /** Derived from the two endpoints. Retained in saved files for transparent exports. */
  elevation: number;
  /** Derived percent: (levelEnd - levelStart) / width * 100. */
  slope: number;
}

/* ---------- vertical profile (levels & slopes) ---------- */
// A real street is never a single flat plane: sidewalks sit on a raised curb,
// cycle tracks are often stepped, medians and plazas can be raised, and every
// surface is built with a small drainage cross-slope. Streetx models this with
// two per-segment edge levels: `levelStart` and `levelEnd`, in metres above
// roadway datum. The editor derives centre elevation and cross-slope from them,
// so neighbouring profiles can share exactly the same joint. The datum (0.00 m)
// is the roadway/gutter line; curbs are the classic +0.15 m level.
export const ELEVATION_MIN = -0.6;
export const ELEVATION_MAX = 0.9;
export const ELEVATION_STEP = 0.01;
export const SLOPE_MIN = -12;
export const SLOPE_MAX = 12;
export const SLOPE_STEP = 0.5;
export const CURB_HEIGHT = 0.15;

// Sensible starting level per surface so a fresh street already has curb levels.
export function defaultElevation(type: string): number {
  const surface = DEFS[type]?.surface;
  if (surface === "walk" || surface === "planting" || surface === "partition") return CURB_HEIGHT;
  if (DEFS[type]?.layout === "protected" || DEFS[type]?.layout === "two-way") return 0.06;
  return 0;
}
export const clampElevation = (value: number) =>
  Number.isFinite(value) ? roundMetres(Math.max(ELEVATION_MIN, Math.min(ELEVATION_MAX, Math.round(value / ELEVATION_STEP) * ELEVATION_STEP))) : 0;
export const clampSlope = (value: number) =>
  Number.isFinite(value) ? Math.round(Math.max(SLOPE_MIN, Math.min(SLOPE_MAX, value)) / SLOPE_STEP) * SLOPE_STEP : 0;
export const slopeAngle = (slope: number) => Math.atan(slope / 100) * 180 / Math.PI;

export function profileFromEdges(start: number, end: number, width: number) {
  const levelStart = clampElevation(start);
  const levelEnd = clampElevation(end);
  const safeWidth = Math.max(width, 0.01);
  return {
    levelStart,
    levelEnd,
    elevation: roundMetres((levelStart + levelEnd) / 2),
    slope: Math.round(((levelEnd - levelStart) / safeWidth * 100) * 100) / 100,
  };
}

let serial = 0;
export const mkId = () => `seg-${Date.now().toString(36)}-${serial++}`;
export const getVariant = (segment: Segment) => DEFS[segment.type].variants.find((variant) => variant.id === segment.variant) ?? DEFS[segment.type].variants[0];
export const getWidthRule = (segment: Segment) => WIDTH_RULES[getVariant(segment).rule ?? DEFS[segment.type].rule];

export function separatorWidth(segment: Segment, segments: Segment[] = []): number {
  const i = segments.findIndex((entry) => entry.id === segment.id);
  const adjacent = i < 0 ? [] : [segments[i - 1], segments[i + 1]].filter(Boolean);
  return adjacent.some((entry) => /parking|taxilane|rideshare/.test(entry.type)) ? 0.92 : 0.61;
}

export function cycleBuffers(segment: Segment, segments: Segment[] = []): { left: number; right: number } {
  const index = segments.findIndex((entry) => entry.id === segment.id);
  const previous = index < 0 ? undefined : segments[index - 1];
  const next = index < 0 ? undefined : segments[index + 1];
  const buffer = (neighbor?: Segment): number => {
    if (!neighbor) return 0;
    if (/parking|taxilane|rideshare/.test(neighbor.type)) return 0.92;
    return ["road", "red", "rail"].includes(DEFS[neighbor.type].surface) && DEFS[neighbor.type].group !== "Cycling" ? 0.61 : 0;
  };
  const left = buffer(previous);
  const right = buffer(next);
  return left || right ? { left, right } : { left: 0.61, right: 0 };
}

export function minimumWidth(segment: Segment, segments: Segment[] = []): number {
  const rule = getWidthRule(segment);
  const layout = DEFS[segment.type].layout;
  if (layout === "protected" || layout === "two-way") {
    const buffers = cycleBuffers(segment, segments);
    return roundMetres(rule.minM - 0.61 + buffers.left + buffers.right);
  }
  if (DEFS[segment.type].rule === "separator") return Math.max(rule.minM, separatorWidth(segment, segments));
  return rule.minM;
}

export function mkSeg(type: string, width?: number, extra: Partial<Segment> = {}): Segment {
  const def = DEFS[type];
  if (!def) throw new Error(`Unknown segment category: ${type}`);
  const variant = def.variants.find((item) => item.id === extra.variant)?.id ?? def.variants[0].id;
  const w = roundMetres(Math.max(minimumWidth({
    id: "pending", type, variant, w: def.defaultWidth, dir: extra.dir === "out" ? "out" : "in", side: extra.side === "left" ? "left" : "right", paint: extra.paint === true,
    movement: hasTurnChoices(def.marking) ? (isLaneMovement(extra.movement) ? extra.movement : type === "turn" ? (extra.variant === "right" ? "right" : "left") : "straight") : "straight",
    levelStart: 0, levelEnd: 0, elevation: 0, slope: 0,
  }), Math.min(30, Number.isFinite(width) ? width! : def.defaultWidth)));
  const legacyCentre = extra.elevation ?? defaultElevation(type);
  const legacySlope = extra.slope ?? 0;
  const rawStart = extra.levelStart ?? legacyCentre - w * legacySlope / 200;
  const rawEnd = extra.levelEnd ?? legacyCentre + w * legacySlope / 200;
  const profile = profileFromEdges(rawStart, rawEnd, w);
  return {
    id: typeof extra.id === "string" && extra.id.length > 0 && extra.id.length < 120 ? extra.id : mkId(),
    type, variant, w,
    dir: extra.dir === "out" ? "out" : "in",
    side: extra.side === "left" ? "left" : "right",
    paint: extra.paint === true,
    movement: hasTurnChoices(def.marking)
      ? (isLaneMovement(extra.movement) ? extra.movement : type === "turn" ? (extra.variant === "right" ? "right" : "left") : "straight")
      : "straight",
    ...profile,
  };
}

export function normalizeSegments(input: Segment[]): Segment[] {
  const seen = new Set<string>();
  const segments = input.filter((item) => item && DEFS[item.type]).slice(0, 120).map((item) => {
    const next = mkSeg(item.type, item.w, item);
    if (seen.has(next.id)) next.id = mkId();
    seen.add(next.id);
    return next;
  });
  const sized = segments.map((segment) => ({ ...segment, w: Math.max(segment.w, minimumWidth(segment, segments)) }));
  return sized.map((segment) => ({ ...segment, ...profileFromEdges(segment.levelStart, segment.levelEnd, segment.w) }));
}

export const streetMinimum = (segments: Segment[]) => roundMetres(segments.reduce((sum, item) => sum + minimumWidth(item, segments), 0));
export const streetWidth = (segments: Segment[]) => roundMetres(segments.reduce((sum, item) => sum + item.w, 0));

export function steppedWidth(segment: Segment, change: -1 | 1, segments: Segment[]): number {
  const tenths = change > 0 ? Math.floor(segment.w * 10 + 0.0001) + 1 : Math.ceil(segment.w * 10 - 0.0001) - 1;
  return roundMetres(Math.min(30, Math.max(minimumWidth(segment, segments), tenths / 10)));
}

export const steppedLevelStart = (segment: Segment, change: -1 | 1) => clampElevation(segment.levelStart + change * ELEVATION_STEP);
export const steppedLevelEnd = (segment: Segment, change: -1 | 1) => clampElevation(segment.levelEnd + change * ELEVATION_STEP);

export function segmentIllustration(segment: Segment): Illustration | undefined {
  const source = getVariant(segment).art;
  if (!source) return undefined;
  const variantPath = segment.type === "turn" && getVariant(segment).id === "sedan"
    // Signal assets are named by DRIVER side, but lane arrows point to a SCREEN
    // side. A front-view (inbound) car mirrors driver vs screen, so the asset is
    // swapped there: inbound left-arrow => right-signal asset (glows screen-left).
    // Rear-view (outbound) needs no swap: driver and screen sides coincide.
    ? segment.movement === "left" || segment.movement === "left-straight"
      ? `vehicles/car-{dir}-turn-signal-${segment.dir === "in" ? "right" : "left"}.svg`
      : segment.movement === "right" || segment.movement === "right-straight"
        ? `vehicles/car-{dir}-turn-signal-${segment.dir === "in" ? "left" : "right"}.svg`
        : "vehicles/car-{dir}.svg"
    : source.path;
  const art = { ...source, path: variantPath.split("{dir}").join(segment.dir === "out" ? "outbound" : "inbound").split("{side}").join(segment.side) };
  if (art.path === "lamps/lamp-modern-right.svg") art.anchor = 21.8;
  if (art.path === "lamps/lamp-modern-left.svg") art.anchor = 348.2;
  if (art.path === "lamps/lamp-modern-both.svg") art.anchor = 250.4;
  if (art.path.startsWith("lamps/lamp-traditional-")) art.anchor = "source-center";
  if (art.path.startsWith("utilities/utility-pole-")) art.anchor = 119.55;
  return art;
}

export interface PaletteItem {
  key: string;
  type: string;
  label: string;
  group: Group;
  variant: string;
  w: number;
  art?: Illustration;
  primary: boolean;
}

// One tile per element type. Variants (people, vehicles, parking layouts,
// planter colours) live in the selection pop-up, keeping every vector available
// without flooding the bar with near-duplicate tiles.
const HIDDEN_FROM_PALETTE = new Set(["angled-parking", "perpendicular-parking"]);
export const PALETTE: PaletteItem[] = definitions
  .filter((def) => !HIDDEN_FROM_PALETTE.has(def.id))
  .map((def) => {
    const variant = def.variants[0];
    const segment = mkSeg(def.id, def.defaultWidth, { variant: variant.id });
    return { key: `${def.id}-${variant.id}`, type: def.id, label: def.label, group: def.group, variant: variant.id, w: segment.w, art: segmentIllustration(segment), primary: true };
  });

export const INITIAL = normalizeSegments([
  mkSeg("walk", 1.8, { variant: "person-7" }), mkSeg("treebed", 1.53), mkSeg("shelter", 2.6),
  mkSeg("lamp", 0.91, { side: "right" }), mkSeg("sharedbus", 3.6), mkSeg("drive", 3.05, { dir: "out" }),
  mkSeg("shrubbed", 1.22), mkSeg("turn", 3.05), mkSeg("parking", 2.14, { dir: "out" }),
  mkSeg("planter", 1.22), mkSeg("bike", 1.8, { paint: true }),
  mkSeg("lamp", 0.91, { side: "left" }), mkSeg("walk", 1.8, { variant: "person-1" }),
]);

export const TEMPLATE_MAIN = normalizeSegments([
  mkSeg("walk", 2.4), mkSeg("treebed", 1.8), mkSeg("bike", 1.8, { paint: true }),
  mkSeg("buffer", 0.92), mkSeg("parking", 2.3), mkSeg("drive", 3.05),
  mkSeg("drive", 3.05, { dir: "out" }), mkSeg("taxilane", 4, { side: "right" }),
  mkSeg("walk", 2.4, { variant: "person-7" }),
]);

export interface BldStyle { key: string; name: string; facade: string; pane: string; frame: string; trim: string; dark: string }
export const BLD_STYLES: BldStyle[] = [
  { key: "navy", name: "Mid-century navy", facade: "#2c4a63", pane: "#232e49", frame: "#dfe5e8", trim: "#4a6a85", dark: "#233d53" },
  { key: "cream", name: "Neoclassic cream", facade: "#f2efe8", pane: "#25304c", frame: "#e3dfd2", trim: "#d8d3c2", dark: "#e4e0d5" },
  { key: "brick", name: "Brick brownstone", facade: "#7d4a3c", pane: "#20263e", frame: "#e6ddcf", trim: "#63392e", dark: "#6b3f33" },
  { key: "sage", name: "Sage walk-up", facade: "#7f9484", pane: "#232e49", frame: "#eef0e7", trim: "#6a7e6f", dark: "#718575" },
  { key: "slate", name: "Slate loft", facade: "#5a6b76", pane: "#1d2536", frame: "#d7dee2", trim: "#47565f", dark: "#4c5c66" },
  { key: "sand", name: "Desert stone", facade: "#c9ad86", pane: "#2b3350", frame: "#f2e9d7", trim: "#b1956e", dark: "#bda077" },
  { key: "plum", name: "Plum deco", facade: "#5d4a68", pane: "#211f3a", frame: "#e2dde8", trim: "#4b3b54", dark: "#51405b" },
  { key: "forest", name: "Forest terracotta", facade: "#4a6b4f", pane: "#232e49", frame: "#e6eee2", trim: "#3c5940", dark: "#405f45" },
  { key: "charcoal", name: "Charcoal tower", facade: "#3c3f44", pane: "#161c2e", frame: "#cfd4d8", trim: "#2e3034", dark: "#34373b" },
];
/* ---------- what sits beside the street ---------- */
export interface BuildingKind {
  key: string;
  label: string;
  hint: string;
  hasFloors: boolean;
  hasStyle: boolean;
}
// The side of a street is not always a building. Offer the common Streetmix
// frontage contexts plus natural edges (green space, waterfront).
export const BUILDING_KINDS: BuildingKind[] = [
  { key: "apartments", label: "Buildings", hint: "Mixed-use frontage with adjustable floors", hasFloors: true, hasStyle: true },
  { key: "residential", label: "House", hint: "Original Streetmix house and entrance steps", hasFloors: false, hasStyle: false },
  { key: "green", label: "Green area", hint: "Open lawn / grass verge", hasFloors: false, hasStyle: false },
  { key: "garden", label: "Garden", hint: "Planted garden with shrubs and a tree", hasFloors: false, hasStyle: false },
  { key: "waterfront", label: "Waterfront", hint: "Seawall, riprap and open water", hasFloors: false, hasStyle: false },
  { key: "fence", label: "Fenced lot", hint: "Vacant lot behind a chain-link fence", hasFloors: false, hasStyle: false },
  { key: "parking", label: "Parking lot", hint: "Surface parking with marked stalls", hasFloors: false, hasStyle: false },
  { key: "wall", label: "Boundary wall", hint: "Original Streetmix compound wall", hasFloors: false, hasStyle: false },
];
export const buildingKind = (key: string) => BUILDING_KINDS.find((entry) => entry.key === key) ?? BUILDING_KINDS[0];

export interface Building { kind: string; style: string; floors: number }