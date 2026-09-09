import { useCallback, useEffect, useLayoutEffect, useMemo, useReducer, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { Check, ChevronDown, LocateFixed, MapPin, Minus, Moon, Plus, Sun, Sunrise, Cloud, Users } from "lucide-react";
import Scene, { type DragUi } from "./components/Scene";
import { Palette, PalettePreview } from "./components/Palette";
import { AboutDialog, GuidanceDialog, Toast, TopBar, WelcomeDialog } from "./components/Chrome";
import { BuildingInspector, SegmentInspector } from "./components/Inspector";
import { CapacityDialog } from "./components/CapacityDialog";
import { DEFS, INITIAL, PALETTE, TEMPLATE_MAIN, minimumWidth, mkId, mkSeg, normalizeSegments, streetMinimum, streetWidth, type Building, type PaletteItem, type Segment } from "./data/street";
import { calculateCapacity, formatDimension } from "./data/analytics";
import { encodeStreet, editorReducer, initialEditorState, normalizeDocument, STORAGE_KEY, type StreetDocument, type EnvironmentTheme } from "./data/editor";
import { insertionIndex, sceneGeometry } from "./data/geometry";
import { formatMetres } from "./data/standards";
import { runModelChecks } from "./data/modelChecks";
import { ExportDialog } from "./components/ExportDialog";
import type { ExportFormat } from "./export/types";

if (import.meta.env.DEV) runModelChecks();

interface DragSession {
  mode: "move" | "add" | "resize";
  segment: Segment;
  edge?: "left" | "right";
  startX: number;
  startY: number;
  startWidth?: number;
  // Left-edge resize moves the shared boundary with the previous segment, so
  // the neighbour's width is tracked alongside (total street width is kept).
  neighborId?: string | null;
  startNeighborWidth?: number;
  // Last committed widths during a resize drag. Compared to detect change —
  // never mutate `session.segment` (it aliases live editor state and undo).
  lastWidth?: number;
  lastNeighborWidth?: number;
  pointerId: number;
  pointerType: string;
  active: boolean;
  target: number | null;
}

const isEditingText = (target: EventTarget | null) =>
  target instanceof HTMLElement && !!target.closest("input, textarea, select, [contenteditable=true]");

export default function App() {
  const [state, dispatch] = useReducer(editorReducer, undefined, initialEditorState);
  const street = state.present;
  const [selected, setSelected] = useState<string | null>(null);
  const [buildingSelected, setBuildingSelected] = useState<"left" | "right" | null>(null);
  const [zoom, setZoom] = useState(1);
  const [viewportWidth, setViewportWidth] = useState(window.innerWidth);
  const [scrollLeft, setScrollLeft] = useState(0);
  const [welcome, setWelcome] = useState(() => {
    try {
      return !sessionStorage.getItem("streetx.welcome.v4");
    } catch {
      return true;
    }
  });
  const [modal, setModal] = useState<"guidance" | "about" | "capacity" | null>(null);
  const [exportFormat, setExportFormat] = useState<ExportFormat | null>(null);
  const [toast, setToast] = useState({ message: "", serial: 0 });
  const [saved, setSaved] = useState(true);
  const [drag, setDrag] = useState<DragUi | null>(null);
  const [widthMenuOpen, setWidthMenuOpen] = useState(false);
  const [locationInputOpen, setLocationInputOpen] = useState(false);

  const viewer = useRef<HTMLDivElement>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const dragSession = useRef<DragSession | null>(null);
  const suppressClickUntil = useRef(0);
  const desiredCameraCenter = useRef<number | null>(null);

  const geometry = useMemo(
    () => sceneGeometry(street.segments, viewportWidth, zoom, street),
    [street.segments, street.left, street.right, viewportWidth, zoom]
  );
  const chosen = street.segments.find((segment) => segment.id === selected);
  const capacity = useMemo(() => calculateCapacity(street.segments), [street.segments]);
  const currentWidth = useMemo(() => streetWidth(street.segments), [street.segments]);
  const showToast = useCallback((message: string) => setToast((value) => ({ message, serial: value.serial + 1 })), []);

  useEffect(() => {
    if (!toast.message) return;
    const timer = window.setTimeout(() => setToast((value) => ({ ...value, message: "" })), 4200);
    return () => window.clearTimeout(timer);
  }, [toast.serial]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(street));
      setSaved(true);
    } catch {
      setSaved(false);
    }
    document.title = `${street.name} — Streetx`;
  }, [street]);

  // Observe the viewport for the life of the component, but only centre the
  // camera on first mount. Re-centring on every street edit yanks the scroll
  // position while the user is resizing, typing widths, or adding segments.
  useLayoutEffect(() => {
    const element = viewer.current;
    if (!element) return;
    const observer = new ResizeObserver(() => setViewportWidth(element.clientWidth));
    observer.observe(element);
    setViewportWidth(element.clientWidth);
    element.scrollLeft = Math.max(0, geometry.origin + geometry.streetW / 2 - element.clientWidth / 2);
    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useLayoutEffect(() => {
    if (desiredCameraCenter.current === null || !viewer.current) return;
    viewer.current.scrollLeft = geometry.origin + desiredCameraCenter.current * geometry.ppm - viewportWidth / 2;
    desiredCameraCenter.current = null;
  }, [zoom, geometry, viewportWidth]);

  // Manifest shortcuts (Start-menu / app shortcuts) hand us query params.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setSelected(null);
    setBuildingSelected(null);
    if (params.get("new") === "1") {
      loadTemplate(false);
      if (history.replaceState) {
        const url = new URL(window.location.href);
        url.searchParams.delete("new");
        history.replaceState(null, "", url);
      }
    } else if (params.get("guide") === "1") {
      setModal("guidance");
      if (history.replaceState) {
        const url = new URL(window.location.href);
        url.searchParams.delete("guide");
        history.replaceState(null, "", url);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const dismissWelcome = () => {
    setWelcome(false);
    try {
      sessionStorage.setItem("streetx.welcome.v4", "1");
    } catch {
      /* Storage is optional. */
    }
  };

  const commit = (document: StreetDocument) => {
    if ((document.left !== street.left || document.right !== street.right) && viewer.current) {
      desiredCameraCenter.current = (viewer.current.scrollLeft + viewportWidth / 2 - geometry.origin) / geometry.ppm;
    }
    dispatch({ type: "commit", document });
  };

  const selectSegment = (id: string) => {
    if (Date.now() < suppressClickUntil.current) return;
    setSelected(id);
    setBuildingSelected(null);
    dismissWelcome();
  };

  const updateSegment = (patch: Partial<Segment>) => {
    if (!chosen) return;
    const selectedIndex = street.segments.findIndex((segment) => segment.id === chosen.id);
    const next = { ...chosen, ...patch };
    const minimum = minimumWidth(next, street.segments);
    if (typeof patch.w === "number" && patch.w < minimum) {
      showToast(`${DEFS[next.type].label} cannot be narrower than ${formatMetres(minimum)} m.`);
    }
    const segments = street.segments.map((segment, index) => (index === selectedIndex ? next : segment));
    commit({ ...street, segments: normalizeSegments(segments) });
  };

  const matchProfileEdge = (edge: "start" | "end") => {
    if (!chosen) return;
    const index = street.segments.findIndex((segment) => segment.id === chosen.id);
    const neighbor = edge === "start" ? street.segments[index - 1] : street.segments[index + 1];
    if (!neighbor) return;
    const level = edge === "start" ? neighbor.levelEnd : neighbor.levelStart;
    const segments = street.segments.map((segment, i) => {
      if (i === index) return { ...segment, [edge === "start" ? "levelStart" : "levelEnd"]: level };
      return segment;
    });
    commit({ ...street, segments: normalizeSegments(segments) });
  };

  const duplicateSegment = (id: string) => {
    const index = street.segments.findIndex((s) => s.id === id);
    if (index < 0) return;
    const source = street.segments[index];
    const clone: Segment = { ...source, id: mkId() };
    addSegment(clone, index + 1);
    showToast(`Duplicated ${DEFS[source.type].label}`);
  };

  const addSegment = (segment: Segment, at?: number) => {
    if (street.segments.length >= 120) {
      showToast("This street has reached the 120-element editing limit.");
      return;
    }
    const selectedIndex = street.segments.findIndex((entry) => entry.id === selected);
    const index = at ?? (selectedIndex >= 0 ? selectedIndex + 1 : Math.max(0, street.segments.length - 1));
    const next = [...street.segments];
    next.splice(index, 0, segment);
    commit({ ...street, segments: next });
    setSelected(segment.id);
    setBuildingSelected(null);
    dismissWelcome();
    showToast(`${DEFS[segment.type].label} added. Existing artwork keeps its scale.`);
  };

  const moveSegment = (id: string, destination: number) => {
    const index = street.segments.findIndex((segment) => segment.id === id);
    if (index < 0 || destination < 0 || destination >= street.segments.length || index === destination) return;
    const next = [...street.segments];
    const [segment] = next.splice(index, 1);
    next.splice(destination, 0, segment);
    commit({ ...street, segments: next });
    setSelected(id);
    setBuildingSelected(null);
  };

  const startDrag = (mode: "move" | "add", segment: Segment, event: ReactPointerEvent<HTMLButtonElement>) => {
    if (event.button !== 0 || !event.isPrimary) return;
    dragSession.current = {
      mode,
      segment,
      startX: event.clientX,
      startY: event.clientY,
      pointerId: event.pointerId,
      pointerType: event.pointerType,
      active: false,
      target: null,
    };
    if (event.pointerType !== "touch") {
      try {
        event.currentTarget.setPointerCapture(event.pointerId);
      } catch {
        /* Capture can be unavailable after a touch cancellation. */
      }
    }
  };

  const startResize = (segment: Segment, edge: "left" | "right", event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.button !== 0 || !event.isPrimary) return;
    event.preventDefault();
    event.stopPropagation();
    const index = street.segments.findIndex((entry) => entry.id === segment.id);
    const neighbor = edge === "left" && index > 0 ? street.segments[index - 1] : null;
    dragSession.current = {
      mode: "resize",
      segment,
      edge,
      startX: event.clientX,
      startY: event.clientY,
      startWidth: segment.w,
      neighborId: neighbor?.id ?? null,
      startNeighborWidth: neighbor?.w,
      lastWidth: segment.w,
      lastNeighborWidth: neighbor?.w,
      pointerId: event.pointerId,
      pointerType: event.pointerType,
      active: false,
      target: null,
    };
    try {
      event.currentTarget.setPointerCapture(event.pointerId);
    } catch {
      /* Capture available on supported browsers. */
    }
  };

  const onDragMove = (event: PointerEvent) => {
    const session = dragSession.current;
    const node = viewer.current;
    if (!session || !node || event.pointerId !== session.pointerId) return;
    const dx = event.clientX - session.startX;
    const dy = event.clientY - session.startY;

    // Interactive segment width resizing
    if (session.mode === "resize" && session.edge && session.startWidth !== undefined) {
      session.active = true;
      event.preventDefault();
      const rect = node.getBoundingClientRect();
      if (event.clientY >= rect.top && event.clientY <= rect.bottom) {
        if (event.clientX < rect.left + 32) node.scrollLeft -= 18;
        if (event.clientX > rect.right - 32) node.scrollLeft += 18;
      }
      const quantize = (value: number) => Number((Math.round(value * 10) / 10).toFixed(1));
      // A quantized width must never dip below its minimum: round the minimum
      // itself *up* to the next tenth when clamping.
      const fitMinimum = (quantized: number, minimum: number) =>
        quantized < minimum ? Math.ceil(minimum * 10 - 1e-6) / 10 : quantized;

      if (session.edge === "left" && session.neighborId && session.startNeighborWidth !== undefined) {
        // Left-edge drag moves the shared boundary with the previous segment:
        // dragging left grows this segment out of the neighbour (dragging
        // right gives space back), so the edge under the cursor is the edge
        // that moves. Total street width stays constant.
        const self = street.segments.find((entry) => entry.id === session.segment.id);
        const neighbor = street.segments.find((entry) => entry.id === session.neighborId);
        if (!self || !neighbor) return;
        const minSelf = minimumWidth(self, street.segments);
        const minNeighbor = minimumWidth(neighbor, street.segments);
        const rawSelf = Math.min(30, Math.max(minSelf, session.startWidth - dx / geometry.ppm));
        let delta = rawSelf - session.startWidth;
        // Limit the transfer to what the neighbour can give or take.
        const maxGrow = Math.max(0, session.startNeighborWidth - minNeighbor);
        const maxShrink = Math.max(0, 30 - session.startNeighborWidth);
        delta = Math.min(Math.max(delta, -maxShrink), maxGrow);
        const selfWidth = fitMinimum(quantize(session.startWidth + delta), minSelf);
        const neighborWidth = fitMinimum(quantize(session.startNeighborWidth - delta), minNeighbor);
        if (selfWidth !== session.lastWidth || neighborWidth !== session.lastNeighborWidth) {
          const segments = street.segments.map((entry) => {
            if (entry.id === self.id) return { ...entry, w: selfWidth };
            if (entry.id === neighbor.id) return { ...entry, w: neighborWidth };
            return entry;
          });
          // Edge levels are untouched, so normalizeSegments re-derives each
          // slope from the same levels and the new widths.
          commit({ ...street, segments: normalizeSegments(segments) });
          session.lastWidth = selfWidth;
          session.lastNeighborWidth = neighborWidth;
        }
      } else {
        // Right-edge drag resizes this segment and shifts everything to its
        // right, changing total street width.
        const self = street.segments.find((entry) => entry.id === session.segment.id);
        const minWidth = minimumWidth(self ?? session.segment, street.segments);
        const deltaMeters = ((session.edge === "right" ? 1 : -1) * dx) / geometry.ppm;
        const newWidth = fitMinimum(
          quantize(Math.min(30, Math.max(minWidth, session.startWidth + deltaMeters))),
          minWidth
        );
        if (newWidth !== session.lastWidth) {
          const segments = street.segments.map((entry) =>
            entry.id === session.segment.id ? { ...entry, w: newWidth } : entry
          );
          commit({ ...street, segments: normalizeSegments(segments) });
          session.lastWidth = newWidth;
        }
      }
      setDrag({ mode: "resize", segment: session.segment, x: event.clientX, y: event.clientY, target: null });
      return;
    }

    if (!session.active && Math.hypot(dx, dy) < 7) return;
    if (!session.active && session.pointerType === "touch" && session.mode === "add" && Math.abs(dx) > Math.abs(dy) * 1.4) {
      dragSession.current = null;
      return;
    }
    session.active = true;
    event.preventDefault();
    const rect = node.getBoundingClientRect();
    if (event.clientY >= rect.top && event.clientY <= rect.bottom) {
      if (event.clientX < rect.left + 32) node.scrollLeft -= 18;
      if (event.clientX > rect.right - 32) node.scrollLeft += 18;
    }
    const x = event.clientX - rect.left + node.scrollLeft - geometry.origin;
    const overStreet = event.clientY > rect.top + 36 && event.clientY < rect.bottom && x >= -20 && x <= geometry.streetW + 20;
    session.target = overStreet ? insertionIndex(x, street.segments, geometry.ppm) : null;
    setDrag({ mode: session.mode, segment: session.segment, x: event.clientX, y: event.clientY, target: session.target });
  };

  const cancelDrag = () => {
    dragSession.current = null;
    setDrag(null);
  };

  const finishDrag = (event: PointerEvent) => {
    const session = dragSession.current;
    if (!session || session.pointerId !== event.pointerId) return;
    cancelDrag();
    if (!session.active) return;
    suppressClickUntil.current = Date.now() + 350;
    // Ensure newly-resized segment stays selected so the user can inspect its inspector
    if (session.mode === "resize" && session.target === null) {
      setSelected(session.segment.id);
      return;
    }
    if (session.target === null) return;
    if (session.mode === "add") addSegment(session.segment, session.target);
    else {
      const old = street.segments.findIndex((segment) => segment.id === session.segment.id);
      moveSegment(session.segment.id, session.target > old ? session.target - 1 : session.target);
    }
  };

  const handlers = useRef({ onDragMove, finishDrag, cancelDrag });
  handlers.current = { onDragMove, finishDrag, cancelDrag };
  useEffect(() => {
    const move = (event: PointerEvent) => handlers.current.onDragMove(event);
    const end = (event: PointerEvent) => handlers.current.finishDrag(event);
    const cancel = () => handlers.current.cancelDrag();
    window.addEventListener("pointermove", move, { passive: false });
    window.addEventListener("pointerup", end);
    window.addEventListener("pointercancel", cancel);
    window.addEventListener("blur", cancel);
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", end);
      window.removeEventListener("pointercancel", cancel);
      window.removeEventListener("blur", cancel);
    };
  }, []);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (isEditingText(event.target)) return;
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "z") {
        event.preventDefault();
        dispatch({ type: event.shiftKey ? "redo" : "undo" });
      }
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "y") {
        event.preventDefault();
        dispatch({ type: "redo" });
      }
      if (event.key === "Escape") {
        setSelected(null);
        setBuildingSelected(null);
        cancelDrag();
        setWidthMenuOpen(false);
        setLocationInputOpen(false);
      }
      if (chosen) {
        if (event.key === "Delete" || event.key === "Backspace") {
          event.preventDefault();
          if (street.segments.length > 1) {
            commit({ ...street, segments: street.segments.filter((s) => s.id !== chosen.id) });
            setSelected(null);
          }
        }
        if (event.key.toLowerCase() === "d" && !event.ctrlKey && !event.metaKey) {
          event.preventDefault();
          duplicateSegment(chosen.id);
        }
        if (event.key === "[" || event.key === "ArrowLeft") {
          const idx = street.segments.findIndex((s) => s.id === chosen.id);
          if (idx > 0) setSelected(street.segments[idx - 1].id);
        }
        if (event.key === "]" || event.key === "ArrowRight") {
          const idx = street.segments.findIndex((s) => s.id === chosen.id);
          if (idx < street.segments.length - 1) setSelected(street.segments[idx + 1].id);
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [chosen, street]);

  const setCameraZoom = (next: number) => {
    const target = Math.max(0.6, Math.min(1.6, Math.round(next * 10) / 10));
    if (target === zoom) return;
    if (viewer.current) desiredCameraCenter.current = (viewer.current.scrollLeft + viewportWidth / 2 - geometry.origin) / geometry.ppm;
    setZoom(target);
  };

  const saveFile = () => {
    const blob = new Blob([JSON.stringify({ ...street, format: "streetx-v4" }, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${street.name.replace(/[^a-z0-9-]/gi, "-")}.streetx.json`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    showToast("Street file downloaded. It can be imported on another device.");
  };

  const copyLink = async () => {
    const url = new URL(window.location.href);
    url.hash = `street=${encodeStreet(street)}`;
    try {
      await navigator.clipboard.writeText(url.toString());
      showToast("Street link copied, including all widths, levels and settings.");
    } catch {
      window.prompt("Copy your street link:", url.toString());
    }
  };

  const loadTemplate = (main?: boolean) => {
    commit({
      ...street,
      name: main ? "Main Street" : "Linden Avenue",
      segments: (main ? TEMPLATE_MAIN : INITIAL).map((segment) => ({ ...segment, id: mkId() })),
    });
    setSelected(null);
    setBuildingSelected(null);
    dismissWelcome();
    showToast("New street created. Undo returns to your previous design.");
  };

  const cycleEnvironment = () => {
    const themes: EnvironmentTheme[] = ["day", "dusk", "night", "overcast"];
    const current = street.environment || "day";
    const next = themes[(themes.indexOf(current) + 1) % themes.length];
    commit({ ...street, environment: next });
    showToast(`Sky theme: ${next.toUpperCase()}`);
  };

  const chosenIndex = chosen ? street.segments.indexOf(chosen) : -1;
  const inspectorX = chosen
    ? geometry.origin + geometry.offsets[chosenIndex] + (chosen.w * geometry.ppm) / 2 - scrollLeft
    : buildingSelected === "left"
    ? geometry.origin - scrollLeft - 85
    : geometry.origin + geometry.streetW - scrollLeft + 85;
  const ghostItem: PaletteItem | undefined = drag?.segment
    ? PALETTE.find((item) => item.type === drag.segment!.type && item.variant === drag.segment!.variant) ??
      PALETTE.find((item) => item.type === drag.segment!.type)
    : undefined;

  const targetWidthDiff = street.targetWidth ? Math.round((street.targetWidth - currentWidth) * 100) / 100 : null;

  return (
    <div className="streetx-app">
      <TopBar
        onNew={loadTemplate}
        onSave={saveFile}
        onImport={() => fileInput.current?.click()}
        onCopyLink={copyLink}
        onGuidance={() => setModal("guidance")}
        onAbout={() => setModal("about")}
        onExport={setExportFormat}
      />

      <main className="street-workspace" aria-label="Street cross-section editor">
        {/* Streetmix-style comprehensive workspace toolbar */}
        <div className="workspace-toolbar">
          <div className="street-info-cluster">
            {/* Street name */}
            <div className="street-name-pill">
              <input
                key={street.name}
                defaultValue={street.name}
                aria-label="Street name"
                onBlur={(event) => {
                  if (event.target.value.trim() && event.target.value.trim() !== street.name) {
                    commit({ ...street, name: event.target.value });
                  }
                }}
                onKeyDown={(event) => {
                  if (event.key === "Enter") event.currentTarget.blur();
                }}
              />
            </div>

            {/* Target Width Dropdown Pill */}
            <div className="width-dropdown-container">
              <button
                className={`street-meta-pill width-pill ${
                  targetWidthDiff !== null && targetWidthDiff < 0 ? "is-over-width" : ""
                }`}
                onClick={() => setWidthMenuOpen(!widthMenuOpen)}
                aria-expanded={widthMenuOpen}
                title="Click to view right-of-way target and change measurement units"
              >
                <strong>{formatDimension(currentWidth, street.units)}</strong>
                {targetWidthDiff !== null && (
                  <span className={`target-diff-badge ${targetWidthDiff < 0 ? "negative" : "positive"}`}>
                    {targetWidthDiff >= 0 ? `${formatMetres(targetWidthDiff)}m left` : `${formatMetres(Math.abs(targetWidthDiff))}m over`}
                  </span>
                )}
                <ChevronDown size={12} />
              </button>

              {widthMenuOpen && (
                <div className="width-popover" role="dialog" aria-label="Street width settings">
                  <header>
                    <strong>Building-to-building width</strong>
                    <button onClick={() => setWidthMenuOpen(false)}>×</button>
                  </header>
                  <div className="width-popover-body">
                    <div className="width-popover-row">
                      <span>Occupied width:</span>
                      <strong>{formatDimension(currentWidth, street.units)}</strong>
                    </div>
                    <label className="width-popover-input">
                      <span>Target Right-of-Way:</span>
                      <div className="target-input-wrap">
                        <input
                          type="number"
                          step="0.1"
                          min="1"
                          max="200"
                          defaultValue={street.targetWidth ?? ""}
                          placeholder="None (unbounded)"
                          onBlur={(e) => {
                            const val = e.target.value ? Number(e.target.value) : undefined;
                            commit({ ...street, targetWidth: val });
                          }}
                        />
                        <span>m</span>
                      </div>
                    </label>

                    {/* Quick target presets */}
                    <div className="target-presets">
                      {[18, 20, 24, 26, 30, 36].map((tw) => (
                        <button
                          key={tw}
                          className={street.targetWidth === tw ? "is-active" : ""}
                          onClick={() => commit({ ...street, targetWidth: tw })}
                        >
                          {tw}m
                        </button>
                      ))}
                      <button
                        className={street.targetWidth === undefined ? "is-active" : ""}
                        onClick={() => commit({ ...street, targetWidth: undefined })}
                      >
                        Clear
                      </button>
                    </div>

                    {/* Units toggle */}
                    <div className="units-toggle-row">
                      <span>Units:</span>
                      <div className="units-buttons">
                        <button
                          className={street.units !== "imperial" ? "is-active" : ""}
                          onClick={() => commit({ ...street, units: "metric" })}
                        >
                          Metric (m)
                        </button>
                        <button
                          className={street.units === "imperial" ? "is-active" : ""}
                          onClick={() => commit({ ...street, units: "imperial" })}
                        >
                          Imperial (ft)
                        </button>
                      </div>
                    </div>

                    <div className="width-popover-footer">
                      <small>Minimum for this mix: {formatMetres(streetMinimum(street.segments))} m</small>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Total Hourly Capacity Badge */}
            <button
              className="street-meta-pill capacity-pill"
              onClick={() => setModal("capacity")}
              title="Click to view full hourly capacity & modal analytics breakdown"
            >
              <Users size={13} className="text-[#1a748a]" />
              <strong>{capacity.total.toLocaleString()}</strong>
              <span>people/hr</span>
              <ChevronDown size={11} className="opacity-60" />
            </button>

            {/* Location Pill */}
            <div className="location-container">
              {locationInputOpen ? (
                <div className="location-input-wrap">
                  <MapPin size={12} className="text-[#1a748a]" />
                  <input
                    autoFocus
                    defaultValue={street.location ?? ""}
                    placeholder="e.g. Brooklyn, NY"
                    onBlur={(e) => {
                      commit({ ...street, location: e.target.value.trim() || undefined });
                      setLocationInputOpen(false);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        commit({ ...street, location: e.currentTarget.value.trim() || undefined });
                        setLocationInputOpen(false);
                      }
                      if (e.key === "Escape") setLocationInputOpen(false);
                    }}
                  />
                </div>
              ) : (
                <button
                  className="street-meta-pill location-pill"
                  onClick={() => setLocationInputOpen(true)}
                  title="Click to add or change city / neighborhood location"
                >
                  <MapPin size={12} />
                  <span>{street.location ? street.location : "+ Add location"}</span>
                </button>
              )}
            </div>
          </div>

          {/* Right side controls: Environment switcher + Zoom controls */}
          <div className="toolbar-right-cluster">
            {/* Sky Theme Switcher */}
            <button
              className="street-meta-pill environment-pill"
              onClick={cycleEnvironment}
              title={`Sky theme: ${(street.environment || "day").toUpperCase()} (click to cycle)`}
              aria-label="Change sky theme"
            >
              {street.environment === "night" ? (
                <Moon size={14} className="text-amber-200" />
              ) : street.environment === "dusk" ? (
                <Sunrise size={14} className="text-orange-400" />
              ) : street.environment === "overcast" ? (
                <Cloud size={14} className="text-slate-400" />
              ) : (
                <Sun size={14} className="text-amber-500" />
              )}
              <span className="env-label capitalize">{street.environment || "Day"}</span>
            </button>

            {/* Camera Zoom & Center */}
            <div className="camera-controls" aria-label="Camera zoom">
              <button onClick={() => setCameraZoom(zoom - 0.1)} disabled={zoom <= 0.6} aria-label="Zoom out">
                <Minus size={15} />
              </button>
              <button className="zoom-value" onClick={() => setCameraZoom(1)} title="Reset zoom">
                {Math.round(zoom * 100)}%
              </button>
              <button onClick={() => setCameraZoom(zoom + 0.1)} disabled={zoom >= 1.6} aria-label="Zoom in">
                <Plus size={15} />
              </button>
              <button
                className="center-scene"
                onClick={() =>
                  viewer.current?.scrollTo({
                    left: geometry.origin + geometry.streetW / 2 - viewportWidth / 2,
                    behavior: "smooth",
                  })
                }
                title="Center the street"
                aria-label="Center street"
              >
                <LocateFixed size={17} />
              </button>
            </div>
          </div>
        </div>

        {/* Viewport */}
        <div
          ref={viewer}
          className="scene-viewport"
          tabIndex={0}
          aria-label="Street canvas, scroll horizontally to explore"
          onScroll={(event) => setScrollLeft(event.currentTarget.scrollLeft)}
        >
          <Scene
            segments={street.segments}
            geometry={geometry}
            left={street.left}
            right={street.right}
            selected={selected}
            buildingSelected={buildingSelected}
            environment={street.environment ?? "day"}
            drag={drag}
            onPointerDown={(segment, event) => startDrag("move", segment, event)}
            onResizeStart={startResize}
            onSelect={selectSegment}
            onSelectBuilding={(side) => {
              setBuildingSelected(side);
              setSelected(null);
              dismissWelcome();
            }}
            onDeselect={() => {
              if (Date.now() >= suppressClickUntil.current) {
                setSelected(null);
                setBuildingSelected(null);
              }
            }}
          />
        </div>

        {welcome && <WelcomeDialog onClose={dismissWelcome} />}

        {/* Floating Element / Building Inspector */}
        {(chosen || buildingSelected) && !drag && (
          <div
            className="inspector-position"
            style={{
              left: Math.max(10, Math.min(viewportWidth - Math.min(350, viewportWidth - 20) - 10, inspectorX - 175)),
            }}
          >
            {chosen ? (
              <SegmentInspector
                segment={chosen}
                segments={street.segments}
                onUpdate={updateSegment}
                onMatch={matchProfileEdge}
                onDuplicate={() => duplicateSegment(chosen.id)}
                onClose={() => setSelected(null)}
                onMove={(delta) => moveSegment(chosen.id, chosenIndex + delta)}
                onRemove={() => {
                  if (street.segments.length > 1) {
                    commit({ ...street, segments: street.segments.filter((segment) => segment.id !== chosen.id) });
                    setSelected(null);
                  }
                }}
              />
            ) : (
              buildingSelected && (
                <BuildingInspector
                  building={street[buildingSelected]}
                  side={buildingSelected}
                  onUpdate={(patch: Partial<Building>) =>
                    commit({ ...street, [buildingSelected]: { ...street[buildingSelected], ...patch } })
                  }
                  onClose={() => setBuildingSelected(null)}
                />
              )
            )}
          </div>
        )}

        {/* Bottom canvas status */}
        <div className="canvas-status">
          <span>
            <Check size={11} />
            {saved ? "Saved in this browser" : "Browser storage unavailable; download to save"}
          </span>
          <span>
            Levels in metres / datum 0.00
            <span className="status-detail"> / fixed world scale / 1 cm = 1 SVG unit</span>
          </span>
        </div>
      </main>

      {/* Palette Element Tray */}
      <Palette
        onPointerDown={(item, event) => startDrag("add", mkSeg(item.type, item.w, { variant: item.variant }), event)}
        onAdd={(item) => {
          if (Date.now() >= suppressClickUntil.current) addSegment(mkSeg(item.type, item.w, { variant: item.variant }));
        }}
        canUndo={state.past.length > 0}
        canRedo={state.future.length > 0}
        onUndo={() => dispatch({ type: "undo" })}
        onRedo={() => dispatch({ type: "redo" })}
      />

      {/* Drag preview */}
      {drag && (
        <div className={`drag-preview ${drag.target === null ? "outside" : ""}`} style={{ left: drag.x, top: drag.y }}>
          {ghostItem && <PalettePreview item={ghostItem} size={54} />}
          <span>{drag.mode === "add" ? "Add element" : "Move element"}</span>
        </div>
      )}

      {/* Import hidden file input */}
      <input
        ref={fileInput}
        className="sr-only"
        type="file"
        accept=".json,application/json"
        aria-label="Import Streetx file"
        onChange={async (event) => {
          const file = event.target.files?.[0];
          event.target.value = "";
          if (!file) return;
          try {
            if (file.size > 1000000) throw new Error("Please choose a street file smaller than 1 MB.");
            const document = normalizeDocument(JSON.parse(await file.text()));
            commit(document);
            setSelected(null);
            setBuildingSelected(null);
            dismissWelcome();
            showToast("Street imported successfully.");
          } catch (error) {
            showToast(error instanceof Error ? error.message : "Could not import that street file.");
          }
        }}
      />

      {/* Modals */}
      {modal === "guidance" && <GuidanceDialog onClose={() => setModal(null)} />}
      {modal === "about" && <AboutDialog onClose={() => setModal(null)} />}
      {modal === "capacity" && <CapacityDialog street={street} onClose={() => setModal(null)} />}
      {exportFormat && <ExportDialog key={exportFormat} street={street} format={exportFormat} onClose={() => setExportFormat(null)} />}
      <Toast key={toast.serial} message={toast.message} />
    </div>
  );
}
