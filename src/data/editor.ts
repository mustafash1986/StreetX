import { BLD_STYLES, BUILDING_KINDS, INITIAL, normalizeSegments, type Building, type Segment } from "./street";

export type EnvironmentTheme = "day" | "dusk" | "night" | "overcast";
export type MeasurementUnits = "metric" | "imperial";

export interface StreetDocument {
  name: string;
  segments: Segment[];
  left: Building;
  right: Building;
  location?: string;
  targetWidth?: number;
  environment?: EnvironmentTheme;
  units?: MeasurementUnits;
}

export interface EditorState { present: StreetDocument; past: StreetDocument[]; future: StreetDocument[] }
export type EditorAction = { type: "commit"; document: StreetDocument } | { type: "undo" } | { type: "redo" };
export const STORAGE_KEY = "streetx.editor.v7";
export const DEFAULT_DOCUMENT: StreetDocument = {
  name: "Linden Avenue",
  segments: INITIAL,
  left: { kind: "apartments", style: "navy", floors: 4 },
  right: { kind: "waterfront", style: "cream", floors: 3 },
  location: undefined,
  targetWidth: 26,
  environment: "day",
  units: "metric",
};

function normalizeBuilding(input: Building | undefined, fallback: Building): Building {
  return {
    kind: BUILDING_KINDS.some((entry) => entry.key === input?.kind) ? input!.kind : fallback.kind,
    style: BLD_STYLES.some((style) => style.key === input?.style) ? input!.style : fallback.style,
    floors: Number.isFinite(input?.floors) ? Math.max(1, Math.min(8, Math.round(input!.floors))) : fallback.floors,
  };
}

export function normalizeDocument(input: StreetDocument): StreetDocument {
  if (!input || !Array.isArray(input.segments)) throw new Error("This is not a Streetx street file.");
  const segments = normalizeSegments(input.segments);
  if (!segments.length) throw new Error("A street must contain at least one supported segment.");
  return {
    name: typeof input.name === "string" && input.name.trim() ? input.name.trim().slice(0, 80) : "Untitled street",
    segments,
    left: normalizeBuilding(input.left, DEFAULT_DOCUMENT.left),
    right: normalizeBuilding(input.right, DEFAULT_DOCUMENT.right),
    location: typeof input.location === "string" ? input.location.trim().slice(0, 80) : undefined,
    targetWidth: typeof input.targetWidth === "number" && input.targetWidth > 0 ? Math.round(input.targetWidth * 100) / 100 : undefined,
    environment: ["day", "dusk", "night", "overcast"].includes(input.environment as string) ? input.environment : "day",
    units: input.units === "imperial" ? "imperial" : "metric",
  };
}

export function editorReducer(state: EditorState, action: EditorAction): EditorState {
  if (action.type === "undo") {
    const previous = state.past[state.past.length - 1];
    return previous ? { present: normalizeDocument(previous), past: state.past.slice(0, -1), future: [state.present, ...state.future] } : state;
  }
  if (action.type === "redo") {
    const next = state.future[0];
    return next ? { present: normalizeDocument(next), past: [...state.past, state.present], future: state.future.slice(1) } : state;
  }
  const document = normalizeDocument(action.document);
  if (JSON.stringify(document) === JSON.stringify(state.present)) return state;
  return { present: document, past: [...state.past.slice(-49), state.present], future: [] };
}

export function encodeStreet(document: StreetDocument): string {
  const bytes = new TextEncoder().encode(JSON.stringify(document));
  let binary = "";
  bytes.forEach((byte) => { binary += String.fromCharCode(byte); });
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function decodeStreet(value: string): StreetDocument {
  if (value.length > 100000) throw new Error("Street link is too large.");
  const text = value.replace(/-/g, "+").replace(/_/g, "/");
  const binary = atob(text.padEnd(Math.ceil(text.length / 4) * 4, "="));
  return normalizeDocument(JSON.parse(new TextDecoder().decode(Uint8Array.from(binary, (character) => character.charCodeAt(0)))));
}

export function initialEditorState(): EditorState {
  let document = DEFAULT_DOCUMENT;
  try {
    const shared = new URLSearchParams(window.location.hash.slice(1)).get("street");
    const local = localStorage.getItem(STORAGE_KEY) || localStorage.getItem("streetx.editor.v6") || localStorage.getItem("streetx.editor.v5");
    if (shared) document = decodeStreet(shared);
    else if (local) document = normalizeDocument(JSON.parse(local));
  } catch {
    // Untrusted imports and stale browser data never bypass width validation.
  }
  return { present: normalizeDocument(document), past: [], future: [] };
}