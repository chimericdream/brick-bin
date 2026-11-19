'use client';

import { useActionState, useEffect, useState } from 'react';
import { Button, Checkbox, Modal, Select, Textarea, TextInput } from '@mantine/core';
import { IconLock, IconPlus } from '@tabler/icons-react';

import { DialogFoot } from '@/components/DialogFoot';
import { toastDone } from '@/components/feedback/toast';
import { Note } from '@/components/Note';
import { Tag } from '@/components/sets/Badges';
import ui from '@/components/ui/ui.module.css';

import { CatalogLookup, type CatalogHit } from '../sets/CatalogLookup';
import {
  addWishAction,
  gotItAction,
  markPurchasedAction,
  unmarkPurchasedAction,
  updateWishAction,
  type WishState,
} from './actions';
import classes from './Wishlist.module.css';

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
    <>
      {d.rbSetNum && <input type="hidden" name="rbSetNum" value={d.rbSetNum} />}
      {d.brandId && <input type="hidden" name="brandId" value={d.brandId} />}
      <TextInput name="title" label="Name" required defaultValue={d.title ?? ''} />
      <div className={classes.pair}>
        <TextInput name="setNumber" label="Set number" defaultValue={d.setNumber ?? ''} />
        {showPrice && (
          <TextInput
            name="price"
            label="Price seen"
            placeholder="149.99"
            inputMode="decimal"
            leftSection="$"
            defaultValue={d.price ?? ''}
          />
        )}
      </div>
      <TextInput name="url" label="Link" placeholder="https://" defaultValue={d.url ?? ''} />
      <Textarea
        name="notes"
        label="Notes for gift-givers"
        autosize
        minRows={2}
        defaultValue={d.notes ?? ''}
      />
    </>
  );
}

interface AddProps {
  catalogReady: boolean;
  canImport: boolean;
  legoBrandId: string | null;
  showPrice: boolean;
  /** Called once a wish is saved (closes the phone sheet). */
  onSaved?: () => void;
}

/** Adds to the viewer's own list. Picking a catalog set prefills the name, number and link. */
export function AddWish({ catalogReady, canImport, legoBrandId, showPrice, onSaved }: AddProps) {
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
      toastDone('Added to your wishlist.');
      onSaved?.();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    <form action={action} className={ui.stack}>
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
      <div
        className={`${ui.panel} ${ui.pad}`}
        key={`${round}-${picked?.setNum ?? scanned ?? 'manual'}`}
      >
        {state.error && <Note variant="error">{state.error}</Note>}
        <Fields d={d} showPrice={showPrice} />
        <Button type="submit" loading={pending} className={classes.submit}>
          Add to my wishlist
        </Button>
      </div>
    </form>
  );
}

/** Under 1024 the form lives in a sheet that "Add a wish" opens. */
export function AddWishSheet(props: AddProps) {
  const [opened, setOpened] = useState(false);
  return (
    <>
      <Button leftSection={<IconPlus size={20} stroke={2} />} onClick={() => setOpened(true)}>
        Add a wish
      </Button>
      <Modal opened={opened} onClose={() => setOpened(false)} title="Add to my wishlist" size={600}>
        <AddWish {...props} onSaved={() => setOpened(false)} />
      </Modal>
    </>
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
      <Button variant="ghost" size="compact-md" onClick={() => setOpened(true)}>
        Edit
      </Button>
      <Modal opened={opened} onClose={() => setOpened(false)} title={`Edit ${d.title}`} size={600}>
        <form action={action} className={ui.stack}>
          {state.error && <Note variant="error">{state.error}</Note>}
          <Fields d={d} showPrice={showPrice} />
          <DialogFoot>
            <Button variant="default" onClick={() => setOpened(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={pending}>
              Save wish
            </Button>
          </DialogFoot>
        </form>
      </Modal>
    </>
  );
}

const today = () => new Date().toLocaleDateString('en-CA');

/** "I bought this": a private mark. Only the person who makes it ever receives this markup. */
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
      <div className={classes.mark} role="status">
        <Tag>
          <IconLock size={16} stroke={2} aria-hidden />
          You bought this
        </Tag>
        <span>
          {' '}
          on{' '}
          {new Date(`${mark.purchasedOn}T12:00:00`).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          })}
        </span>
        {mark.note && <span>{mark.note}</span>}
        <span className={ui.muted}>Only you see this.</span>
        <Button
          variant="default"
          size="compact-md"
          loading={undoing}
          onClick={async () => {
            setUndoing(true);
            await unmarkPurchasedAction(id);
            setUndoing(false);
          }}
        >
          Undo
        </Button>
      </div>
    );
  }
  return (
    <>
      <Button variant="default" size="compact-md" onClick={() => setOpened(true)}>
        I bought this
      </Button>
      <Modal
        opened={opened}
        onClose={() => setOpened(false)}
        title={`I bought ${title}`}
        size={440}
      >
        <form action={action} className={ui.stack}>
          <Note>
            <span className={classes.lockLine}>
              <IconLock size={20} stroke={1.75} aria-hidden />
              <span>
                Only you will see this. It is not shown to anyone else, and not written to the
                activity log.
              </span>
            </span>
          </Note>
          {state.error && <Note variant="error">{state.error}</Note>}
          <TextInput name="purchasedOn" label="Date" type="date" defaultValue={today()} />
          <TextInput name="note" label="Note to yourself" placeholder="Where it is hidden" />
          <DialogFoot>
            <Button variant="default" onClick={() => setOpened(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={pending}>
              Mark as bought
            </Button>
          </DialogFoot>
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
      <Button variant="default" size="compact-md" onClick={() => setOpened(true)}>
        We got it
      </Button>
      <Modal opened={opened} onClose={() => setOpened(false)} title={`We got ${title}`} size={440}>
        <form action={action} className={ui.stack}>
          <Note variant="mind">
            This moves the wish into the collection, where everyone in the household can see it.
            Anyone&rsquo;s private &ldquo;I bought this&rdquo; marks on it are deleted. If it is
            still a surprise, hide it from kid profiles.
          </Note>
          {state.error && <Note variant="error">{state.error}</Note>}
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
          <DialogFoot>
            <Button variant="default" onClick={() => setOpened(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={pending}>
              Add to the collection
            </Button>
          </DialogFoot>
        </form>
      </Modal>
    </>
  );
}
