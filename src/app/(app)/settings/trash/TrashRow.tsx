'use client';

import { useState, useTransition } from 'react';
import { Alert, Button, Group } from '@mantine/core';

import { ConfirmDelete } from '@/components/ConfirmDelete';

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
    <div>
      <Group gap="xs">
        {canRestore && (
          <Button
            size="compact-md"
            variant="default"
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
      </Group>
      {error && (
        <Alert color="red" variant="light" role="alert" mt="xs">
          {error}
        </Alert>
      )}
    </div>
  );
}
