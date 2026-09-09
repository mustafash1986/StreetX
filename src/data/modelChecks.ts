import { artPixelSize, artPlacement, prepareArt, SVG_SOURCES } from "../svg/library";
import { DEFAULT_DOCUMENT, editorReducer, normalizeDocument } from "./editor";
import { sceneGeometry } from "./geometry";
import { BUILDING_KINDS, DEFS, PALETTE, INITIAL, minimumWidth, mkSeg, normalizeSegments, segmentIllustration, steppedWidth, streetMinimum, streetWidth, type Dir, type Side } from "./street";
import { frontagePanels, frontageSpec, frontageWidthMetres } from "./frontages";
import { edgeLevels, formatLevel, profileGeometry, surfaceLevelAt, surfacePolygon } from "./profile";
import { arrowAssetPath, hasLaneArrow, LANE_MOVEMENTS } from "./directions";

/** Browser/development regression checks; runModelChecks() throws on regression. */
export function runModelChecks(): number {
  let count = 0;
  const check = (condition: boolean, message: string) => { count++; if (!condition) throw new Error(`Streetx check failed: ${message}`); };
  const near = (a: number, b: number) => Math.abs(a - b) < .00001;
  const paletteKeys = new Set<string>();

  for (const item of PALETTE) {
    check(!paletteKeys.has(item.key), `duplicate palette key ${item.key}`);
    paletteKeys.add(item.key);
    const segment = mkSeg(item.type, -100, { variant: item.variant });
    check(near(segment.w, minimumWidth(segment)), `minimum at creation: ${item.key}`);
    check(near(steppedWidth(segment, -1, [segment]), segment.w), `minus stops at minimum: ${item.key}`);
    check(item.w >= minimumWidth(segment), `palette default below minimum: ${item.key}`);
  }
  check(PALETTE.length === Object.keys(DEFS).filter((id) => id !== "angled-parking" && id !== "perpendicular-parking").length, "one toolbar tile per element type, variants live in the pop-up");
  check(!PALETTE.some((item) => item.type === "angled-parking" || item.type === "perpendicular-parking"), "legacy split parking bays are hidden from the bar");
  // Every selectable variant (inspector options included) must resolve artwork.
  for (const def of Object.values(DEFS)) {
    for (const variant of def.variants) {
      const segment = mkSeg(def.id, undefined, { variant: variant.id });
      for (const dir of ["in", "out"] as Dir[]) for (const side of ["left", "right"] as Side[]) {
        const art = segmentIllustration({ ...segment, dir, side });
        if (!art) continue;
        check(!!SVG_SOURCES[art.path], `asset exists: ${art.path}`);
        check(!/magic-carpet|krz-motorbike|bernie|missing/.test(art.path), `no novelty artwork: ${art.path}`);
      }
    }
  }
  check(PALETTE.some((item) => item.type === "running"), "running lane is available in the Walking elements");
  check(PALETTE.some((item) => item.type === "peoplewalk"), "people sidewalk is available in the Walking elements");
  check(DEFS.walk.variants.some((item) => item.id === "kid-johnny-1") && DEFS.walk.variants.some((item) => item.id === "kid-junebug-1"), "children are selectable inside the sidewalk pop-up");

  check(LANE_MOVEMENTS.length === 8, "all eight reference arrow combinations are available");
  for (const movement of LANE_MOVEMENTS) for (const dir of ["in", "out"] as Dir[]) {
    const path = arrowAssetPath(movement.id, dir);
    check(!!SVG_SOURCES[path], `official arrow exists: ${path}`);
    const segment = mkSeg("bus", undefined, { movement: movement.id, dir });
    check(segment.movement === movement.id && segment.dir === dir, "bus arrows are persisted independently of travel direction");
    const normalized = normalizeSegments([{ ...segment, w: -1 }])[0];
    check(normalized.movement === movement.id, "minimum width correction preserves arrows");
  }
  for (const type of ["bus", "sharedbus", "double-bus", "brt", "shuttle"]) check(hasLaneArrow(DEFS[type].marking), `${type} displays a travel arrow`);
  check(mkSeg("turn", undefined, { variant: "right" }).movement === "right", "legacy right-turn files migrate to the right arrow");
  check(segmentIllustration(mkSeg("turn", undefined, { dir: "in", movement: "left" }))?.path === "vehicles/car-inbound-turn-signal-right.svg", "inbound left arrow glows on the screen-left lamp");
  check(segmentIllustration(mkSeg("turn", undefined, { dir: "out", movement: "left" }))?.path === "vehicles/car-outbound-turn-signal-left.svg", "outbound left arrow glows on the screen-left lamp");
  check(segmentIllustration(mkSeg("turn", undefined, { dir: "in", movement: "right" }))?.path === "vehicles/car-inbound-turn-signal-left.svg", "inbound right arrow glows on the screen-right lamp");
  check(segmentIllustration(mkSeg("turn", undefined, { dir: "out", movement: "right" }))?.path === "vehicles/car-outbound-turn-signal-right.svg", "outbound right arrow glows on the screen-right lamp");
  check(segmentIllustration(mkSeg("turn", undefined, { variant: "van", movement: "left", dir: "in" }))?.path === "vehicles/microvan-inbound.svg", "turn-lane vehicle selector changes the vehicle");
  check(segmentIllustration(mkSeg("turn", undefined, { variant: "autonomous", movement: "straight", dir: "out" }))?.path === "vehicles/av-outbound.svg", "autonomous turn-lane vehicle resolves");
  for (const [variant, rule] of [["parallel", 2.14], ["angled-front", 4.8], ["perpendicular", 5]] as const) {
    check(minimumWidth(mkSeg("parking", 30, { variant }), []) >= rule, `parking layout ${variant} enforces its own minimum`);
  }
  check(mkSeg("drive", undefined, { movement: "invalid" as never }).movement === "straight", "untrusted movement value is normalised");
  check(PALETTE.some((item) => item.type === "train"), "the locomotive is in the Transit library");
  check(segmentIllustration(mkSeg("train"))?.path === "secret/inception-train.svg", "train uses the original collection vector");
  check(minimumWidth(mkSeg("train", .1)) >= 4.5, "train track retains its rail-envelope allowance");

  const wide = INITIAL.map((segment) => ({ ...segment, w: segment.w + 2 }));
  const baseline = sceneGeometry(INITIAL, 1440, 1);
  const widened = sceneGeometry(wide, 1440, 1);
  const extended = sceneGeometry([...INITIAL, mkSeg("bus")], 1440, 1);
  check(baseline.ppm === widened.ppm && baseline.ppm === extended.ppm, "street edits cannot change world scale");
  check(baseline.ppm === sceneGeometry(INITIAL, 375, 1).ppm, "responsive viewport cannot change world scale");
  const exampleBusBounds = { x: 20, y: 5, width: 270, height: 310 };
  check(artPixelSize(exampleBusBounds, baseline.ppm).height === artPixelSize(exampleBusBounds, widened.ppm).height, "bus height is independent of lane width");
  for (const variant of ["inbound", "outbound"]) {
    const art = { path: `vehicles/microvan-${variant}.svg`, anchor: "source-center" as const };
    const prepared = prepareArt(art);
    // Simulate both an inflated transformed-box measurement and raw-viewBox
    // fallback. Tyres must contact the same datum in either case.
    for (const bounds of [prepared.original, { x: 5, y: 10, width: 175, height: 207 }]) {
      for (const zoom of [.6, .9, 1, 1.6]) {
        const p = artPlacement(art, prepared, bounds, 38 * zoom);
        check(p.ground === 180, `native tyre datum: microvan ${variant}`);
        check(near(p.belowGround, p.height - p.pivotY), `no floating microvan ${variant} at ${zoom}`);
      }
    }
  }
  check(sceneGeometry(INITIAL, 1440, 1.5).ppm === baseline.ppm * 1.5, "explicit zoom changes scale");
  for (const geometry of [baseline, widened, extended]) {
    check(geometry.leftBuilding + 200 * geometry.buildingScale < geometry.origin, "left building stays outside sidewalks");
    check(geometry.rightBuilding > geometry.origin + geometry.streetW, "right building stays outside sidewalks");
  }
  for (const dir of ["in", "out"] as Dir[]) {
    const taxi = mkSeg("taxilane", undefined, { dir });
    const left = segmentIllustration({ ...taxi, side: "left" });
    const right = segmentIllustration({ ...taxi, side: "right" });
    check(!!left && !!right && left.path !== right.path, `both taxi doors exist (${dir})`);
    check(near(minimumWidth(taxi), 2.44 + 1.53), "loading includes separate access aisle");
  }
  const twoSided = normalizeSegments([mkSeg("parking"), mkSeg("protected-bike", .1), mkSeg("drive")]);
  check(near(minimumWidth(twoSided[1], twoSided), 2.1 + .92 + .61), "buffers protect both traffic-facing sides");
  const undersized = normalizeDocument({ ...DEFAULT_DOCUMENT, segments: INITIAL.map((segment) => ({ ...segment, w: .01 })) });
  check(undersized.segments.every((segment) => segment.w >= minimumWidth(segment, undersized.segments)), "imports enforce every category minimum");
  const committed = editorReducer({ present: DEFAULT_DOCUMENT, past: [], future: [] }, { type: "commit", document: undersized });
  const undone = editorReducer(committed, { type: "undo" });
  const redone = editorReducer(undone, { type: "redo" });
  check(near(streetWidth(redone.present.segments), streetMinimum(redone.present.segments)), "redo preserves validated minimums");
  check(DEFS.planter.variants.every((variant) => variant.art?.path === "dividers/planter-box.svg"), "raised planters use one coherent native composite");

  const sloped = mkSeg("drive", 4, { elevation: .3, slope: 3 });
  check(near(edgeLevels(sloped).left, .24) && near(edgeLevels(sloped).right, .36), "edge levels are calculated from actual width and crossfall");
  check(near(surfaceLevelAt(sloped, 2), .3), "centre level is preserved");
  const endpointSlope = mkSeg("drive", 4, { levelStart: .24, levelEnd: .36 });
  check(near(endpointSlope.slope, 3) && near(endpointSlope.elevation, .3), "slope is derived from user-set start and end levels");
  const joined = normalizeSegments([mkSeg("drive", 3, { levelStart: .12, levelEnd: .24 }), mkSeg("turn", 3, { levelStart: .24, levelEnd: .3 })]);
  check(joined[0].levelEnd === joined[1].levelStart, "matched neighboring endpoints preserve an exact shared elevation");
  const belowDatum = mkSeg("drive", 30, { elevation: -.6, slope: -12 });
  const profile = profileGeometry([sloped, belowDatum], 38);
  for (const segment of [sloped, belowDatum]) {
    const polygon = surfacePolygon(segment, 38, profile.baseDepth);
    check(polygon.height > Math.max(polygon.leftInset, polygon.rightInset), "profile has a positive depth below both surface edges");
    check(near(polygon.leftInset - polygon.rightInset, segment.w * segment.slope / 100 * 38), "surface silhouette matches slope, without a flat backing");
  }
  check(formatLevel(0) === "0.00" && formatLevel(-.00001) === "0.00", "zero datum has no negative zero");

  for (const kind of BUILDING_KINDS) for (const side of ["left", "right"] as Side[]) {
    const building = { ...DEFAULT_DOCUMENT[side], kind: kind.key };
    const spec = frontageSpec(building, side);
    check(!!SVG_SOURCES[spec.art.path], `original frontage vector exists: ${spec.art.path}`);
    check(spec.datumY >= 0 && spec.datumY <= spec.height, `frontage has a valid land datum: ${kind.key}`);
    const panels = frontagePanels(spec, 1800);
    check(panels.every((panel) => near(panel.y, -spec.datumY)), `frontage panels never repeat vertically: ${kind.key}`);
    if (!spec.repeat) check(panels.length === 1, `only one frontage illustration: ${kind.key}`);
    const layout = sceneGeometry(INITIAL, 1200, 1, { ...DEFAULT_DOCUMENT, [side]: building });
    const width = side === "left" ? layout.leftMarginWidth : layout.rightMarginWidth;
    check(width >= frontageWidthMetres(building, side) * layout.ppm, `frontage footprint fits its reserved margin: ${kind.key}`);
  }
  const water = frontageSpec({ ...DEFAULT_DOCUMENT.right, kind: "waterfront" }, "right");
  const seaPanels = frontagePanels(water, 2200);
  check(seaPanels.filter((panel) => !panel.art.onlyLayers).length === 1, "shore, rocks and seawall are drawn exactly once");
  const repeat = prepareArt(seaPanels[1].art);
  check(!repeat.content.includes('id="wall"') && !repeat.content.includes('id="rocks"'), "water extension contains water only");
  for (const floors of [1, 2, 4, 8]) {
    const building = { ...DEFAULT_DOCUMENT.left, kind: "apartments", floors };
    const spec = frontageSpec(building, "left");
    const prepared = prepareArt(spec.art);
    check(near(prepared.original.height, spec.height), `building crop and placement agree at ${floors} floors`);
    check((prepared.content.match(/<svg /g) ?? []).length === floors + 1, "building repeats storey slices, not whole buildings");
  }
  return count;
}