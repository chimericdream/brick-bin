import Link from 'next/link';

import { Mark } from './Icons';
import classes from './Logo.module.css';

/** Mark and live wordmark (SPEC 4). The wordmark is never an image on the site. */
export function Logo() {
  return (
    <Link className={classes.logo} href="/" aria-label="Brick Bin, home">
      <Mark />
      <span>Brick Bin</span>
    </Link>
  );
}
