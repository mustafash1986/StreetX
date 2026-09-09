import { DEFS, cycleBuffers, segmentIllustration, type Segment } from "./street";
import type { Illustration } from "../svg/library";

export interface StreetObject { art: Illustration; xM: number; z?: number }

// Shared by the live canvas and both export formats, so object locations do not
// drift when a lane has an access aisle, two travel directions or a separator.
export function objectsFor(segment: Segment, segments: Segment[]): StreetObject[] {
  const def = DEFS[segment.type];
  const art = segmentIllustration(segment);
  if (!art) return [];
  let center = segment.w / 2;
  if (def.layout === "loading") center = (segment.w - 1.53) / 2 + (segment.side === "left" ? 1.53 : 0);
  if (def.layout === "protected" || def.layout === "two-way") {
    const buffers = cycleBuffers(segment, segments);
    const rideWidth = segment.w - buffers.left - buffers.right;
    const items: StreetObject[] = [];
    if (buffers.left) items.push({ art: { path: "dividers/bollard.svg" }, xM: buffers.left / 2, z: 2 });
    if (buffers.right) items.push({ art: { path: "dividers/bollard.svg" }, xM: segment.w - buffers.right / 2, z: 2 });
    if (def.layout === "two-way") {
      items.push({ art: { path: "bikes/biker-02-inbound.svg" }, xM: buffers.left + rideWidth * .28, z: 3 });
      items.push({ art: { path: "bikes/biker-01-outbound.svg" }, xM: buffers.left + rideWidth * .72, z: 3 });
    } else items.push({ art, xM: buffers.left + rideWidth / 2, z: 3 });
    return items;
  }
  if (segment.type === "peoplewalk") return [
    { art, xM: segment.w * .22, z: 1 },
    { art: { path: "people/people-14.svg" }, xM: segment.w * .5, z: 1 },
    { art: { path: "people/people-25.svg" }, xM: segment.w * .78, z: 1 },
  ];
  const items: StreetObject[] = [{ art, xM: center, z: 1 }];
  if (def.layout === "shared") items.push({ art: { path: `bikes/biker-01-${segment.dir === "in" ? "inbound" : "outbound"}.svg` }, xM: center, z: 3 });
  return items;
}