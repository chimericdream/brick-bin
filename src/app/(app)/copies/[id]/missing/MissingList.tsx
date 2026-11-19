'use client';

import { useState, useTransition } from 'react';
import { Button, Modal, NumberInput } from '@mantine/core';
import { IconCheck, IconChevronRight } from '@tabler/icons-react';

import { ConfirmDelete } from '@/components/ConfirmDelete';
import { DialogFoot } from '@/components/DialogFoot';
import { Note } from '@/components/Note';
import { FigureImage, PartImage, Swatch } from '@/components/sets/PartImage';
import { EmptyState } from '@/components/ui/EmptyState';
import ui from '@/components/ui/ui.module.css';

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
  /** The color the picture is in (null = none), and its name when it differs from `colorId`. */
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
    <li className={classes.line} data-act={children ? true : undefined}>
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
      <div className={classes.lineText}>
        <p className={classes.name}>{row.title}</p>
        <div className={classes.meta}>
          {row.colorName && (
            <span className={classes.ink}>
              <Swatch rgb={row.rgb} />
              {row.colorName}
            </span>
          )}
          {row.partNum && <span className="app-mono">#{row.partNum}</span>}
          {row.figNum && <span className="app-mono">{row.figNum}</span>}
          {row.kind === 'other' && <span>Other piece</span>}
          {row.imageColorName && <span>picture shown in {row.imageColorName}</span>}
        </div>
        {row.notes && <p className={classes.notes}>{row.notes}</p>}
      </div>
      <span className={classes.qty} aria-label={`Quantity ${row.quantity}`}>
        <small aria-hidden>×</small>
        {row.quantity}
      </span>
      {children && <div className={classes.actions}>{children}</div>}
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
    <section aria-labelledby="open-heading" className={ui.stack}>
      <div className={ui.sectionHead}>
        <h2 id="open-heading">
          Still missing
          <small className={ui.count}>{open.reduce((n, r) => n + r.quantity, 0)}</small>
        </h2>
      </div>

      {sealed && (
        <Note variant="mind">
          This copy is marked Sealed, so it shows as Sealed in the library whatever is listed here.
        </Note>
      )}
      {error && !dialog && <Note variant="error">{error}</Note>}

      {open.length === 0 ? (
        <EmptyState inline title="Nothing is listed as missing from this copy." />
      ) : (
        <ul className={`${ui.panel} ${ui.rows}`}>
          {open.map((row) => (
            <Row key={row.id} row={row}>
              {canEdit && (
                <>
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
                  <span className={classes.push}>
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
                  </span>
                </>
              )}
            </Row>
          ))}
        </ul>
      )}

      {canEdit && (
        <div className={ui.actions}>
          <Button
            leftSection={<IconCheck size={20} stroke={2} />}
            variant="default"
            loading={pending}
            onClick={() =>
              start(async () => finish(await markCheckedAction(copyId, setId, today())))
            }
          >
            Everything else is here
          </Button>
          <p className={ui.small}>
            {checkedOn ? `Pieces last checked ${checkedOn}.` : 'Pieces have not been checked yet.'}
          </p>
        </div>
      )}

      {resolved.length > 0 && (
        <details className={ui.more}>
          <summary>
            <IconChevronRight size={20} stroke={1.75} aria-hidden />
            Resolved ({resolved.length})
          </summary>
          <ul className={`${ui.panel} ${ui.rows}`}>
            {resolved.map((row) => (
              <Row key={row.id} row={row}>
                <span className={ui.small}>{row.resolution ? LABEL[row.resolution] : ''}</span>
              </Row>
            ))}
          </ul>
        </details>
      )}

      <Modal
        opened={dialog !== null}
        onClose={() => setDialog(null)}
        title={dialog ? `${LABEL[dialog.resolution]}: ${dialog.row.title}` : ''}
        size={440}
      >
        {dialog && (
          <div className={ui.stack}>
            {error && <Note variant="error">{error}</Note>}
            <NumberInput
              label="How many?"
              description={`${dialog.row.quantity} are missing. Fewer leaves the rest on the list.`}
              min={1}
              max={dialog.row.quantity}
              value={count}
              onChange={setCount}
              data-autofocus
            />
            <DialogFoot>
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
            </DialogFoot>
          </div>
        )}
      </Modal>
    </section>
  );
}
