'use client';

import { useOptimistic, useRef, useState, useTransition } from 'react';
import { Menu, Modal, UnstyledButton } from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
import { IconCheck, IconChevronDown } from '@tabler/icons-react';

import { toastDone, toastFailed } from '@/components/feedback/toast';
import { BUILD_STATE_INFO } from '@/components/sets/Badges';
import { StateGlyph } from '@/components/sets/StateGlyph';
import { BUILD_STATES, type BuildState } from '@/server/data/completeness';

import { buildStateAction } from '../actions';
import classes from './Detail.module.css';

/** One choice: a little brick in the state's colour with its glyph, the name and what it means. */
function Choice({ state, current }: { state: BuildState; current: boolean }) {
  const info = BUILD_STATE_INFO[state];
  return (
    <>
      <span className={`${classes.swatch} app-studs`} data-st={info.st}>
        <StateGlyph state={state} />
      </span>
      <span className={classes.choiceText}>
        <b>{info.label}</b>
        <span>{info.hint}</span>
      </span>
      {current && <IconCheck size={20} stroke={2.5} aria-hidden className={classes.choiceCheck} />}
    </>
  );
}

/**
 * The six choices as a menu of radio items. Arrow keys, Home and End move between them, in the
 * popover and in the phone sheet alike.
 */
function ChoiceList({ shown, onPick }: { shown: BuildState; onPick: (s: BuildState) => void }) {
  const list = useRef<HTMLDivElement>(null);
  const onKey = (e: React.KeyboardEvent) => {
    const items = [...(list.current?.querySelectorAll<HTMLButtonElement>('button') ?? [])];
    const at = items.indexOf(document.activeElement as HTMLButtonElement);
    const to =
      e.key === 'ArrowDown'
        ? (at + 1) % items.length
        : e.key === 'ArrowUp'
          ? (at - 1 + items.length) % items.length
          : e.key === 'Home'
            ? 0
            : e.key === 'End'
              ? items.length - 1
              : -1;
    if (to < 0) return;
    e.preventDefault();
    items[to]?.focus();
  };
  return (
    <div ref={list} role="menu" aria-label="Build state" onKeyDown={onKey}>
      {BUILD_STATES.map((s) => (
        <button
          key={s}
          type="button"
          role="menuitemradio"
          aria-checked={s === shown}
          className={classes.choice}
          data-autofocus={s === shown || undefined}
          tabIndex={s === shown ? 0 : -1}
          onClick={() => onPick(s)}
        >
          <Choice state={s} current={s === shown} />
        </button>
      ))}
    </div>
  );
}

/**
 * The state button on a copy: a brick in the state's colour that opens the six choices. A popover
 * under the button from 768, a bottom sheet on phones. The new colour shows at once; if the save
 * fails it goes back and a toast says so.
 */
export function BuildStateControl({
  setId,
  copyId,
  position,
  state,
}: {
  setId: string;
  copyId: string;
  position: number;
  state: BuildState;
}) {
  const desktop = useMediaQuery('(min-width: 48em)');
  const [menuOpen, setMenuOpen] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [shown, setShown] = useOptimistic(state);
  const [pending, startTransition] = useTransition();
  const info = BUILD_STATE_INFO[shown];

  const pick = (next: BuildState) => {
    setMenuOpen(false);
    setSheetOpen(false);
    if (next === shown) return;
    startTransition(async () => {
      setShown(next);
      try {
        await buildStateAction(setId, copyId, next);
        toastDone(`Copy ${position} is now ${BUILD_STATE_INFO[next].label}.`);
      } catch {
        toastFailed('Couldn’t change the build state. Nothing was changed.', () => pick(next));
      }
    });
  };

  return (
    <>
      <Menu
        opened={menuOpen}
        onChange={setMenuOpen}
        position="bottom-end"
        offset={6}
        disabled={!desktop}
        withinPortal
      >
        <Menu.Target>
          <UnstyledButton
            className={`${classes.stateButton} app-studs`}
            data-st={info.st}
            aria-label={`Build state of copy ${position}: ${info.label}. Change it`}
            aria-haspopup="menu"
            aria-expanded={menuOpen || sheetOpen}
            aria-busy={pending || undefined}
            onClick={() => {
              if (!desktop) setSheetOpen(true);
            }}
          >
            <StateGlyph state={shown} />
            {info.label}
            <IconChevronDown size={16} stroke={2} aria-hidden className={classes.stateChev} />
          </UnstyledButton>
        </Menu.Target>
        <Menu.Dropdown>
          <ChoiceList shown={shown} onPick={pick} />
        </Menu.Dropdown>
      </Menu>

      <Modal
        opened={sheetOpen}
        onClose={() => setSheetOpen(false)}
        title={`Build state, copy ${position}`}
        size={440}
      >
        <ChoiceList shown={shown} onPick={pick} />
      </Modal>
    </>
  );
}
