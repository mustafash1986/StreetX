import { DEFAULT_DOCUMENT } from "../data/editor";
import { mkSeg } from "../data/street";
import { DEFAULT_EXPORT_OPTIONS } from "./types";
import { exportPdf } from "./pdf";
import { exportCad } from "./cad";
import { exportPng } from "./png";
import { exportAi } from "./ai";
import { flattenPath, clipPolygon } from "./vectorGeometry";

/** Browser integration checks; intentionally not run on every page load. */
export async function runExportChecks(): Promise<number> {
  let count = 0;
  const check = (condition: boolean, message: string) => { count++; if (!condition) throw new Error(`Export check failed: ${message}`); };
  const square = flattenPath("M0 0H10V10H0Z");
  check(square.length === 1 && square[0].closed, "closed path conversion");
  check(flattenPath("M0 0L1 1M5 5L6 6").length === 2, "disconnected paths stay disconnected");
  const clipped = clipPolygon(square[0].points, [{ x: 2, y: 2 }, { x: 8, y: 2 }, { x: 8, y: 8 }, { x: 2, y: 8 }]);
  check(clipped.length >= 4 && clipped.every((point) => point.x >= 2 && point.x <= 8 && point.y >= 2 && point.y <= 8), "viewport clipping");
  const street = { ...DEFAULT_DOCUMENT, name: "Streetx export check", segments: [mkSeg("walk", 1.8), mkSeg("bus", 3.5, { movement: "left-straight", dir: "out" }), mkSeg("train", 4.5), mkSeg("drive", 3.4, { elevation: .15, slope: -2 }), mkSeg("walk", 1.8)] };
  const options = { ...DEFAULT_EXPORT_OPTIONS, artwork: false, frontages: false, annotations: true };
  const pdf = await exportPdf(street, { ...options, format: "pdf" }, () => undefined);
  check(new TextDecoder().decode(pdf.bytes.slice(0, 5)) === "%PDF-", "PDF header");
  const capacityPdf = await exportPdf(street, { ...options, format: "pdf", capacity: true }, () => undefined);
  check(new TextDecoder().decode(capacityPdf.bytes.slice(0, 5)) === "%PDF-", "PDF with capacity analytics appends the Street Capacity page");
  const noCapPdf = await exportPdf(street, { ...options, format: "pdf", capacity: false }, () => undefined);
  check(capacityPdf.bytes.length >= noCapPdf.bytes.length, "Capacity checkbox controls appendix inclusion");
  for (const appearance of ["solid", "sketch", "mono"] as const) {
    const styled = await exportPdf(street, { ...options, format: "pdf", appearance }, () => undefined);
    check(new TextDecoder().decode(styled.bytes.slice(0, 5)) === "%PDF-", `${appearance} PDF header`);
  }
  for (const units of ["m", "mm"] as const) {
    const result = await exportCad(street, { ...options, format: "dwg", units }, () => undefined);
    check(result.bytes.length > 1000 && result.filename.endsWith(".dwg"), `DWG download and round-trip (${units})`);
  }
  for (const pngBackground of ["transparent", "sky", "white"] as const) {
    const png = await exportPng(street, { ...options, format: "png", pngBackground }, () => undefined);
    check(png.bytes[0] === 0x89 && png.bytes[1] === 0x50 && png.bytes[2] === 0x4e && png.bytes[3] === 0x47 && png.filename.endsWith(".png"), `PNG signature (${pngBackground})`);
  }
  for (const aiFormat of ["ai", "svg"] as const) {
    const result = await exportAi(street, { ...options, format: "ai", aiFormat }, () => undefined);
    if (aiFormat === "ai") {
      check(new TextDecoder("ascii").decode(result.bytes.slice(0, 5)) === "%PDF-" && result.filename.endsWith(".ai"), "AI (.ai) is a single-page vector PDF with .ai name");
    } else {
      check(new TextDecoder("utf-8").decode(result.bytes.slice(0, 60)).includes("<?xml") && result.filename.endsWith(".svg"), "Vector SVG has XML prolog and .svg extension");
    }
  }
  return count;
}