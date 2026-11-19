'use client';

import { startTransition, useActionState, useEffect, useRef, useState } from 'react';
import {
  Button,
  Checkbox,
  FileInput,
  NumberInput,
  Select,
  TagsInput,
  Textarea,
  TextInput,
} from '@mantine/core';
import { IconPlus } from '@tabler/icons-react';
import Link from 'next/link';
import { unstable_rethrow } from 'next/navigation';

import { toastFailed } from '@/components/feedback/toast';
import { Note } from '@/components/Note';
import ui from '@/components/ui/ui.module.css';

import type { ActionState } from './actions';
import { CatalogLookup, type CatalogHit } from './CatalogLookup';
import { CopyFields, type Option } from './CopyFields';
import { HowMany } from './HowMany';
import classes from './SetForm.module.css';

export interface SetDefaults {
  brandId?: string;
  setNumber?: string | null;
  name?: string;
  themeId?: string | null;
  year?: number | null;
  pieceCount?: number | null;
  minifigCount?: number | null;
  minAge?: number | null;
  description?: string | null;
  retailPrice?: string;
  designer?: string | null;
  notes?: string | null;
  hiddenFromRestricted?: boolean;
  tags?: string[];
  /** The Rebrickable set this one is linked to, when it is. */
  rbSetNum?: string | null;
}

interface Props {
  action: (prev: ActionState, fd: FormData) => Promise<ActionState>;
  /** Null when creating. */
  setId: string | null;
  brands: Option[];
  themes: Option[];
  locations: Option[];
  members: Option[];
  tagSuggestions: string[];
  defaults?: SetDefaults;
  /** LEGO catalog lookup: whether the catalog has been imported, and which brand is LEGO. */
  lookup?: { catalogReady: boolean; legoBrandId: string | null; canImport: boolean } | null;
}

