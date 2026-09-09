import { useEffect, useMemo, useRef, useState, type PointerEvent } from "react";
import { ChevronLeft, ChevronRight, ChevronUp, ChevronDown, LayoutGrid, Redo2, Search, Undo2, X, Accessibility } from "lucide-react";
import { DEFS, GROUPS, PALETTE, type Group, type PaletteItem } from "../data/street";
import { formatMetres } from "../data/standards";
import { NativeArt } from "../svg/NativeArt";

export function PalettePreview({ item, size = 48 }: { item: PaletteItem; size?: number }) {
  if (item.art) return <NativeArt art={item.art} ppm={38} thumbnail={{ width: size, height: size }} />;
  if (item.type === "boarding") return <div className="structural-preview boarding-preview"><Accessibility size={23} /></div>;
  if (item.type === "drainage") return <div className="structural-preview"><span className="drainage-section" /></div>;
  return <div className={`structural-preview surface-${DEFS[item.type].surface}`} />;
}

interface PaletteProps {
  onPointerDown: (item: PaletteItem, event: PointerEvent<HTMLButtonElement>) => void;
  onAdd: (item: PaletteItem) => void;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
}

export function Palette({ onPointerDown, onAdd, canUndo, canRedo, onUndo, onRedo }: PaletteProps) {
  const [group, setGroup] = useState<Group | "All">("All");
  const [query, setQuery] = useState("");
  const [expanded, setExpanded] = useState(false);
  const [scrollable, setScrollable] = useState({ left: false, right: true });
  const scroller = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const items = useMemo(() => PALETTE.filter((item) => (group === "All" || item.group === group) && `${item.label} ${item.group}`.toLowerCase().includes(query.trim().toLowerCase())), [group, query]);

  useEffect(() => {
    const node = scroller.current;
    if (!node) return;
    node.scrollLeft = 0;
    const update = () => setScrollable({ left: node.scrollLeft > 2, right: node.scrollLeft + node.clientWidth < node.scrollWidth - 2 });
    update();
    node.addEventListener("scroll", update, { passive: true });
    const observer = new ResizeObserver(update);
    observer.observe(node);
    return () => { node.removeEventListener("scroll", update); observer.disconnect(); };
  }, [items, expanded]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "/" && !(event.target instanceof HTMLElement && event.target.closest("input, textarea, select, [contenteditable=true]"))) {
        event.preventDefault(); searchRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const scroll = (amount: number) => scroller.current?.scrollBy({ left: amount, behavior: "smooth" });
  return (
    <section className={`element-library ${expanded ? "expanded" : ""}`} aria-label="Street element library">
      <div className="library-toolbar">
        <div className="library-title"><LayoutGrid size={14} /><strong>Elements</strong><span>{items.length}</span></div>
        <div className="library-categories" role="group" aria-label="Filter element category">{["All", ...GROUPS].map((entry) => <button key={entry} aria-pressed={group === entry} onClick={() => setGroup(entry as Group | "All")}>{entry}</button>)}</div>
        <label className="library-search"><Search size={14} /><input ref={searchRef} value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Find an element..." aria-label="Search elements" />{query && <button type="button" aria-label="Clear search" onClick={() => setQuery("")}><X size={13} /></button>}</label>
        <button className="library-expand" onClick={() => setExpanded((value) => !value)} aria-expanded={expanded} title={expanded ? "Collapse library" : "Browse all illustrations"}>{expanded ? <ChevronDown size={16} /> : <ChevronUp size={16} />}<span>{expanded ? "Collapse" : "Browse all"}</span></button>
      </div>
      <div className="library-body">
        {!expanded && <button className="palette-scroll-button" onClick={() => scroll(-450)} disabled={!scrollable.left} aria-label="Previous elements"><ChevronLeft size={18} /></button>}
        <div ref={scroller} className="palette-items">
          {items.map((item) => <button key={item.key} className={`palette-tile palette-${DEFS[item.type].surface}`} title={`${item.label}. Default width ${formatMetres(item.w)} m. Click to add or drag onto the street.`} aria-label={`Add ${item.label}`} onPointerDown={(event) => onPointerDown(item, event)} onClick={() => onAdd(item)}>
            <span className="palette-art"><PalettePreview item={item} /></span><span className="palette-label">{item.label}</span>
          </button>)}
          {!items.length && <p className="palette-empty">No matching elements. <button onClick={() => { setQuery(""); setGroup("All"); }}>Show the full library</button></p>}
        </div>
        {!expanded && <button className="palette-scroll-button" onClick={() => scroll(450)} disabled={!scrollable.right} aria-label="Next elements"><ChevronRight size={18} /></button>}
        <div className="history-controls"><button onClick={onUndo} disabled={!canUndo} title="Undo (Ctrl/Cmd+Z)" aria-label="Undo"><Undo2 size={18} /></button><button onClick={onRedo} disabled={!canRedo} title="Redo (Ctrl/Cmd+Shift+Z)" aria-label="Redo"><Redo2 size={18} /></button></div>
      </div>
    </section>
  );
}