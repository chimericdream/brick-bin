'use client';

import { useActionState, useEffect, useState } from 'react';
import {
  Alert,
  Button,
  Checkbox,
  Group,
  Modal,
  Paper,
  Select,
  Stack,
  Text,
  Textarea,
  TextInput,
} from '@mantine/core';

import { CatalogLookup, type CatalogHit } from '../sets/CatalogLookup';
import {
  addWishAction,
  gotItAction,
  markPurchasedAction,
  unmarkPurchasedAction,
  updateWishAction,
  type WishState,
} from './actions';

export interface WishDefaults {
  title?: string;
  setNumber?: string | null;
  rbSetNum?: string | null;
  brandId?: string | null;
  url?: string | null;
  price?: string;
  notes?: string | null;
}

interface FieldsProps {
  d: WishDefaults;
  /** Kid profiles never enter or see a price. */
  showPrice: boolean;
}

function Fields({ d, showPrice }: FieldsProps) {
  return (
    <Stack gap="sm">
      {d.rbSetNum && <input type="hidden" name="rbSetNum" value={d.rbSetNum} />}
      {d.brandId && <input type="hidden" name="brandId" value={d.brandId} />}
      <TextInput name="title" label="Name" required defaultValue={d.title ?? ''} />
      <Group grow align="flex-start">
        <TextInput name="setNumber" label="Set number" defaultValue={d.setNumber ?? ''} />
        {showPrice && (
          <TextInput
            name="price"
            label="Price seen"
            placeholder="149.99"
            inputMode="decimal"
            defaultValue={d.price ?? ''}
          />
        )}
      </Group>
      <TextInput name="url" label="Link" placeholder="https://" defaultValue={d.url ?? ''} />
      <Textarea
        name="notes"
        label="Notes for gift-givers"
        autosize
        minRows={2}
        defaultValue={d.notes ?? ''}
      />
    </Stack>
  );
}

interface AddProps {
  catalogReady: boolean;
  canImport: boolean;
  legoBrandId: string | null;
  showPrice: boolean;
}

/** Adds to the viewer's own list. Picking a catalog set prefills the name, number and link. */
export function AddWish({ catalogReady, canImport, legoBrandId, showPrice }: AddProps) {
  const [state, action, pending] = useActionState(addWishAction, {});
  const [picked, setPicked] = useState<CatalogHit | null>(null);
  const [scanned, setScanned] = useState<string | null>(null);
  // A saved wish clears the form for the next one.
  const [round, setRound] = useState(0);
  useEffect(() => {
    if (state.saved) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setRound((r) => r + 1);
      setPicked(null);
      setScanned(null);
    }
  }, [state]);

  const d: WishDefaults = picked
    ? {
        title: picked.name,
        setNumber: picked.number,
        rbSetNum: picked.setNum,
        brandId: legoBrandId,
      }
    : { title: scanned ?? '' };

  return (
    <form action={action}>
      <Stack gap="md" maw={760}>
        <CatalogLookup
          catalogReady={catalogReady}
          canImport={canImport}
          onPick={(h) => {
            setScanned(null);
            setPicked(h);
          }}
          onTitle={(t) => {
            setPicked(null);
            setScanned(t);
          }}
        />
        <Paper withBorder p="md" key={`${round}-${picked?.setNum ?? scanned ?? 'manual'}`}>
          <Stack gap="sm">
            {state.error && (
              <Alert color="red" variant="light" role="alert">
                {state.error}
              </Alert>
            )}
            {state.saved && (
              <Alert color="green" variant="light" role="status">
                Added to your wishlist.
              </Alert>
            )}
            <Fields d={d} showPrice={showPrice} />
            <Group>
              <Button type="submit" loading={pending}>
                Add to my wishlist
              </Button>
            </Group>
          </Stack>
        </Paper>
      </Stack>
    </form>
  );
}

