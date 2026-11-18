import Link from 'next/link';

import { ISSUES_URL, LICENSE_URL, REBRICKABLE_URL, REPO_URL, ROUTES } from '@/lib/site';

import classes from './SiteFooter.module.css';
import { ThemeToggle } from './ThemeToggle';

/** BRICK BIN in letter bricks; the gap between the words counts as the sixth child. */
const WALL: { letter: string; section: string }[] = [
  { letter: 'B', section: 'tutorials' },
  { letter: 'R', section: 'setup' },
  { letter: 'I', section: 'hosting' },
  { letter: 'C', section: 'config' },
  { letter: 'K', section: 'faq' },
  { letter: '', section: '' },
  { letter: 'B', section: 'hosting' },
  { letter: 'I', section: 'tutorials' },
  { letter: 'N', section: 'setup' },
];

/**
 * SPEC 6.3. The link columns are #site-nav, where the phone Menu control lands without scripts.
 * The Rebrickable credit and the non-affiliation note are required on every page.
 */
export function SiteFooter() {
  return (
    <footer className={classes.footer}>
      <div className="wrap">
        <div className={classes.wall} role="img" aria-label="Brick Bin, spelled out in bricks">
          {WALL.map(({ letter, section }, i) =>
            letter ? (
              <span key={i} className={`studs sec-${section}`}>
                {letter}
              </span>
            ) : (
              <span key={i} className={classes.gap} />
            ),
          )}
        </div>
        <div className={classes.grid} id="site-nav">
          <nav aria-labelledby="f1">
            <h2 id="f1">Get it running</h2>
            <ul>
              <li>
                <Link href={ROUTES.setup}>Setup</Link>
              </li>
              <li>
                <Link href={ROUTES.hosting}>Hosting</Link>
              </li>
              <li>
                <Link href={ROUTES.config}>Configuration</Link>
              </li>
            </ul>
          </nav>
          <nav aria-labelledby="f2">
            <h2 id="f2">Use it</h2>
            <ul>
              <li>
                <Link href={ROUTES.tutorials}>Tutorials</Link>
              </li>
              <li>
                <Link href={ROUTES.faq}>FAQ</Link>
              </li>
            </ul>
          </nav>
          <nav aria-labelledby="f3">
            <h2 id="f3">The project</h2>
            <ul>
              <li>
                <a href={REPO_URL}>Source code</a>
              </li>
              <li>
                <a href={ISSUES_URL}>Report a problem</a>
              </li>
              <li>
                <a href={LICENSE_URL}>MIT license</a>
              </li>
            </ul>
          </nav>
          <div>
            <h2 className="js-only" id="f4">
              Theme
            </h2>
            <ThemeToggle variant="icons" onField labelledBy="f4" />
          </div>
          <div className={classes.credit}>
            <p>
              Catalog data comes from <a href={REBRICKABLE_URL}>Rebrickable</a>. You import it
              yourself, onto your own server. Thank you, Rebrickable.
            </p>
            <p>
              Brick Bin is an independent project. It is not affiliated with, endorsed by or
              sponsored by the LEGO Group or any other brick maker. LEGO is a trademark of the LEGO
              Group.
            </p>
          </div>
        </div>
        <div className={classes.base}>
          <p>
            &copy; 2026 Bill Parrott. Free and open source under the MIT license. Nothing on this
            site tracks you.
          </p>
          <a className={classes.top} href="#top">
            Back to the top
          </a>
        </div>
      </div>
    </footer>
  );
}
