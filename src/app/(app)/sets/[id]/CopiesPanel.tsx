'use client';

import { useActionState, useState } from 'react';
import { Button, Modal } from '@mantine/core';
import {
  IconAlertTriangle,
  IconCheck,
  IconMapPin,
  IconMinus,
  IconPencil,
  IconPlus,
} from '@tabler/icons-react';
import Link from 'next/link';

import { ConfirmDelete, TRASH_SENTENCE } from '@/components/ConfirmDelete';
import { DialogFoot } from '@/components/DialogFoot';
import { Note } from '@/components/Note';
import { CompletenessBadge, StateTag, missingLabel, tagClass } from '@/components/sets/Badges';
import type { BuildState, Completeness } from '@/server/data/completeness';

import { saveCopyAction, trashCopyAction, type ActionState } from '../actions';
import { CopyFields, type CopyDefaults, type Option } from '../CopyFields';
import { HowMany } from '../HowMany';
import { BuildStateControl } from './BuildStateControl';
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
      size={600}
    >
      <form action={formAction} className={classes.form}>
        {state.error && <Note variant="error">{state.error}</Note>}
        {!copy && <HowMany />}
        <CopyFields members={members} locations={locations} defaults={copy?.defaults} />
        <DialogFoot>
          <Button variant="default" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={pending}>
            {copy ? 'Save copy' : 'Add copy'}
          </Button>
        </DialogFoot>
      </form>
    </Modal>
  );
}

/** "Has the box" with a check, or "No box" with a dash. */
function Tick({ yes, label, no }: { yes: boolean; label: string; no: string }) {
  return (
    <li>
      {yes ? (
        <IconCheck size={16} stroke={2.5} aria-hidden />
      ) : (
        <IconMinus size={16} stroke={2.5} aria-hidden />
      )}
      {yes ? label : no}
    </li>
  );
}

function Pieces({ copy }: { copy: CopyView }) {
  const c = copy.completeness;
  if (c.kind === 'missing') {
    // The tag is the way into the list of what is missing (read only for kids).
    return (
      <Link href={`/copies/${copy.id}/missing`} className={tagClass('dash')}>
        {missingLabel(c.pieces)}
      </Link>
    );
  }
  if (c.kind === 'complete') {
    return (
      <span className={classes.stack}>
        <CompletenessBadge completeness={c} />
        <span className={classes.small} aria-hidden>
          checked{' '}
          {new Date(`${c.checkedOn}T12:00:00`).toLocaleDateString('en-US', {
            month: 'short',
            year: 'numeric',
          })}
        </span>
      </span>
    );
  }
  return <CompletenessBadge completeness={c} />;
}

export function CopiesPanel({ setId, copies, canEdit, members, locations }: Props) {
  const [editing, setEditing] = useState<CopyView | null>(null);
  const [adding, setAdding] = useState(false);

  return (
    <section aria-labelledby="copies-heading" className={classes.section}>
      <div className={classes.sectionHead}>
        <h2 id="copies-heading">
          Copies <small className={classes.count}>{copies.length}</small>
        </h2>
        {canEdit && (
          <Button leftSection={<IconPlus size={20} stroke={2} />} onClick={() => setAdding(true)}>
            Add copy
          </Button>
        )}
      </div>

      {copies.length === 0 && (
        <div className={`${classes.empty} app-baseplate`}>
          <div className={classes.emptyCard}>
            <h3>No copies of this set.</h3>
            <p>
              The design is in the library, but nobody has said they own a box of it.
              {canEdit && ' Add a copy to give it a build state and a place.'}
            </p>
            {canEdit && (
              <Button
                variant="default"
                leftSection={<IconPlus size={20} stroke={2} />}
                onClick={() => setAdding(true)}
              >
                Add copy
              </Button>
            )}
          </div>
        </div>
      )}

      {copies.map((copy) => (
        <article
          key={copy.id}
          className={classes.copy}
          aria-label={`Copy ${copy.position} of ${copies.length}`}
        >
          <div className={classes.copyHead}>
            <span className={classes.tile} aria-hidden>
              {(copy.ownerName ?? 'Ours').slice(0, 1).toUpperCase()}
            </span>
            <div className={classes.who}>
              <h3>
                {copy.ownerName ? `${copy.ownerName}’s copy` : 'Ours'}
                {copies.length > 1 && (
                  <small>
                    {' '}
                    copy {copy.position} of {copies.length}
                  </small>
                )}
              </h3>
              {copy.locationPath && (
                <p className={classes.place}>
                  <IconMapPin size={16} stroke={1.75} aria-hidden />
                  {copy.locationPath}
                </p>
              )}
            </div>
            <div className={classes.state}>
              {canEdit ? (
                <BuildStateControl
                  setId={setId}
                  copyId={copy.id}
                  position={copy.position}
                  state={copy.buildState}
                />
              ) : (
                <StateTag state={copy.buildState} />
              )}
            </div>
          </div>

          <dl className={classes.kv}>
            <dt>Pieces</dt>
            <dd>
              <Pieces copy={copy} />
            </dd>
            <dt>Box and booklets</dt>
            <dd>
              <ul className={classes.ticks}>
                <Tick yes={copy.hasBox} label="Has the box" no="No box" />
                <Tick
                  yes={copy.hasInstructions}
                  label="Has paper booklets"
                  no="No paper booklets"
                />
              </ul>
            </dd>
            <dt>Condition notes</dt>
            <dd>{copy.conditionNotes ?? <span className={classes.muted}>None</span>}</dd>
            {copy.money ? (
              <>
                <dt>Paid / value</dt>
                <dd>
                  <b className="app-num">
                    {copy.money.paid || '—'} / {copy.money.value || '—'}
                  </b>
                  {copy.money.valued && (
                    <span className={classes.small}>valued {copy.money.valued}</span>
                  )}
                </dd>
              </>
            ) : (
              <>
                <dt>Acquired</dt>
                <dd>{copy.acquiredOn ?? <span className={classes.muted}>—</span>}</dd>
              </>
            )}
          </dl>

          {canEdit && (
            <div className={classes.copyActions}>
              <Button
                variant="default"
                size="compact-md"
                leftSection={<IconPencil size={16} stroke={1.75} />}
                onClick={() => setEditing(copy)}
              >
                Edit copy
              </Button>
              <Button
                component={Link}
                href={`/copies/${copy.id}/missing`}
                variant="default"
                size="compact-md"
                leftSection={<IconAlertTriangle size={16} stroke={1.75} />}
              >
                Missing pieces
              </Button>
              <span className={classes.push}>
                <ConfirmDelete
                  title={`Remove copy ${copy.position}?`}
                  triggerLabel="Remove copy"
                  compact
                  action={() => trashCopyAction(setId, copy.id)}
                >
                  {TRASH_SENTENCE}
                </ConfirmDelete>
              </span>
            </div>
          )}
        </article>
      ))}

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