function useCloseOnSave(state: WishState, close: () => void) {
  useEffect(() => {
    if (state.saved) close();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);
}

export function EditWish({
  id,
  d,
  showPrice,
}: {
  id: string;
  d: WishDefaults;
  showPrice: boolean;
}) {
  const [opened, setOpened] = useState(false);
  const [state, action, pending] = useActionState(updateWishAction.bind(null, id), {});
  useCloseOnSave(state, () => setOpened(false));
  return (
    <>
      <Button variant="subtle" size="compact-sm" onClick={() => setOpened(true)}>
        Edit
      </Button>
      <Modal opened={opened} onClose={() => setOpened(false)} title={`Edit ${d.title}`} centered>
        <form action={action}>
          <Stack gap="sm">
            {state.error && (
              <Alert color="red" variant="light" role="alert">
                {state.error}
              </Alert>
            )}
            <Fields d={d} showPrice={showPrice} />
            <Group justify="flex-end">
              <Button variant="default" onClick={() => setOpened(false)}>
                Cancel
              </Button>
              <Button type="submit" loading={pending}>
                Save wish
              </Button>
            </Group>
          </Stack>
        </form>
      </Modal>
    </>
  );
}

const today = () => new Date().toLocaleDateString('en-CA');

/** "I bought this": a private mark. Only the person who makes it ever sees it. */
export function BoughtButton({
  id,
  title,
  mark,
}: {
  id: string;
  title: string;
  mark: { purchasedOn: string; note: string | null } | null;
}) {
  const [opened, setOpened] = useState(false);
  const [state, action, pending] = useActionState(markPurchasedAction.bind(null, id), {});
  useCloseOnSave(state, () => setOpened(false));
  const [undoing, setUndoing] = useState(false);

  if (mark) {
    return (
      <Group gap="xs" align="center">
        <Text size="sm" role="status">
          You bought this on{' '}
          {new Date(`${mark.purchasedOn}T12:00:00`).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          })}
          {mark.note ? ` · ${mark.note}` : ''}
          <Text span size="xs" c="dimmed">
            {' '}
            (only you can see this)
          </Text>
        </Text>
        <Button
          variant="subtle"
          size="compact-sm"
          loading={undoing}
          onClick={async () => {
            setUndoing(true);
            await unmarkPurchasedAction(id);
            setUndoing(false);
          }}
        >
          Undo
        </Button>
      </Group>
    );
  }
  return (
    <>
      <Button variant="light" size="compact-sm" onClick={() => setOpened(true)}>
        I bought this
      </Button>
      <Modal opened={opened} onClose={() => setOpened(false)} title={`I bought ${title}`} centered>
        <form action={action}>
          <Stack gap="sm">
            <Text size="sm" c="dimmed">
              Only you will see this. It is not shown to anyone else, and not written to the
              activity log.
            </Text>
            {state.error && (
              <Alert color="red" variant="light" role="alert">
                {state.error}
              </Alert>
            )}
            <TextInput name="purchasedOn" label="Date" type="date" defaultValue={today()} />
            <TextInput name="note" label="Note to yourself" placeholder="Where it is hidden" />
            <Group justify="flex-end">
              <Button variant="default" onClick={() => setOpened(false)}>
                Cancel
              </Button>
              <Button type="submit" loading={pending}>
                Mark as bought
              </Button>
            </Group>
          </Stack>
        </form>
      </Modal>
    </>
  );
}

/** "We got it": turns the wish into a set in the collection. */
export function GotItButton({
  id,
  title,
  brands,
  defaultBrandId,
}: {
  id: string;
  title: string;
  brands: { value: string; label: string }[];
  defaultBrandId: string | null;
}) {
  const [opened, setOpened] = useState(false);
  const [state, action, pending] = useActionState(gotItAction.bind(null, id), {});
  return (
    <>
      <Button variant="light" size="compact-sm" onClick={() => setOpened(true)}>
        We got it
      </Button>
      <Modal opened={opened} onClose={() => setOpened(false)} title={`We got ${title}`} centered>
        <form action={action}>
          <Stack gap="sm">
            <Alert color="yellow" variant="light">
              This moves the wish into the collection, where everyone in the household can see it.
              Anyone&rsquo;s private &ldquo;I bought this&rdquo; marks on it are deleted. If it is
              still a surprise, hide it from kid profiles.
            </Alert>
            {state.error && (
              <Alert color="red" variant="light" role="alert">
                {state.error}
              </Alert>
            )}
            <Select
              name="brandId"
              label="Brand"
              data={brands}
              defaultValue={defaultBrandId}
              searchable
              required
              allowDeselect={false}
            />
            <Checkbox name="addCopy" label="Add a sealed copy" defaultChecked />
            <Checkbox name="hideFromKids" label="Hide it from kid profiles for now" />
            <Group justify="flex-end">
              <Button variant="default" onClick={() => setOpened(false)}>
                Cancel
              </Button>
              <Button type="submit" loading={pending}>
                Add to the collection
              </Button>
            </Group>
          </Stack>
        </form>
      </Modal>
    </>
  );
}
