import type { StreetDocument } from "../data/editor";
import { buildExportDrawing } from "./drawing";
import { filenameFor, type ExportOptions, type ExportResult, type Progress } from "./types";

// Sky gradient matches the editor backdrop (#acd1df top -> #b8ddea).
const SKY_TOP = "#acd1df";
const SKY_BOTTOM = "#c2e2ee";

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.decoding = "sync";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("The street image could not be rasterized in this browser."));
    img.src = url;
  });
}

export async function exportPng(street: StreetDocument, options: ExportOptions, progress: Progress): Promise<ExportResult> {
  progress("Preparing the full street cross-section...");
  // PNG is always full colour; appearance modes are a PDF-only presentation.
  const drawing = buildExportDrawing(street, { ...options, appearance: "solid" });
  try {
    let scale = 3;
    while ((drawing.box.width * scale > 12000 || drawing.box.height * scale > 12000) && scale > 1) scale -= 1;
    const width = Math.max(1, Math.round(drawing.box.width * scale));
    const height = Math.max(1, Math.round(drawing.box.height * scale));
    drawing.svg.setAttribute("width", String(width));
    drawing.svg.setAttribute("height", String(height));
    const markup = new XMLSerializer().serializeToString(drawing.svg);
    const url = URL.createObjectURL(new Blob([markup], { type: "image/svg+xml;charset=utf-8" }));
    try {
      progress("Rendering PNG image...");
      const img = await loadImage(url);
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("This browser blocked PNG export (no 2D canvas).");
      if (options.pngBackground === "white") {
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, width, height);
      } else if (options.pngBackground === "sky") {
        const gradient = ctx.createLinearGradient(0, 0, 0, height);
        gradient.addColorStop(0, SKY_TOP);
        gradient.addColorStop(1, SKY_BOTTOM);
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);
      }
      ctx.drawImage(img, 0, 0, width, height);
      progress("Encoding PNG file...");
      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob((result) => (result ? resolve(result) : reject(new Error("The PNG encoder returned an empty image."))), "image/png");
      });
      const bytes = new Uint8Array(await blob.arrayBuffer());
      if (!(bytes.length > 8 && bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47)) {
        throw new Error("The PNG file failed its signature check.");
      }
      const background = options.pngBackground === "transparent" ? "transparent background" : `${options.pngBackground} background`;
      return { bytes, mime: "image/png", filename: `${filenameFor(street.name)}.png`, detail: `PNG created at ${width} x ${height}px (${scale}x), ${background}.` };
    } finally {
      URL.revokeObjectURL(url);
    }
  } finally {
    drawing.cleanup();
  }
}
