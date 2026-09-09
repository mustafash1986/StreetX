import { useEffect, useState } from "react";
import { Check, Download, FileText, Image as ImageIcon, Layers, Loader2, ShieldCheck, TriangleAlert, Zap } from "lucide-react";
import type { StreetDocument } from "../data/editor";
import { Modal } from "./Chrome";
import { DEFAULT_EXPORT_OPTIONS, saveExport, type ExportFormat, type ExportOptions, type PngBackground } from "../export/types";

const TITLES = {
  pdf: "Export PDF document",
  png: "Export PNG image",
  dwg: "Export AutoCAD drawing (.dwg)",
  ai: "Export for Adobe Illustrator",
} as const;

const BLURBS = {
  pdf: ["PDF vector document", "Solid colour, sketch or black & white"] as const,
  png: ["PNG raster image", "Transparent or with background"] as const,
  dwg: ["Native AutoCAD DWG", "AutoCAD 2018+ binary, editable layers"] as const,
  ai: ["Adobe Illustrator vector file", "Opens in Illustrator, grouped layers"] as const,
};

export function ExportDialog({ street, format, onClose }: { street: StreetDocument; format: ExportFormat; onClose: () => void }) {
  const [options, setOptions] = useState<ExportOptions>({ ...DEFAULT_EXPORT_OPTIONS, format });
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  useEffect(() => {
    setOptions((current) => ({ ...current, format }));
    setError(""); setSuccess("");
  }, [format]);
  const update = (patch: Partial<ExportOptions>) => { setOptions((current) => ({ ...current, ...patch })); setError(""); setSuccess(""); };
  const generate = async () => {
    if (busy) return;
    setBusy(true); setError(""); setSuccess(""); setProgress("Loading the export tools...");
    try {
      await new Promise<void>((resolve) => window.setTimeout(resolve, 25));
      const result = options.format === "pdf"
        ? await (await import("../export/pdf")).exportPdf(street, options, setProgress)
        : options.format === "png"
          ? await (await import("../export/png")).exportPng(street, options, setProgress)
          : options.format === "ai"
            ? await (await import("../export/ai")).exportAi(street, options, setProgress)
            : await (await import("../export/cad")).exportCad(street, options, setProgress);
      saveExport(result);
      setSuccess(result.detail);
    } catch (cause) {
      console.error("Streetx export failed", cause);
      setError(cause instanceof Error ? cause.message : "The file could not be generated. Try a smaller export.");
    } finally { setBusy(false); setProgress(""); }
  };
  const cad = options.format === "dwg";
  return <Modal title={TITLES[options.format]} closeDisabled={busy} onClose={() => { if (!busy) onClose(); }}>
    <div className="export-dialog" aria-busy={busy}>
      <p className="export-street-name">{street.name}<span>Full cross-section, independent of camera zoom</span></p>
      <div className="export-format-badge">{options.format === "pdf" ? <FileText size={21} /> : options.format === "png" ? <ImageIcon size={21} /> : options.format === "ai" ? <Zap size={21} /> : <Layers size={21} />}<div><strong>{BLURBS[options.format][0]}</strong><span>{BLURBS[options.format][1]}</span></div></div>
      <fieldset disabled={busy} className="export-settings">
        <legend>Include in the file</legend>
        <label><input type="checkbox" checked={options.artwork} onChange={(event) => update({ artwork: event.target.checked })} /><span>Vehicles, people and street objects</span></label>
        <label><input type="checkbox" checked={options.frontages} onChange={(event) => update({ frontages: event.target.checked })} /><span>Buildings and side environments</span></label>
        <label><input type="checkbox" checked={options.annotations} onChange={(event) => update({ annotations: event.target.checked })} /><span>Width dimensions, edge levels and element schedule</span></label>
        <label><input type="checkbox" checked={options.capacity} onChange={(event) => update({ capacity: event.target.checked })} /><span>Street Capacity &amp; Analytics (modal breakdown)</span></label>
        {options.format === "pdf" && <label className="export-select-row"><span>Paper size</span><select aria-label="PDF paper size" value={options.paper} onChange={(event) => update({ paper: event.target.value as "a3" | "a4" })}><option value="a3">A3 landscape</option><option value="a4">A4 landscape</option></select></label>}
        {options.format === "png" && <label className="export-select-row"><span>Background</span><select aria-label="PNG background" value={options.pngBackground} onChange={(event) => update({ pngBackground: event.target.value as PngBackground })}><option value="transparent">Transparent</option><option value="sky">Sky backdrop</option><option value="white">White</option></select></label>}
        {options.format === "png" && <label className="export-select-row"><span>Format</span><select aria-label="PNG background" value={options.aiFormat} onChange={(event) => update({ aiFormat: event.target.value as typeof options.aiFormat })}><option value="ai">.ai (opens in Illustrator)</option><option value="svg">.svg (vector, wide support)</option></select></label>}
        {options.format === "dwg" && <label className="export-select-row"><span>Drawing units</span><select aria-label="CAD drawing units" value={options.units} onChange={(event) => update({ units: event.target.value as "m" | "mm" })}><option value="m">Metres (1 unit = 1 m)</option><option value="mm">Millimetres (1 unit = 1 mm)</option></select></label>}
        {options.format === "pdf" && <div className="pdf-appearance"><span>PDF appearance</span><div role="group" aria-label="PDF appearance">{(["solid", "sketch", "mono"] as const).map((appearance) => <button type="button" key={appearance} aria-pressed={options.appearance === appearance} onClick={() => update({ appearance })}>{appearance === "solid" ? "Solid colour" : appearance === "sketch" ? "Sketch" : "Black & white"}</button>)}</div></div>}
      </fieldset>
      <div className="export-format-note">
        <ShieldCheck size={16} />
        <p>{options.format === "pdf" ? `${options.appearance === "solid" ? "Solid-colour" : options.appearance === "sketch" ? "Outline-sketch" : "Black-and-white"} vector PDF with a printed scale bar. Long schedules continue onto additional pages.`
          : options.format === "png" ? "High-resolution raster image (3x). Transparent keeps the alpha channel for overlays and presentations; sky and white fill the backdrop."
          : options.format === "ai" ? "Opens in Adobe Illustrator as editable vector objects. Buildings, vehicles, sidewalks and frontages arrive as separate named groups so you can recolor, restyle and recompose for presentation."
          : "Real AutoCAD 2018+ DWG, generated locally. Editable polylines and text on separate layers at 1:1 scale. The file is read back and checked before download."}</p>
      </div>
      <div className="export-format-note">
        <ShieldCheck size={16} />
        <p>{options.format === "pdf" ? `${options.appearance === "solid" ? "Solid-colour" : options.appearance === "sketch" ? "Outline-sketch" : "Black-and-white"} vector PDF with a printed scale bar. Long schedules continue onto additional pages.`
          : options.format === "png" ? "High-resolution raster image (3x). Transparent keeps the alpha channel for overlays and presentations; sky and white fill the backdrop."
          : "Real AutoCAD 2018+ DWG, generated locally. Editable polylines and text on separate layers at 1:1 scale. The file is read back and checked before download."}</p>
      </div>
      {cad && <p className="export-small-print">CAD artwork is outline linework, not raster images or solid fills. Curves are approximated by polylines; dimensions are editable, non-associative linework and text. Levels remain relative to datum 0.00 m. Confirm the result in your CAD application before production use.</p>}
      {busy && <div className="export-progress" role="status"><Loader2 size={17} className="animate-spin" /><span>{progress}</span></div>}
      {error && <div className="export-error" role="alert"><TriangleAlert size={17} /><div><strong>Export was not downloaded</strong><p>{error}</p></div></div>}
      {success && <div className="export-success" role="status"><Check size={17} /><span>{success}</span></div>}
      <button className="export-download" disabled={busy} onClick={generate}>{busy ? <Loader2 size={17} className="animate-spin" /> : <Download size={17} />} {busy ? "Creating file..." : `Download ${options.format.toUpperCase()}`}</button>
      <p className="export-privacy">Created in your browser. Your street is not uploaded.</p>
    </div>
  </Modal>;
}
