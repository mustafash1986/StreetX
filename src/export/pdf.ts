import { jsPDF } from "jspdf";
import { svg2pdf } from "svg2pdf.js";
import type { StreetDocument } from "../data/editor";
import { DEFS, streetWidth } from "../data/street";
import { edgeLevels, formatLevel } from "../data/profile";
import { calculateCapacity } from "../data/analytics";
import { formatMetres } from "../data/standards";
import { movementLabel } from "../data/directions";
import { buildExportDrawing, printableText } from "./drawing";
import { filenameFor, type ExportOptions, type ExportResult, type Progress } from "./types";

export async function exportPdf(street: StreetDocument, options: ExportOptions, progress: Progress): Promise<ExportResult> {
  progress("Preparing a vector drawing of the full street...");
  const drawing = buildExportDrawing(street, options);
  try {
    const pdf = new jsPDF({ orientation: "landscape", unit: "mm", format: options.paper, compress: true, putOnlyUsedFonts: true });
    pdf.setProperties({ title: `${street.name} - Streetx cross-section`, author: "Streetx", subject: "Street design cross-section and dimensions", creator: "Streetx" });
    const pageW = pdf.internal.pageSize.getWidth(), pageH = pdf.internal.pageSize.getHeight();
    const margin = 12;
    const header = (subtitle: string) => {
      pdf.setFillColor(47, 136, 152); pdf.rect(margin, 11, 2, 13, "F");
      pdf.setTextColor(47, 84, 87); pdf.setFont("helvetica", "bold"); pdf.setFontSize(18);
      pdf.text(printableText(street.name), margin + 6, 17);
      pdf.setFont("helvetica", "normal"); pdf.setFontSize(9); pdf.setTextColor(118, 137, 126);
      pdf.text(subtitle, margin + 6, 23);
      pdf.setFont("helvetica", "bold"); pdf.setTextColor(42, 100, 112); pdf.setFontSize(13);
      pdf.text("Streetx", pageW - margin, 17, { align: "right" });
    };
    const footer = (number: number) => {
      pdf.setFont("helvetica", "normal"); pdf.setFontSize(6.8); pdf.setTextColor(117, 132, 120);
      pdf.text("Planning illustration only. Local design, accessibility and rail requirements apply. Subgrade depth is schematic.", margin, pageH - 9);
      pdf.text(`Streetmix artwork / Katie Lewis and contributors / CC BY-SA 4.0 | Page ${number}`, pageW - margin, pageH - 5, { align: "right" });
    };
    const locationPrefix = street.location ? `${street.location}  /  ` : "";
    header(`${locationPrefix}CROSS-SECTION  /  ${formatMetres(streetWidth(street.segments))} m overall  /  Datum 0.00 m`);
    const availableW = pageW - 2 * margin, availableH = pageH - 68;
    const mmPerPixel = Math.min(availableW / drawing.box.width, availableH / drawing.box.height);
    const width = drawing.box.width * mmPerPixel, height = drawing.box.height * mmPerPixel;
    const x = (pageW - width) / 2, y = 34 + (availableH - height) / 2;
    progress("Rendering vector artwork to PDF...");
    await svg2pdf(drawing.svg, pdf, { x, y, width, height, loadExternalStyleSheets: false, loadImages: false });
    const scale = 1000 / (drawing.ppm * mmPerPixel);
    const barMetres = Math.max(1, Math.min(5, Math.floor(streetWidth(street.segments) / 5)));
    const barWidth = barMetres * drawing.ppm * mmPerPixel;
    pdf.setDrawColor(62, 107, 105); pdf.setLineWidth(.3);
    pdf.line(margin, pageH - 22, margin + barWidth, pageH - 22);
    pdf.line(margin, pageH - 24, margin, pageH - 20); pdf.line(margin + barWidth, pageH - 24, margin + barWidth, pageH - 20);
    pdf.setFontSize(8); pdf.setFont("helvetica", "normal"); pdf.setTextColor(86, 117, 107);
    pdf.text(`Scale bar: ${barMetres} m at 100% print`, margin + barWidth / 2, pageH - 25, { align: "center" });
    pdf.text(`Fit scale 1:${scale.toFixed(1)} at 100% print | ${options.paper.toUpperCase()} landscape`, pageW - margin, pageH - 22, { align: "right" });
    footer(1);

    if (options.annotations) {
      let page = 2;
      const columns = [margin, margin + 12, pageW * .42, pageW * .51, pageW * .60, pageW * .69, pageW * .77];
      const tableHeader = () => {
        pdf.addPage(options.paper, "landscape");
        header("ELEMENT SCHEDULE  /  All widths and levels in metres");
        pdf.setFillColor(236, 246, 244); pdf.rect(margin, 32, pageW - margin * 2, 9, "F");
        pdf.setFont("helvetica", "bold"); pdf.setFontSize(8); pdf.setTextColor(65, 103, 100);
        ["No.", "Element", "Width", "Left level", "Right level", "Slope", "Direction / marking"].forEach((text, i) => pdf.text(text, columns[i] + 2, 38));
        footer(page++);
      };
      tableHeader();
      let rowY = 47;
      for (let index = 0; index < street.segments.length; index++) {
        const segment = street.segments[index], def = DEFS[segment.type], level = edgeLevels(segment);
        if (rowY > pageH - 32) { tableHeader(); rowY = 47; }
        pdf.setFont("helvetica", "normal"); pdf.setFontSize(8); pdf.setTextColor(72, 91, 84);
        const last = def.directional ? `${segment.dir === "in" ? "Toward" : "Away"} / ${movementLabel(segment.movement)}` : "Not a travel lane";
        const fields = [String(index + 1), def.label, formatMetres(segment.w), formatLevel(level.left), formatLevel(level.right), `${segment.slope}%`, last];
        fields.forEach((value, i) => {
          const maxWidth = (columns[i + 1] ?? pageW - margin) - columns[i] - 4;
          pdf.text(pdf.splitTextToSize(printableText(value), maxWidth), columns[i] + 2, rowY);
        });
        pdf.setDrawColor(224, 233, 224); pdf.setLineWidth(.1); pdf.line(margin, rowY + 5, pageW - margin, rowY + 5);
        rowY += 13;
      }
    }

    // Street Capacity & Analytics appendix when enabled
    if (options.capacity) {
      pdf.addPage(options.paper, "landscape");
      header("STREET CAPACITY & ANALYTICS  /  Hourly people-moving capacity");
      const cap = calculateCapacity(street.segments);
      const modes = [
        { name: "Pedestrians", value: cap.pedestrian, width: cap.pedestrianWidth, color: [57, 127, 149] },
        { name: "Bikes & Scooters", value: cap.cycling, width: cap.cyclingWidth, color: [44, 118, 85] },
        { name: "Public Transit", value: cap.transit, width: cap.transitWidth, color: [137, 83, 76] },
        { name: "Motor Vehicles", value: cap.driving, width: cap.drivingWidth, color: [66, 66, 66] },
      ];
      let y = 40;
      pdf.setFont("helvetica", "bold"); pdf.setFontSize(22); pdf.setTextColor(30, 109, 127);
      pdf.text(`${cap.total.toLocaleString()}`, margin, y + 10);
      pdf.setFont("helvetica", "normal"); pdf.setFontSize(9); pdf.setTextColor(98, 120, 122);
      pdf.text("people / hour", margin + 38, y + 10);
      y += 24;
      for (const mode of modes) {
        const share = cap.total > 0 ? Math.round((mode.value / cap.total) * 100) : 0;
        const widthShare = cap.totalWidth > 0 ? Math.round((mode.width / cap.totalWidth) * 100) : 0;
        pdf.setFont("helvetica", "bold"); pdf.setFontSize(9); pdf.setTextColor(64, 91, 88);
        pdf.text(`${mode.name}`, margin, y);
        pdf.text(`${mode.value.toLocaleString()} p/hr`, margin + 80, y);
        pdf.setFont("helvetica", "normal"); pdf.setFontSize(7.5); pdf.setTextColor(122, 146, 140);
        pdf.text(`${widthShare}% of width (${formatMetres(mode.width)} m)  •  ${share}% of capacity`, margin + 8, y + 11, { maxWidth: pageW / 2 - 20 });
        const barWidth = pageW - margin * 2 - 140;
        pdf.setFillColor(232, 240, 239);
        pdf.roundedRect(margin + 82, y + 6, barWidth, 6, 1.5, 1.5, "F");
        pdf.setFillColor(mode.color[0], mode.color[1], mode.color[2]);
        pdf.roundedRect(margin + 82, y + 6, (share / 100) * barWidth, 6, 1.5, 1.5, "F");
        y += 21;
      }
      const activeTransitCap = cap.pedestrian + cap.cycling + cap.transit;
      const activeTransitPct = cap.total > 0 ? Math.round((activeTransitCap / cap.total) * 100) : 0;
      const activeTransitWidthPct = cap.totalWidth > 0 ? Math.round(((cap.pedestrianWidth + cap.cyclingWidth + cap.transitWidth) / cap.totalWidth) * 100) : 0;
      pdf.setFillColor(238, 247, 249);
      pdf.roundedRect(margin, y + 4, pageW - margin * 2, 24, 3, 3, "F");
      pdf.setFont("helvetica", "bold"); pdf.setFontSize(9); pdf.setTextColor(30, 92, 102);
      pdf.text("Space Efficiency Insight", margin + 6, y + 11);
      pdf.setFont("helvetica", "normal"); pdf.setFontSize(8); pdf.setTextColor(37, 102, 114);
      if (activeTransitCap > 0) {
        pdf.text(
          `Transit, walking, and cycling account for ${activeTransitPct}% of total people-moving capacity while occupying ${activeTransitWidthPct}% of the street width.`,
          margin + 6, y + 19, { maxWidth: pageW - margin * 2 - 12 }
        );
      } else {
        pdf.text("Add sidewalks, bike lanes, or transit lanes to significantly multiply your street's hourly throughput.", margin + 6, y + 19, { maxWidth: pageW - margin * 2 - 12 });
      }
      footer(2);
    }

    progress("Finalising the PDF...");
    const bytes = new Uint8Array(pdf.output("arraybuffer"));
    if (new TextDecoder("ascii").decode(bytes.subarray(0, 5)) !== "%PDF-") throw new Error("The PDF could not be finalised.");
    return { bytes, mime: "application/pdf", filename: `${filenameFor(street.name)}.pdf`, detail: `Vector PDF created on ${options.paper.toUpperCase()} landscape, with the full street${options.annotations ? " and element schedule" : ""}${options.capacity ? " and capacity analytics" : ""}.` };
  } finally { drawing.cleanup(); }
}