import { SVGPathData } from "svg-pathdata";

export interface Point2 { x: number; y: number }
export interface VectorPath { points: Point2[]; closed: boolean; layer: string; color: string }
export interface VectorText { point: Point2; value: string; height: number; rotation: number; align: "left" | "center" | "right"; layer: string; color: string }
export interface ExtractedGeometry { paths: VectorPath[]; texts: VectorText[] }

const NS = "http://www.w3.org/2000/svg";
const n = (node: Element, key: string, fallback = 0) => Number(node.getAttribute(key) ?? fallback);
const cross = (a: Point2, b: Point2, p: Point2) => (b.x - a.x) * (p.y - a.y) - (b.y - a.y) * (p.x - a.x);
const midpoint = (a: Point2, b: Point2): Point2 => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });
const distance = (a: Point2, b: Point2) => Math.hypot(a.x - b.x, a.y - b.y);

export function flattenPath(d: string, tolerance = .2): { points: Point2[]; closed: boolean }[] {
  const commands = new SVGPathData(d).toAbs().normalizeHVZ(true, true, false).normalizeST().qtToC().aToC().commands;
  const paths: { points: Point2[]; closed: boolean }[] = [];
  let points: Point2[] = [], current: Point2 = { x: 0, y: 0 }, start = current;
  const flush = (closed: boolean) => { if (points.length > 1) paths.push({ points, closed }); points = []; };
  const curve = (p0: Point2, p1: Point2, p2: Point2, p3: Point2, depth: number) => {
    const chord = Math.max(.000001, distance(p0, p3));
    const deviation = Math.max(Math.abs(cross(p0, p3, p1)), Math.abs(cross(p0, p3, p2))) / chord;
    if (depth >= 12 || (deviation <= tolerance && distance(p0, p1) + distance(p1, p2) + distance(p2, p3) - chord <= tolerance * 2)) {
      points.push(p3); return;
    }
    const a = midpoint(p0, p1), b = midpoint(p1, p2), c = midpoint(p2, p3);
    const ab = midpoint(a, b), bc = midpoint(b, c), mid = midpoint(ab, bc);
    curve(p0, a, ab, mid, depth + 1); curve(mid, bc, c, p3, depth + 1);
  };
  for (const command of commands) {
    if (command.type === SVGPathData.MOVE_TO) {
      flush(false); current = { x: command.x, y: command.y }; start = current; points = [current];
    } else if (command.type === SVGPathData.LINE_TO) {
      if (!points.length) points.push(current);
      current = { x: command.x, y: command.y }; points.push(current);
    } else if (command.type === SVGPathData.CURVE_TO) {
      if (!points.length) points.push(current);
      const end = { x: command.x, y: command.y };
      curve(current, { x: command.x1, y: command.y1 }, { x: command.x2, y: command.y2 }, end, 0); current = end;
    } else if (command.type === SVGPathData.CLOSE_PATH) {
      current = start; flush(true);
    }
  }
  flush(false);
  return paths;
}

function shapePaths(node: SVGGraphicsElement, tolerance: number): { points: Point2[]; closed: boolean }[] {
  const tag = node.localName;
  if (tag === "path") return flattenPath(node.getAttribute("d") || "", tolerance);
  if (tag === "polygon" || tag === "polyline") {
    const values = (node.getAttribute("points") || "").trim().split(/[\s,]+/).map(Number);
    return [{ points: Array.from({ length: Math.floor(values.length / 2) }, (_, i) => ({ x: values[i * 2], y: values[i * 2 + 1] })), closed: tag === "polygon" }];
  }
  if (tag === "line") return [{ points: [{ x: n(node, "x1"), y: n(node, "y1") }, { x: n(node, "x2"), y: n(node, "y2") }], closed: false }];
  if (tag === "rect") {
    const x = n(node, "x"), y = n(node, "y"), w = n(node, "width"), h = n(node, "height");
    const rx = Math.min(w / 2, n(node, "rx", n(node, "ry"))), ry = Math.min(h / 2, n(node, "ry", rx));
    if (rx > 0 && ry > 0) return flattenPath(`M${x + rx} ${y}H${x + w - rx}A${rx} ${ry} 0 0 1 ${x + w} ${y + ry}V${y + h - ry}A${rx} ${ry} 0 0 1 ${x + w - rx} ${y + h}H${x + rx}A${rx} ${ry} 0 0 1 ${x} ${y + h - ry}V${y + ry}A${rx} ${ry} 0 0 1 ${x + rx} ${y}Z`, tolerance);
    return [{ points: [{ x, y }, { x: x + w, y }, { x: x + w, y: y + h }, { x, y: y + h }], closed: true }];
  }
  if (tag === "circle" || tag === "ellipse") {
    const cx = n(node, "cx"), cy = n(node, "cy"), rx = n(node, tag === "circle" ? "r" : "rx"), ry = n(node, tag === "circle" ? "r" : "ry");
    const steps = Math.min(512, Math.max(24, Math.ceil(Math.PI * Math.sqrt(Math.max(rx, ry) / Math.max(tolerance, .0001)))));
    return [{ points: Array.from({ length: steps }, (_, i) => ({ x: cx + rx * Math.cos(i / steps * Math.PI * 2), y: cy + ry * Math.sin(i / steps * Math.PI * 2) })), closed: true }];
  }
  return [];
}

