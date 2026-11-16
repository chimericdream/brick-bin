import {
  IconAlertTriangle,
  IconArrowsShuffle,
  IconCategory,
  IconCircleCheck,
  IconCircleDashed,
  IconLock,
  IconPackage,
  IconStack2,
  IconTool,
  type Icon,
} from '@tabler/icons-react';

import type { BuildState, Completeness } from '@/server/data/completeness';

import classes from './Badges.module.css';

export const BUILD_STATE_INFO: Record<
  BuildState,
  { label: string; hint: string; icon: Icon; token: string }
> = {
  sealed: {
    label: 'Sealed',
    hint: 'Factory sealed, never opened',
    icon: IconLock,
    token: 'sealed',
  },
  opened: { label: 'Opened', hint: 'Opened, not built', icon: IconPackage, token: 'opened' },
  in_progress: {
    label: 'In progress',
    hint: 'Being built right now',
    icon: IconTool,
    token: 'progress',
  },
  built: { label: 'Built', hint: 'Finished and on display', icon: IconStack2, token: 'built' },
  disassembled: {
    label: 'Disassembled',
    hint: 'Taken apart, kept together',
    icon: IconCategory,
    token: 'disassembled',
  },
  mixed: {
    label: 'Mixed',
    hint: 'Parted into bulk bins',
    icon: IconArrowsShuffle,
    token: 'mixed',
  },
};

/** Build state as icon + word, so it never relies on colour alone. */
export function BuildBadge({ state }: { state: BuildState }) {
  const { label, icon: Glyph, token } = BUILD_STATE_INFO[state];
  return (
    <span className={classes.badge} data-state={token}>
      <Glyph size={14} stroke={2} aria-hidden />
      {label}
    </span>
  );
}

const monthYear = (iso: string) =>
  new Date(`${iso}T12:00:00`).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });

export function completenessLabel(c: Completeness): string {
  switch (c.kind) {
    case 'sealed':
      return 'Sealed';
    case 'missing':
      return `Missing ${c.pieces} ${c.pieces === 1 ? 'piece' : 'pieces'}`;
    case 'complete':
      return `Complete (checked ${monthYear(c.checkedOn)})`;
    case 'not_checked':
      return 'Not checked';
  }
}

export function CompletenessBadge({ completeness }: { completeness: Completeness }) {
  const Glyph = {
    sealed: IconLock,
    missing: IconAlertTriangle,
    complete: IconCircleCheck,
    not_checked: IconCircleDashed,
  }[completeness.kind];
  return (
    <span className={classes.badge} data-completeness={completeness.kind}>
      <Glyph size={14} stroke={2} aria-hidden />
      {completenessLabel(completeness)}
    </span>
  );
}
