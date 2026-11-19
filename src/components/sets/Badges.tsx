import { IconCheck } from '@tabler/icons-react';

import type { BuildState, Completeness } from '@/server/data/completeness';

import classes from './Badges.module.css';
import { StateGlyph } from './StateGlyph';

/** Build states in their fixed order, with the brick (`data-st`) each one is shown in. */
export const BUILD_STATE_INFO: Record<BuildState, { label: string; hint: string; st: string }> = {
  sealed: { label: 'Sealed', hint: 'Factory sealed, never opened', st: 'sealed' },
  opened: { label: 'Opened', hint: 'Opened, not built', st: 'opened' },
  in_progress: { label: 'In progress', hint: 'Being built right now', st: 'progress' },
  built: { label: 'Built', hint: 'Finished and on display', st: 'built' },
  disassembled: { label: 'Disassembled', hint: 'Taken apart, kept together', st: 'apart' },
  mixed: { label: 'Mixed', hint: 'Parted into bulk bins', st: 'mixed' },
};

/**
 * A read-only build state: the state's brick colour, its glyph and its word, with `×N` when
 * several copies share it. Flat, with no studs, because it cannot be pressed.
 */
export function StateTag({ state, count = 1 }: { state: BuildState; count?: number }) {
  const { label, st } = BUILD_STATE_INFO[state];
  return (
    <span className={classes.st} data-st={st}>
      <StateGlyph state={state} />
      {label}
      {count > 1 && (
        <>
          <span className={classes.times} aria-hidden>
            ×{count}
          </span>
          <span className="app-vh">, {count} copies</span>
        </>
      )}
    </span>
  );
}

/** Kept for screens that still use the old name. */
export const BuildBadge = StateTag;

export type TagVariant = 'solid' | 'dash' | 'line' | 'quiet';

/** Class names for a tag, so a link can look like one. */
export const tagClass = (variant: TagVariant = 'solid') => `${classes.tag} ${classes[variant]}`;

/**
 * Solid: "Hidden from kids". Dashed: something is missing. Outline: not checked. Quiet: complete,
 * sealed, set tags.
 */
export function Tag({
  variant = 'solid',
  children,
}: {
  variant?: TagVariant;
  children: React.ReactNode;
}) {
  return (
    <span className={tagClass(variant)} data-tag={variant}>
      {children}
    </span>
  );
}

const monthYear = (iso: string) =>
  new Date(`${iso}T12:00:00`).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });

export const missingLabel = (pieces: number) =>
  `Missing ${pieces} ${pieces === 1 ? 'piece' : 'pieces'}`;

export function completenessLabel(c: Completeness): string {
  switch (c.kind) {
    case 'sealed':
      return 'Sealed';
    case 'missing':
      return missingLabel(c.pieces);
    case 'complete':
      return `Complete (checked ${monthYear(c.checkedOn)})`;
    case 'not_checked':
      return 'Not checked';
  }
}

/** Completeness has three shapes and never a colour: dashed, outlined, or quiet with a check. */
export function CompletenessBadge({ completeness }: { completeness: Completeness }) {
  switch (completeness.kind) {
    case 'missing':
      return <Tag variant="dash">{missingLabel(completeness.pieces)}</Tag>;
    case 'not_checked':
      return <Tag variant="line">Not checked</Tag>;
    case 'sealed':
      return <Tag variant="quiet">Sealed</Tag>;
    case 'complete':
      return (
        <Tag variant="quiet">
          <IconCheck size={16} stroke={2.5} aria-hidden />
          Complete
          <span className="app-vh"> (checked {monthYear(completeness.checkedOn)})</span>
        </Tag>
      );
  }
}
