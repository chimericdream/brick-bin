import { IconPackage } from '@tabler/icons-react';

import classes from './SetCover.module.css';

/**
 * A landscape frame with `object-fit: contain` on a neutral card: catalog images are product shots
 * of mixed aspect ratios. Without a cover it shows a quiet placeholder, never a third-party image.
 */
export function SetCover({
  setId,
  hasCover,
  alt,
  eager = false,
}: {
  setId: string;
  hasCover: boolean;
  alt: string;
  eager?: boolean;
}) {
  return (
    <div className={classes.frame}>
      {hasCover ? (
        // Served through the app so visibility always applies; next/image adds nothing here.
        // oxlint-disable-next-line nextjs/no-img-element
        <img
          src={`/api/sets/${setId}/cover`}
          alt={alt}
          loading={eager ? 'eager' : 'lazy'}
          className={classes.img}
        />
      ) : (
        <div className={classes.placeholder} role="img" aria-label={`${alt} (no cover yet)`}>
          <IconPackage size={36} stroke={1.5} aria-hidden />
        </div>
      )}
    </div>
  );
}
