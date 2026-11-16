'use client';

import { useRef } from 'react';
import { IconSearch } from '@tabler/icons-react';

import classes from './Library.module.css';

/**
 * Search and sort as one plain GET form (it works without script). The sort menu submits on
 * change; every other active filter rides along as hidden fields.
 */
export function SearchSort({
  q,
  sort,
  hidden,
  allowValueSort,
}: {
  q: string;
  sort: string;
  hidden: [string, string][];
  allowValueSort: boolean;
}) {
  const form = useRef<HTMLFormElement>(null);
  return (
    <form action="/sets" method="get" ref={form} className={classes.toolbar} role="search">
      {hidden.map(([k, v], i) => (
        <input key={`${k}-${i}`} type="hidden" name={k} value={v} />
      ))}
      <div className={classes.search}>
        <IconSearch size={18} aria-hidden />
        <input
          type="search"
          name="q"
          defaultValue={q}
          placeholder="Search name, number, theme, brand"
          aria-label="Search sets"
        />
      </div>
      <label className={classes.sort}>
        Sort
        <select name="sort" defaultValue={sort} onChange={() => form.current?.requestSubmit()}>
          <option value="name">Name</option>
          <option value="number">Set number</option>
          <option value="year">Year, newest first</option>
          <option value="pieces">Pieces, most first</option>
          <option value="recent">Recently added</option>
          {allowValueSort && <option value="value">Estimated value</option>}
        </select>
      </label>
    </form>
  );
}
