import type { CSSProperties, PointerEvent } from "react";
import { Accessibility, Bike, BusFront, Footprints, TramFront } from "lucide-react";
import { DEFS, cycleBuffers, minimumWidth, slopeAngle, type Building, type Marking, type Segment } from "../data/street";
import type { EnvironmentTheme } from "../data/editor";
import { formatMetres } from "../data/standards";
import type { SceneGeometry } from "../data/geometry";
import { NativeArt } from "../svg/NativeArt";
import { GroundedArt } from "../svg/GroundedArt";
import { Clouds } from "../svg/Backdrop";
import { SideScene } from "../svg/SideScene";
import { edgeLevels, formatLevel, LABEL_BAND_PX, profileGeometry, surfaceLevelAt, surfacePolygon } from "../data/profile";
import { LaneArrow } from "../svg/LaneArrow";
import { objectsFor } from "../data/objects";

export interface DragUi {
  mode: "move" | "add" | "resize";
  segment?: Segment;
  x: number;
  y: number;
  target: number | null;
}

export interface SceneProps {
  segments: Segment[];
  geometry: SceneGeometry;
  left: Building;
  right: Building;
  selected: string | null;
  buildingSelected: "left" | "right" | null;
  environment?: EnvironmentTheme;
  drag: DragUi | null;
  onPointerDown: (segment: Segment, event: PointerEvent<HTMLButtonElement>) => void;
  onResizeStart: (segment: Segment, edge: "left" | "right", event: PointerEvent<HTMLDivElement>) => void;
  onSelect: (id: string) => void;
  onSelectBuilding: (side: "left" | "right") => void;
  onDeselect: () => void;
}

export function LaneSymbol({ marking, segment }: { marking?: Marking; segment: Segment }) {
  const arrow = <LaneArrow movement={segment.movement} direction={segment.dir} />;
  switch (marking) {
    case "bike": return segment.type === "two-way-bike"
      ? <><LaneArrow direction="in" size={26} /><Bike size={21} /><LaneArrow direction="out" size={26} /></>
      : <><Bike size={21} />{arrow}</>;
    case "bus": return <><BusFront size={21} />{arrow}</>;
    case "shared": return <><BusFront size={18} /><Bike size={19} />{arrow}</>;
    case "rail": return <><TramFront size={21} />{arrow}</>;
    case "turn": return arrow;
    case "parking": return <span className="parking-mark">P</span>;
    case "accessible": case "boarding": return <Accessibility size={27} />;
    case "loading": return <span className="loading-mark">DROP OFF</span>;
    case "running": return <><Footprints size={22} />{arrow}</>;
    case "drive": return arrow;
    default: return null;
  }
}


