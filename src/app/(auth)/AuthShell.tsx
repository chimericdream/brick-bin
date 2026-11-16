import { BrickMark } from '@/components/BrickMark';
import { DecorativeBins } from '@/components/art/DecorativeBins';

import classes from './AuthShell.module.css';

interface Props {
  title: string;
  lead: string;
  /** The form. */
  children: React.ReactNode;
  /** A line under the form. */
  footnote?: string;
}

/**
 * The front door: a wall of invented boxes beside one short form. It is shown to anyone who can
 * reach the app, so it carries no information about this collection (no set names or covers).
 */
export function AuthShell({ title, lead, children, footnote }: Props) {
  return (
    <div className={classes.door}>
      <aside className={classes.wall}>
        <DecorativeBins />
      </aside>
      <main className={classes.form}>
        <div className={classes.brand}>
          <BrickMark size={30} />
          Brick Bin
        </div>
        <h1>{title}</h1>
        <p className={classes.lead}>{lead}</p>
        <div className={classes.body}>{children}</div>
        {footnote && <p className={classes.foot}>{footnote}</p>}
      </main>
    </div>
  );
}
