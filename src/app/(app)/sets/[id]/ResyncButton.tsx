'use client';

import { useState, useTransition } from 'react';
import { Alert, Button, Checkbox, Group, Modal, Stack, Text } from '@mantine/core';
import { IconRefresh } from '@tabler/icons-react';

import type { ResyncKey, ResyncPreview } from '@/server/catalog/resync';

import { resyncApplyAction, resyncPreviewAction } from '../actions';

/** Compares a linked set with the catalog and lets you pick what to update. Nothing changes until you say so. */
export function ResyncButton({ setId, setNum }: { setId: string; setNum: string }) {
  const [opened, setOpened] = useState(false);
  const [preview, setPreview] = useState<ResyncPreview | null | undefined>(undefined);
  const [picked, setPicked] = useState<Set<ResyncKey>>(new Set());
  const [replaceCover, setReplaceCover] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const open = () => {
    setOpened(true);
    setError(null);
    setDone(null);
    setPreview(undefined);
    start(async () => {
      const p = await resyncPreviewAction(setId);
      setPreview(p);
      // Everything that differs is ticked; the cover is never ticked for you.
      setPicked(new Set(p?.fields.map((f) => f.key) ?? []));
      setReplaceCover(false);
    });
  };

  const toggle = (key: ResyncKey, on: boolean) => {
    const next = new Set(picked);
    if (on) next.add(key);
    else next.delete(key);
    setPicked(next);
  };

  const apply = () =>
    start(async () => {
      const keys = [...picked];
      const r = await resyncApplyAction(setId, keys, replaceCover);
      if (r.error) return setError(r.error);
      setDone(
        r.coverFailed
          ? 'Updated, but the cover could not be downloaded.'
          : 'Updated from the catalog.',
      );
      setPreview(null);
    });

  const offerCover = preview?.catalogHasCover === true;
  const coverTicked = picked.has('cover');

  return (
    <>
      <Button variant="default" leftSection={<IconRefresh size={16} />} onClick={open}>
        Re-sync from catalog
      </Button>
      <Modal
        opened={opened}
        onClose={() => setOpened(false)}
        title={`Re-sync with Rebrickable ${setNum}`}
        centered
      >
        <Stack gap="sm">
          {error && (
            <Alert color="red" variant="light" role="alert">
              {error}
            </Alert>
          )}
          {done && (
            <Alert color="green" variant="light" role="status">
              {done}
            </Alert>
          )}
          {preview === undefined && !done && <Text c="dimmed">Comparing with the catalog</Text>}
          {preview === null && !done && (
            <Text c="dimmed">
              The catalog has nothing to compare with. Import it in Settings first.
            </Text>
          )}
          {preview && preview.fields.length === 0 && !offerCover && (
            <Text>This set already matches the catalog.</Text>
          )}
          {preview && (
            <>
              {preview.fields.length > 0 && <Text size="sm">Tick what to update:</Text>}
              {preview.fields.map((f) => (
                <Checkbox
                  key={f.key}
                  checked={picked.has(f.key)}
                  onChange={(e) => toggle(f.key, e.currentTarget.checked)}
                  label={
                    <span>
                      <strong>{f.label}:</strong> {f.current ?? 'empty'} → {f.catalog}
                    </span>
                  }
                />
              ))}
              {offerCover && (
                <>
                  <Checkbox
                    checked={coverTicked}
                    onChange={(e) => toggle('cover', e.currentTarget.checked)}
                    label={
                      preview.hasCover
                        ? 'Also download the catalog cover'
                        : 'Download the catalog cover'
                    }
                  />
                  {coverTicked && preview.hasCover && (
                    <Checkbox
                      checked={replaceCover}
                      onChange={(e) => setReplaceCover(e.currentTarget.checked)}
                      label="Replace the cover this set has now"
                      description="Without this, your current cover is kept."
                      ml="lg"
                    />
                  )}
                </>
              )}
            </>
          )}
          <Group justify="flex-end">
            <Button variant="default" onClick={() => setOpened(false)}>
              {done ? 'Close' : 'Cancel'}
            </Button>
            {preview && (preview.fields.length > 0 || offerCover) && !done && (
              <Button onClick={apply} loading={pending} disabled={picked.size === 0}>
                Update
              </Button>
            )}
          </Group>
          <Text size="xs" c="dimmed">
            Catalog data from Rebrickable
          </Text>
        </Stack>
      </Modal>
    </>
  );
}
