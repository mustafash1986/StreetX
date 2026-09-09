export type RuleBasis = "Published guidance" | "Accessibility dimension" | "Planning allowance";

export const SOURCES = {
  lanes: {
    title: "NACTO: Lane Width",
    url: "https://nacto.org/publication/urban-street-design-guide/street-design-elements/lane-width/",
  },
  bus: {
    title: "NACTO: Dedicated Curbside / Offset Bus Lanes",
    url: "https://nacto.org/publication/urban-street-design-guide/street-design-elements/transit-streets/dedicated-curbside-offset-bus-lanes/",
  },
  sidewalk: {
    title: "NACTO: Sidewalk Design",
    url: "https://nacto.org/publication/urban-street-design-guide/street-design-elements/sidewalks/sidewalk-design/",
  },
  bikes: {
    title: "NACTO: Constrained Bike Lanes",
    url: "https://nacto.org/publication/urban-bikeway-design-guide/designing-bikeways-for-all-ages-and-abilities/bikeways-on-low-speed-low-volume-streets/constrained-bike-lanes/",
  },
  protected: {
    title: "NACTO: Designing Protected Bike Lanes",
    url: "https://nacto.org/publication/urban-bikeway-design-guide/designing-bikeways-for-all-ages-and-abilities/protected-bike-lanes/designing-protected-bike-lanes/",
  },
  prowag: {
    title: "U.S. Access Board: PROWAG R302, R309-R311",
    url: "https://www.access-board.gov/prowag/technical.html",
  },
  landscape: {
    title: "San Francisco Better Streets: Sidewalk Landscaping",
    url: "https://sfbetterstreets.org/find-project-types/greening-and-stormwater-management/greening-overview/sidewalk-landscaping/index.html",
  },
  trees: {
    title: "Seattle SDOT: Planting Strip and Tree Planting Rules",
    url: "https://www.seattle.gov/documents/Departments/SDOT/CAMs/cam2304.pdf",
  },
  racks: {
    title: "Bicycle Security Advisors: Rack Spacing and Placement",
    url: "https://bicyclesecurityadvisors.com/best-practice-guides/parking/rack-spacing/",
  },
  transit: {
    title: "NACTO: Transit Street Design Guide",
    url: "https://nacto.org/publication/transit-street-design-guide/",
  },
} as const;

export interface WidthRule {
  label: string;
  minM: number;
  basis: RuleBasis;
  sources: (keyof typeof SOURCES)[];
  note: string;
}

const rule = (label: string, minM: number, basis: RuleBasis, sources: WidthRule["sources"], note: string): WidthRule =>
  ({ label, minM, basis, sources, note });

