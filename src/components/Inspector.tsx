import { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, Copy, ExternalLink, Link2, Minus, MoveVertical, Plus, TrafficCone, Trash2, X } from "lucide-react";
import {
  BLD_STYLES, BUILDING_KINDS, buildingKind, clampElevation, CURB_HEIGHT, DEFS, getVariant, getWidthRule, minimumWidth,
  segmentIllustration, separatorWidth, cycleBuffers, steppedLevelEnd, steppedLevelStart, steppedWidth,
  type Building, type Segment,
} from "../data/street";
import { formatMetres, SOURCES } from "../data/standards";
import { edgeLevels, formatLevel } from "../data/profile";
import { NativeArt } from "../svg/NativeArt";
import { frontageSpec } from "../data/frontages";
import { LevelReadout } from "./Scene";
import { hasTurnChoices, LANE_MOVEMENTS, movementLabel } from "../data/directions";
import { LaneArrow } from "../svg/LaneArrow";

interface SegmentInspectorProps {
  segment: Segment;
  segments: Segment[];
  onUpdate: (patch: Partial<Segment>) => void;
  onMatch: (edge: "start" | "end") => void;
  onDuplicate: () => void;
  onRemove: () => void;
  onMove: (delta: -1 | 1) => void;
  onClose: () => void;
}

function LevelInput({ label, value, onChange, onStep, error, setError }: {
  label: string; value: number; onChange: (value: number) => void; onStep: (change: -1 | 1) => void; error: string; setError: (value: string) => void;
}) {
  const [draft, setDraft] = useState(formatLevel(value));
  useEffect(() => setDraft(formatLevel(value)), [value]);
  const apply = () => {
    const parsed = Number(draft);
    if (!Number.isFinite(parsed) || parsed < -.6 || parsed > .9) { setDraft(formatLevel(value)); setError("Levels must be between -0.60 m and +0.90 m."); return; }
    setError(""); onChange(clampElevation(parsed));
  };
  return <label className="edge-level-input"><span>{label}</span><div className="edge-stepper">
    <button type="button" onClick={() => onStep(-1)} aria-label={`Lower ${label}`}><Minus size={14} /></button>
    <input value={draft} inputMode="decimal" type="number" min="-0.6" max="0.9" step="0.01" onChange={(event) => setDraft(event.target.value)} onBlur={apply} onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); apply(); } }} aria-label={`${label} level in metres`} />
    <button type="button" onClick={() => onStep(1)} aria-label={`Raise ${label}`}><Plus size={14} /></button>
  </div><small>m vs. datum</small>{error && <em>{error}</em>}</label>;
}

