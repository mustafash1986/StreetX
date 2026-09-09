export type ExportFormat = "pdf" | "png" | "dwg" | "ai";
export type PdfAppearance = "solid" | "sketch" | "mono";
export type AiFormat = "ai" | "svg";
export type PngBackground = "transparent" | "sky" | "white";
export interface ExportOptions {
  format: ExportFormat;
  artwork: boolean;
  frontages: boolean;
  annotations: boolean;
  capacity: boolean;
  paper: "a4" | "a3";
  units: "m" | "mm";
  appearance: PdfAppearance;
  pngBackground: PngBackground;
  aiFormat: AiFormat;
}

export const DEFAULT_EXPORT_OPTIONS: ExportOptions = {
  format: "pdf", artwork: true, frontages: true, annotations: true, capacity: true, paper: "a3", units: "m", appearance: "solid", pngBackground: "transparent", aiFormat: "ai",
};

export interface ExportResult {
  bytes: Uint8Array;
  mime: string;
  filename: string;
  detail: string;
}

export type Progress = (message: string) => void;
export function filenameFor(name: string): string {
  return name.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9._-]+/gi, "-").replace(/^-+|-+$/g, "").slice(0, 80) || "Streetx";
}

export function saveExport(result: ExportResult) {
  // Copy to an ordinary ArrayBuffer: some encoders return views into a larger buffer.
  const data = new Uint8Array(result.bytes.length);
  data.set(result.bytes);
  const url = URL.createObjectURL(new Blob([data.buffer], { type: result.mime }));
  const anchor = document.createElement("a");
  anchor.href = url; anchor.download = result.filename;
  document.body.appendChild(anchor); anchor.click(); anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 10000);
}