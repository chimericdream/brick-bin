'use client';

import { useState, useTransition } from 'react';
import { Button } from '@mantine/core';
import { IconArrowBackUp } from '@tabler/icons-react';

import { ConfirmDelete } from '@/components/ConfirmDelete';
import { Note } from '@/components/Note';
import ui from '@/components/ui/ui.module.css';

import { purgeTrashAction, restoreTrashAction } from '../actions';

export function TrashRow({
  kind,
  id,
  title,
  canRestore,
  canPurge,
}: {
  kind: string;
  id: string;
  title: string;
  canRestore: boolean;
  canPurge: boolean;
}) {
  const [error, setError] = useState<string | null>(null);
  const [offerDrop, setOfferDrop] = useState(false);
  const [pending, start] = useTransition();

  const restore = (withoutLocation: boolean) =>
    start(async () => {
      const r = await restoreTrashAction(kind, id, withoutLocation);
      setError(r.error ?? null);
      // A copy whose place is still in the trash can be restored without a place.
      setOfferDrop(kind === 'copy' && Boolean(r.error?.includes('without a place')));
    });

  return (
    <div className={ui.stack}>
      <div className={ui.actions}>
        {canRestore && (
          <Button
            size="compact-md"
            variant="default"
            leftSection={<IconArrowBackUp size={16} stroke={1.75} />}
            loading={pending}
            onClick={() => restore(false)}
          >
            Restore
          </Button>
        )}
        {offerDrop && (
          <Button
            size="compact-md"
            variant="default"
            loading={pending}
            onClick={() => restore(true)}
          >
            Restore without a place
          </Button>
        )}
        {canPurge && (
          <ConfirmDelete
            title={`Delete ${title} for good?`}
            triggerLabel="Delete for good"
            compact
            confirmLabel="Delete for good"
            action={async () => {
              const r = await purgeTrashAction(kind, id);
              return r.error ? { error: r.error } : undefined;
            }}
          >
            This cannot be undone.
          </ConfirmDelete>
        )}
      </div>
      {error && <Note variant="error">{error}</Note>}
    </div>
  );
}
