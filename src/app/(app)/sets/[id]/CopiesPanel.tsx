'use client';

import { useActionState, useState, useTransition } from 'react';
import {
  Alert,
  Avatar,
  Button,
  Group,
  Menu,
  Modal,
  NumberInput,
  Paper,
  Stack,
  Text,
  Title,
  UnstyledButton,
} from '@mantine/core';
import {
  IconAlertTriangle,
  IconCheck,
  IconChevronDown,
  IconMapPin,
  IconPencil,
  IconPlus,
} from '@tabler/icons-react';
import Link from 'next/link';

import { ConfirmDelete } from '@/components/ConfirmDelete';
import { BUILD_STATE_INFO, BuildBadge, CompletenessBadge } from '@/components/sets/Badges';
import { BUILD_STATES, type BuildState, type Completeness } from '@/server/data/completeness';

import { buildStateAction, saveCopyAction, trashCopyAction, type ActionState } from '../actions';
import { CopyFields, type CopyDefaults, type Option } from '../CopyFields';
import classes from './Detail.module.css';

export interface CopyView {
  id: string;
  position: number;
  ownerName: string | null;
  locationPath: string | null;
  buildState: BuildState;
  completeness: Completeness;
  hasBox: boolean;
  hasInstructions: boolean;
  conditionNotes: string | null;
  acquiredOn: string | null;
  /** Null for restricted viewers: money never reaches them. */
  money: { paid: string; value: string; valued: string | null } | null;
  defaults: CopyDefaults;
}

interface Props {
  setId: string;
  copies: CopyView[];
  canEdit: boolean;
  members: Option[];
  locations: Option[];
}

function BuildStateMenu({ setId, copy }: { setId: string; copy: CopyView }) {
  const [pending, startTransition] = useTransition();
  return (
    <Menu position="bottom-end" withinPortal>
      <Menu.Target>
        <UnstyledButton
          className={classes.stateButton}
          aria-label={`Build state: ${BUILD_STATE_INFO[copy.buildState].label}. Change`}
          aria-busy={pending}
        >
          <BuildBadge state={copy.buildState} />
          <IconChevronDown size={16} aria-hidden />
        </UnstyledButton>
      </Menu.Target>
      <Menu.Dropdown>
        {BUILD_STATES.map((state) => {
          const info = BUILD_STATE_INFO[state];
          const Glyph = info.icon;
          return (
            <Menu.Item
              key={state}
              leftSection={<Glyph size={18} aria-hidden />}
              rightSection={state === copy.buildState ? <IconCheck size={16} aria-hidden /> : null}
              onClick={() => startTransition(() => buildStateAction(setId, copy.id, state))}
            >
              <Text fw={600} size="sm">
                {info.label}
              </Text>
              <Text size="xs" c="dimmed">
                {info.hint}
              </Text>
            </Menu.Item>
          );
        })}
      </Menu.Dropdown>
    </Menu>
  );
}

function CopyDialog({
  setId,
  copy,
  opened,
  onClose,
  members,
  locations,
}: {
  setId: string;
  copy: CopyView | null;
  opened: boolean;
  onClose: () => void;
  members: Option[];
  locations: Option[];
}) {
  const [state, formAction, pending] = useActionState(async (prev: ActionState, fd: FormData) => {
    const result = await saveCopyAction(setId, copy?.id ?? null, prev, fd);
    if (result.saved) onClose();
    return result;
  }, {});
  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={copy ? `Edit copy ${copy.position}` : 'Add a copy'}
      size="lg"
      centered
    >
      <form action={formAction}>
        <Stack gap="md">
          {state.error && (
            <Alert color="red" variant="light" role="alert">
              {state.error}
            </Alert>
          )}
          {!copy && (
            <NumberInput
              name="quantity"
              label="How many?"
              description="Creates that many identical copies at once."
              min={1}
              max={50}
              defaultValue={1}
              maw={200}
            />
          )}
          <CopyFields members={members} locations={locations} defaults={copy?.defaults} />
          <Group justify="flex-end">
            <Button variant="default" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" loading={pending}>
              {copy ? 'Save copy' : 'Add copy'}
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}

