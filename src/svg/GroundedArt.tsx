import { useMemo, type PointerEvent } from "react";
import { artPlacement, measureBounds, prepareArt, type Illustration } from "./library";
import { NativeArt } from "./NativeArt";

interface GroundedArtProps {
  art: Illustration;
  x: number;
  bottom: number;
  ppm: number;
  angle?: number;
  zIndex?: number;
  className?: string;
  label: string;
  onPointerDown: (event: PointerEvent<HTMLButtonElement>) => void;
  onClick: () => void;
}

export function GroundedArt({ art, x, bottom, ppm, angle = 0, zIndex, className = "", label, onPointerDown, onClick }: GroundedArtProps) {
  const prepared = useMemo(() => prepareArt(art), [art.path, art.flowerColor, art.removeLayers?.join(",")]);
  const bounds = useMemo(() => measureBounds(prepared), [prepared]);
  const p = artPlacement(art, prepared, bounds, ppm);
  return <button
    className={`street-object ${className}`}
    style={{
      left: x + p.offsetX, bottom: bottom - p.belowGround,
      width: p.width, height: p.height, zIndex,
      transform: angle ? `rotate(${angle}deg)` : undefined,
      transformOrigin: `${p.pivotX}px ${p.pivotY}px`,
    }}
    data-contact-bottom={bottom} data-art-ground={p.ground}
    onPointerDown={onPointerDown} onClick={onClick} aria-label={label} title={label}
  ><NativeArt art={art} ppm={ppm} anchored={false} /></button>;
}