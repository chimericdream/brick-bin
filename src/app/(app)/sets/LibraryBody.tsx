'use client';

import { useRef, useState } from 'react';
import { Button, Modal } from '@mantine/core';
import { IconAdjustmentsHorizontal, IconSearch } from '@tabler/icons-react';
import Link from 'next/link';

import { DialogFoot } from '@/components/DialogFoot';

import classes from './Library.module.css';

interface Props {
  q: string;
  sort: string;
  /** Every other active filter, carried by the search form as hidden fields. */
  hidden: [string, string][];
  allowValueSort: boolean;
  activeCount: number;
  total: number;
  /** The library with every filter cleared but the search and sort kept. */
  clearHref: string;
  /** The facet panel, rendered on the server. */
  panel: React.ReactNode;
  children: React.ReactNode;
}

/**
 * The toolbar (search, Filters, sort) and the body. From 1024 the facet panel is a column beside
 * the sets; below that the same panel opens in a sheet from the Filters button.
 */
export function LibraryBody({
  q,
  sort,
  hidden,
  allowValueSort,
  activeCount,
  total,
  clearHref,
  panel,
  children,
}: Props) {
  const form = useRef<HTMLFormElement>(null);
  const [open, setOpen] = useState(false);
  const sets = `${total} ${total === 1 ? 'set' : 'sets'}`;

  return (
    <>
      <form action="/sets" method="get" ref={form} className={classes.toolbar} role="search">
        {hidden.map(([k, v], i) => (
          <input key={`${k}-${i}`} type="hidden" name={k} value={v} />
        ))}
        <div className={classes.search}>
          <IconSearch size={20} stroke={1.75} aria-hidden />
          <input
            type="search"
            name="q"
            defaultValue={q}
            placeholder="Search name, number, theme, brand"
            aria-label="Search sets"
          />
        </div>
        <Button
          variant="default"
          className={classes.filterButton}
          leftSection={<IconAdjustmentsHorizontal size={20} stroke={1.75} />}
          onClick={() => setOpen(true)}
          aria-expanded={open}
          aria-haspopup="dialog"
        >
          Filters
          {activeCount > 0 && (
            <span className={classes.activeCount}>
              {activeCount}
              <span className="app-vh"> active</span>
            </span>
          )}
        </Button>
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

      <div className={classes.lib}>
        <aside className={classes.facets} aria-label="Filters">
          {panel}
        </aside>
        <div className={classes.results}>{children}</div>
      </div>

      <Modal opened={open} onClose={() => setOpen(false)} title="Filters" size={600}>
        <aside aria-label="Filters">{panel}</aside>
        <DialogFoot>
          {activeCount > 0 && (
            <Button component={Link} href={clearHref} variant="default" scroll={false}>
              Clear filters
            </Button>
          )}
          <Button onClick={() => setOpen(false)}>Show {sets}</Button>
        </DialogFoot>
      </Modal>
    </>
  );
}
