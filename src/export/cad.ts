import { ACadVersion, CadDocument, Color, DwgReader, DwgWriter, Layer, Line, LwPolyline, TextEntity, TextHorizontalAlignment, TextVerticalAlignmentType, UnitsType, XY, XYZ } from "@node-projects/acad-ts";
import type { StreetDocument } from "../data/editor";
import { DEFS, streetWidth } from "../data/street";
import { formatLevel, edgeLevels } from "../data/profile";
import { movementLabel } from "../data/directions";
import { buildExportDrawing, printableText } from "./drawing";
import { extractVectorGeometry } from "./vectorGeometry";
import { filenameFor, type ExportOptions, type ExportResult, type Progress } from "./types";

function colorFor(css: string): Color {
  if (/^#[a-f\d]{6}$/i.test(css)) return new Color(parseInt(css.slice(1, 3), 16), parseInt(css.slice(3, 5), 16), parseInt(css.slice(5, 7), 16));
  const values = css.match(/[\d.]+/g)?.map(Number);
  if (values && values.length >= 3) return new Color(Math.round(values[0]), Math.round(values[1]), Math.round(values[2]));
  return new Color(7);
}

export async function exportCad(street: StreetDocument, options: ExportOptions, progress: Progress): Promise<ExportResult> {
  progress("Preparing the full street cross-section...");
  const drawing = buildExportDrawing(street, options);
  try {
    const geometry = await extractVectorGeometry(drawing.svg, drawing.ppm, progress);
    const document = new CadDocument(ACadVersion.AC1032);
    const header = document.header, model = document.modelSpace, layerTable = document.layers, summary = document.summaryInfo, views = document.vPorts;
    if (!header || !model || !layerTable || !summary || !views) throw new Error("The CAD document could not be initialised.");
    const unitScale = options.units === "mm" ? 1000 : 1;
    const factor = unitScale / drawing.ppm;
    header.insUnits = options.units === "mm" ? UnitsType.Millimeters : UnitsType.Meters;
    model.units = header.insUnits;
    header.linearUnitPrecision = 3;
    header.codePage = "UTF-8";
    summary.title = printableText(street.name);
    summary.author = "Streetx";
    summary.comments = "True-scale street cross-section. One drawing unit = " + (options.units === "mm" ? "one millimetre." : "one metre.") + " Curved illustration outlines approximated by polylines. Not a construction approval.";
    const layers = new Map<string, Layer>();
    const layerFor = (name: string) => {
      let layer = layers.get(name);
      if (!layer) { layer = new Layer(name); layer.color = new Color(7); layerTable.add(layer); layers.set(name, layer); }
      return layer;
    };

    for (const path of geometry.paths) {
      const points = path.points.filter((point, i, arr) => i === 0 || Math.hypot(point.x - arr[i - 1].x, point.y - arr[i - 1].y) > .000001);
      if (points.length < 2) continue;
      if (path.closed && Math.hypot(points[0].x - points[points.length - 1].x, points[0].y - points[points.length - 1].y) < .000001) points.pop();
      if (points.length < 2) continue;
      const entity = new LwPolyline(points.map((point) => new XY(point.x * factor, -point.y * factor)));
      entity.isClosed = path.closed;
      entity.layer = layerFor(path.layer); entity.color = colorFor(path.color);
      model.entities.add(entity);
    }
    const addText = (value: string, x: number, y: number, h: number, layerName: string, align = TextHorizontalAlignment.Left, rotation = 0, color = new Color(7)) => {
      const entity = new TextEntity(printableText(value));
      entity.height = h; entity.insertPoint = new XYZ(x, y, 0); entity.alignmentPoint = new XYZ(x, y, 0);
      entity.horizontalAlignment = align; entity.verticalAlignment = TextVerticalAlignmentType.Baseline;
      entity.rotation = rotation; entity.layer = layerFor(layerName); entity.color = color;
      model.entities.add(entity);
    };
    for (const text of geometry.texts) {
      addText(text.value, text.point.x * factor, -text.point.y * factor, text.height * factor,
        text.layer, text.align === "center" ? TextHorizontalAlignment.Center : text.align === "right" ? TextHorizontalAlignment.Right : TextHorizontalAlignment.Left,
        -text.rotation, colorFor(text.color));
    }

    // The left edge of the first segment and roadway 0.00 are the CAD origin.
    const datum = new Line(); datum.startPoint = new XYZ(-.6 * unitScale, 0, 0); datum.endPoint = new XYZ((streetWidth(street.segments) + .6) * unitScale, 0, 0); datum.layer = layerFor("DATUM_0_00"); datum.color = new Color(8); model.entities.add(datum);
    const top = -drawing.box.y * factor;
    addText(`${street.name}${street.location ? " (" + street.location + ")" : ""} | STREET CROSS-SECTION`, 0, top + .65 * unitScale, .4 * unitScale, "TITLE");
    addText(`Model space 1:1 | units: ${options.units === "mm" ? "millimetres" : "metres"} | elevations relative to 0.00 m`, 0, top + .2 * unitScale, .2 * unitScale, "TITLE");
    let bottom = -(drawing.box.y + drawing.box.height) * factor;
    if (options.annotations) {
      bottom -= .8 * unitScale;
      addText("ELEMENT SCHEDULE (widths and levels in metres)", 0, bottom, .3 * unitScale, "SCHEDULE");
      for (let index = 0; index < street.segments.length; index++) {
        const segment = street.segments[index], levels = edgeLevels(segment);
        bottom -= .46 * unitScale;
        addText(`${index + 1}. ${DEFS[segment.type].label} | W ${segment.w} m | L ${formatLevel(levels.left)} | R ${formatLevel(levels.right)} | slope ${segment.slope}% | ${segment.dir === "in" ? "toward" : "away"} | ${movementLabel(segment.movement)}`, 0, bottom, .19 * unitScale, "SCHEDULE");
      }
    }
    bottom -= .7 * unitScale;
    addText("Illustrations: Streetmix / Katie Lewis and contributors, CC BY-SA 4.0. https://creativecommons.org/licenses/by-sa/4.0/", 0, bottom, .16 * unitScale, "CREDITS");
    const minX = drawing.box.x * factor, maxX = (drawing.box.x + drawing.box.width) * factor;
    header.modelSpaceExtMin = new XYZ(minX, bottom - .4 * unitScale, 0);
    header.modelSpaceExtMax = new XYZ(maxX, top + 1.1 * unitScale, 0);
    header.modelSpaceLimitsMin = new XY(minX, bottom - .4 * unitScale);
    header.modelSpaceLimitsMax = new XY(maxX, top + 1.1 * unitScale);
    const view = views.get("*Active");
    view.center = new XY((minX + maxX) / 2, (top + bottom) / 2);
    view.viewHeight = (top - bottom + 2 * unitScale) * 1.15;
    view.aspectRatio = Math.max(1.4, (maxX - minX) / view.viewHeight);
    view.target = new XYZ(0, 0, 0); view.direction = new XYZ(0, 0, 1); view.showGrid = false;

    progress(`Writing DWG with ${model.entities.count.toLocaleString()} editable entities...`);
    await new Promise<void>((resolve) => window.setTimeout(resolve, 20));
    const errors: string[] = [];
    const bytes = DwgWriter.writeToBuffer(document, null, (_sender, event) => { if (event.notificationType === 3) errors.push(event.message); });
    if (new TextDecoder("ascii").decode(bytes.subarray(0, 6)) !== "AC1032") throw new Error("The CAD encoder did not produce a valid DWG header.");
    if (errors.length) throw new Error(`CAD encoding failed: ${errors[0]}`);
    progress("Checking the exported CAD file...");
    await new Promise<void>((resolve) => window.setTimeout(resolve, 20));
    const buffer = new Uint8Array(bytes.length); buffer.set(bytes);
    const readBack = DwgReader.readFromStream(buffer.buffer);
    if (readBack.modelSpace?.entities.count !== model.entities.count || readBack.header?.insUnits !== header.insUnits) {
      throw new Error("The CAD round-trip check failed. No file was downloaded; try exporting without illustrations.");
    }
    return { bytes, mime: "image/vnd.dwg", filename: `${filenameFor(street.name)}.dwg`, detail: `DWG created: ${model.entities.count.toLocaleString()} entities, ${layers.size} layers, 1:1 ${options.units}.` };
  } finally { drawing.cleanup(); }
}