'use client';

import { IconCheck } from '@tabler/icons-react';
import { useRouter } from 'next/navigation';

import { BUILD_STATE_INFO } from '@/components/sets/Badges';
import { StateGlyph } from '@/components/sets/StateGlyph';
import type { BuildState } from '@/server/data/completeness';

import classes from './Library.module.css';

export interface SorterBrick {
  state: BuildState;
  count: number;
  pressed: boolean;
  /** The library with this state toggled. */
  href: string;
}

/**
 * The six build states as bricks with their counts: the Library's build-state filter. Picking one
 * or more filters the list; each choice is a URL, so it survives a reload and the back button.
 */
export function Sorter({ bricks }: { bricks: SorterBrick[] }) {
  const router = useRouter();
  const anyPicked = bricks.some((b) => b.pressed);
  return (
    <section aria-label="Build state">
      <div
        className={classes.sorter}
        role="group"
        aria-label="Filter by build state"
        data-picked={anyPicked || undefined}
      >
        {bricks.map(({ state, count, pressed, href }) => (
          <button
            key={state}
            type="button"
            className={`${classes.brick} app-studs`}
            data-st={BUILD_STATE_INFO[state].st}
            data-zero={count === 0 && !pressed ? true : undefined}
            aria-pressed={pressed}
            onClick={() => router.push(href, { scroll: false })}
          >
            {pressed ? (
              <IconCheck size={18} stroke={3} aria-hidden />
            ) : (
              <StateGlyph state={state} />
            )}
            <span>{BUILD_STATE_INFO[state].label}</span>
            <span className={classes.n}>{count}</span>
          </button>
        ))}
      </div>
    </section>
  );
}
