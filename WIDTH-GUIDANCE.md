# Streetx Width Profile

This is a conservative US urban-street planning profile. It is not a universal
standard, a building permit, an accessibility certification, or a traffic safety
approval. The app displays the source and basis of every enforced width.

## Main Width Floors

| Category | Minimum across the street | Basis |
| --- | --- | --- |
| Clear sidewalk | 1.53 m | NACTO 5 ft through-zone guidance |
| General traffic / turn lane | 3.05 m | NACTO 10 ft urban lane guidance |
| Curbside bus / freight lane | 3.36 m | NACTO 11 ft guidance |
| Shared bus / bike | 3.36 m | Selected 11 ft within NACTO shared-lane range |
| Ordinary parallel parking | 2.14 m | NACTO 7 ft parking guidance |
| Accessible parallel parking | 4.00 m | PROWAG R310.2, also requires 7.3 m length |
| Taxi / passenger drop-off | 3.97 m | 2.44 m pull-up + 1.53 m access aisle, PROWAG R311 |
| Conventional bike / micromobility | 1.53 m | Conservative 5 ft lane profile; local rules apply |
| Protected one-way cycling | 2.71 m baseline | 2.10 m rideable + 0.61 m separator |
| Protected two-way cycling | 4.51 m baseline | 3.90 m rideable + 0.61 m separator |
| Clear bus boarding area | 2.44 m | PROWAG R309, measured perpendicular to curb |
| Tree planting strip | 1.53 m | SDOT 5 ft planting-strip floor without exceptions |
| Raised planter | 1.22 m | Allowance for a fixed 1.20 m illustration / container |

Parking-adjacent cycling buffers use 0.92 m. If motor traffic exists on both sides
of a protected cycleway, the editor reserves separation on both sides. Clear
sidewalks, boarding areas and furniture zones are different pieces of the street.
Do not count furniture space as clear pedestrian space.

For furniture, rail, drainage, planting containers, angled parking, work zones and
other equipment there is no single universal width. Their rows are explicitly
marked as planning allowances. Verify equipment footprints, local standards,
clearances, hydraulic requirements, soil volumes and rail dynamic envelopes.

The whole street minimum is the sum of its selected segment minimums. It is not a
single arbitrary road-width number. Invalid dimensions are normalized on
creation, editing, import, local restore, template load, undo and redo.

## Sources

- https://nacto.org/publication/urban-street-design-guide/street-design-elements/lane-width/
- https://nacto.org/publication/urban-street-design-guide/street-design-elements/transit-streets/dedicated-curbside-offset-bus-lanes/
- https://nacto.org/publication/urban-street-design-guide/street-design-elements/sidewalks/sidewalk-design/
- https://nacto.org/publication/urban-bikeway-design-guide/designing-bikeways-for-all-ages-and-abilities/bikeways-on-low-speed-low-volume-streets/constrained-bike-lanes/
- https://nacto.org/publication/urban-bikeway-design-guide/designing-bikeways-for-all-ages-and-abilities/protected-bike-lanes/designing-protected-bike-lanes/
- https://www.access-board.gov/prowag/technical.html
- https://sfbetterstreets.org/find-project-types/greening-and-stormwater-management/greening-overview/sidewalk-landscaping/index.html
- https://www.seattle.gov/documents/Departments/SDOT/CAMs/cam2304.pdf
- https://bicyclesecurityadvisors.com/best-practice-guides/parking/rack-spacing/

## Scale and Artwork

The library uses one SVG unit per centimetre. Streetx uses 38 screen pixels per
metre at 100% camera zoom. Neither the current street width nor lane width changes
that value. Wider streets scroll; they do not shrink their vehicles. Transparent
SVG padding is cropped without changing the original geometry. Repeated SVG IDs
are namespaced so clip paths cannot interfere with other illustrations.

Raised planters use the original complete planter SVG. They do not stack an
additional flower SVG on top of a container that already includes flowers.
Color and grass / empty variations keep exactly the same planter body.

## Regression Checks

`src/data/modelChecks.ts` exports `runModelChecks()` for use in the Vite browser
environment. It checks catalog assets, minimum enforcement, taxi variants,
camera-scale independence, building boundaries, adjacent buffers, imports and
undo/redo. A browser-based visual check is still needed for rendering and touch
interactions; a successful production build is not a substitute for that check.