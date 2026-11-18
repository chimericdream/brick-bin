'use client';

import { useEffect, useState } from 'react';

import classes from './Docs.module.css';

export interface TocItem {
  id: string;
  label: string;
}

/**
 * Tracks the heading in view (SPEC 6.16): the same rootMargin as the mockups, so a heading counts
 * once it reaches the top 30% of the window. Without scripts the links still work.
 */
function useCurrentHeading(items: TocItem[]) {
  const [current, setCurrent] = useState<string | null>(null);
  useEffect(() => {
    if (!('IntersectionObserver' in window)) return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) if (e.isIntersecting) setCurrent(e.target.id);
      },
      { rootMargin: '0px 0px -70% 0px' },
    );
    for (const { id } of items) {
      const el = document.getElementById(id);
      if (el) io.observe(el);
    }
    return () => io.disconnect();
  }, [items]);
  return current;
}

function Links({ items }: { items: TocItem[] }) {
  const current = useCurrentHeading(items);
  return (
    <ul>
      {items.map(({ id, label }) => (
        <li key={id}>
          <a href={`#${id}`} aria-current={current === id ? 'location' : undefined}>
            <span className="b1" />
            {label}
          </a>
        </li>
      ))}
    </ul>
  );
}

/** Under 1280px: a closed disclosure under the page head. */
export function TocDisclosure({ items }: { items: TocItem[] }) {
  return (
    <details className={classes.toc}>
      <summary>On this page</summary>
      <nav aria-label="On this page">
        <Links items={items} />
      </nav>
    </details>
  );
}

/** From 1280px: the right-hand column. */
export function TocColumn({ items }: { items: TocItem[] }) {
  return (
    <aside className={classes.tocDesk}>
      <nav className={classes.toc} aria-label="On this page">
        <h2>On this page</h2>
        <Links items={items} />
      </nav>
    </aside>
  );
}
