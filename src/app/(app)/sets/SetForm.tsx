'use client';

import { useActionState, useState } from 'react';
import {
  Alert,
  Anchor,
  Button,
  Checkbox,
  FileInput,
  Group,
  NumberInput,
  Paper,
  Select,
  SimpleGrid,
  Stack,
  TagsInput,
  Text,
  Textarea,
  TextInput,
  Title,
} from '@mantine/core';
import Link from 'next/link';

import type { ActionState } from './actions';
import { CopyFields, type Option } from './CopyFields';

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
}: Props) {
  const [state, formAction, pending] = useActionState(action, {});
  const [newBrand, setNewBrand] = useState(false);
  const [addCopy, setAddCopy] = useState(true);
  const creating = setId === null;

  return (
    <form action={formAction} encType="multipart/form-data">
      <Stack gap="lg" maw={760}>
        {state.error && (
          <Alert color="red" variant="light" role="alert">
            {state.error}
            {state.duplicate && (
              <>
                {' '}
                <Anchor component={Link} href={`/sets/${state.duplicate.id}`}>
                  Open it to add another copy
                </Anchor>
                .
              </>
            )}
          </Alert>
        )}

        <Paper withBorder p="md">
          <Stack gap="sm">
            <Title order={2} size="h4">
              The set
            </Title>
            <SimpleGrid cols={{ base: 1, sm: 2 }}>
              {newBrand ? (
                <TextInput
                  name="newBrandName"
                  label="New brand"
                  placeholder="Mould King"
                  required
                  data-autofocus
                  rightSection={
                    <Anchor
                      component="button"
                      type="button"
                      size="xs"
                      onClick={() => setNewBrand(false)}
                    >
                      Cancel
                    </Anchor>
                  }
                  rightSectionWidth={64}
                />
              ) : (
                <Select
                  name="brandId"
                  label="Brand"
                  data={brands}
                  defaultValue={defaults.brandId ?? brands[0]?.value ?? null}
                  allowDeselect={false}
                  searchable
                  required
                />
              )}
              <TextInput
                name="setNumber"
                label="Set number"
                description="As printed on the box. Optional for unnumbered kits."
                placeholder="10294"
                defaultValue={defaults.setNumber ?? ''}
              />
            </SimpleGrid>
            {!newBrand && (
              <Anchor
                component="button"
                type="button"
                size="sm"
                onClick={() => setNewBrand(true)}
                ta="left"
              >
                + New brand
              </Anchor>
            )}
            <TextInput name="name" label="Name" required defaultValue={defaults.name ?? ''} />
            <Select
              name="themeId"
              label="Theme"
              placeholder="None"
              data={themes}
              defaultValue={defaults.themeId ?? null}
              searchable
              clearable
            />
            <SimpleGrid cols={{ base: 2, sm: 4 }}>
              <NumberInput
                name="year"
                label="Year"
                min={1900}
                max={2200}
                hideControls
                defaultValue={defaults.year ?? ''}
              />
              <NumberInput
                name="pieceCount"
                label="Pieces"
                min={0}
                hideControls
                thousandSeparator=","
                defaultValue={defaults.pieceCount ?? ''}
              />
              <NumberInput
                name="minifigCount"
                label="Minifigs"
                min={0}
                hideControls
                defaultValue={defaults.minifigCount ?? ''}
              />
              <NumberInput
                name="minAge"
                label="Min age"
                min={0}
                hideControls
                defaultValue={defaults.minAge ?? ''}
              />
            </SimpleGrid>
            <Textarea
              name="description"
              label="Description"
              autosize
              minRows={3}
              defaultValue={defaults.description ?? ''}
            />
            <SimpleGrid cols={{ base: 1, sm: 2 }}>
              <TextInput
                name="retailPrice"
                label="Retail price"
                placeholder="0.00"
                inputMode="decimal"
                leftSection="$"
                defaultValue={defaults.retailPrice ?? ''}
              />
              <TextInput
                name="designer"
                label="Designer"
                description="For example a MOC designer"
                defaultValue={defaults.designer ?? ''}
              />
            </SimpleGrid>
            <TagsInput
              name="tags"
              label="Tags"
              placeholder="Christmas 2025"
              data={tagSuggestions}
              defaultValue={defaults.tags ?? []}
            />
            <FileInput
              name="cover"
              label="Cover image"
              description="JPEG, PNG or WebP, up to 8 MB"
              accept="image/jpeg,image/png,image/webp"
              clearable
            />
            <Textarea
              name="notes"
              label="Notes"
              autosize
              minRows={2}
              defaultValue={defaults.notes ?? ''}
            />
            <Checkbox
              name="hiddenFromRestricted"
              label="Hide from kid profiles"
              description="Kid profiles will not see this set, its copies or its cover. Useful for a present."
              defaultChecked={defaults.hiddenFromRestricted ?? false}
            />
          </Stack>
        </Paper>

        {creating && (
          <Paper withBorder p="md">
            <Stack gap="sm">
              <Checkbox
                name="addCopy"
                label="Add a copy I own"
                checked={addCopy}
                onChange={(e) => setAddCopy(e.currentTarget.checked)}
              />
              {addCopy && (
                <>
                  <NumberInput
                    name="quantity"
                    label="How many?"
                    description="Creates that many identical copies at once."
                    min={1}
                    max={50}
                    defaultValue={1}
                    maw={200}
                  />
                  <CopyFields prefix="copy." members={members} locations={locations} />
                </>
              )}
            </Stack>
          </Paper>
        )}

        <Group>
          <Button type="submit" loading={pending}>
            {creating ? 'Add set' : 'Save changes'}
          </Button>
          <Button component={Link} href={setId ? `/sets/${setId}` : '/sets'} variant="default">
            Cancel
          </Button>
          {state.saved && <Text c="dimmed">Saved</Text>}
        </Group>
      </Stack>
    </form>
  );
}