export default function Scene({ segments, geometry: g, left, right, selected, buildingSelected, environment = "day", drag, onPointerDown, onResizeStart, onSelect, onSelectBuilding, onDeselect }: SceneProps) {
  const profile = profileGeometry(segments, g.ppm);
  const leftLevel = profile.edges[0]?.left ?? 0;
  const rightLevel = profile.edges[profile.edges.length - 1]?.right ?? 0;
  const variables = { "--profile-depth": `${profile.baseDepth}px`, "--label-depth": `${LABEL_BAND_PX}px` } as CSSProperties;
  // ?debug=layout overlays every segment's computed bounds (magenta) and every
  // artwork's box (cyan) so tiling vs. artwork overflow can be told apart.
  const debugLayout = typeof window !== "undefined" && new URLSearchParams(window.location.search).get("debug") === "layout";
  return (
    <div className={`street-scene${debugLayout ? " debug-layout" : ""}`} style={{ width: g.rowW, minWidth: g.rowW, ...variables }} data-ppm={g.ppm}>
      <div className="scene-sky" data-env={environment} onClick={onDeselect} aria-hidden="true">
        <Clouds w={g.rowW} h={155} environment={environment} />
      </div>

      <SideScene side="left" building={left} x={0} width={g.leftMarginWidth} ppm={g.ppm} baseDepth={profile.baseDepth} groundLevel={leftLevel} selected={buildingSelected === "left"} onSelect={() => onSelectBuilding("left")} />
      <SideScene side="right" building={right} x={g.origin + g.streetW} width={g.rightMarginWidth} ppm={g.ppm} baseDepth={profile.baseDepth} groundLevel={rightLevel} selected={buildingSelected === "right"} onSelect={() => onSelectBuilding("right")} />

      <div className="scene-street" style={{ left: g.origin, width: g.streetW }}>
        {segments.map((segment, index) => {
          const def = DEFS[segment.type];
          const objects = objectsFor(segment, segments);
          if (segment.type === "grass") {
            return <button key={segment.id} className="groundcover-object" style={{ left: g.offsets[index], width: segment.w * g.ppm, height: .4 * g.ppm, bottom: profile.datumBottom + surfaceLevelAt(segment, 0) * g.ppm, transform: `skewY(${-slopeAngle(segment.slope)}deg)`, transformOrigin: "0 100%" }} onPointerDown={(event) => onPointerDown(segment, event)} onClick={() => onSelect(segment.id)} aria-label="Edit grass strip">
              {Array.from({ length: Math.ceil(segment.w / 1.2) }, (_, i) => <span key={i} style={{ left: (i + 0.5) * 1.2 * g.ppm }}><NativeArt art={{ path: "plants/grass.svg" }} ppm={g.ppm} /></span>)}
            </button>;
          }
          return objects.map((object, objectIndex) => (
            <GroundedArt
              key={`${segment.id}-${objectIndex}`}
              art={object.art} ppm={g.ppm}
              x={g.offsets[index] + object.xM * g.ppm}
              bottom={profile.datumBottom + surfaceLevelAt(segment, object.xM) * g.ppm}
              angle={def.pole || def.canopy ? 0 : -slopeAngle(segment.slope)}
              zIndex={object.z}
              className={drag?.segment?.id === segment.id && drag.mode === "move" ? "drag-source" : ""}
              onPointerDown={(event) => onPointerDown(segment, event)}
              onClick={() => onSelect(segment.id)}
              label={`Edit ${def.label} | ${formatMetres(segment.w)} m`}
            />
          ));
        })}

        <div className="profile-surfaces" style={{ height: profile.baseDepth }}>
          {segments.map((segment, index) => {
            const def = DEFS[segment.type];
            const protectedLane = def.layout === "protected" || def.layout === "two-way";
            const buffers = cycleBuffers(segment, segments);
            const surface = segment.paint && def.paintable ? "green" : def.surface;
            const polygon = surfacePolygon(segment, g.ppm, profile.baseDepth);
            const centreInset = (polygon.leftInset + polygon.rightInset) / 2;
            const symbolPadding = def.layout === "loading"
              ? { [segment.side === "left" ? "paddingLeft" : "paddingRight"]: 1.53 * g.ppm }
              : protectedLane ? { paddingLeft: buffers.left * g.ppm, paddingRight: buffers.right * g.ppm } : {};
            return (
              <button
                key={segment.id}
                className={`profile-surface surface-${surface} ${selected === segment.id ? "is-selected" : ""} ${drag?.segment?.id === segment.id && drag.mode === "move" ? "drag-source" : ""}`}
                style={{ left: g.offsets[index], width: polygon.width, height: polygon.height, clipPath: polygon.clipPath }}
                onPointerDown={(event) => onPointerDown(segment, event)}
                onClick={() => onSelect(segment.id)}
                aria-pressed={selected === segment.id}
                aria-label={`${def.label}, ${formatMetres(segment.w)} metres wide. ${levelDescription(segment)}`}
                data-surface={segment.id} data-left-level={profile.edges[index].left} data-right-level={profile.edges[index].right}
              >
                {def.layout === "loading" && <span className={`access-aisle ${segment.side}`} style={{ width: 1.53 * g.ppm }}><Accessibility size={16} /></span>}
                {protectedLane && buffers.left > 0 && <span className="cycle-buffer" style={{ width: buffers.left * g.ppm }} />}
                {protectedLane && buffers.right > 0 && <span className="cycle-buffer right" style={{ width: buffers.right * g.ppm }} />}
                {def.layout === "drainage" && <span className="drainage-section" />}
                <span className={`lane-symbol profile-symbol ${def.surface === "walk" ? "on-sidewalk" : ""}`} style={{ top: centreInset + 8, ...symbolPadding }}>
                  <LaneSymbol marking={def.marking} segment={segment} />
                </span>
                <svg className="profile-outline" width={polygon.width} height={polygon.height} viewBox={`0 0 ${polygon.width} ${polygon.height}`} aria-hidden="true">
                  {def.surface === "planting" && <path d={`M0 ${polygon.leftInset}L${polygon.width} ${polygon.rightInset}v6L0 ${polygon.leftInset + 6}Z`} fill="#72624d" />}
                  <path className="surface-top-edge" d={`M0 ${polygon.leftInset}L${polygon.width} ${polygon.rightInset}`} fill="none" />
                  <path className="surface-selection-edge" d={`M0 ${polygon.leftInset}L${polygon.width} ${polygon.rightInset}V${polygon.height}H0Z`} fill="none" />
                </svg>
                {/* Left / Right Edge Resize Handles.
                    The left grip moves the shared boundary with the previous
                    segment (total width kept); the first segment has no left
                    neighbour, so it only gets the right grip. */}
                {index > 0 && (
                  <div
                    className="segment-edge-resize edge-left"
                    aria-label={`Drag to move the boundary between ${def.label} and the previous segment`}
                    title="Drag to move the shared boundary with the previous segment"
                    onPointerDown={(event) => onResizeStart(segment, "left", event)}
                    onClick={(event) => event.stopPropagation()}
                  >
                    <span className="edge-resize-grip" aria-hidden="true">⇔</span>
                  </div>
                )}
                <div
                  className="segment-edge-resize edge-right"
                  aria-label={`Drag to resize ${def.label} right edge`}
                  title={`Drag to resize ${def.label} (shifts segments to the right)`}
                  onPointerDown={(event) => onResizeStart(segment, "right", event)}
                  onClick={(event) => event.stopPropagation()}
                >
                  <span className="edge-resize-grip" aria-hidden="true">⇔</span>
                </div>
              </button>
            );
          })}
        </div>

        {debugLayout && segments.map((segment, di) => (
          <div
            key={`debug-${segment.id}`}
            className="debug-segment-box"
            style={{ left: g.offsets[di], width: segment.w * g.ppm }}
            aria-hidden="true"
          >
            <span>#{di} {segment.w.toFixed(2)} m</span>
            <span>off {Math.round(g.offsets[di])} px</span>
          </div>
        ))}

        {drag?.target != null && <div className="insertion-line" style={{ left: g.offsets[drag.target] ?? g.streetW }} aria-hidden="true" />}

        <div className="segment-labels">
          {segments.map((segment) => <button key={segment.id} className={`segment-label ${selected === segment.id ? "is-selected" : ""}`} style={{ width: segment.w * g.ppm }} onClick={() => onSelect(segment.id)} onPointerDown={(event) => onPointerDown(segment, event)} title={`${DEFS[segment.type].label}: ${formatMetres(segment.w)} m. ${levelDescription(segment)} Minimum width ${formatMetres(minimumWidth(segment, segments))} m`}>
            <span className="segment-ruler" style={{ backgroundSize: `${g.ppm / 2}px 10px, ${g.ppm / 10}px 5px` }} />
            <strong>{formatMetres(segment.w)} m</strong>
            <span className="segment-name">{DEFS[segment.type].label}</span>
            <LevelReadout segment={segment} compact={segment.w * g.ppm < 100} />
          </button>)}
        </div>
      </div>
    </div>
  );
}

function levelDescription(segment: Segment): string {
  const { left, right } = edgeLevels(segment);
  return segment.slope === 0 ? `Level ${formatLevel(left)} m relative to zero.`
    : `Left level ${formatLevel(left)} m; right level ${formatLevel(right)} m, relative to zero.`;
}

export function LevelReadout({ segment, compact = false }: { segment: Segment; compact?: boolean }) {
  const { left, right } = edgeLevels(segment);
  return segment.slope === 0 ? <span className="level-single" aria-label={levelDescription(segment)}>{formatLevel(left)} m</span>
    : <span className={`level-edges ${compact ? "compact" : ""}`} aria-label={levelDescription(segment)}>
      <span><i>L</i> {formatLevel(left)}<small> m</small></span>
      <span><i>R</i> {formatLevel(right)}<small> m</small></span>
    </span>;
}
