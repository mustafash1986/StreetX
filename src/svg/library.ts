export interface Illustration {
  path: string;
  anchor?: number | "source-center" | "center";
  groundY?: number;
  removeLayers?: string[];
  onlyLayers?: string[];
  flowerColor?: string;
  facadeColor?: string;
  facadeShadow?: string;
  floors?: number;
}

// Bundle the canonical illustrations. A whitelist in the catalog determines what
// is exposed; novelty vehicles, characters and hand-drawn fallback icons are not used.
const modules = import.meta.glob<string>(
  [
    "/node_modules/@streetmix/illustrations/images/vehicles/*.svg",
    "/node_modules/@streetmix/illustrations/images/transit/*.svg",
    "/node_modules/@streetmix/illustrations/images/bikes/*.svg",
    "/node_modules/@streetmix/illustrations/images/scooters/*.svg",
    "/node_modules/@streetmix/illustrations/images/people/*.svg",
    "/node_modules/@streetmix/illustrations/images/trees/*.svg",
    "/node_modules/@streetmix/illustrations/images/plants/*.svg",
    "/node_modules/@streetmix/illustrations/images/dividers/*.svg",
    "/node_modules/@streetmix/illustrations/images/furniture/*.svg",
    "/node_modules/@streetmix/illustrations/images/lamps/lamp-*.svg",
    "/node_modules/@streetmix/illustrations/images/construction/*.svg",
    "/node_modules/@streetmix/illustrations/images/utilities/*.svg",
    "/node_modules/@streetmix/illustrations/images/wayfinding/*.svg",
    "/node_modules/@streetmix/illustrations/images/vendors/*.svg",
    "/node_modules/@streetmix/illustrations/images/curb/*.svg",
    "/node_modules/@streetmix/illustrations/images/parklet/*.svg",
    "/node_modules/@streetmix/illustrations/images/buildings/*.svg",
    "/node_modules/@streetmix/illustrations/images/markings/*.svg",
    "/node_modules/@streetmix/illustrations/images/secret/inception-train.svg",
    "!**/magic-carpet-*.svg",
    "!**/krz-motorbike-*.svg",
    "!**/bernie.svg",
  ],
  { eager: true, query: "?raw", import: "default" },
);

export const SVG_SOURCES = Object.fromEntries(
  Object.entries(modules).map(([path, svg]) => [path.split("/images/")[1], svg]),
);

export interface ArtBounds { x: number; y: number; width: number; height: number }
export interface PreparedArt { markup: string; content: string; original: ArtBounds; key: string }

const preparedCache = new Map<string, PreparedArt>();
export const measuredArt = new Map<string, ArtBounds>();

export function measureBounds(prepared: PreparedArt): ArtBounds {
  const cached = measuredArt.get(prepared.key);
  if (cached) return cached;
  if (typeof document === "undefined") return prepared.original;
  const holder = document.createElement("div");
  try {
    holder.setAttribute("style", "position:fixed;left:-100000px;top:0;width:512px;height:512px;visibility:hidden;pointer-events:none;contain:strict");
    holder.setAttribute("aria-hidden", "true");
    holder.innerHTML = isolateSvgIds(prepared.markup, "measure");
    document.body.appendChild(holder);
    const svg = holder.querySelector("svg") as SVGSVGElement | null;
    const box = svg?.getBBox();
    if (box && [box.x, box.y, box.width, box.height].every(Number.isFinite) && box.width > 0.01 && box.height > 0.01) {
      const bounds = { x: box.x, y: box.y, width: box.width, height: box.height };
      measuredArt.set(prepared.key, bounds);
      return bounds;
    }
  } catch {
    // Do not cache a failed measurement; a later mounted instance can retry.
  } finally {
    holder.remove();
  }
  return prepared.original;
}

