'use client';

import { notifications } from '@mantine/notifications';
import { IconAlertTriangle, IconCheck } from '@tabler/icons-react';

import classes from './toast.module.css';

/** What happened, as a sentence with a period. Leaves after about four seconds. */
export function toastDone(message: string) {
  notifications.show({
    message,
    icon: <IconCheck size={20} stroke={2} aria-hidden />,
    role: 'status',
    autoClose: 4000,
    closeButtonProps: { 'aria-label': 'Dismiss' },
  });
}

/**
 * A failed action: what failed and that nothing changed, with "Try again". A dashed border, and
 * it stays until dismissed.
 */
export function toastFailed(message: string, retry?: () => void) {
  const id = notifications.show({
    message: (
      <span className={classes.row}>
        <span className={classes.text}>{message}</span>
        {retry && (
          <button
            type="button"
            className={classes.action}
            onClick={() => {
              notifications.hide(id);
              retry();
            }}
          >
            Try again
          </button>
        )}
      </span>
    ),
    icon: <IconAlertTriangle size={20} stroke={2} aria-hidden />,
    role: 'alert',
    autoClose: false,
    className: classes.failed,
    closeButtonProps: { 'aria-label': 'Dismiss' },
  });
}
