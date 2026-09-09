export const LANE_MOVEMENTS = [
  { id: "left", label: "Left turn only" },
  { id: "left-straight", label: "Left or straight" },
  { id: "straight", label: "Straight ahead" },
  { id: "right-straight", label: "Straight or right" },
  { id: "right", label: "Right turn only" },
  { id: "both", label: "Left or right" },
  { id: "left-right-straight", label: "Left, straight or right" },
  { id: "shared", label: "Shared two-way turn lane" },
] as const;

export type LaneMovement = (typeof LANE_MOVEMENTS)[number]["id"];
export const isLaneMovement = (value: unknown): value is LaneMovement =>
  LANE_MOVEMENTS.some((movement) => movement.id === value);

export function arrowAssetPath(movement: LaneMovement, direction: "in" | "out"): string {
  return `markings/${movement}-${direction === "out" ? "outbound" : "inbound"}.svg`;
}

export function movementLabel(movement: LaneMovement): string {
  return LANE_MOVEMENTS.find((entry) => entry.id === movement)?.label ?? "Straight ahead";
}

export function hasLaneArrow(marking?: string): boolean {
  return ["drive", "turn", "bus", "shared", "bike", "rail"].includes(marking ?? "");
}

export function hasTurnChoices(marking?: string): boolean {
  return ["drive", "turn", "bus", "shared"].includes(marking ?? "");
}