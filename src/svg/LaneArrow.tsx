import { useId, useMemo } from "react";
import { arrowAssetPath, type LaneMovement } from "../data/directions";
import { isolateSvgIds, prepareArt } from "./library";

export function arrowContent(movement: LaneMovement, direction: "in" | "out") {
  // Keep the shared 120x120 design grid: normalising each path independently
  // would change the shaft widths between simple and combined arrows.
  return prepareArt({ path: arrowAssetPath(movement, direction) }).content.replace(/fill:white/g, "fill:currentColor");
}

export function LaneArrow({ movement = "straight", direction, size = 32 }: {
  movement?: LaneMovement; direction: "in" | "out"; size?: number;
}) {
  const prefix = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const content = useMemo(() => isolateSvgIds(arrowContent(movement, direction), `arrow-${prefix}`), [movement, direction, prefix]);
  return <svg className="lane-direction-arrow" width={size} height={size} viewBox="0 0 120 120" aria-hidden="true" fillRule="evenodd" clipRule="evenodd" data-movement={movement} data-direction={direction}>
    <g dangerouslySetInnerHTML={{ __html: content }} />
  </svg>;
}