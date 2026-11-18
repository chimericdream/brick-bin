import Link from 'next/link';
import { Fragment } from 'react';

import { TUTORIAL_GROUPS, TUTORIALS, tutorialNumber } from '@/content/tutorials';
import { DOCS_PAGES } from '@/lib/nav';
import { ROUTES, tutorialHref, type Section } from '@/lib/site';

import { Prose } from '../prose/Blocks';
import classes from './Docs.module.css';
import { TocColumn, TocDisclosure, type TocItem } from './Toc';

function DocsNav({ current }: { current: string }) {
  return (
    <nav className={classes.sidenav} aria-label="Documentation">
      <h2>Documentation</h2>
      <ul>
        {DOCS_PAGES.map((p) => (
          <li key={p.href}>
            <Link
              className={`sec-${p.section}`}
              href={p.href}
              aria-current={p.href === current ? 'page' : undefined}
            >
              <span className="b1" />
              {p.name}
            </Link>
          </li>
        ))}
      </ul>
      <h2>Elsewhere</h2>
      <ul>
        <li>
          <Link className="sec-tutorials" href={ROUTES.tutorials}>
            <span className="b1" />
            Tutorials
          </Link>
        </li>
        <li>
          <Link className="sec-faq" href={ROUTES.faq}>
            <span className="b1" />
            FAQ
          </Link>
        </li>
      </ul>
    </nav>
  );
}

function TutorialsNav({ current }: { current: string }) {
  return (
    <nav className={classes.sidenav} aria-label="Tutorials">
      {TUTORIAL_GROUPS.map((g) => (
        <Fragment key={g.id}>
          <h2>{g.title}</h2>
          <ul>
            {g.tutorials.map((t) => {
              const href = tutorialHref(t.slug);
              return (
                <li key={t.slug}>
                  <Link href={href} aria-current={href === current ? 'page' : undefined}>
                    <span className={classes.num}>
                      {String(tutorialNumber(t.slug)).padStart(2, '0')}
                    </span>
                    {t.title}
                  </Link>
                </li>
              );
            })}
          </ul>
        </Fragment>
      ))}
    </nav>
  );
}

interface Props {
  section: Section;
  nav: 'docs' | 'tutorials';
  /** This page's address, to mark it current. */
  href: string;
  head: React.ReactNode;
  toc: TocItem[];
  children: React.ReactNode;
}

/**
 * The docs and tutorial layout (SPEC 6.15): a sidebar from 1024px, the article at 760px at most,
 * and "On this page" on the right from 1280px. Under 1024px the section navigation sits above
 * the page head: three tabs for the docs, a disclosure for the tutorials.
 */
export function DocsShell({ section, nav, href, head, toc, children }: Props) {
  const number = TUTORIALS.findIndex((t) => tutorialHref(t.slug) === href) + 1;
  return (
    <div className={`wrap ${classes.docs}`} data-section={section} data-footer="tight">
      {nav === 'docs' ? <DocsNav current={href} /> : <TutorialsNav current={href} />}
      <article className={classes.main}>
        {nav === 'docs' ? (
          <nav aria-label="Documentation sections">
            <ul className={classes.doctabs}>
              {DOCS_PAGES.map((p) => (
                <li key={p.href}>
                  <Link
                    className={`sec-${p.section}`}
                    href={p.href}
                    aria-current={p.href === href ? 'page' : undefined}
                  >
                    <span className="b1" />
                    {p.name}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ) : (
          <details className={classes.tutnav}>
            <summary>
              Tutorial {number} of {TUTORIALS.length} · all tutorials
            </summary>
            <TutorialsNav current={href} />
          </details>
        )}
        {head}
        <TocDisclosure items={toc} />
        <Prose>{children}</Prose>
      </article>
      <TocColumn items={toc} />
    </div>
  );
}
