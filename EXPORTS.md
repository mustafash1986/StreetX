# Streetx Exports

Use **Export** in the top bar to create a PDF, PNG or DWG. All files are generated
in the browser; the design is not uploaded to a third-party conversion service.
The export includes the full cross-section, irrespective of the viewport's pan
or zoom. Artwork, side frontages and annotations can be included separately.

## PDF

- A3 or A4 landscape, with vector paths rather than a screenshot.
- Choose **Solid colour**, **Sketch**, or **Black & white** before downloading.
  Sketch converts the whole drawing — including buildings — to clean outline
  linework; Black & white preserves tonal hierarchy while removing colour.
  The editor itself is unchanged.
- Automatic fit scale and a labelled scale bar ("Scale bar: 5 m at 100% print"
  means the printed bar measures exactly that distance on paper). Print at 100%
  to preserve the stated fit scale.
- Optional dimension lines, edge levels and an element schedule on later pages.
- Colour fills, street markings, original illustrations and side environments.

## PNG

- High-resolution raster image (3x) for slides and documents.
- Background choice: **Transparent** (alpha channel for overlays), **Sky**
  (editor-style gradient backdrop) or **White**.

PDF creation uses jsPDF and svg2pdf.js. The file signature is checked before
download. Use a PDF viewer to confirm the final print layout.

## Adobe Illustrator vector (.ai / .svg)

For presentation editing in **Adobe Illustrator**, two hand-offs are offered:

- **`.ai`** — a single-page vector PDF named `.ai`. Illustrator opens it directly
  as native, editable artwork. Buildings, vehicles, sidewalks and frontages are
  separate editable paths.
- **`.svg`** — a presentation-ready vector SVG. Each segment, artwork item and
  frontage carries layer metadata (`inkscape:label` + `data-cad-layer`), so the
  objects arrive as named, re-styleable groups in Illustrator and Inkscape.

Choose the option that fits your workflow: `.ai` for direct Illustrator editing,
`.svg` for broader compatibility with other editors.

## AutoCAD DWG

- A real binary AC1032 (AutoCAD 2018+) DWG, not a renamed DXF.
- Editable lightweight polylines and text in model space at 1:1.
- Drawing units are selectable: metres or millimetres.
- The origin is the left edge of the first street segment at roadway datum 0.00.
- Separate layers for each segment, artwork, frontages, markings, dimensions,
  edge levels, schedule and zero datum.
- Artwork is exported as outline linework, not solid fills or raster images.
  Curves are adaptively approximated by polylines. Dimensions are non-associative
  linework and text, not linked civil-engineering objects.

Native DWG serialization uses @node-projects/acad-ts. Before download, the file is
read back with its DWG reader to check entity count and drawing units. A failed
round-trip reports an error rather than downloading a misleading file.

Opening and auditing the file in Autodesk AutoCAD is a separate compatibility
check and remains recommended before professional production use.

## Direction Markings and Train

The eight original Streetmix arrow combinations are exposed separately from
travel direction: left, left/straight, straight, straight/right, right, left/right,
left/straight/right, and opposing shared turns. Bus lanes, including shared bus
and bike lanes, display arrows using the same 120-by-120 source design grid.
Selections are stored in street files, links, browser saves and history.

## Levels

Each segment stores left/start and right/end levels in metres relative to the
0.00 roadway datum. The displayed slope is calculated from those values. Flat
segments show one level; sloped segments show both. Matching neighbour controls
copy the same endpoint exactly, avoiding millimetre-scale gaps at continuous
surface joins.

The train track uses the original Streetmix locomotive illustration
`secret/inception-train.svg`. That asset has one front view; its lane arrow carries
travel direction. The 4.5 m track width is a planning envelope, not a railway
engineering standard.

## Attribution and Limits

Streetmix illustrations: Katie Lewis and contributors, CC BY-SA 4.0.
https://creativecommons.org/licenses/by-sa/4.0/

Exports are planning illustrations. Subgrade depth is schematic. Local width,
accessibility, rail, drainage and safety requirements still apply. Browser-based
export regression checks are in `src/export/checks.ts`; production compilation
does not itself execute those checks.