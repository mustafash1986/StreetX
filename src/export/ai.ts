import { jsPDF } from "jspdf";
import { svg2pdf } from "svg2pdf.js";
import type { StreetDocument } from "../data/editor";
import { buildExportDrawing } from "./drawing";
import { filenameFor, type AiFormat, type ExportOptions, type ExportResult, type Progress } from "./types";

export async function exportAi(street: StreetDocument, options: ExportOptions, progress: Progress): Promise<ExportResult> {
  progress("Preparing the full street cross-section for Adobe Illustrator...");
  // Always full colour for presentation editing; appearance modes are PDF-only.
  const drawing = buildExportDrawing(street, { ...options, appearance: "solid" });
  try {
    const format: AiFormat = options.aiFormat;
    if (format === "ai") {
      // Open directly in Illustrator: build a single-page vector PDF and name it
      // .ai. Illustrator opens PDF as native, editable vector artwork.
      const pdf = new jsPDF({
        orientation: drawing.box.width >= drawing.box.height ? "landscape" : "portrait",
        unit: "pt",
        format: [Math.max(9, drawing.box.width), Math.max(9, drawing.box.height)],
        compress: true,
        putOnlyUsedFonts: true,
      });
      pdf.setProperties({ title: `${street.name} - Streetx vector (AI)`, author: "Streetx", subject: "Street cross-section, editable vector", creator: "Streetx" });
      progress("Converting street illustrations to vector paths...");
      await svg2pdf(drawing.svg, pdf, { x: 0, y: 0, width: drawing.box.width, height: drawing.box.height, loadExternalStyleSheets: false, loadImages: false });
      const bytes = new Uint8Array(pdf.output("arraybuffer"));
      if (new TextDecoder("ascii").decode(bytes.subarray(0, 5)) !== "%PDF-") throw new Error("The AI document could not be finalised.");
      return {
        bytes,
        mime: "application/pdf",
        filename: `${filenameFor(street.name)}.ai`,
        detail: "Adobe Illustrator vector file created (.ai). Open it in Illustrator — objects are editable paths grouped by layer.",
      };
    }

    // Presentation-ready vector SVG: outlines, same layer ids as other exports.
    progress("Serialising editable SVG...");
    const clone = drawing.svg.cloneNode(true) as SVGSVGElement;
    clone.removeAttribute("width");
    clone.removeAttribute("height");
    clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
    clone.setAttribute("xmlns:xlink", "http://www.w3.org/1999/xlink");
    // Give every layer an obvious id for Illustrator's Layers panel.
    clone.querySelectorAll("[data-cad-layer]").forEach((group) => {
      const layer = group.getAttribute("data-cad-layer") || "";
      group.setAttribute("id", `layer-${layer}`.replace(/[^a-zA-Z0-9[-]_]/g, "-"));
      group.setAttribute("inkscape:groupmode", "layer");
      group.setAttribute("inkscape:label", layer);
    });
    clone.insertBefore(
      clone.ownerDocument.createComment(`Streetx vector export · ${street.name} · groups are layers · Streetmix artwork CC BY-SA 4.0`),
      clone.firstChild,
    );
    const svgString = new XMLSerializer().serializeToString(clone);
    const bytes = new TextEncoder().encode(`<?xml version="1.0" encoding="UTF-8" standalone="no"?>\n${svgString}`);
    return {
      bytes,
      mime: "image/svg+xml",
      filename: `${filenameFor(street.name)}.svg`,
      detail: "Vector SVG created for Illustrator / presentation editing. Each segment, artwork and frontage is a named layer.",
    };
  } finally {
    drawing.cleanup();
  }
}
