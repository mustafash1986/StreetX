import { renderToStaticMarkup } from "react-dom/server";
import type { StreetDocument } from "../data/editor";
import { DEFS, cycleBuffers, slopeAngle, streetWidth, type Side } from "../data/street";
import { sceneGeometry } from "../data/geometry";
import { edgeLevels, formatLevel, profileGeometry, surfaceLevelAt } from "../data/profile";
import { objectsFor } from "../data/objects";
import { frontagePanels, frontageSpec } from "../data/frontages";
import { artPlacement, BASE_PIXELS_PER_METRE, isolateSvgIds, measureBounds, prepareArt, type ArtBounds, type Illustration } from "../svg/library";
import { LaneSymbol } from "../components/Scene";
import { formatMetres } from "../data/standards";
import type { ExportOptions } from "./types";

const NS = "http://www.w3.org/2000/svg";
const COLORS: Record<string, string> = { walk: "#d1d0c8", running: "#b86b52", road: "#30332f", green: "#2c7655", red: "#89534c", planting: "#bab69f", partition: "#b0b2a6", buffer: "#657167", rail: "#414541" };
export const xml = (value: string) => value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
export const printableText = (value: string) => value.replace(/[\u2010-\u2015]/g, "-").replace(/\u2192/g, " to ").replace(/\u2212/g, "-").normalize("NFKD").replace(/[\u0300-\u036f]/g, "").replace(/[^\x20-\x7e\u00a0-\u00ff]/g, "?");

export interface ExportDrawing {
  svg: SVGSVGElement;
  ppm: number;
  box: ArtBounds;
  baseY: number;
  document: StreetDocument;
  cleanup: () => void;
}

function luminance(color: string): number {
  const channels = color.match(/[\d.]+/g)?.map(Number);
  if (!channels || channels.length < 3) return 0;
  return Math.round(channels[0] * .2126 + channels[1] * .7152 + channels[2] * .0722);
}

/** Applies an explicit presentation mode only to export SVG, never the editor. */
function applyPdfAppearance(svg: SVGSVGElement, appearance: ExportOptions["appearance"]) {
  if (appearance === "solid") return;
  const background = document.createElementNS(NS, "rect");
  const box = svg.viewBox.baseVal;
  background.setAttribute("x", String(box.x)); background.setAttribute("y", String(box.y));
  background.setAttribute("width", String(box.width)); background.setAttribute("height", String(box.height));
  background.setAttribute("fill", "#ffffff"); background.setAttribute("data-cad-role", "export-background");
  svg.insertBefore(background, svg.firstChild);
  const shapes = svg.querySelectorAll<SVGElement>("path,polygon,polyline,rect,line,circle,ellipse,text");
  for (const shape of shapes) {
    // NOTE: <defs> content is deliberately INCLUDED. Apartment frontages render
    // via <use href="#frontage-source"> slices, so their visible paint lives on
    // source paths inside <defs> — skipping defs leaves buildings colored in
    // sketch/mono modes. Only clip/mask/pattern geometry is skipped (it is not
    // rendered paint; styling it could alter clip silhouettes).
    if (shape.closest("clipPath,mask,pattern") || shape === background) continue;
    const style = window.getComputedStyle(shape);
    const fill = style.fill;
    const stroke = style.stroke;
    if (appearance === "sketch") {
      if (shape.localName === "text") {
        shape.style.setProperty("fill", "#263b3a", "important");
        shape.style.setProperty("stroke", "none", "important");
      } else {
        shape.style.setProperty("fill", "none", "important");
        shape.style.setProperty("stroke", "#344c49", "important");
        shape.style.setProperty("stroke-width", shape.closest("[data-cad-role=artwork]") ? ".7" : "1", "important");
        shape.style.setProperty("stroke-linecap", "round", "important");
        shape.style.setProperty("stroke-linejoin", "round", "important");
      }
    } else {
      // Read the rendered source color, then set a deterministic neutral value.
      // Important style declarations override imported inline Streetmix styles.
      if (shape.localName !== "line" && fill !== "none" && fill !== "transparent") {
        const shade = Math.max(24, Math.min(246, luminance(fill)));
        shape.style.setProperty("fill", `rgb(${shade},${shade},${shade})`, "important");
      }
      if (stroke !== "none" && stroke !== "transparent") {
        const shade = Math.max(24, Math.min(210, luminance(stroke)));
        shape.style.setProperty("stroke", `rgb(${shade},${shade},${shade})`, "important");
      }
    }
  }
}