function area(polygon: Point2[]) {
  return polygon.reduce((sum, p, i) => { const next = polygon[(i + 1) % polygon.length]; return sum + p.x * next.y - p.y * next.x; }, 0) / 2;
}

export function clipPolygon(points: Point2[], clip: Point2[]): Point2[] {
  const sign = area(clip) >= 0 ? 1 : -1;
  let result = points;
  for (let i = 0; i < clip.length && result.length; i++) {
    const a = clip[i], b = clip[(i + 1) % clip.length], next: Point2[] = [];
    for (let j = 0; j < result.length; j++) {
      const p = result[j], q = result[(j + 1) % result.length];
      const cp = cross(a, b, p) * sign, cq = cross(a, b, q) * sign;
      if (cp >= -.000001) next.push(p);
      if ((cp >= 0) !== (cq >= 0)) {
        const t = cp / (cp - cq);
        next.push({ x: p.x + (q.x - p.x) * t, y: p.y + (q.y - p.y) * t });
      }
    }
    result = next;
  }
  return result;
}

function clipLine(start: Point2, end: Point2, clip: Point2[]): [Point2, Point2] | null {
  const sign = area(clip) >= 0 ? 1 : -1;
  let from = 0, to = 1;
  for (let i = 0; i < clip.length; i++) {
    const a = clip[i], b = clip[(i + 1) % clip.length];
    const c0 = cross(a, b, start) * sign, c1 = cross(a, b, end) * sign;
    if (c0 < 0 && c1 < 0) return null;
    if (c0 < 0) from = Math.max(from, c0 / (c0 - c1));
    if (c1 < 0) to = Math.min(to, c0 / (c0 - c1));
  }
  if (from > to) return null;
  return [{ x: start.x + (end.x - start.x) * from, y: start.y + (end.y - start.y) * from }, { x: start.x + (end.x - start.x) * to, y: start.y + (end.y - start.y) * to }];
}

function expandUses(root: SVGSVGElement) {
  for (let iteration = 0; iteration < 12; iteration++) {
    const uses = [...root.querySelectorAll("use")].filter((node) => !node.closest("defs"));
    if (!uses.length) return;
    for (const use of uses) {
      const href = use.getAttribute("href") || use.getAttribute("xlink:href");
      if (!href?.startsWith("#")) { use.remove(); continue; }
      const source = root.querySelector(`[id="${CSS.escape(href.slice(1))}"]`);
      if (!source) throw new Error("An illustration references a missing vector layer.");
      const group = document.createElementNS(NS, "g");
      for (const attribute of Array.from(use.attributes)) if (!["href", "xlink:href", "x", "y", "width", "height", "transform"].includes(attribute.name)) group.setAttribute(attribute.name, attribute.value);
      group.setAttribute("transform", `${use.getAttribute("transform") || ""} translate(${n(use, "x")} ${n(use, "y")})`);
      const clone = source.cloneNode(true) as Element;
      clone.removeAttribute("id");
      group.appendChild(clone); use.replaceWith(group);
    }
  }
  throw new Error("An illustration contains a recursive vector reference.");
}

