import { type Segment } from "./street";

export interface CapacityBreakdown {
  pedestrian: number;
  cycling: number;
  transit: number;
  driving: number;
  total: number;
  pedestrianWidth: number;
  cyclingWidth: number;
  transitWidth: number;
  drivingWidth: number;
  otherWidth: number;
  totalWidth: number;
}

/**
 * Calculates hourly people-moving capacity (people per hour) based on
 * NACTO Transit Street Design Guide and High-Capacity Urban Corridors data.
 */
export function calculateCapacity(segments: Segment[]): CapacityBreakdown {
  let pedestrian = 0;
  let cycling = 0;
  let transit = 0;
  let driving = 0;

  let pedestrianWidth = 0;
  let cyclingWidth = 0;
  let transitWidth = 0;
  let drivingWidth = 0;
  let otherWidth = 0;

  for (const segment of segments) {
    const w = segment.w;

    switch (segment.type) {
      case "walk":
      case "peoplewalk":
        // Sidewalk capacity scales with through-width (~8,300 p/hr per metre)
        pedestrian += Math.round(15000 * (w / 1.8));
        pedestrianWidth += w;
        break;
      case "running":
        pedestrian += 4500;
        pedestrianWidth += w;
        break;
      case "waiting":
        pedestrian += 2000;
        pedestrianWidth += w;
        break;
      case "bike":
      case "protected-bike":
        cycling += 12000;
        cyclingWidth += w;
        break;
      case "two-way-bike":
        cycling += 14000;
        cyclingWidth += w;
        break;
      case "scooter":
        cycling += 4000;
        cyclingWidth += w;
        break;
      case "bus":
        transit += 10000;
        transitWidth += w;
        break;
      case "sharedbus":
        transit += 5000;
        transitWidth += w;
        break;
      case "double-bus":
        transit += 15000;
        transitWidth += w;
        break;
      case "brt":
        transit += 18000;
        transitWidth += w;
        break;
      case "shuttle":
        transit += 3000;
        transitWidth += w;
        break;
      case "tram":
        transit += 10000;
        transitWidth += w;
        break;
      case "light-rail":
        transit += 15000;
        transitWidth += w;
        break;
      case "train":
        transit += 25000;
        transitWidth += w;
        break;
      case "drive":
        driving += 1500;
        drivingWidth += w;
        break;
      case "turn":
        driving += 1000;
        drivingWidth += w;
        break;
      case "truck":
        driving += 800;
        drivingWidth += w;
        break;
      case "taxilane":
      case "rideshare":
        driving += 900;
        drivingWidth += w;
        break;
      default:
        // Buffers, planters, curbs, benches, parking
        otherWidth += w;
        break;
    }
  }

  const total = pedestrian + cycling + transit + driving;
  const totalWidth = pedestrianWidth + cyclingWidth + transitWidth + drivingWidth + otherWidth;

  return {
    pedestrian,
    cycling,
    transit,
    driving,
    total,
    pedestrianWidth: Math.round(pedestrianWidth * 100) / 100,
    cyclingWidth: Math.round(cyclingWidth * 100) / 100,
    transitWidth: Math.round(transitWidth * 100) / 100,
    drivingWidth: Math.round(drivingWidth * 100) / 100,
    otherWidth: Math.round(otherWidth * 100) / 100,
    totalWidth: Math.round(totalWidth * 100) / 100,
  };
}

/**
 * Format metres into metric string or imperial feet & inches string.
 */
export function formatDimension(metres: number, units: "metric" | "imperial" = "metric"): string {
  if (units === "imperial") {
    const totalInches = Math.round(metres * 39.3700787);
    const feet = Math.floor(totalInches / 12);
    const inches = totalInches % 12;
    if (inches === 0) return `${feet}′`;
    return `${feet}′ ${inches}″`;
  }
  const rounded = Math.round(metres * 100) / 100;
  return `${Number(rounded.toFixed(2))} m`;
}
