import { IconEyeOff } from '@tabler/icons-react';
import Link from 'next/link';

import { StateTag, Tag, missingLabel } from '@/components/sets/Badges';
import { SetCover } from '@/components/sets/SetCover';
import { BUILD_STATES } from '@/server/data/completeness';
import type { LibraryTile } from '@/server/data/library';

import classes from './Library.module.css';

/**
 * One set: a row under 768, a tile from 768, from the same markup. The name is the only link and
 * its target covers the whole row. Copies collapse into one tag per build state (`Sealed ×5`), so
 * five copies make a row no taller than one.
 */
export function SetRow({ tile }: { tile: LibraryTile }) {
  const states = BUILD_STATES.map((state) => ({
    state,
    count: tile.copies.filter((c) => c.buildState === state).length,
  })).filter((s) => s.count > 0);
  const missing = tile.copies.reduce(
    (sum, c) => sum + (c.completeness.kind === 'missing' ? c.completeness.pieces : 0),
    0,
  );
  const unchecked = tile.copies.some((c) => c.completeness.kind === 'not_checked');

  return (
    <li className={classes.set}>
      <SetCover setId={tile.id} hasCover={tile.hasCover} alt="" />
      <div className={classes.setBody}>
        <h3 className={classes.setName}>
          <Link href={`/sets/${tile.id}`}>{tile.name}</Link>
        </h3>
        <p className={classes.setMeta}>
          {tile.brandName} · <span className="app-mono">{tile.setNumber ?? '—'}</span>
          {tile.year !== null && (
            <>
              {' · '}
              <span className="app-num">{tile.year}</span>
            </>
          )}
        </p>
        <div className={classes.chips}>
          {tile.copies.length === 0 && <Tag variant="line">No copies</Tag>}
          {states.map((s) => (
            <StateTag key={s.state} state={s.state} count={s.count} />
          ))}
          {missing > 0 && <Tag variant="dash">{missingLabel(missing)}</Tag>}
          {unchecked && <Tag variant="line">Not checked</Tag>}
          {tile.hiddenFromRestricted && (
            <Tag>
              <IconEyeOff size={16} stroke={1.75} aria-hidden />
              Hidden from kids
            </Tag>
          )}
        </div>
      </div>
    </li>
  );
}
