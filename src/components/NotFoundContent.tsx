import { MissingWall } from '@/components/art/Art';
import { BrickMark } from '@/components/BrickMark';
import { LinkButton } from '@/components/Links';

import classes from './NotFoundContent.module.css';

/**
 * The one page for every dead end: an unknown address, a set hidden from this profile, an
 * instruction file or image the viewer may not open. They all look and read the same, so nothing
 * here can confirm that a hidden set ever existed.
 *
 * `inShell` is for pages that already sit inside the app's own `<main>`. A kid has no shopping
 * list, so the line about it is left out for them.
 */
export function NotFoundContent({
  inShell = false,
  kid = false,
}: {
  inShell?: boolean;
  kid?: boolean;
}) {
  const Wrapper = inShell ? 'section' : 'main';
  return (
    <Wrapper className={`${classes.lost} ${inShell ? classes.inShell : ''}`}>
      <div className={`${classes.art} app-baseplate`}>
        <MissingWall className={classes.wall} />
      </div>
      <div className={classes.text}>
        <span className={classes.logo}>
          <BrickMark />
          Brick Bin
        </span>
        <h1 className={classes.title}>That’s not in the bin.</h1>
        <p className={classes.lead}>
          The page you asked for isn’t here. It may have moved, or you may not have access to it.
        </p>
        <div className={classes.partsline} role="note">
          <span className={classes.qty}>
            1 <small>×</small>
          </span>
          <p>
            <b>Page, color unknown</b>
            {!kid && <span>Not added to your shopping list. We checked.</span>}
          </p>
        </div>
        <LinkButton href="/">Back to the library</LinkButton>
      </div>
    </Wrapper>
  );
}
