'use client';

import { useEffect, useState, useSyncExternalStore, useTransition } from 'react';
import { Button, Modal, NumberInput } from '@mantine/core';
import { IconCheck } from '@tabler/icons-react';

import { DialogFoot } from '@/components/DialogFoot';
import { Note } from '@/components/Note';
import { FigureImage, PartImage, Swatch } from '@/components/sets/PartImage';
import ui from '@/components/ui/ui.module.css';
import { allocateOldestFirst } from '@/lib/allocate';

import { markBoughtAction } from './actions';
import classes from './Shopping.module.css';

export interface TripGroup {
  key: string;
  title: string;
  kind: 'part' | 'minifig' | 'other';
  partNum: string | null;
  colorId: number | null;
  colorName: string | null;
  rgb: string | null;
  imageColorId: number | null;
  quantity: number;
  hints: string[];
  setsText: string;
  sources: { itemId: string; label: string; quantity: number; createdAt: string }[];
}

const STORE = 'bb-store-trip-v1';

/** Ticks live in this browser only. Storage can be missing or blocked, so every access is guarded. */
function readTicks(): string[] {
  try {
    const raw = window.localStorage.getItem(STORE);
    const parsed = raw ? (JSON.parse(raw) as unknown) : [];
    return Array.isArray(parsed) ? parsed.filter((x): x is string => typeof x === 'string') : [];
  } catch {
    return [];
  }
}
function writeTicks(keys: string[]) {
  try {
    window.localStorage.setItem(STORE, JSON.stringify(keys));
  } catch {
    // Ticks just will not survive a reload.
  }
}

/**
 * Store-trip mode: big pictures, check things off as they go in the cart, then "Done" offers to mark
 * what was ticked as bought. Ticks are kept in the browser only, never sent anywhere.
 */
export function StoreTrip({ groups }: { groups: TripGroup[] }) {
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
  const [ticked, setTicked] = useState<string[]>([]);
  const [open, setOpen] = useState(false);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  // Read the saved ticks once the browser is there; the server render has none.
  useEffect(() => {
    if (!mounted) return;
    const saved = readTicks();
    const valid = new Set(groups.map((g) => g.key));
    // eslint-disable-next-line react-hooks/set-state-in-effect -- syncing with browser storage
    setTicked(saved.filter((k) => valid.has(k)));
  }, [mounted, groups]);

  const toggle = (key: string, on: boolean) => {
    const next = on ? [...new Set([...ticked, key])] : ticked.filter((k) => k !== key);
    setTicked(next);
    writeTicks(next);
  };

  const tickedGroups = groups.filter((g) => ticked.includes(g.key));

  const beginDone = () => {
    // Everything ticked is bought in full, filling the oldest missing rows first.
    const next: Record<string, number> = {};
    for (const g of tickedGroups) {
      for (const a of allocateOldestFirst(
        g.sources.map((s) => ({ ...s, createdAt: new Date(s.createdAt) })),
        g.quantity,
      )) {
        next[a.itemId] = a.quantity;
      }
    }
    setCounts(next);
    setError(null);
    setOpen(true);
  };

  const confirm = () =>
    start(async () => {
      const allocations = Object.entries(counts).map(([itemId, quantity]) => ({
        itemId,
        quantity: Number(quantity) || 0,
      }));
      const r = await markBoughtAction(allocations);
      if (r.error) return setError(r.error);
      const done = new Set(tickedGroups.map((g) => g.key));
      const rest = ticked.filter((k) => !done.has(k));
      setTicked(rest);
      writeTicks(rest);
      setOpen(false);
    });

  return (
    <div className={classes.trip}>
      <ul className={`${ui.panel} ${ui.rows}`}>
        {groups.map((g) => {
          const on = ticked.includes(g.key);
          return (
            <li key={g.key} data-checked={on || undefined}>
              <label className={classes.tripLine}>
                <input
                  type="checkbox"
                  checked={on}
                  onChange={(e) => toggle(g.key, e.currentTarget.checked)}
                  className={classes.tripCheck}
                  aria-label={`${g.title}${g.colorName ? `, ${g.colorName}` : ''}, quantity ${g.quantity}`}
                />
                <span className={classes.tripPart}>
                  {g.kind === 'part' && g.partNum && g.colorId !== null ? (
                    <PartImage
                      partNum={g.partNum}
                      colorId={g.colorId}
                      imageColorId={g.imageColorId}
                      size={72}
                    />
                  ) : (
                    <FigureImage size={72} />
                  )}
                </span>
                <span className={classes.text}>
                  <strong className={classes.name}>{g.title}</strong>
                  <span className={classes.meta}>
                    {g.colorName && (
                      <span className={classes.ink}>
                        <Swatch rgb={g.rgb} />
                        {g.colorName}
                      </span>
                    )}
                    {g.partNum && <span className="app-mono">#{g.partNum}</span>}
                  </span>
                  {g.hints.length > 0 && (
                    <span className={classes.hint}>
                      Any of {[g.partNum, ...g.hints].join(', ')} will do
                    </span>
                  )}
                </span>
                <span className={classes.qty} aria-hidden>
                  <small>×</small>
                  {g.quantity}
                </span>
              </label>
            </li>
          );
        })}
      </ul>

      <div className={classes.tripBar} data-noprint>
        <div className={classes.tripCount} aria-live="polite">
          {ticked.length} of {groups.length} checked off
          <div
            className={classes.progress}
            role="progressbar"
            aria-label="Checked off"
            aria-valuemin={0}
            aria-valuemax={groups.length}
            aria-valuenow={ticked.length}
          >
            {ticked.length > 0 && (
              <span
                className={`${classes.progressFill} app-studs`}
                style={{ width: `${(ticked.length / Math.max(groups.length, 1)) * 100}%` }}
              />
            )}
          </div>
        </div>
        <Button
          leftSection={<IconCheck size={20} stroke={2} />}
          disabled={ticked.length === 0}
          onClick={beginDone}
        >
          Done
        </Button>
      </div>

      <Modal
        opened={open}
        onClose={() => setOpen(false)}
        title="Mark the checked pieces as bought"
        size={600}
      >
        <div className={ui.stack}>
          {error && <Note variant="error">{error}</Note>}
          <p className={ui.small}>
            Each part fills the oldest missing rows first. Change a number if a different copy
            should get them.
          </p>
          {tickedGroups.map((g) => (
            <div key={g.key} className={classes.bought}>
              <p className={classes.name}>
                {g.title}
                {g.colorName ? `, ${g.colorName}` : ''}
              </p>
              {g.sources.map((s) => (
                <div key={s.itemId} className={classes.boughtRow}>
                  <span>
                    {s.label} <span className={ui.muted}>(missing {s.quantity})</span>
                  </span>
                  <NumberInput
                    aria-label={`Bought for ${s.label}`}
                    min={0}
                    max={s.quantity}
                    w={96}
                    value={counts[s.itemId] ?? 0}
                    onChange={(v) => setCounts({ ...counts, [s.itemId]: Number(v) || 0 })}
                  />
                </div>
              ))}
            </div>
          ))}
          <DialogFoot>
            <Button variant="default" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button loading={pending} onClick={confirm}>
              Mark as bought
            </Button>
          </DialogFoot>
        </div>
      </Modal>
    </div>
  );
}
