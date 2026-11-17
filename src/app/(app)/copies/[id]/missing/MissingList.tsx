'use client';

import { useState, useTransition } from 'react';
import { Alert, Button, Group, Modal, NumberInput, Paper, Stack, Text, Title } from '@mantine/core';
import { IconCheck } from '@tabler/icons-react';

import { ConfirmDelete } from '@/components/ConfirmDelete';
import { FigureImage, PartImage, Swatch } from '@/components/sets/PartImage';

import {
  markCheckedAction,
  removeMissingAction,
  resolveMissingAction,
  type MissingState,
} from './actions';
import classes from './Missing.module.css';

export interface MissingRow {
  id: string;
  kind: 'part' | 'minifig' | 'other';
  title: string;
  partNum: string | null;
  figNum: string | null;
  colorId: number | null;
  colorName: string | null;
  rgb: string | null;
  /** The colour the picture is in (null = none), and its name when it differs from `colorId`. */
  imageColorId: number | null;
  imageColorName: string | null;
  quantity: number;
  resolution: 'found' | 'bought' | 'substituted' | null;
  notes: string | null;
}

type Resolution = 'found' | 'bought' | 'substituted';
const LABEL: Record<Resolution, string> = {
  found: 'Found',
  bought: 'Bought',
  substituted: 'Substituted',
};

/** The viewer's own calendar day as YYYY-MM-DD. */
const today = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

function Row({ row, children }: { row: MissingRow; children?: React.ReactNode }) {
  return (
    <li className={classes.row}>
      {row.kind === 'part' && row.partNum && row.colorId !== null ? (
        <PartImage
          partNum={row.partNum}
          colorId={row.colorId}
          imageColorId={row.imageColorId}
          size={64}
        />
      ) : (
        <FigureImage size={64} />
      )}
      <div className={classes.rowText}>
        <Text fw={650}>{row.title}</Text>
        <div className={classes.sub}>
          {row.colorName && (
            <span className={classes.colorLine}>
              <Swatch rgb={row.rgb} />
              {row.colorName}
            </span>
          )}
          {row.partNum && <span>#{row.partNum}</span>}
          {row.figNum && <span>{row.figNum}</span>}
          {row.kind === 'other' && <span>Other piece</span>}
          {row.imageColorName && <span>picture shown in {row.imageColorName}</span>}
        </div>
        {row.notes && <Text size="sm">{row.notes}</Text>}
      </div>
      <strong className={classes.qty} aria-label={`Quantity ${row.quantity}`}>
        ×{row.quantity}
      </strong>
      {children}
    </li>
  );
}

export function MissingList({
  copyId,
  setId,
  open,
  resolved,
  canEdit,
  checkedOn,
  sealed,
}: {
  copyId: string;
  setId: string;
  open: MissingRow[];
  resolved: MissingRow[];
  canEdit: boolean;
  checkedOn: string | null;
  sealed: boolean;
}) {
  const [dialog, setDialog] = useState<{ row: MissingRow; resolution: Resolution } | null>(null);
  const [count, setCount] = useState<number | string>(1);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const finish = (r: MissingState) => {
    if (r.error) return setError(r.error);
    setDialog(null);
    setError(null);
  };

  const begin = (row: MissingRow, resolution: Resolution) => {
    setError(null);
    setCount(row.quantity);
    // One piece resolves straight away; more than one asks how many.
    if (row.quantity === 1) {
      start(async () => finish(await resolveMissingAction(copyId, setId, row.id, resolution)));
    } else {
      setDialog({ row, resolution });
    }
  };

  return (
    <section aria-labelledby="open-heading" className={classes.section}>
      <Title order={2} id="open-heading" size="h3">
        Still missing{' '}
        <Text span c="dimmed" fw={400}>
          {open.reduce((n, r) => n + r.quantity, 0)}
        </Text>
      </Title>

      {sealed && (
        <Alert color="blue" variant="light" mt="sm">
          This copy is marked Sealed, so it shows as Sealed in the library whatever is listed here.
        </Alert>
      )}
      {error && !dialog && (
        <Alert color="red" variant="light" role="alert" mt="sm">
          {error}
        </Alert>
      )}

      <Paper withBorder p="xs" mt="sm">
        {open.length === 0 ? (
          <Text c="dimmed" p="md">
            Nothing is listed as missing from this copy.
          </Text>
        ) : (
          <ul className={classes.list}>
            {open.map((row) => (
              <Row key={row.id} row={row}>
                {canEdit && (
                  <Group gap={6} className={classes.actions}>
                    {(['found', 'bought', 'substituted'] as const).map((r) => (
                      <Button
                        key={r}
                        size="compact-md"
                        variant="default"
                        loading={pending}
                        onClick={() => begin(row, r)}
                        aria-label={`${LABEL[r]}: ${row.title}${row.colorName ? `, ${row.colorName}` : ''}`}
                      >
                        {LABEL[r]}
                      </Button>
                    ))}
                    <ConfirmDelete
                      title={`Remove ${row.title}?`}
                      triggerLabel="Remove"
                      compact
                      confirmLabel="Remove"
                      action={() => removeMissingAction(copyId, setId, row.id)}
                    >
                      Use this for a row entered by mistake. It is deleted, not moved to the trash.
                      To record that a piece turned up, use Found instead.
                    </ConfirmDelete>
                  </Group>
                )}
              </Row>
            ))}
          </ul>
        )}
      </Paper>

      {canEdit && (
        <Group mt="md" gap="sm" align="center">
          <Button
            leftSection={<IconCheck size={16} />}
            variant="light"
            loading={pending}
            onClick={() =>
              start(async () => finish(await markCheckedAction(copyId, setId, today())))
            }
          >
            Everything else is here
          </Button>
          <Text size="sm" c="dimmed">
            {checkedOn ? `Pieces last checked ${checkedOn}.` : 'Pieces have not been checked yet.'}
          </Text>
        </Group>
      )}

      {resolved.length > 0 && (
        <details className={classes.history}>
          <summary>Resolved ({resolved.length})</summary>
          <ul className={classes.list}>
            {resolved.map((row) => (
              <Row key={row.id} row={row}>
                <Text size="sm" c="dimmed">
                  {row.resolution ? LABEL[row.resolution] : ''}
                </Text>
              </Row>
            ))}
          </ul>
        </details>
      )}

      <Modal
        opened={dialog !== null}
        onClose={() => setDialog(null)}
        title={dialog ? `${LABEL[dialog.resolution]}: ${dialog.row.title}` : ''}
        centered
      >
        {dialog && (
          <Stack gap="sm">
            {error && (
              <Alert color="red" variant="light" role="alert">
                {error}
              </Alert>
            )}
            <NumberInput
              label="How many?"
              description={`${dialog.row.quantity} are missing. Fewer leaves the rest on the list.`}
              min={1}
              max={dialog.row.quantity}
              value={count}
              onChange={setCount}
              data-autofocus
            />
            <Group justify="flex-end">
              <Button variant="default" onClick={() => setDialog(null)}>
                Cancel
              </Button>
              <Button
                loading={pending}
                onClick={() =>
                  start(async () =>
                    finish(
                      await resolveMissingAction(
                        copyId,
                        setId,
                        dialog.row.id,
                        dialog.resolution,
                        Number(count),
                      ),
                    ),
                  )
                }
              >
                {LABEL[dialog.resolution]}
              </Button>
            </Group>
          </Stack>
        )}
      </Modal>
    </section>
  );
}
