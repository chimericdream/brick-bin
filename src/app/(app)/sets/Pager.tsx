import { IconChevronLeft, IconChevronRight } from '@tabler/icons-react';
import Link from 'next/link';

import classes from './Library.module.css';

/** The pages to offer: the first, the last, and the current one with its neighbours. */
function pageList(page: number, pages: number): (number | 'gap')[] {
  const keep = new Set([1, pages, page - 1, page, page + 1]);
  const out: (number | 'gap')[] = [];
  for (let p = 1; p <= pages; p++) {
    if (!keep.has(p)) continue;
    if (out.length > 0 && p - (out.at(-1) as number) > 1) out.push('gap');
    out.push(p);
  }
  return out;
}

/** Under a long list: the range on the left, page links on the right. */
export function Pager({
  page,
  pages,
  first,
  last,
  total,
  noun,
  href,
}: {
  page: number;
  pages: number;
  first: number;
  last: number;
  total: number;
  noun: string;
  href: (page: number) => string;
}) {
  return (
    <nav className={classes.pager} aria-label="Pages">
      <p className={classes.range}>
        {first.toLocaleString('en-US')} to {last.toLocaleString('en-US')} of{' '}
        {total.toLocaleString('en-US')} {noun}
      </p>
      <div className={classes.pages}>
        {page > 1 ? (
          <Link href={href(page - 1)} aria-label="Previous page">
            <IconChevronLeft size={20} stroke={1.75} aria-hidden />
          </Link>
        ) : (
          <span aria-hidden className={classes.dim}>
            <IconChevronLeft size={20} stroke={1.75} />
          </span>
        )}
        {pageList(page, pages).map((p, i) =>
          p === 'gap' ? (
            <span key={`gap-${i}`} aria-hidden className={classes.dim}>
              …
            </span>
          ) : p === page ? (
            <span key={p} aria-current="page">
              <span className="app-vh">Page </span>
              {p}
            </span>
          ) : (
            <Link key={p} href={href(p)} aria-label={`Page ${p}`}>
              {p}
            </Link>
          ),
        )}
        {page < pages ? (
          <Link href={href(page + 1)} aria-label="Next page">
            <IconChevronRight size={20} stroke={1.75} aria-hidden />
          </Link>
        ) : (
          <span aria-hidden className={classes.dim}>
            <IconChevronRight size={20} stroke={1.75} />
          </span>
        )}
      </div>
    </nav>
  );
}