export function SegmentInspector({ segment, segments, onUpdate, onMatch, onDuplicate, onRemove, onMove, onClose }: SegmentInspectorProps) {
  const def = DEFS[segment.type];
  const rule = getWidthRule(segment);
  const min = minimumWidth(segment, segments);
  const index = segments.findIndex((item) => item.id === segment.id);
  const [draft, setDraft] = useState(String(segment.w));
  const [widthError, setWidthError] = useState("");
  const [levelError, setLevelError] = useState("");
  const levels = edgeLevels(segment);
  useEffect(() => { setDraft(String(segment.w)); setWidthError(""); }, [segment.id, segment.w]);
  const applyWidth = () => {
    const value = Number(draft);
    if (draft.trim() === "" || !Number.isFinite(value) || value < min || value > 30) { setDraft(String(segment.w)); setWidthError(`Enter a width from ${formatMetres(min)} to 30 m.`); return; }
    setWidthError(""); onUpdate({ w: value });
  };
  const setFlat = (level: number) => onUpdate({ levelStart: clampElevation(level), levelEnd: clampElevation(level) });
  const art = segmentIllustration(segment);
  return <section className="element-inspector inspector-enter" aria-label={`Edit ${def.label}`}>
    <header className="inspector-heading"><h2>{def.label}</h2><button onClick={onClose} aria-label="Close element editor"><X size={17} /></button></header>
    <div className="inspector-content">
      <form onSubmit={(event) => { event.preventDefault(); applyWidth(); }}>
        <div className="inspector-label"><label htmlFor="segment-width">Width</label><span>Min. {formatMetres(min)} m</span></div>
        <div className="width-stepper"><button type="button" onClick={() => onUpdate({ w: steppedWidth(segment, -1, segments) })} disabled={segment.w <= min + .0001} aria-label="Decrease segment width"><Minus size={17} /></button><div><input id="segment-width" type="number" inputMode="decimal" min={min} max={30} step=".01" value={draft} aria-invalid={!!widthError} onChange={(event) => setDraft(event.target.value)} onBlur={applyWidth} /><span>m</span></div><button type="button" onClick={() => onUpdate({ w: steppedWidth(segment, 1, segments) })} disabled={segment.w >= 30} aria-label="Increase segment width"><Plus size={17} /></button></div>
        <p className={widthError ? "width-error" : "width-hint"}>{widthError || (segment.w <= min + .0001 ? "At the minimum width for this category." : "Artwork stays the same size when you change the width.")}</p>
      </form>
      {def.variants.length > 1 && <div className="variant-control">{art && <NativeArt art={art} ppm={38} thumbnail={{ width: 48, height: 44 }} />}<label>{segment.type === "parking" ? "Parking layout" : segment.type === "walk" || segment.type === "peoplewalk" || segment.type === "running" ? "Person" : "Illustration"}<select aria-label={segment.type === "parking" ? "Parking layout" : "Illustration variant"} value={getVariant(segment).id} onChange={(event) => {
        const variant = event.target.value;
        if (segment.type !== "parking") { onUpdate({ variant }); return; }
        // Each parking layout has its own standard bay width: switching layout
        // resizes the bay to match instead of keeping the previous layout's width.
        const standard: Record<string, number> = { parallel: 2.3, "angled-front": 4.8, "angled-rear": 4.8, perpendicular: 5 };
        onUpdate({ variant, w: standard[variant] ?? segment.w });
      }}>{segment.type === "walk"
        ? (<><optgroup label="Adults">{def.variants.filter((item) => !item.id.startsWith("kid-")).map((variant) => <option key={variant.id} value={variant.id}>{variant.label}</option>)}</optgroup><optgroup label="Children">{def.variants.filter((item) => item.id.startsWith("kid-")).map((variant) => <option key={variant.id} value={variant.id}>{variant.label}</option>)}</optgroup></>)
        : def.variants.map((variant) => <option key={variant.id} value={variant.id}>{variant.label}</option>)}</select></label></div>}
      {(segment.type === "walk" || segment.type === "peoplewalk") && <p className="inspector-caption">The official set covers men, women and seniors — the preview above shows the selected person. Children are grouped at the bottom of the list. For a busy sidewalk use People sidewalk, which places three people together.</p>}
      {def.directional && (!getVariant(segment).art || (getVariant(segment).art?.path ?? "").includes("{dir}")) && <div className="inspector-row"><span>Travel direction</span><div className="option-buttons"><button aria-pressed={segment.dir === "in"} onClick={() => onUpdate({ dir: "in" })}><LaneArrow direction="in" size={23} /> Toward</button><button aria-pressed={segment.dir === "out"} onClick={() => onUpdate({ dir: "out" })}><LaneArrow direction="out" size={23} /> Away</button></div></div>}
      {hasTurnChoices(def.marking) && <div className="lane-movement-control"><div className="inspector-label"><span>Lane arrows</span><span>{movementLabel(segment.movement)}</span></div><div className="lane-movement-choices" role="group" aria-label="Permitted lane directions">{LANE_MOVEMENTS.map((movement) => <button type="button" key={movement.id} title={movement.label} aria-label={movement.label} aria-pressed={segment.movement === movement.id} onClick={() => onUpdate({ movement: movement.id })}><LaneArrow movement={movement.id} direction={segment.dir} size={29} /></button>)}</div>{segment.movement === "shared" && <p className="inspector-caption">Opposing turn arrows represent a shared centre turning lane. Check local signing and traffic rules.</p>}</div>}
      {segment.type === "train" && <p className="inspector-caption">Original Streetmix locomotive, shown end-on. The arrow indicates travel direction; the library supplies one locomotive view.</p>}
      {def.sideControl && (segment.type !== "parking" || (getVariant(segment).art?.path ?? "").includes("{side}")) && <div className="inspector-row door-control"><span>{def.sideControl === "door" ? "Door / access aisle" : "Orientation"}</span><div className="option-buttons"><button aria-label={def.sideControl === "door" ? "Open left taxi door" : "Face left"} aria-pressed={segment.side === "left"} onClick={() => onUpdate({ side: "left" })}><ArrowLeft size={14} /> Left</button><button aria-label={def.sideControl === "door" ? "Open right taxi door" : "Face right"} aria-pressed={segment.side === "right"} onClick={() => onUpdate({ side: "right" })}>Right <ArrowRight size={14} /></button></div></div>}
      {segment.type === "parking" && <p className="inspector-caption">Parallel bays face travel direction; angled and perpendicular bays use left/right orientation. Width minimum follows the chosen layout.</p>}
      {def.sideControl === "door" && <p className="inspector-caption">Left/right as shown. A 1.53 m access aisle moves with the door; the car is never stretched.</p>}
      {def.paintable && <div className="inspector-row"><span>Lane surface</span><div className="option-buttons"><button aria-pressed={!segment.paint} onClick={() => onUpdate({ paint: false })}>Asphalt</button><button aria-pressed={segment.paint} onClick={() => onUpdate({ paint: true })}><i className="paint-dot" /> Green</button></div></div>}
      <div className="level-control">
        <div className="inspector-label"><span><MoveVertical size={13} /> Edge levels</span><span>{segment.slope === 0 ? "Flat" : `${segment.slope > 0 ? "Rises" : "Falls"} ${Math.abs(segment.slope).toFixed(2)}%`}</span></div>
        <div className="edge-levels"><LevelInput label="Left / start" value={levels.left} onChange={(value) => onUpdate({ levelStart: value })} onStep={(change) => onUpdate({ levelStart: steppedLevelStart(segment, change) })} error={levelError} setError={setLevelError} /><LevelInput label="Right / end" value={levels.right} onChange={(value) => onUpdate({ levelEnd: value })} onStep={(change) => onUpdate({ levelEnd: steppedLevelEnd(segment, change) })} error={levelError} setError={setLevelError} /></div>
        <div className="profile-join-actions"><button disabled={index === 0} onClick={() => onMatch("start")} title="Match this start level to the previous segment end"><Link2 size={12} /> Match previous end</button><button disabled={index === segments.length - 1} onClick={() => onMatch("end")} title="Match this end level to the next segment start"><Link2 size={12} /> Match next start</button></div>
        <div className="level-presets"><button aria-pressed={segment.slope === 0 && Math.abs(levels.left) < .001} onClick={() => setFlat(0)}>Roadway 0</button><button aria-pressed={segment.slope === 0 && Math.abs(levels.left - CURB_HEIGHT) < .001} onClick={() => setFlat(CURB_HEIGHT)}>Curb +15 cm</button><button aria-pressed={segment.slope === 0 && Math.abs(levels.left - .3) < .001} onClick={() => setFlat(.3)}>Raised +30 cm</button></div>
        <div className="profile-readout"><span>Slope calculated from edges</span><LevelReadout segment={segment} /></div>
        <p className="inspector-caption"><TrafficCone size={12} /> Enter the two physical edge levels. Slope is calculated as (right − left) / width. Match copies the neighbor's exact level as a one-shot join — editing either side afterwards detaches the joint again.</p>
      </div>
      <details className="width-guidance"><summary>Why this minimum?</summary><span className="rule-basis">{rule.basis}</span><p>{rule.note}</p>{min > rule.minM && <p>{def.layout === "protected" || def.layout === "two-way" ? `Adjacent traffic requires ${formatMetres(cycleBuffers(segment, segments).left)} m left and ${formatMetres(cycleBuffers(segment, segments).right)} m right separation.` : `Parking/loading adjacency adds a wider ${formatMetres(separatorWidth(segment, segments))} m buffer.`}</p>}{rule.sources.map((key) => <a key={key} href={SOURCES[key].url} target="_blank" rel="noreferrer">{SOURCES[key].title}<ExternalLink size={11} /></a>)}</details>
      <div className="inspector-actions"><div><button onClick={() => onMove(-1)} disabled={index === 0} title="Move segment left" aria-label="Move segment left"><ArrowLeft size={15} /></button><button onClick={() => onMove(1)} disabled={index === segments.length - 1} title="Move segment right" aria-label="Move segment right"><ArrowRight size={15} /></button><button onClick={onDuplicate} title="Duplicate this segment with all settings" aria-label="Duplicate segment"><Copy size={13} /> Duplicate</button></div><button className="remove-element" onClick={onRemove} disabled={segments.length === 1}><Trash2 size={14} /> Remove</button></div>
    </div>
  </section>;
}