export async function extractVectorGeometry(root: SVGSVGElement, ppm: number, progress: (value: string) => void): Promise<ExtractedGeometry> {
  expandUses(root);
  const rootMatrix = root.getScreenCTM();
  if (!rootMatrix) throw new Error("The export drawing is not attached to a visible browser document.");
  const inverse = rootMatrix.inverse();
  const clips = new WeakMap<Element, Point2[][]>();
  const paths: VectorPath[] = [], texts: VectorText[] = [];
  const map = (p: Point2, matrix: DOMMatrix): Point2 => ({ x: p.x * matrix.a + p.y * matrix.c + matrix.e, y: p.x * matrix.b + p.y * matrix.d + matrix.f });
  const getMatrix = (node: Element) => inverse.multiply((node as SVGGraphicsElement).getScreenCTM() || rootMatrix);
  const getClips = (node: Element): Point2[][] => {
    const cached = clips.get(node); if (cached) return cached;
    const inherited = node.parentElement && node !== root ? getClips(node.parentElement) : [];
    const list = [...inherited];
    if (node.localName === "svg") {
      const svg = node as SVGSVGElement, box = svg.viewBox.baseVal;
      if (box.width > 0 && box.height > 0 && (node === root || node.getAttribute("overflow") !== "visible")) list.push([{ x: box.x, y: box.y }, { x: box.x + box.width, y: box.y }, { x: box.x + box.width, y: box.y + box.height }, { x: box.x, y: box.y + box.height }].map((point) => map(point, getMatrix(node))));
    }
    const clipName = (node.getAttribute("clip-path") || "").match(/#([^)'"\s]+)/)?.[1];
    if (clipName) {
      const definition = root.querySelector(`[id="${CSS.escape(clipName)}"]`);
      const shape = definition?.querySelector<SVGGraphicsElement>("rect,polygon,path");
      if (shape) {
        let matrix = getMatrix(node);
        if (definition?.getAttribute("clipPathUnits") === "objectBoundingBox") {
          const b = (node as SVGGraphicsElement).getBBox(); matrix = matrix.translate(b.x, b.y).scale(b.width, b.height);
        }
        const ancestry: SVGGraphicsElement[] = [];
        let parent: Element | null = shape;
        while (parent && parent !== definition?.parentElement) { ancestry.unshift(parent as SVGGraphicsElement); if (parent === definition) break; parent = parent.parentElement; }
        for (const element of ancestry) {
          const transform = element.transform?.baseVal.consolidate()?.matrix;
          if (transform) matrix = matrix.multiply(transform);
        }
        const outline = shapePaths(shape, .1)[0]?.points;
        if (outline && outline.length >= 3) list.push(outline.map((point) => map(point, matrix)));
      }
    }
    clips.set(node, list); return list;
  };

  const nodes = Array.from(root.querySelectorAll<SVGGraphicsElement>("path,polygon,polyline,rect,line,circle,ellipse,text"));
  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i];
    if (node.closest("defs,clipPath,mask,pattern")) continue;
    const style = window.getComputedStyle(node);
    if (style.display === "none" || style.visibility === "hidden" || Number(style.opacity) === 0) continue;
    const fillVisible = style.fill !== "none" && style.fill !== "transparent" && Number(style.fillOpacity) !== 0;
    const strokeVisible = style.stroke !== "none" && style.stroke !== "transparent" && Number(style.strokeOpacity) !== 0;
    if (!fillVisible && !strokeVisible) continue;
    const layer = node.closest("[data-cad-layer]")?.getAttribute("data-cad-layer") ?? "ILLUSTRATIONS";
    const matrix = getMatrix(node);
    const color = strokeVisible ? style.stroke : style.fill;
    const inheritedClips = getClips(node);
    if (node.localName === "text") {
      const point = map({ x: n(node, "x"), y: n(node, "y") }, matrix);
      if (!inheritedClips.every((clip) => clipPolygon([point, { x: point.x + .01, y: point.y }, { x: point.x, y: point.y + .01 }], clip).length > 0)) continue;
      texts.push({ point, value: node.textContent || "", height: parseFloat(style.fontSize) * Math.hypot(matrix.c, matrix.d), rotation: Math.atan2(matrix.b, matrix.a), align: style.textAnchor === "middle" ? "center" : style.textAnchor === "end" ? "right" : "left", layer, color });
    } else {
      const tolerance = .005 * ppm / Math.max(.0001, Math.hypot(matrix.a, matrix.b), Math.hypot(matrix.c, matrix.d));
      for (const path of shapePaths(node, tolerance)) {
        let points = path.points.map((point) => map(point, matrix));
        if (!points.every((point) => Number.isFinite(point.x) && Number.isFinite(point.y))) continue;
        const closed = path.closed || fillVisible && node.localName !== "line";
        if (closed) {
          for (const clip of inheritedClips) points = clipPolygon(points, clip);
          if (points.length > 2) paths.push({ points, closed: true, layer, color });
        } else {
          let lines: [Point2, Point2][] = points.slice(1).map((point, j) => [points[j], point]);
          for (const clip of inheritedClips) lines = lines.map(([a, b]) => clipLine(a, b, clip)).filter((entry): entry is [Point2, Point2] => !!entry);
          lines.filter(([a, b]) => distance(a, b) > .00001).forEach((line) => paths.push({ points: line, closed: false, layer, color }));
        }
      }
    }
    if (paths.length > 70000) throw new Error("This drawing is too detailed for a single browser CAD export. Try turning off illustrations or frontages.");
    if (i % 100 === 0) { progress(`Converting vector linework (${Math.round(i / nodes.length * 100)}%)...`); await new Promise<void>((resolve) => window.setTimeout(resolve, 0)); }
  }
  return { paths, texts };
}