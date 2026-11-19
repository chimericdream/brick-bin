import { IconAlertCircle } from '@tabler/icons-react';

import classes from './Note.module.css';

/**
 * Note: background and reasons. Mind: dashed, something that will catch you out. Error: the
 * danger tone with an icon, announced as an alert.
 */
export function Note({
  variant = 'note',
  children,
}: {
  variant?: 'note' | 'mind' | 'error';
  children: React.ReactNode;
}) {
  if (variant === 'error') {
    return (
      <div className={`${classes.note} ${classes.error}`} role="alert">
        <IconAlertCircle size={20} stroke={1.75} aria-hidden className={classes.icon} />
        <div>{children}</div>
      </div>
    );
  }
  return <div className={`${classes.note} ${classes[variant]}`}>{children}</div>;
}
