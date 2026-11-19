'use client';

import { type ReactNode, useState, useTransition } from 'react';
import { ActionIcon, Button, Modal } from '@mantine/core';

import { DialogFoot } from './DialogFoot';
import { Note } from './Note';

interface Props {
  /** The dialog's title: a question naming the thing, e.g. "Delete Shelf 2?". */
  title: string;
  /** What will happen, and how to undo it, in plain words. */
  children: ReactNode;
  /** Accessible name (and text, for a button) of the control that opens the dialog. */
  triggerLabel: string;
  /** Visible text when it differs from the accessible name ("Delete" for "Delete Shelf 2"). */
  triggerText?: string;
  /** Show an icon button instead of a text button. */
  triggerIcon?: ReactNode;
  /** An icon before the trigger's text. */
  triggerLeftSection?: ReactNode;
  /** Why this cannot be deleted right now. Shown instead of the explanation; confirming is off. */
  blocked?: ReactNode;
  /** A smaller text button, for use inside rows. */
  compact?: boolean;
  /** Confirm button text. */
  confirmLabel?: string;
  /** Runs on confirm. Return `{ error }` to keep the dialog open and show why. */
  action: () => Promise<{ error?: string } | void>;
}

/** Shared wording for anything that goes to the trash. */
export const TRASH_SENTENCE =
  'It moves to the trash. You can restore it from Settings, then Trash, for 30 days.';

/**
 * Every deletion asks first. Deleting moves something to the trash, so the wording says where it
 * went and that it can be restored.
 */
export function ConfirmDelete({
  title,
  children,
  triggerLabel,
  triggerText,
  triggerIcon,
  triggerLeftSection,
  blocked,
  compact,
  confirmLabel = 'Move to trash',
  action,
}: Props) {
  const [opened, setOpened] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const close = () => {
    setOpened(false);
    setError(null);
  };
  const confirm = () =>
    startTransition(async () => {
      try {
        const result = await action();
        if (result && result.error) setError(result.error);
        else close();
      } catch (e) {
        // A redirect after deleting is not an error; the browser is already on its way.
        if (e instanceof Error && e.message.includes('NEXT_REDIRECT')) throw e;
        setError('Could not delete it. Try again.');
      }
    });
  return (
    <>
      {triggerIcon ? (
        <ActionIcon
          variant="subtle"
          color="gray"
          aria-label={triggerLabel}
          onClick={() => setOpened(true)}
        >
          {triggerIcon}
        </ActionIcon>
      ) : (
        <Button
          variant="danger-text"
          size={compact ? 'compact-md' : undefined}
          leftSection={triggerLeftSection}
          aria-label={triggerText ? triggerLabel : undefined}
          onClick={() => setOpened(true)}
        >
          {triggerText ?? triggerLabel}
        </Button>
      )}
      <Modal opened={opened} onClose={close} title={title} size={440}>
        {blocked ? <Note>{blocked}</Note> : <div>{children}</div>}
        {error && (
          <div style={{ marginTop: 'var(--app-s3)' }}>
            <Note variant="error">{error}</Note>
          </div>
        )}
        <DialogFoot>
          <Button variant="default" onClick={close}>
            Cancel
          </Button>
          <Button variant="danger" onClick={confirm} loading={pending} disabled={Boolean(blocked)}>
            {confirmLabel}
          </Button>
        </DialogFoot>
      </Modal>
    </>
  );
}
