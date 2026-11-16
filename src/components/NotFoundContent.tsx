import Link from 'next/link';

import { BrickMark } from '@/components/BrickMark';

import classes from './NotFoundContent.module.css';

/**
 * The one page for every dead end: an unknown address, a set hidden from this profile, an
 * instruction file or image the viewer may not open. They all look and read the same, so nothing
 * here can confirm that a hidden set ever existed.
 *
 * `inShell` is for pages that already sit inside the app's own `<main>`.
 */
export function NotFoundContent({ inShell = false }: { inShell?: boolean }) {
  const Wrapper = inShell ? 'section' : 'main';
  return (
    <Wrapper className={`${classes.page} ${inShell ? classes.inShell : ''}`}>
      <div className={classes.bin} aria-hidden>
        <span className={classes.brick} style={{ background: '#1d5ca6' }} />
        <span className={classes.brick} style={{ background: '#2d6b6e', height: 44 }} />
        <span className={classes.gap} />
        <span className={classes.brick} style={{ background: '#b0651c', height: 52 }} />
      </div>
      <h1>That’s not in the bin.</h1>
      <p>The page you asked for isn’t here. It may have moved, or you may not have access to it.</p>
      <Link href="/" className={classes.link}>
        <BrickMark size={18} /> Back to the library
      </Link>
    </Wrapper>
  );
}
