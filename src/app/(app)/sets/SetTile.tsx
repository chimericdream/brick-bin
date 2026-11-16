import { IconEyeOff } from '@tabler/icons-react';
import Link from 'next/link';

import { BuildBadge, CompletenessBadge } from '@/components/sets/Badges';
import { SetCover } from '@/components/sets/SetCover';
import type { LibraryTile } from '@/server/data/library';

import classes from './Library.module.css';

/** Copies shown on a tile before collapsing the rest into "+N more". */
const MAX_COPY_ROWS = 3;

/**
 * A box on a rail. Each copy gets its own row of badges (build state and completeness), numbered
 * when there is more than one; after three, the rest collapse into one "+N more copies" chip.
 */
export function SetTile({ tile }: { tile: LibraryTile }) {
  const shown = tile.copies.slice(0, MAX_COPY_ROWS);
  const more = tile.copies.length - shown.length;
  const meta = [tile.brandName, tile.setNumber, tile.year].filter(Boolean).join(' · ');
  const several = tile.copies.length > 1;

  return (
    <li className={classes.tile}>
      <Link href={`/sets/${tile.id}`} className={classes.tileLink}>
        <div className={classes.art}>
          <SetCover setId={tile.id} hasCover={tile.hasCover} alt="" />
          {tile.hiddenFromRestricted && (
            <span className={classes.hidden}>
              <IconEyeOff size={14} aria-hidden /> Hidden from kids
            </span>
          )}
        </div>
        <div className={classes.body}>
          <strong className={classes.name}>{tile.name}</strong>
          <span className={classes.meta}>{meta}</span>
          {tile.copies.length === 0 && <span className={classes.meta}>No copies</span>}
          <div className={classes.copies}>
            {shown.map((c, i) => (
              <div key={c.id} className={classes.copyRow}>
                {several && (
                  <span className={classes.copyNo} aria-label={`Copy ${i + 1}`}>
                    {i + 1}
                  </span>
                )}
                <BuildBadge state={c.buildState} />
                {c.completeness.kind !== 'sealed' && (
                  <CompletenessBadge completeness={c.completeness} />
                )}
              </div>
            ))}
            {more > 0 && (
              <span className={classes.more}>
                +{more} more {more === 1 ? 'copy' : 'copies'}
              </span>
            )}
          </div>
        </div>
      </Link>
    </li>
  );
}