export function BuildingInspector({ building, side, onUpdate, onClose }: { building: Building; side: "left" | "right"; onUpdate: (patch: Partial<Building>) => void; onClose: () => void }) {
  const kind = buildingKind(building.kind);
  return <section className="element-inspector inspector-enter" aria-label="Edit building"><header className="inspector-heading"><h2>{side === "left" ? "Left" : "Right"} frontage</h2><button onClick={onClose} aria-label="Close building editor"><X size={17} /></button></header><div className="inspector-content"><div className="inspector-label"><span>What is beside the street?</span></div><div className="kind-grid">{BUILDING_KINDS.map((entry) => <button key={entry.key} className="kind-option" aria-pressed={building.kind === entry.key} title={entry.hint} onClick={() => onUpdate({ kind: entry.key })}><span className="kind-preview"><NativeArt art={frontageSpec({ ...building, kind: entry.key, floors: 2 }, side).art} ppm={38} thumbnail={{ width: 48, height: 32 }} /></span><span>{entry.label}</span></button>)}</div><p className="inspector-caption">{kind.hint}</p><p className="inspector-caption">Ground follows the adjacent street edge. Frontage artwork stays inside this side of the right-of-way.</p>{kind.hasStyle && <><div className="inspector-label"><span>Facade colour</span></div><div className="building-styles">{BLD_STYLES.map((style) => <button key={style.key} title={style.name} aria-label={style.name} aria-pressed={building.style === style.key} onClick={() => onUpdate({ style: style.key })} style={{ background: style.facade }}><span style={{ background: style.pane }} /><span style={{ background: style.pane }} /></button>)}</div></>}{kind.hasFloors && <><div className="inspector-label"><span>Floors</span><span>Outside the street right-of-way</span></div><div className="width-stepper"><button onClick={() => onUpdate({ floors: building.floors - 1 })} disabled={building.floors <= 1} aria-label="Remove building floor"><Minus size={17} /></button><strong>{building.floors} floors</strong><button onClick={() => onUpdate({ floors: building.floors + 1 })} disabled={building.floors >= 8} aria-label="Add building floor"><Plus size={17} /></button></div></>}</div></section>;
}