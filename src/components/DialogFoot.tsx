import classes from './DialogFoot.module.css';

/**
 * The foot of a dialog or sheet: a rule above, then its buttons. Under 768 they are full width and
 * stacked with the main action on top, nearest the thumb; from 768 they sit right-aligned with the
 * main action last. Put the main action last in the markup.
 */
export function DialogFoot({ children }: { children: React.ReactNode }) {
  return <div className={classes.foot}>{children}</div>;
}
