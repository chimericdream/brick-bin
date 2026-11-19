import classes from './SetCover.module.css';

/**
 * A 4:3 frame on the surface tone. The picture is contained with 8px of air, so a portrait,
 * landscape or square cover is always whole. Without a cover it shows the baseplate ("something
 * is waiting to go here") with "No cover" on a small card; never a third-party image.
 */
export function SetCover({
  setId,
  hasCover,
  alt,
  eager = false,
  hideLabel = false,
}: {
  setId: string;
  hasCover: boolean;
  /** Empty in lists, where the name sits beside the cover. */
  alt: string;
  eager?: boolean;
  /** Keep "No cover" for screen readers only, in very small thumbnails. */
  hideLabel?: boolean;
}) {
  if (!hasCover) {
    return (
      <span className={`${classes.frame} app-baseplate`}>
        <span className={hideLabel ? 'app-vh' : classes.none}>No cover</span>
      </span>
    );
  }
  return (
    <span className={classes.frame}>
      {/* Served through the app so visibility always applies; next/image adds nothing here. */}
      {/* oxlint-disable-next-line nextjs/no-img-element */}
      <img
        src={`/api/sets/${setId}/cover`}
        alt={alt}
        loading={eager ? 'eager' : 'lazy'}
        className={classes.img}
      />
    </span>
  );
}
