'use client';

import { useRef, useState, useTransition } from 'react';
import {
  Alert,
  Button,
  Group,
  Modal,
  Paper,
  Progress,
  Stack,
  Text,
  TextInput,
  Title,
} from '@mantine/core';
import {
  IconArrowDown,
  IconArrowUp,
  IconDownload,
  IconExternalLink,
  IconLink,
  IconPencil,
  IconUpload,
} from '@tabler/icons-react';

import { ConfirmDelete } from '@/components/ConfirmDelete';

import {
  addLinkAction,
  moveInstructionAction,
  refreshSetAction,
  renameInstructionAction,
  trashInstructionAction,
} from './instruction-actions';
import classes from './Detail.module.css';

export interface InstructionView {
  id: string;
  kind: 'file' | 'link';
  label: string;
  /** "38.4 MB · added 3 Jan 2024", or the link's host. */
  detail: string;
  /** Where "Open" goes. */
  href: string;
  /** Hosts a saved PDF came from, for "Saved from …". */
  sourceHost: string | null;
}

interface Props {
  setId: string;
  items: InstructionView[];
  canEdit: boolean;
  maxMb: number;
  /** "Find on LEGO.com" and the like. */
  find: { label: string; href: string } | null;
}

type Dialog = 'upload' | 'link' | 'save' | { rename: InstructionView } | null;

/** POSTs a file as the raw body, reporting progress. Resolves with the parsed JSON and status. */
function uploadFile(
  file: File,
  headers: Record<string, string>,
  onProgress: (fraction: number) => void,
): Promise<{ status: number; body: { id?: string; error?: string } }> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', '/api/instructions/upload');
    for (const [k, v] of Object.entries(headers)) xhr.setRequestHeader(k, v);
    xhr.setRequestHeader('Content-Type', 'application/pdf');
    xhr.upload.onprogress = (e) => e.lengthComputable && onProgress(e.loaded / e.total);
    xhr.onload = () => {
      let body = {};
      try {
        body = JSON.parse(xhr.responseText);
      } catch {
        // Not JSON: the message below covers it.
      }
      resolve({ status: xhr.status, body });
    };
    xhr.onerror = () => reject(new Error('network'));
    xhr.send(file);
  });
}

const nameFromFile = (name: string) =>
  name
    .replace(/\.pdf$/i, '')
    .replace(/[_-]+/g, ' ')
    .trim();