export function prepareArt(art: Illustration): PreparedArt {
  const key = JSON.stringify([art.path, art.removeLayers, art.onlyLayers, art.flowerColor, art.facadeColor, art.facadeShadow, art.floors]);
  const cached = preparedCache.get(key);
  if (cached) return cached;
  const source = SVG_SOURCES[art.path];
  if (!source) throw new Error(`Missing Streetmix illustration: ${art.path}`);
  const doc = new DOMParser().parseFromString(source, "image/svg+xml");
  const svg = doc.documentElement;
  if (svg.localName !== "svg") throw new Error(`Invalid illustration: ${art.path}`);
  if (art.onlyLayers?.length) {
    const selected = art.onlyLayers.map((id) => svg.querySelector(`[id="${id}"]`)).filter((element): element is Element => !!element);
    if (selected.length !== art.onlyLayers.length) throw new Error(`Missing illustration layer: ${art.path}`);
    const prune = (parent: Element) => {
      for (const child of Array.from(parent.children)) {
        if (["defs", "style", "title", "desc"].includes(child.localName) || selected.includes(child)) continue;
        if (selected.some((element) => child.contains(element))) prune(child);
        else child.remove();
      }
    };
    prune(svg);
  }
  for (const id of art.removeLayers ?? []) svg.querySelector(`[id="${id}"]`)?.remove();
  svg.querySelectorAll("script, foreignObject").forEach((element) => element.remove());
  const [x, y, width, sourceHeight] = (svg.getAttribute("viewBox") ?? "0 0 100 100").split(/[\s,]+/).map(Number);
  svg.setAttribute("width", "100%");
  svg.setAttribute("height", "100%");
  svg.setAttribute("preserveAspectRatio", "xMinYMin meet");
  const serializer = new XMLSerializer();
  let content = Array.from(svg.childNodes).map((node) => serializer.serializeToString(node)).join("");
  if (art.flowerColor) content = content.replace(/rgb\(174,\s*32,\s*37\)/g, art.flowerColor);
  if (art.facadeColor) {
    content = content.replace(/rgb\(54,\s*99,\s*135\)/g, art.facadeColor);
    content = content.replace(/rgb\(245,\s*243,\s*233\)/g, art.facadeColor);
    content = content.replace(/rgb\(245,\s*240,\s*224\)/g, art.facadeColor);
    if (art.facadeShadow) content = content.replace(/rgb\(231,\s*230,\s*222\)/g, art.facadeShadow);
  }
  let height = sourceHeight;
  if (art.floors !== undefined && /buildings\/apartments-(narrow|wide)-/.test(art.path)) {
    // Only the storey band repeats. The roof and shopfront are drawn once.
    const storeys = Math.max(1, Math.min(8, Math.round(art.floors)));
    const roof = 68.48, row = 304.8, storefront = roof + row;
    height = sourceHeight + (storeys - 2) * row;
    const slice = (sourceY: number, targetY: number, h: number) => `<svg x="0" y="${targetY}" width="${width}" height="${h}" viewBox="0 ${sourceY} ${width} ${h}" overflow="hidden"><use href="#frontage-source"/></svg>`;
    content = `<defs><g id="frontage-source">${content}</g></defs>`
      + slice(0, 0, roof)
      + Array.from({ length: storeys - 1 }, (_, i) => slice(roof, roof + i * row, row)).join("")
      + slice(storefront, roof + (storeys - 1) * row, sourceHeight - storefront);
  }
  const markup = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="100%" height="100%" viewBox="${x} ${y} ${width} ${height}" preserveAspectRatio="xMinYMin meet" fill-rule="evenodd" clip-rule="evenodd" stroke-linejoin="round" stroke-miterlimit="2">${content}</svg>`;
  const result = { key, markup, content, original: { x, y, width, height } };
  preparedCache.set(key, result);
  return result;
}

export function isolateSvgIds(markup: string, prefix: string): string {
  const ids = [...markup.matchAll(/\bid="([^"]+)"/g)].map((match) => match[1]);
  let result = markup;
  for (const id of new Set(ids)) {
    result = result.split(`id="${id}"`).join(`id="${prefix}-${id}"`);
    result = result.split(`url(#${id})`).join(`url(#${prefix}-${id})`);
    result = result.split(`href="#${id}"`).join(`href="#${prefix}-${id}"`);
  }
  return result;
}

export const BASE_PIXELS_PER_METRE = 38;
export const artPixelSize = (bounds: ArtBounds, ppm: number) => ({
  width: bounds.width * ppm / 100,
  height: bounds.height * ppm / 100,
});

// The tyres in both microvan SVGs contact y=180 in source centimetres.
// A rotated diagonal detail inflates getBBox below the tyres, so box-bottom is
// not a valid wheel anchor. This datum is independent of lane width and zoom.
export const CONTACT_Y: Record<string, number> = {
  "vehicles/microvan-outbound.svg": 180,
  "vehicles/microvan-inbound.svg": 180,
};

export function artPlacement(art: Illustration, prepared: PreparedArt, bounds: ArtBounds, ppm: number) {
  const scale = ppm / 100;
  const anchor = typeof art.anchor === "number" ? art.anchor
    : art.anchor === "source-center" ? prepared.original.x + prepared.original.width / 2
    : bounds.x + bounds.width / 2;
  const ground = art.groundY ?? CONTACT_Y[art.path] ?? bounds.y + bounds.height;
  return {
    ...artPixelSize(bounds, ppm),
    offsetX: (bounds.x - anchor) * scale,
    belowGround: (bounds.y + bounds.height - ground) * scale,
    pivotX: (anchor - bounds.x) * scale,
    pivotY: (ground - bounds.y) * scale,
    ground,
  };
}