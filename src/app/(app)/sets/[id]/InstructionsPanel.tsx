'use client';

import { useRef, useState, useTransition } from 'react';
import { ActionIcon, Button, Modal, Progress, TextInput } from '@mantine/core';
import {
  IconArrowDown,
  IconArrowUp,
  IconDownload,
  IconExternalLink,
  IconFileText,
  IconLink,
  IconPencil,
  IconUpload,
} from '@tabler/icons-react';

import { ConfirmDelete, TRASH_SENTENCE } from '@/components/ConfirmDelete';
import { DialogFoot } from '@/components/DialogFoot';
import { Note } from '@/components/Note';

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
    <section aria-labelledby="instructions-heading" className={classes.section}>
      <div className={classes.sectionHead}>
        <h2 id="instructions-heading">
          Instructions
          {items.length > 0 && <small className={classes.count}> {items.length}</small>}
        </h2>
        {find && (
          <Button
            component="a"
            href={find.href}
            target="_blank"
            rel="noopener noreferrer"
            variant="default"
            size="compact-md"
            leftSection={<IconExternalLink size={16} stroke={1.75} />}
          >
            {find.label}
          </Button>
        )}
      </div>

      {items.length === 0 ? (
        <div className={`${classes.inlineEmpty} app-baseplate`}>
          <p className={classes.inlineCard}>
            <b>No instructions saved for this set yet.</b>
            {canEdit && ' Upload the PDF, or save a link to it.'}
          </p>
        </div>
      ) : (
        <ul className={classes.insList}>
          {items.map((item, i) => (
            <li key={item.id} className={classes.insRow}>
              {item.kind === 'file' ? (
                <IconFileText size={20} stroke={1.75} aria-hidden className={classes.insIcon} />
              ) : (
                <IconLink size={20} stroke={1.75} aria-hidden className={classes.insIcon} />
              )}
              <div className={classes.insText}>
                <p className={classes.insLabel}>{item.label}</p>
                <span className={classes.small}>
                  {item.kind === 'file' ? 'PDF' : 'Link'}
                  {item.detail ? ` · ${item.detail}` : ''}
                  {item.sourceHost ? ` · saved from ${item.sourceHost}` : ''}
                </span>
              </div>
              <div className={classes.insActions}>
                {canEdit && (
                  <>
                    <ActionIcon
                      variant="subtle"
                      size={44}
                      aria-label={`Move ${item.label} up`}
                      disabled={i === 0}
                      onClick={() => start(() => moveInstructionAction(setId, item.id, 'up'))}
                    >
                      <IconArrowUp size={18} stroke={1.75} />
                    </ActionIcon>
                    <ActionIcon
                      variant="subtle"
                      size={44}
                      aria-label={`Move ${item.label} down`}
                      disabled={i === items.length - 1}
                      onClick={() => start(() => moveInstructionAction(setId, item.id, 'down'))}
                    >
                      <IconArrowDown size={18} stroke={1.75} />
                    </ActionIcon>
                    <ActionIcon
                      variant="subtle"
                      size={44}
                      aria-label={`Rename ${item.label}`}
                      onClick={() => open({ rename: item }, item.label)}
                    >
                      <IconPencil size={18} stroke={1.75} />
                    </ActionIcon>
                  </>
                )}
                <Button
                  component="a"
                  href={item.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  variant="default"
                  size="compact-md"
                  leftSection={<IconExternalLink size={16} stroke={1.75} />}
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
                    {TRASH_SENTENCE}
                  </ConfirmDelete>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      {canEdit && (
        <div className={classes.insButtons}>
          <Button
            variant="default"
            leftSection={<IconUpload size={20} stroke={1.75} />}
            onClick={() => open('upload')}
          >
            Upload PDF
          </Button>
          <Button
            variant="default"
            leftSection={<IconLink size={20} stroke={1.75} />}
            onClick={() => open('link')}
          >
            Add link
          </Button>
          <Button
            variant="default"
            leftSection={<IconDownload size={20} stroke={1.75} />}
            onClick={() => open('save')}
          >
            Save PDF from a link
          </Button>
        </div>
      )}

      <Modal opened={dialog !== null} onClose={close} title={titleOf(dialog)} size={440}>
        <div className={classes.form}>
          {error && <Note variant="error">{error}</Note>}
          {dialog === 'upload' && (
            <div className={classes.field}>
              <label htmlFor="instructions-file" className={classes.label}>
                PDF file
              </label>
              <span className={classes.small}>Up to {maxMb} MB. Large files can take a while.</span>
              <input
                id="instructions-file"
                ref={file}
                type="file"
                accept="application/pdf,.pdf"
                className={classes.file}
                onChange={(e) => {
                  const f = e.currentTarget.files?.[0];
                  if (f && !label) setLabel(nameFromFile(f.name));
                }}
              />
            </div>
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
            <p className={classes.small}>
              The PDF is downloaded once and stored here, so you keep it even if the maker takes it
              down. Only public https addresses work.
            </p>
          )}
          {progress !== null && busy && (
            <Progress value={Math.round(progress * 100)} aria-label="Upload progress" />
          )}
        </div>
        <DialogFoot>
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
        </DialogFoot>
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