// This is a conservative US urban-street design profile, not a universal code.
// Imperial dimensions are rounded UP to the next centimetre, never below the source.
export const WIDTH_RULES = {
  sidewalk: rule("Clear sidewalk", 1.53, "Published guidance", ["sidewalk", "prowag"],
    "5 ft clear through-zone, excluding furniture. NACTO prefers 6 ft or more. PROWAG permits narrower routes in specific conditions; this profile does not use those exceptions."),
  running: rule("Running lane", 1.5, "Planning allowance", ["sidewalk"],
    "A 1.5 m one-way running allocation beside, not instead of, the continuous accessible pedestrian route. Running routes require local design review for conflicts, lighting and crossings."),
  drive: rule("Urban traffic / turn lane", 3.05, "Published guidance", ["lanes"],
    "Uses NACTO's 10 ft urban travel-lane recommendation as the editor minimum. Narrow-lane exceptions are not enabled; turning vehicles may need extra swept-path clearance."),
  bus: rule("Bus / freight lane", 3.36, "Published guidance", ["bus", "lanes"],
    "11 ft for curbside buses and designated freight routes. Offset bus-lane exceptions are not used in this profile."),
  sharedBus: rule("Shared bus / bike lane", 3.36, "Published guidance", ["bikes", "bus"],
    "NACTO describes 10-12 ft shared lanes. Streetx uses 11 ft with buses and bicycles travelling in line, not passing side by side. A separate bikeway is preferable."),
  parking: rule("Parallel parking", 2.14, "Published guidance", ["lanes"],
    "7 ft ordinary parallel parking. This is not the dimension for an accessible parking space or for an adjacent bicycle door buffer."),
  angledParking: rule("Angled parking bay", 4.8, "Planning allowance", ["lanes"],
    "Transverse-depth allowance for the illustrated angled car, not the stall width measured along the curb. Angle, vehicle length, manoeuvring aisle and local parking standards govern final geometry."),
  perpendicularParking: rule("Perpendicular parking bay", 5, "Planning allowance", ["lanes"],
    "5 m bay depth for a side-on car in this cross-section. The separate manoeuvring aisle, stall spacing and accessible spaces require a plan-view design."),
  accessibleParking: rule("Accessible parallel parking", 4, "Accessibility dimension", ["prowag"],
    "PROWAG R310.2: 4.0 m transverse width and 7.3 m minimum length. The cross-section cannot validate longitudinal length, ramps or the accessible route."),
  loading: rule("Taxi / passenger loading", 3.97, "Accessibility dimension", ["prowag"],
    "Includes a 2.44 m pull-up space AND a 1.53 m marked access aisle on the selected door side (R311). Requires at least 6.1 m length, a connected accessible route and level surfaces, not validated in this view."),
  bike: rule("Bike / micromobility lane", 1.53, "Published guidance", ["bikes"],
    "Uses a 5 ft conventional lane as a conservative floor. Excludes gutters and any door buffer; local rules for scooters also apply. Paint alone is not physical protection."),
  protectedBike: rule("One-way protected cycleway", 2.71, "Planning allowance", ["protected"],
    "Includes 2.10 m rideable width plus a 0.61 m separator. This conservative combined allocation follows the 2025 guide; next to parking the separator increases to 0.92 m."),
  twoWayBike: rule("Two-way protected cycleway", 4.51, "Planning allowance", ["protected"],
    "Includes the guide's recommended 3.90 m rideable space plus 0.61 m separation. The absolute short-constrained-section exception is not used. Next to parking the separator is 0.92 m."),
  boarding: rule("Clear transit boarding area", 2.44, "Accessibility dimension", ["prowag"],
    "R309.1.1: 2.44 m clear perpendicular to the curb, and 1.525 m along the curb. Keep the ramp deployment area free of shelters, seats and poles."),
  shelter: rule("Shelter furnishing zone", 2.44, "Planning allowance", ["prowag", "sidewalk"],
    "Allowance for the illustrated shelter and wheelchair space. Add a separate clear boarding area and continuous sidewalk; this furniture strip is NOT the clear boarding area."),
  station: rule("BRT station", 3.6, "Planning allowance", ["prowag", "transit"],
    "Station footprint allowance. Platform width, accessible boarding, vehicle interface, crowding and egress must be designed with the transit operator."),
  rail: rule("Streetcar / light rail", 3.6, "Planning allowance", ["transit"],
    "An editor allowance for a single rail vehicle and lateral clearance, not a universal rail standard. The operator's dynamic envelope, curves, poles and platform clearances govern final width."),
  train: rule("Train track / locomotive", 4.5, "Planning allowance", ["transit"],
    "A 4.5 m single-track illustration envelope for the supplied locomotive, not a railway design standard. Gauge, vehicle dynamic envelope, track centres, electrification, structures and maintenance clearances require railway-operator approval."),
  tree: rule("Tree / palm planting strip", 1.53, "Published guidance", ["trees", "landscape"],
    "Uses SDOT's 5 ft planting-strip floor without a forestry exception. Other jurisdictions permit narrower tree basins. Soil volume, species, roots and canopy clearance need a site-specific design."),
  planter: rule("Raised planter bay", 1.22, "Planning allowance", ["landscape"],
    "A 1.22 m bay accommodates the supplied 1.20 m planter without resizing it. No universal planter width exists; this is an object-footprint allowance, not an accessibility clear path."),
  landscape: rule("Shrub / planted median", 1.22, "Planning allowance", ["landscape"],
    "A 4 ft planted strip, including edging, based on the San Francisco median guidance. Maintenance access, visibility, drainage and soil volume need additional review."),
  grass: rule("Groundcover strip", 0.61, "Planning allowance", ["landscape"],
    "2 ft groundcover allowance, without a tree. Planting is separate from pedestrian space and may need more width locally."),
  bench: rule("Bench furnishing zone", 1.8, "Planning allowance", ["sidewalk", "prowag"],
    "Furniture footprint and seated-user allowance only. A separate clear sidewalk and accessible seating space must be provided; furniture is never counted as clear walking width."),
  dining: rule("Outdoor dining / vendor", 2.4, "Planning allowance", ["sidewalk"],
    "Table, chairs or vendor-cart allowance, not the public through-route. Keep a separate clear sidewalk and verify local permits and accessible seating."),
  bikeRack: rule("Bicycle rack / dock", 2.29, "Published guidance", ["racks"],
    "7.5 ft corral allocation. Space for manoeuvring and an unobstructed pedestrian route must also be available; dock manufacturers may require additional clearance."),
  scooterParking: rule("Scooter parking", 1.53, "Planning allowance", ["sidewalk"],
    "A designated dock / parking footprint, separate from the accessible sidewalk. Placement and operating permits are jurisdiction-specific."),
  lamp: rule("Lighting / utility strip", 0.91, "Planning allowance", ["sidewalk"],
    "A dedicated 0.91 m furniture strip keeps pole bases out of traffic and walking lanes. Utilities, foundations and setbacks must be checked locally."),
  wayfinding: rule("Wayfinding furnishing zone", 1.53, "Planning allowance", ["sidewalk", "prowag"],
    "Pylon footprint allowance, additional to the clear sidewalk. Maintain protruding-object and accessible-control clearances."),
  separator: rule("Painted / physical separator", 0.61, "Published guidance", ["protected"],
    "2 ft separator. Where used as a bicycle door buffer next to parking, use at least 3 ft (0.92 m); this larger minimum is applied automatically."),
  curb: rule("Curb only", 0.16, "Planning allowance", ["sidewalk"],
    "A nominal 6 in curb rounded up to 0.16 m. It does not count as a bike-lane buffer, traffic safety island or clear pedestrian space."),
  works: rule("Work-zone equipment", 1.22, "Planning allowance", ["prowag"],
    "Equipment footprint only, not a work-zone safety buffer. A traffic management plan, impact protection, taper lengths and alternate accessible routes must be designed separately."),
  drainage: rule("Drainage channel", 1.2, "Planning allowance", ["landscape"],
    "Illustrated open-channel allowance. Hydraulic capacity, protective edges, maintenance and accessible crossings need engineering design."),
  parklet: rule("Parklet / curbside seating", 2.44, "Planning allowance", ["sidewalk", "lanes"],
    "8 ft occupied curbside-space allowance. Barriers, setbacks, drainage, accessible entry and local parklet permits govern the final design."),
  foodtruck: rule("Food-truck vending bay", 4.5, "Planning allowance", ["lanes", "sidewalk"],
    "A 4.5 m envelope for this library's truck with deployed service awning, not a universal parking minimum or a travel lane. A separate customer queue and accessible pedestrian route are required."),
} satisfies Record<string, WidthRule>;

export type WidthRuleId = keyof typeof WIDTH_RULES;
export const GUIDANCE_DISCLAIMER = "Urban US guidance profile. These are enforced Streetx design floors, not universal legal minima or a construction approval. Local codes, speeds, swept paths, accessibility, soil volumes and transit-operator requirements still govern.";
export const roundMetres = (n: number) => Math.round(n * 100) / 100;
export const formatMetres = (n: number) => Number(n.toFixed(2)).toString();