export function CopiesPanel({ setId, copies, canEdit, members, locations }: Props) {
  const [editing, setEditing] = useState<CopyView | null>(null);
  const [adding, setAdding] = useState(false);

  return (
    <section aria-labelledby="copies-heading">
      <Group justify="space-between" mb="sm">
        <Title order={2} id="copies-heading" size="h3">
          Copies{' '}
          <Text span c="dimmed" fw={400}>
            {copies.length}
          </Text>
        </Title>
        {canEdit && (
          <Button leftSection={<IconPlus size={16} />} onClick={() => setAdding(true)}>
            Add copy
          </Button>
        )}
      </Group>

      {copies.length === 0 && (
        <Paper withBorder p="lg">
          <Text c="dimmed">No copies yet. This set is in the catalog but you do not own one.</Text>
        </Paper>
      )}

      <Stack gap="md">
        {copies.map((copy) => (
          <Paper
            key={copy.id}
            withBorder
            p="md"
            component="article"
            aria-label={`Copy ${copy.position}`}
          >
            <div className={classes.copyHead}>
              <Group gap="sm" wrap="nowrap">
                <Avatar color="bin" radius="xl" size={36} aria-hidden>
                  {(copy.ownerName ?? 'Ours').slice(0, 1).toUpperCase()}
                </Avatar>
                <div>
                  <Text fw={600}>
                    {copy.ownerName ? `${copy.ownerName}’s copy` : 'Ours'}
                    {copies.length > 1 && (
                      <Text span c="dimmed" fw={400}>
                        {' '}
                        · copy {copy.position} of {copies.length}
                      </Text>
                    )}
                  </Text>
                  {copy.locationPath && (
                    <Text size="sm" c="dimmed" className={classes.place}>
                      <IconMapPin size={14} aria-hidden /> {copy.locationPath}
                    </Text>
                  )}
                </div>
              </Group>
              {canEdit ? (
                <BuildStateMenu setId={setId} copy={copy} />
              ) : (
                <BuildBadge state={copy.buildState} />
              )}
            </div>

            <dl className={classes.facts}>
              <div>
                <dt>Pieces</dt>
                <dd>
                  {copy.completeness.kind === 'missing' ? (
                    // The badge is the way into the list of what is missing, for kids too (read only).
                    <Link href={`/copies/${copy.id}/missing`} className={classes.badgeLink}>
                      <CompletenessBadge completeness={copy.completeness} />
                    </Link>
                  ) : (
                    <CompletenessBadge completeness={copy.completeness} />
                  )}
                </dd>
              </div>
              <div>
                <dt>Box and booklets</dt>
                <dd>
                  <span>{copy.hasBox ? '✓ Has the box' : '✗ No box'}</span>
                  <br />
                  <span>
                    {copy.hasInstructions ? '✓ Has paper booklets' : '✗ No paper booklets'}
                  </span>
                </dd>
              </div>
              <div>
                <dt>Condition notes</dt>
                <dd>
                  {copy.conditionNotes ?? (
                    <Text span c="dimmed">
                      None
                    </Text>
                  )}
                </dd>
              </div>
              {copy.money ? (
                <div>
                  <dt>Paid / value</dt>
                  <dd>
                    {copy.money.paid || '–'} / {copy.money.value || '–'}
                    {copy.money.valued && (
                      <Text size="xs" c="dimmed">
                        valued {copy.money.valued}
                      </Text>
                    )}
                  </dd>
                </div>
              ) : (
                <div>
                  <dt>Acquired</dt>
                  <dd>{copy.acquiredOn ?? '–'}</dd>
                </div>
              )}
            </dl>

            {canEdit && (
              <Group gap="xs" mt="sm">
                <Button
                  variant="default"
                  size="compact-md"
                  leftSection={<IconPencil size={16} />}
                  onClick={() => setEditing(copy)}
                >
                  Edit copy
                </Button>
                <Button
                  component={Link}
                  href={`/copies/${copy.id}/missing`}
                  variant="default"
                  size="compact-md"
                  leftSection={<IconAlertTriangle size={16} />}
                >
                  Missing pieces
                </Button>
                <ConfirmDelete
                  title={`Remove copy ${copy.position}?`}
                  triggerLabel="Remove copy"
                  compact
                  action={() => trashCopyAction(setId, copy.id)}
                >
                  It moves to the trash. You can restore it from Settings &gt; Trash.
                </ConfirmDelete>
              </Group>
            )}
          </Paper>
        ))}
      </Stack>

      {canEdit && (
        <>
          <CopyDialog
            key={`add-${adding}`}
            setId={setId}
            copy={null}
            opened={adding}
            onClose={() => setAdding(false)}
            members={members}
            locations={locations}
          />
          <CopyDialog
            key={editing?.id ?? 'none'}
            setId={setId}
            copy={editing}
            opened={editing !== null}
            onClose={() => setEditing(null)}
            members={members}
            locations={locations}
          />
        </>
      )}
    </section>
  );
}
