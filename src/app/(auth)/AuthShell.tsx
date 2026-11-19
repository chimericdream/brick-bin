import { HeroPile } from '@/components/art/Art';
import { BrickMark } from '@/components/BrickMark';

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
 * The front door: a panel on the field with the logo and a built pile of bricks, beside one short
 * form. It is shown to anyone who can reach the app, so it carries nothing about this collection.
 */
export function AuthShell({ title, lead, children, footnote }: Props) {
  return (
    <div className={classes.gate}>
      <div className={classes.art}>
        <span className={classes.logo}>
          <BrickMark />
          Brick Bin
        </span>
        <div className={classes.pitch}>
          <p className={classes.headline}>Know what’s in every box.</p>
          <p className={classes.line}>
            Sets, the boxes you own of each, and everything that goes missing from them.
          </p>
        </div>
        <HeroPile className={classes.pile} />
      </div>
      <main className={classes.form}>
        <h1 className={classes.title}>{title}</h1>
        <p className={classes.lead}>{lead}</p>
        {children}
        {footnote && <p className={classes.foot}>{footnote}</p>}
        <p className={classes.credit}>
          Catalog data from <a href="https://rebrickable.com/">Rebrickable</a>. Brick Bin is not
          affiliated with the LEGO Group or any other brick maker.
        </p>
      </main>
    </div>
  );
}
