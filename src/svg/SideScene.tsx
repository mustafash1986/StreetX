import { useId, useMemo } from "react";
import type { Building, Side } from "../data/street";
import { frontagePanels, frontageSpec, type FrontagePanel } from "../data/frontages";
import { artPlacement, isolateSvgIds, measureBounds, prepareArt, type Illustration } from "./library";

function SourcePanel({ panel }: { panel: FrontagePanel }) {
  const prepared = useMemo(() => prepareArt(panel.art), [panel.art.path, panel.art.floors, panel.art.facadeColor, panel.art.facadeShadow, panel.art.onlyLayers?.join(",")]);
  const prefix = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const content = useMemo(() => isolateSvgIds(prepared.content, `frontage-${prefix}`), [prepared, prefix]);
  const box = panel.viewBox;
  return <svg
    x={panel.x} y={panel.y} width={box.width} height={box.height}
    viewBox={`${box.x} ${box.y} ${box.width} ${box.height}`}
    overflow="hidden" preserveAspectRatio="xMinYMin meet"
    data-frontage-panel={panel.art.onlyLayers?.join(",") ?? "main"}
    fillRule="evenodd" clipRule="evenodd" strokeLinejoin="round" strokeMiterlimit={2}
  ><g dangerouslySetInnerHTML={{ __html: content }} /></svg>;
}

function GardenPlant({ path, center }: { path: string; center: number }) {
  const art: Illustration = { path };
  const prepared = prepareArt(art);
  const bounds = measureBounds(prepared);
  const placement = artPlacement(art, prepared, bounds, 100);
  return <SourcePanel panel={{ art, x: center + placement.offsetX, y: -placement.pivotY, viewBox: bounds }} />;
}

interface SideSceneProps {
  side: Side;
  building: Building;
  x: number;
  width: number;
  ppm: number;
  baseDepth: number;
  groundLevel: number;
  selected: boolean;
  onSelect: () => void;
}

export function SideScene({ side, building, x, width, ppm, baseDepth, groundLevel, selected, onSelect }: SideSceneProps) {
  const spec = frontageSpec(building, side);
  const scale = ppm / 100;
  const availableCm = width / scale;
  const panels = frontagePanels(spec, availableCm);
  const aboveCm = building.kind === "garden" ? Math.max(spec.datumY, 700) : spec.datumY;
  const height = Math.ceil(Math.max(1, aboveCm * scale + baseDepth + groundLevel * ppm));
  const landY = height - baseDepth - groundLevel * ppm;
  const isWater = building.kind === "waterfront";
  const mirrored = isWater && side === "left";
  const startX = mirrored ? width : side === "left" && !spec.repeat ? width - spec.width * scale : 0;
  const fillTop = isWater ? landY + (spec.height - spec.datumY) * scale : landY;

  return <button
    className={`frontage-zone ${selected ? "is-selected" : ""}`}
    style={{ left: x, width }} onClick={onSelect}
    data-frontage={side} data-frontage-kind={building.kind} data-ground-level={groundLevel}
    aria-label={`Edit ${side} side of the street`}
  >
    <svg className="frontage-plane" width={width} height={height} viewBox={`0 0 ${width} ${height}`} aria-hidden="true">
      {fillTop < height && <rect x={0} y={Math.max(0, fillTop)} width={width} height={height - Math.max(0, fillTop)} fill={spec.groundColor} />}
      <g transform={`translate(${startX} ${landY}) scale(${mirrored ? -scale : scale} ${scale})`}>
        {panels.map((panel, i) => <SourcePanel key={`${building.kind}-${i}`} panel={panel} />)}
        {building.kind === "garden" && <>
          <GardenPlant path="trees/tree.svg" center={availableCm * (side === "left" ? .32 : .68)} />
          <GardenPlant path="plants/bush.svg" center={availableCm * .48} />
          <GardenPlant path="plants/flowers-yellow.svg" center={availableCm * (side === "left" ? .8 : .2)} />
        </>}
      </g>
    </svg>
    <span className="frontage-selection" aria-hidden="true" />
  </button>;
}