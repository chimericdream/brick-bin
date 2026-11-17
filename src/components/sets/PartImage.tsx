import { IconBox, IconUser } from '@tabler/icons-react';

import classes from './PartImage.module.css';

/**
 * A part picture on a white card, in both themes: LDraw renders are 24-bit PNGs on white with no
 * transparency, so the white is deliberate. The swatch and colour name sit beside it, because a pale
 * colour (White, Lavender) cannot be read against white. When the image is in another colour, say so.
 */
export function PartImage({
  partNum,
  colorId,
  imageColorId,
  size = 72,
}: {
  partNum: string;
  colorId: number;
  /** The colour the image is actually in; null when the part has no image at all. */
  imageColorId: number | null;
  size?: number;
}) {
  return (
    <div className={classes.frame} style={{ width: size, height: size }}>
      {imageColorId === null ? (
        <IconBox size={size * 0.4} stroke={1.5} aria-hidden className={classes.none} />
      ) : (
        // Served through the app (signed-in people only); next/image adds nothing for 500 px PNGs.
        // oxlint-disable-next-line nextjs/no-img-element
        <img
          src={`/api/part-image/${imageColorId}/${encodeURIComponent(partNum)}`}
          alt=""
          loading="lazy"
          width={size}
          height={size}
          className={classes.img}
          data-fallback={imageColorId !== colorId || undefined}
        />
      )}
    </div>
  );
}

export function FigureImage({ size = 72 }: { size?: number }) {
  // Minifigure pictures live on a third-party server, which browsers never load from here.
  return (
    <div className={classes.frame} style={{ width: size, height: size }}>
      <IconUser size={size * 0.45} stroke={1.5} aria-hidden className={classes.none} />
    </div>
  );
}

/** A colour dot with an inner ring so White and Lavender show an edge. */
export function Swatch({ rgb, label }: { rgb: string | null; label?: string }) {
  return (
    <span
      className={classes.swatch}
      style={{ background: rgb ? `#${rgb}` : 'transparent' }}
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    />
  );
}
