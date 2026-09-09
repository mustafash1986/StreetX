# Grounding and Profile Rendering

## Frontages

Each side renders one SVG plane, clipped to a reserved frontage margin. Original
Streetmix assets provide the apartments, house, grass, fence, parking and seawall.
The land datum follows the adjacent street edge elevation. The coastline is
drawn once; only the native water-repeat layer continues horizontally, at exactly
the same y coordinate. It is never stacked vertically or used as a repeated CSS
background. Changing frontage type cannot place it over the sidewalk.

## Road Levels

Stored `levelStart` and `levelEnd` are the source-of-truth levels relative to
0.00 m. Positive derived cross-slope rises to the right. For horizontal width w:

- Left edge = levelStart.
- Right edge = levelEnd.
- Slope = (levelEnd - levelStart) / w * 100.
- Centre elevation = (levelStart + levelEnd) / 2.
- A flat segment displays one level; a sloped segment displays L and R levels.

The surface is a clipped trapezoid matching those two edge elevations. There is
no straight full-width asphalt backing. Objects contact the surface at their
individual x position. Poles and trees stay upright; vehicles tilt about their
ground-contact anchor without being resized.

If a continuous profile must meet at a boundary, use **Match previous end** or
**Match next start**. It copies the exact stored endpoint instead of relying on
rounded slope arithmetic. When an already-matched edge is edited, its continuous
neighbour follows automatically. Intentional curb steps remain independent.

## Microvan Contact

The source microvan tyres meet at y=180 cm in both direction variants. Rotated
details inflate browser bounding-box measurements below the tyres. The vehicle
therefore uses that explicit tyre datum rather than bounding-box bottom, even
when the browser falls back to the original viewBox.

## Verification

Development model checks in `src/data/modelChecks.ts` cover both microvan
directions and multiple zoom values, edge-level calculations, sloped surface
polygons, frontage footprints, horizontal-only water repeats and apartment slices.
Browser screenshot comparison is a separate visual check.