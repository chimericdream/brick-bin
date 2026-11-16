'use client';

import { Checkbox, Select, SimpleGrid, Stack, Textarea, TextInput } from '@mantine/core';

import { BUILD_STATE_INFO } from '@/components/sets/Badges';
import { BUILD_STATES } from '@/server/data/completeness';

export interface Option {
  value: string;
  label: string;
}

export interface CopyDefaults {
  ownerUserId?: string | null;
  locationId?: string | null;
  buildState?: string;
  piecesCheckedOn?: string | null;
  hasBox?: boolean;
  hasInstructions?: boolean;
  conditionNotes?: string | null;
  acquiredOn?: string | null;
  pricePaid?: string;
  estimatedValue?: string;
  notes?: string | null;
}

interface Props {
  /** Field-name prefix, for forms that hold a set and a copy together. */
  prefix?: string;
  members: Option[];
  locations: Option[];
  defaults?: CopyDefaults;
}

/** The fields of one copy. Money is entered in dollars and parsed on the server. */
export function CopyFields({ prefix = '', members, locations, defaults = {} }: Props) {
  const n = (key: string) => `${prefix}${key}`;
  return (
    <Stack gap="sm">
      <SimpleGrid cols={{ base: 1, sm: 2 }}>
        <Select
          name={n('buildState')}
          label="Build state"
          data={BUILD_STATES.map((s) => ({ value: s, label: BUILD_STATE_INFO[s].label }))}
          defaultValue={defaults.buildState ?? 'sealed'}
          allowDeselect={false}
        />
        <Select
          name={n('ownerUserId')}
          label="Owner"
          placeholder="Ours"
          data={members}
          defaultValue={defaults.ownerUserId ?? null}
          clearable
        />
        <Select
          name={n('locationId')}
          label="Place"
          placeholder="Not set"
          data={locations}
          defaultValue={defaults.locationId ?? null}
          searchable
          clearable
        />
        <TextInput
          name={n('acquiredOn')}
          type="date"
          label="Acquired on"
          defaultValue={defaults.acquiredOn ?? ''}
        />
        <TextInput
          name={n('pricePaid')}
          label="Price paid"
          placeholder="0.00"
          inputMode="decimal"
          leftSection="$"
          defaultValue={defaults.pricePaid ?? ''}
        />
        <TextInput
          name={n('estimatedValue')}
          label="Estimated value"
          placeholder="0.00"
          inputMode="decimal"
          leftSection="$"
          defaultValue={defaults.estimatedValue ?? ''}
        />
        <TextInput
          name={n('piecesCheckedOn')}
          type="date"
          label="Pieces last checked"
          description="Leave empty if never"
          defaultValue={defaults.piecesCheckedOn ?? ''}
        />
      </SimpleGrid>
      <Checkbox name={n('hasBox')} label="Has the box" defaultChecked={defaults.hasBox ?? true} />
      <Checkbox
        name={n('hasInstructions')}
        label="Has paper booklets"
        defaultChecked={defaults.hasInstructions ?? true}
      />
      <Textarea
        name={n('conditionNotes')}
        label="Condition notes"
        placeholder="Box corner dented, stickers applied crooked"
        autosize
        minRows={2}
        defaultValue={defaults.conditionNotes ?? ''}
      />
      <Textarea
        name={n('notes')}
        label="Notes"
        autosize
        minRows={2}
        defaultValue={defaults.notes ?? ''}
      />
    </Stack>
  );
}
