import { useId, useMemo } from "react";
import { artPlacement, isolateSvgIds, measureBounds, prepareArt, type Illustration } from "./library";

interface NativeArtProps {
  art: Illustration;
  ppm: number;
  thumbnail?: { width: number; height: number };
  className?: string;
  anchored?: boolean;
}

export function NativeArt({ art, ppm, thumbnail, className = "", anchored = true }: NativeArtProps) {
  const prepared = useMemo(() => prepareArt(art), [art.path, art.flowerColor, art.removeLayers?.join(","), art.onlyLayers?.join(","), art.facadeColor, art.facadeShadow, art.floors]);
  const id = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  // Bounds are resolved synchronously (and cached) so the artwork is cropped to
  // its true geometry on the very first paint. No floating uncropped frame.
  const bounds = useMemo(() => measureBounds(prepared), [prepared]);

  const placement = artPlacement(art, prepared, bounds, ppm);
  // Thumbnails share one source viewBox per asset family (all sedans are
  // 360x180), so the same vehicle renders at the same icon size even when a
  // turn-signal glow widens its measured bounds. The canvas still uses the
  // tight measured crop for exact grounding.
  const thumbBounds = prepared.original;
  const scale = thumbnail
    ? Math.min(thumbnail.width / thumbBounds.width, thumbnail.height / thumbBounds.height)
    : ppm / 100;
  const renderBounds = thumbnail ? thumbBounds : bounds;
  const markup = useMemo(() => isolateSvgIds(
    thumbnail
      ? prepared.markup.replace(/preserveAspectRatio="[^"]*"/, `preserveAspectRatio="xMidYMid meet"`)
      : prepared.markup
        .replace(/viewBox="[^"]*"/, `viewBox="${bounds.x} ${bounds.y} ${bounds.width} ${bounds.height}"`)
        .replace(/preserveAspectRatio="[^"]*"/, `preserveAspectRatio="xMidYMax meet"`), id,
  ), [prepared, bounds.x, bounds.y, bounds.width, bounds.height, id, thumbnail]);

  return (
    <div
      className={`native-art ${className}`}
      aria-hidden="true"
      data-art={art.path}
      data-native-width={renderBounds.width}
      data-native-height={renderBounds.height}
      data-ground-y={placement.ground}
      style={{
        width: thumbnail ? thumbBounds.width * scale : placement.width,
        height: thumbnail ? thumbBounds.height * scale : placement.height,
        marginLeft: thumbnail || !anchored ? 0 : placement.offsetX,
        transform: thumbnail || !anchored ? undefined : `translateY(${placement.belowGround}px)`,
        flexShrink: 0,
      }}
      dangerouslySetInnerHTML={{ __html: markup }}
    />
  );
}