export function buildExportDrawing(street: StreetDocument, options: ExportOptions): ExportDrawing {
  const ppm = BASE_PIXELS_PER_METRE;
  const g = sceneGeometry(street.segments, 0, 1, street);
  const profile = profileGeometry(street.segments, ppm);
  const body: string[] = [];
  let serial = 0;
  let minY = -4 * ppm;
  let minX = options.frontages ? -g.leftMarginWidth : 0;
  let maxX = options.frontages ? g.streetW + g.rightMarginWidth : g.streetW;
  const baseY = profile.baseDepth;
  const poly = (points: number[][], color: string, extra = "") => `<polygon points="${points.map((point) => point.join(",")).join(" ")}" fill="${color}" ${extra}/>`;
  const line = (x1: number, y1: number, x2: number, y2: number, color = "#74877d", width = .55) => `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${color}" stroke-width="${width}"/>`;
  const text = (x: number, y: number, value: string, size = 9, anchor = "middle", color = "#4c6761") => `<text x="${x}" y="${y}" font-family="Helvetica, Arial, sans-serif" font-size="${size}" text-anchor="${anchor}" fill="${color}">${xml(printableText(value))}</text>`;

  const artGroup = (art: Illustration, x: number, y: number, angle: number, layer: string) => {
    const prepared = prepareArt(art);
    const bounds = measureBounds(prepared);
    const p = artPlacement(art, prepared, bounds, ppm);
    const anchor = bounds.x - p.offsetX * 100 / ppm;
    const content = isolateSvgIds(prepared.content, `export-art-${serial++}`);
    const radians = angle * Math.PI / 180;
    const corners = [[bounds.x, bounds.y], [bounds.x + bounds.width, bounds.y], [bounds.x, bounds.y + bounds.height], [bounds.x + bounds.width, bounds.y + bounds.height]];
    for (const [cx, cy] of corners) {
      const dx = (cx - anchor) * ppm / 100, dy = (cy - p.ground) * ppm / 100;
      const tx = x + dx * Math.cos(radians) - dy * Math.sin(radians);
      const ty = y + dx * Math.sin(radians) + dy * Math.cos(radians);
      minY = Math.min(minY, ty); minX = Math.min(minX, tx); maxX = Math.max(maxX, tx);
    }
    return `<g data-cad-layer="${layer}" data-cad-role="artwork" transform="translate(${x} ${y}) rotate(${angle}) scale(${ppm / 100}) translate(${-anchor} ${-p.ground})">${content}</g>`;
  };

  if (options.frontages) for (const side of ["left", "right"] as Side[]) {
    const building = street[side];
    const spec = frontageSpec(building, side);
    const width = side === "left" ? g.leftMarginWidth : g.rightMarginWidth;
    const x = side === "left" ? -width : g.streetW;
    const level = side === "left" ? profile.edges[0].left : profile.edges[profile.edges.length - 1].right;
    const scale = ppm / 100;
    const mirrored = building.kind === "waterfront" && side === "left";
    const startX = mirrored ? width : side === "left" && !spec.repeat ? width - spec.width * scale : 0;
    const top = -Math.max(spec.datumY, building.kind === "garden" ? 700 : 0) * scale - level * ppm;
    minY = Math.min(minY, top);
    const viewportHeight = baseY - top;
    const landY = -level * ppm - top;
    const fillTop = building.kind === "waterfront" ? landY + (spec.height - spec.datumY) * scale : landY;
    let panels = "";
    for (const panel of frontagePanels(spec, width / scale)) {
      const prepared = prepareArt(panel.art);
      const content = isolateSvgIds(prepared.content, `export-frontage-${serial++}`);
      const box = panel.viewBox;
      panels += `<svg x="${panel.x}" y="${panel.y}" width="${box.width}" height="${box.height}" viewBox="${box.x} ${box.y} ${box.width} ${box.height}" overflow="hidden">${content}</svg>`;
    }
    if (building.kind === "garden") {
      for (const [path, fraction] of [["trees/tree.svg", side === "left" ? .32 : .68], ["plants/bush.svg", .48], ["plants/flowers-yellow.svg", side === "left" ? .8 : .2]] as const) {
        const art = { path }, prepared = prepareArt(art), bounds = measureBounds(prepared);
        const p = artPlacement(art, prepared, bounds, 100);
        const cx = width / scale * fraction;
        panels += `<g transform="translate(${cx + p.offsetX - bounds.x} ${-p.ground})">${isolateSvgIds(prepared.content, `garden-${serial++}`)}</g>`;
      }
    }
    const earth = fillTop < viewportHeight ? `<rect y="${fillTop}" width="${width}" height="${viewportHeight - fillTop}" fill="${spec.groundColor}"/>` : "";
    body.push(`<g data-cad-layer="FRONTAGE_${side.toUpperCase()}" data-cad-role="frontage"><svg x="${x}" y="${top}" width="${width}" height="${viewportHeight}" viewBox="0 0 ${width} ${viewportHeight}" overflow="hidden">${earth}<g transform="translate(${startX} ${landY}) scale(${mirrored ? -scale : scale} ${scale})">${panels}</g></svg></g>`);
  }

  street.segments.forEach((segment, index) => {
    const def = DEFS[segment.type];
    const edge = edgeLevels(segment);
    const x = g.offsets[index], width = segment.w * ppm;
    const yL = -edge.left * ppm, yR = -edge.right * ppm;
    const outline = [[x, yL], [x + width, yR], [x + width, baseY], [x, baseY]];
    const color = COLORS[segment.paint && def.paintable ? "green" : def.surface];
    const layer = `S${String(index + 1).padStart(3, "0")}_${segment.type.toUpperCase().replace(/-/g, "_")}`;
    const clipId = `surface-${serial++}`;
    let surface = poly(outline, color, 'stroke="#758276" stroke-width="0.45"');
    if (def.surface === "planting") surface += poly([[x, yL], [x + width, yR], [x + width, yR + 5], [x, yL + 5]], "#72624d");
    const buffers = cycleBuffers(segment, street.segments);
    const bands: { x: number; w: number; fill: string; stripes?: boolean }[] = [];
    if (def.layout === "loading") bands.push({ x: segment.side === "left" ? x : x + width - 1.53 * ppm, w: 1.53 * ppm, fill: "#82928a", stripes: true });
    if (def.layout === "protected" || def.layout === "two-way") {
      if (buffers.left) bands.push({ x, w: buffers.left * ppm, fill: "#b8b7ac" });
      if (buffers.right) bands.push({ x: x + width - buffers.right * ppm, w: buffers.right * ppm, fill: "#b8b7ac" });
    }
    if (def.surface === "buffer") bands.push({ x, w: width, fill: color, stripes: true });
    if (def.surface === "rail") {
      const centre = x + width / 2, gauge = 1.435 * ppm;
      surface += line(centre - gauge / 2, Math.min(yL, yR), centre - gauge / 2, baseY, "#cbd1c8", 1.1);
      surface += line(centre + gauge / 2, Math.min(yL, yR), centre + gauge / 2, baseY, "#cbd1c8", 1.1);
    }
    for (const band of bands) {
      const y = Math.min(yL, yR), h = baseY - y;
      surface += `<rect x="${band.x}" y="${y}" width="${band.w}" height="${h}" fill="${band.fill}"/>`;
      if (band.stripes) {
        const bandId = `stripe-${serial++}`;
        surface += `<defs><clipPath id="${bandId}"><rect x="${band.x}" y="${y}" width="${band.w}" height="${h}"/></clipPath></defs><g clip-path="url(#${bandId})">`;
        for (let n = -h; n < band.w + h; n += 14) surface += line(band.x + n, y, band.x + n + h, y + h, "#e4e8de", 1.2);
        surface += "</g>";
      }
    }
    body.push(`<g data-cad-layer="${layer}" data-cad-role="surface"><defs><clipPath id="${clipId}">${poly(outline, "white")}</clipPath></defs><g clip-path="url(#${clipId})">${surface}</g></g>`);

    const symbol = renderToStaticMarkup(<LaneSymbol marking={def.marking} segment={segment} />);
    const symbolDoc = new DOMParser().parseFromString(`<div>${symbol}</div>`, "text/html");
    const children = Array.from(symbolDoc.body.firstElementChild?.children ?? []);
    const symbolWidth = children.reduce((sum, child) => sum + (child.tagName.toLowerCase() === "svg" ? Number(child.getAttribute("width") || 24) : 26) + 3, -3);
    let symbolX = x + width / 2 - symbolWidth / 2;
    if (def.layout === "loading") symbolX += (segment.side === "left" ? 1 : -1) * 1.53 * ppm / 2;
    if (def.layout === "protected" || def.layout === "two-way") symbolX += (buffers.left - buffers.right) * ppm / 2;
    const symbolY = -(edge.left + edge.right) * ppm / 2 + 8;
    let symbols = "";
    for (const child of children) {
      if (child.tagName.toLowerCase() === "svg") {
        const w = Number(child.getAttribute("width") || 24), h = Number(child.getAttribute("height") || 24);
        child.setAttribute("x", String(symbolX)); child.setAttribute("y", String(symbolY + (32 - h) / 2));
        symbols += child.outerHTML;
        symbolX += w + 3;
      } else {
        symbols += text(symbolX + 13, symbolY + 22, child.textContent ?? "", 11, "middle", "#f8f7ef"); symbolX += 29;
      }
    }
    body.push(`<g data-cad-layer="MARKINGS" color="${def.surface === "walk" ? "#697975" : "#f8f7ef"}" fill="currentColor">${symbols}</g>`);

    if (options.artwork) {
      for (const object of objectsFor(segment, street.segments)) {
        body.push(artGroup(object.art, x + object.xM * ppm, -surfaceLevelAt(segment, object.xM) * ppm, def.pole || def.canopy ? 0 : -slopeAngle(segment.slope), `ART_${layer}`));
      }
    }
    if (options.annotations) {
      const y = baseY + 17;
      body.push(`<g data-cad-layer="DIMENSIONS">${line(x, baseY + 2, x, y + 4)}${line(x + width, baseY + 2, x + width, y + 4)}${line(x, y, x + width, y)}${line(x - 2, y + 2, x + 2, y - 2)}${line(x + width - 2, y + 2, x + width + 2, y - 2)}${text(x + width / 2, y + 13, `${formatMetres(segment.w)} m`, Math.min(9, Math.max(5, width / 4)))}</g>`);
      body.push(`<g data-cad-layer="LABELS">${text(x + width / 2, y + 26, String(index + 1), 8)}${width > 58 ? text(x + width / 2, y + 39, def.label.length > 22 ? `${def.label.slice(0, 20)}...` : def.label, 8) : ""}</g>`);
      body.push(`<g data-cad-layer="LEVELS">${text(x + width / 2, y + 51, segment.slope === 0 ? `${formatLevel(edge.left)} m` : `L ${formatLevel(edge.left)} / R ${formatLevel(edge.right)}`, Math.min(8, Math.max(5, width / (segment.slope === 0 ? 5 : 14))))}</g>`);
    }
  });

  if (options.annotations) {
    const y = baseY + 92;
    body.push(`<g data-cad-layer="DIMENSIONS">${line(0, y, g.streetW, y, "#357c86", .8)}${line(0, y - 5, 0, y + 5)}${line(g.streetW, y - 5, g.streetW, y + 5)}${text(g.streetW / 2, y - 5, `Overall width ${formatMetres(streetWidth(street.segments))} m`, 10)}</g>`);
  }
  minY -= 14; minX -= 10; maxX += 10;
  const bottom = baseY + (options.annotations ? 110 : 12);
  const box = { x: minX, y: minY, width: maxX - minX, height: bottom - minY };
  const markup = `<svg xmlns="${NS}" xmlns:xlink="http://www.w3.org/1999/xlink" width="${box.width}" height="${box.height}" viewBox="${box.x} ${box.y} ${box.width} ${box.height}" fill-rule="evenodd" clip-rule="evenodd" stroke-linejoin="round"><title>${xml(street.name)}</title>${body.join("")}</svg>`;
  const svg = new DOMParser().parseFromString(markup, "image/svg+xml").documentElement as unknown as SVGSVGElement;
  if (svg.localName !== "svg" || svg.querySelector("parsererror")) throw new Error("Could not prepare the export drawing.");
  const holder = document.createElement("div");
  holder.style.cssText = `position:fixed;left:-100000px;top:0;width:${box.width}px;height:${box.height}px;pointer-events:none;opacity:0;`;
  holder.setAttribute("aria-hidden", "true");
  holder.appendChild(svg); document.body.appendChild(holder);
  applyPdfAppearance(svg, options.appearance);
  return { svg, ppm, box, baseY, document: street, cleanup: () => holder.remove() };
}