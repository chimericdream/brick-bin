'use client';

import { useEffect, useState, useSyncExternalStore, useTransition } from 'react';
import { Alert, Button, Group, Modal, NumberInput, Stack, Text } from '@mantine/core';
import { IconCheck } from '@tabler/icons-react';

import { FigureImage, PartImage, Swatch } from '@/components/sets/PartImage';
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
 * Store-trip mode: big pictures, tick things off as they go in the basket, then "Done" offers to mark
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
    <div>
      <ul className={classes.trip}>
        {groups.map((g) => {
          const on = ticked.includes(g.key);
          return (
            <li key={g.key} className={classes.tripRow} data-ticked={on || undefined}>
              <label className={classes.tripLabel}>
                <input
                  type="checkbox"
                  checked={on}
                  onChange={(e) => toggle(g.key, e.currentTarget.checked)}
                  className={classes.tripCheck}
                  aria-label={`${g.title}${g.colorName ? `, ${g.colorName}` : ''}, quantity ${g.quantity}`}
                />
                {g.kind === 'part' && g.partNum && g.colorId !== null ? (
                  <PartImage
                    partNum={g.partNum}
                    colorId={g.colorId}
                    imageColorId={g.imageColorId}
                    size={112}
                  />
                ) : (
                  <FigureImage size={112} />
                )}
                <span className={classes.tripText}>
                  <strong>{g.title}</strong>
                  <span className={classes.meta}>
                    {g.colorName && (
                      <span className={classes.color}>
                        <Swatch rgb={g.rgb} />
                        {g.colorName}
                      </span>
                    )}
                    {g.partNum && <span>#{g.partNum}</span>}
                  </span>
                  {g.hints.length > 0 && (
                    <span className={classes.hint}>
                      Any of {[g.partNum, ...g.hints].join(', ')} will do
                    </span>
                  )}
                </span>
                <span className={classes.tripQty}>×{g.quantity}</span>
              </label>
            </li>
          );
        })}
      </ul>

      <div className={classes.tripBar} data-noprint>
        <Text fw={600}>
          {ticked.length} of {groups.length} ticked
        </Text>
        <Button
          leftSection={<IconCheck size={18} />}
          disabled={ticked.length === 0}
          onClick={beginDone}
          size="md"
        >
          Done
        </Button>
      </div>

      <Modal
        opened={open}
        onClose={() => setOpen(false)}
        title="Mark the ticked pieces as bought"
        centered
        size="lg"
      >
        <Stack gap="sm">
          {error && (
            <Alert color="red" variant="light" role="alert">
              {error}
            </Alert>
          )}
          <Text size="sm" c="dimmed">
            Each part fills the oldest missing rows first. Change a number if a different copy
            should get them.
          </Text>
          {tickedGroups.map((g) => (
            <div key={g.key}>
              <Text fw={650}>
                {g.title}
                {g.colorName ? `, ${g.colorName}` : ''}
              </Text>
              {g.sources.map((s) => (
                <Group key={s.itemId} justify="space-between" gap="sm" py={2}>
                  <Text size="sm">
                    {s.label}{' '}
                    <Text span c="dimmed">
                      (missing {s.quantity})
                    </Text>
                  </Text>
                  <NumberInput
                    aria-label={`Bought for ${s.label}`}
                    min={0}
                    max={s.quantity}
                    size="xs"
                    w={80}
                    value={counts[s.itemId] ?? 0}
                    onChange={(v) => setCounts({ ...counts, [s.itemId]: Number(v) || 0 })}
                  />
                </Group>
              ))}
            </div>
          ))}
          <Group justify="flex-end">
            <Button variant="default" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button loading={pending} onClick={confirm}>
              Mark as bought
            </Button>
          </Group>
        </Stack>
      </Modal>
    </div>
  );
}