export function InstructionsPanel({ setId, items, canEdit, maxMb, find }: Props) {
  const [dialog, setDialog] = useState<Dialog>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState<number | null>(null);
  const [label, setLabel] = useState('');
  const [url, setUrl] = useState('');
  const file = useRef<HTMLInputElement>(null);
  const [, start] = useTransition();

  const close = () => {
    setDialog(null);
    setError(null);
    setBusy(false);
    setProgress(null);
    setLabel('');
    setUrl('');
  };
  const open = (d: Dialog, initial = '') => {
    setError(null);
    setLabel(initial);
    setUrl('');
    setDialog(d);
  };

  async function upload() {
    const f = file.current?.files?.[0];
    if (!f) return setError('Choose a PDF first.');
    if (f.size > maxMb * 1_048_576) return setError(`That file is larger than ${maxMb} MB.`);
    if (!label.trim()) return setError('Give the instructions a name.');
    setBusy(true);
    setError(null);
    try {
      const { status, body } = await uploadFile(
        f,
        { 'x-set-id': setId, 'x-label': encodeURIComponent(label.trim()) },
        setProgress,
      );
      if (status !== 201) return setError(body.error ?? 'The upload failed.');
      await refreshSetAction(setId);
      close();
    } catch {
      setError('The upload failed. Check your connection and try again.');
    } finally {
      setBusy(false);
    }
  }

  async function saveFromLink() {
    if (!url.trim()) return setError('Paste the address of the PDF.');
    if (!label.trim()) return setError('Give the instructions a name.');
    setBusy(true);
    setError(null);
    try {
      const res = await fetch('/api/instructions/save-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ setId, label, url }),
      });
      const body = (await res.json().catch(() => ({}))) as { error?: string };
      if (res.status !== 201) return setError(body.error ?? 'The download failed.');
      await refreshSetAction(setId);
      close();
    } catch {
      setError('The download failed. Try again.');
    } finally {
      setBusy(false);
    }
  }

  async function addLink() {
    setBusy(true);
    const r = await addLinkAction(setId, { label, url });
    setBusy(false);
    if (r.error) return setError(r.error);
    close();
  }

  async function rename(item: InstructionView) {
    setBusy(true);
    const r = await renameInstructionAction(setId, item.id, label);
    setBusy(false);
    if (r.error) return setError(r.error);
    close();
  }

  return (
    <section aria-labelledby="instructions-heading" className={classes.instructions}>
      <Group justify="space-between" mb="sm" wrap="wrap">
        <Title order={2} id="instructions-heading" size="h3">
          Instructions
        </Title>
        {find && (
          <Button
            component="a"
            href={find.href}
            target="_blank"
            rel="noopener noreferrer"
            variant="default"
            leftSection={<IconExternalLink size={16} />}
          >
            {find.label}
          </Button>
        )}
      </Group>

      <Paper withBorder p="xs">
        {items.length === 0 ? (
          <Text c="dimmed" p="md">
            No instructions saved for this set yet.
          </Text>
        ) : (
          <ul className={classes.insList}>
            {items.map((item, i) => (
              <li key={item.id} className={classes.insRow}>
                <span className={classes.insBadge} data-kind={item.kind} aria-hidden>
                  {item.kind === 'file' ? 'PDF' : 'LINK'}
                </span>
                <div className={classes.insText}>
                  <Text fw={650}>{item.label}</Text>
                  <Text size="sm" c="dimmed">
                    {item.detail}
                    {item.sourceHost ? ` · saved from ${item.sourceHost}` : ''}
                  </Text>
                </div>
                <Group gap={4} wrap="nowrap">
                  {canEdit && (
                    <>
                      <Button
                        variant="subtle"
                        size="compact-md"
                        aria-label={`Move ${item.label} up`}
                        disabled={i === 0}
                        onClick={() => start(() => moveInstructionAction(setId, item.id, 'up'))}
                      >
                        <IconArrowUp size={16} />
                      </Button>
                      <Button
                        variant="subtle"
                        size="compact-md"
                        aria-label={`Move ${item.label} down`}
                        disabled={i === items.length - 1}
                        onClick={() => start(() => moveInstructionAction(setId, item.id, 'down'))}
                      >
                        <IconArrowDown size={16} />
                      </Button>
                      <Button
                        variant="subtle"
                        size="compact-md"
                        aria-label={`Rename ${item.label}`}
                        onClick={() => open({ rename: item }, item.label)}
                      >
                        <IconPencil size={16} />
                      </Button>
                    </>
                  )}
                  <Button
                    component="a"
                    href={item.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    variant="default"
                    size="compact-md"
                    leftSection={<IconExternalLink size={14} />}
                  >
                    {item.kind === 'file' ? 'Open' : 'Visit'}
                  </Button>
                  {canEdit && (
                    <ConfirmDelete
                      title={`Remove ${item.label}?`}
                      triggerLabel="Remove"
                      compact
                      action={() => trashInstructionAction(setId, item.id)}
                    >
                      It moves to the trash. You can restore it from Settings &gt; Trash.
                    </ConfirmDelete>
                  )}
                </Group>
              </li>
            ))}
          </ul>
        )}
      </Paper>

      {canEdit && (
        <Group mt="sm" gap="xs" wrap="wrap">
          <Button
            variant="default"
            leftSection={<IconUpload size={16} />}
            onClick={() => open('upload')}
          >
            Upload PDF
          </Button>
          <Button
            variant="default"
            leftSection={<IconLink size={16} />}
            onClick={() => open('link')}
          >
            Add link
          </Button>
          <Button
            variant="default"
            leftSection={<IconDownload size={16} />}
            onClick={() => open('save')}
          >
            Save PDF from a link
          </Button>
        </Group>
      )}

      <Modal opened={dialog !== null} onClose={close} title={titleOf(dialog)} centered>
        <Stack gap="sm">
          {error && (
            <Alert color="red" variant="light" role="alert">
              {error}
            </Alert>
          )}
          {dialog === 'upload' && (
            <>
              <label>
                <Text size="sm" fw={600}>
                  PDF file
                </Text>
                <input
                  ref={file}
                  type="file"
                  accept="application/pdf,.pdf"
                  aria-label="PDF file"
                  onChange={(e) => {
                    const f = e.currentTarget.files?.[0];
                    if (f && !label) setLabel(nameFromFile(f.name));
                  }}
                />
              </label>
              <Text size="xs" c="dimmed">
                Up to {maxMb} MB. Large files can take a while.
              </Text>
            </>
          )}
          {(dialog === 'link' || dialog === 'save') && (
            <TextInput
              label={dialog === 'save' ? 'Address of the PDF' : 'Web address'}
              placeholder="https://"
              value={url}
              onChange={(e) => setUrl(e.currentTarget.value)}
              inputMode="url"
            />
          )}
          <TextInput
            label="Name"
            placeholder="Book 1"
            value={label}
            onChange={(e) => setLabel(e.currentTarget.value)}
            data-autofocus
          />
          {dialog === 'save' && (
            <Text size="xs" c="dimmed">
              The PDF is downloaded once and stored here, so you keep it even if the maker takes it
              down. Only public https addresses work.
            </Text>
          )}
          {progress !== null && busy && (
            <Progress value={Math.round(progress * 100)} aria-label="Upload progress" />
          )}
          <Group justify="flex-end">
            <Button variant="default" onClick={close}>
              Cancel
            </Button>
            <Button
              loading={busy}
              onClick={() => {
                if (dialog === 'upload') void upload();
                else if (dialog === 'save') void saveFromLink();
                else if (dialog === 'link') void addLink();
                else if (dialog && typeof dialog === 'object') void rename(dialog.rename);
              }}
            >
              {dialog === 'upload'
                ? 'Upload'
                : dialog === 'save'
                  ? 'Download and save'
                  : dialog === 'link'
                    ? 'Add link'
                    : 'Save'}
            </Button>
          </Group>
        </Stack>
      </Modal>
    </section>
  );
}

function titleOf(d: Dialog): string {
  if (d === 'upload') return 'Upload a PDF';
  if (d === 'link') return 'Add a link';
  if (d === 'save') return 'Save a PDF from a link';
  if (d && typeof d === 'object') return 'Rename';
  return '';
}