export function SetForm({
  action,
  setId,
  brands,
  themes,
  locations,
  members,
  tagSuggestions,
  defaults = {},
  lookup = null,
}: Props) {
  // "Try again" on a failed save sends the same form again.
  const retry = useRef<((fd: FormData) => void) | null>(null);
  const [state, formAction, pending] = useActionState(
    async (prev: ActionState, fd: FormData): Promise<ActionState> => {
      try {
        return await action(prev, fd);
      } catch (e) {
        // A redirect after saving is how a save ends; anything else means nothing was saved.
        unstable_rethrow(e);
        toastFailed('Couldn’t save the set. Nothing was changed.', () => retry.current?.(fd));
        return prev;
      }
    },
    {},
  );
  useEffect(() => {
    retry.current = (fd) => startTransition(() => formAction(fd));
  }, [formAction]);
  const [newBrand, setNewBrand] = useState(false);
  const [addCopy, setAddCopy] = useState(true);
  const creating = setId === null;
  // A set picked from the catalog (or scanned) prefills the fields below it.
  const [picked, setPicked] = useState<CatalogHit | null>(null);
  const [scannedName, setScannedName] = useState<string | null>(null);
  const d: SetDefaults = picked
    ? {
        ...defaults,
        brandId: lookup?.legoBrandId ?? defaults.brandId,
        name: picked.name,
        setNumber: picked.number,
        year: picked.year,
        pieceCount: picked.pieces,
        rbSetNum: picked.setNum,
      }
    : scannedName
      ? { ...defaults, name: scannedName }
      : defaults;
  const fieldsKey = picked?.setNum ?? scannedName ?? 'manual';

  return (
    <form action={formAction} encType="multipart/form-data" className={ui.narrow}>
      {state.error && (
        <Note variant="error">
          {state.error}
          {state.duplicate && (
            <>
              {' '}
              <Link href={`/sets/${state.duplicate.id}`}>Open it to add another copy</Link>.
            </>
          )}
        </Note>
      )}

      {creating && lookup && (
        <CatalogLookup
          catalogReady={lookup.catalogReady}
          canImport={lookup.canImport}
          onPick={(h) => {
            setScannedName(null);
            setNewBrand(false);
            setPicked(h);
          }}
          onTitle={(t) => {
            setPicked(null);
            setScannedName(t);
          }}
        />
      )}

      <section className={`${ui.panel} ${ui.pad}`} key={fieldsKey} aria-labelledby="set-heading">
        <div className={ui.panelHead}>
          <h2 id="set-heading">The set</h2>
        </div>
        {d.rbSetNum && (
          <>
            <input type="hidden" name="rbSetNum" value={d.rbSetNum} />
            <div role="status">
              <Note>
                Linked to Rebrickable set <span className="app-mono">{d.rbSetNum}</span>.{' '}
                {creating &&
                  'The theme is added for you, and the cover is downloaded once when you save. '}
                {picked && (
                  <button
                    type="button"
                    className={classes.textButton}
                    onClick={() => setPicked(null)}
                  >
                    Unlink
                  </button>
                )}
              </Note>
            </div>
          </>
        )}
        <div className={ui.row2}>
          <div className={ui.field}>
            {newBrand ? (
              <TextInput
                name="newBrandName"
                label="New brand"
                placeholder="Mould King"
                required
                data-autofocus
                rightSection={
                  <button
                    type="button"
                    className={classes.textButton}
                    onClick={() => setNewBrand(false)}
                  >
                    Cancel
                  </button>
                }
                rightSectionWidth={72}
              />
            ) : (
              <>
                <Select
                  name="brandId"
                  label="Brand"
                  data={brands}
                  defaultValue={d.brandId ?? brands[0]?.value ?? null}
                  allowDeselect={false}
                  searchable
                  required
                />
                <Button
                  variant="subtle"
                  size="compact-md"
                  className={classes.newBrand}
                  leftSection={<IconPlus size={16} stroke={2} />}
                  onClick={() => setNewBrand(true)}
                >
                  New brand
                </Button>
              </>
            )}
          </div>
          <TextInput
            name="setNumber"
            label="Set number"
            description="As printed on the box. Optional for unnumbered kits."
            placeholder="10294"
            defaultValue={d.setNumber ?? ''}
            classNames={{ input: classes.mono }}
          />
        </div>
        <TextInput name="name" label="Name" required defaultValue={d.name ?? ''} />
        <Select
          name="themeId"
          label="Theme"
          placeholder="None"
          data={themes}
          defaultValue={d.themeId ?? null}
          searchable
          clearable
        />
        <div className={ui.row4}>
          <NumberInput
            name="year"
            label="Year"
            min={1900}
            max={2200}
            hideControls
            defaultValue={d.year ?? ''}
          />
          <NumberInput
            name="pieceCount"
            label="Pieces"
            min={0}
            hideControls
            thousandSeparator=","
            defaultValue={d.pieceCount ?? ''}
          />
          <NumberInput
            name="minifigCount"
            label="Minifigs"
            min={0}
            hideControls
            defaultValue={d.minifigCount ?? ''}
          />
          <NumberInput
            name="minAge"
            label="Min age"
            min={0}
            hideControls
            defaultValue={d.minAge ?? ''}
          />
        </div>
        <Textarea
          name="description"
          label="Description"
          autosize
          minRows={3}
          defaultValue={d.description ?? ''}
        />
        <div className={ui.row2}>
          <TextInput
            name="retailPrice"
            label="Retail price"
            placeholder="0.00"
            inputMode="decimal"
            leftSection="$"
            defaultValue={d.retailPrice ?? ''}
          />
          <TextInput
            name="designer"
            label="Designer"
            description="For example a MOC designer"
            defaultValue={d.designer ?? ''}
          />
        </div>
        <TagsInput
          name="tags"
          label="Tags"
          placeholder="Christmas 2025"
          data={tagSuggestions}
          defaultValue={d.tags ?? []}
        />
        <FileInput
          name="cover"
          label="Cover image"
          description="JPEG, PNG or WebP, up to 8 MB"
          accept="image/jpeg,image/png,image/webp"
          clearable
        />
        <Textarea name="notes" label="Notes" autosize minRows={2} defaultValue={d.notes ?? ''} />
        <Checkbox
          name="hiddenFromRestricted"
          label="Hide from kid profiles"
          description="Kid profiles will not see this set, its copies or its cover. Useful for a present."
          defaultChecked={d.hiddenFromRestricted ?? false}
        />
      </section>

      {creating && (
        <section className={`${ui.panel} ${ui.pad}`} aria-label="A copy I own">
          <Checkbox
            name="addCopy"
            label="Add a copy I own"
            checked={addCopy}
            onChange={(e) => setAddCopy(e.currentTarget.checked)}
          />
          {addCopy && (
            <>
              <HowMany />
              <CopyFields prefix="copy." members={members} locations={locations} />
            </>
          )}
        </section>
      )}

      <div className={ui.actionbar}>
        <Button type="submit" loading={pending}>
          {creating ? 'Add set' : 'Save changes'}
        </Button>
        <Button component={Link} href={setId ? `/sets/${setId}` : '/sets'} variant="default">
          Cancel
        </Button>
        {state.saved && (
          <span className={ui.small} role="status">
            Saved
          </span>
        )}
      </div>
    </form>
  );
}
