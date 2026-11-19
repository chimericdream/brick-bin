import { IconCheck, IconChevronDown } from '@tabler/icons-react';
import Link from 'next/link';

import type { Facets } from '@/server/data/library';
import {
  PIECE_BANDS,
  filtersToQuery,
  toggleFilter,
  type LibraryFilters,
} from '@/server/data/library-filters';

import classes from './Facets.module.css';

export interface TreeNode {
  id: string;
  name: string;
  parentId: string | null;
}

export interface FacetOptions {
  brands: { id: string; name: string }[];
  themes: TreeNode[];
  locations: TreeNode[];
  owners: { id: string; name: string }[];
}

type ListKey =
  | 'brands'
  | 'themes'
  | 'states'
  | 'completeness'
  | 'locations'
  | 'owners'
  | 'bands'
  | 'tags';

interface RowProps {
  filters: LibraryFilters;
  facetKey: ListKey;
  value: string;
  label: string;
  count: number;
  depth?: number;
}

/**
 * One facet value. It is a link, so the library works without script and every filter state has
 * its own URL. The checkbox is drawn, and "selected" is also said in words for screen readers.
 */
function Row({ filters, facetKey, value, label, count, depth = 0 }: RowProps) {
  const selected = (filters[facetKey] as string[]).includes(value);
  const href = `/sets${filtersToQuery(toggleFilter(filters, facetKey, value as never))}`;
  return (
    <li style={{ paddingLeft: depth * 16 }}>
      <Link
        href={href}
        className={classes.row}
        data-selected={selected || undefined}
        data-empty={count === 0 && !selected ? true : undefined}
        scroll={false}
      >
        <span className={classes.box} aria-hidden>
          {selected && <IconCheck size={15} stroke={3} />}
        </span>
        <span className={classes.label}>
          {label}
          {selected && <span className={classes.sr}> (selected)</span>}
        </span>
        <span className={classes.count} data-zero={count === 0 || undefined}>
          {count}
        </span>
      </Link>
    </li>
  );
}

function Group({
  title,
  active,
  defaultOpen,
  children,
}: {
  title: string;
  active: boolean;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  return (
    <details className={classes.group} open={defaultOpen || active || undefined}>
      <summary>
        {title}
        {active && <span className="app-vh">, has selections</span>}
        <IconChevronDown size={16} stroke={1.75} aria-hidden className={classes.chev} />
      </summary>
      <div className={classes.body}>{children}</div>
    </details>
  );
}

/** Flattens a parent tree into depth-first order, dropping branches with no sets and nothing selected. */
function walk(
  nodes: TreeNode[],
  counts: Record<string, number>,
  selected: string[],
): { node: TreeNode; depth: number }[] {
  const children = new Map<string | null, TreeNode[]>();
  const ids = new Set(nodes.map((n) => n.id));
  for (const n of nodes) {
    const key = n.parentId && ids.has(n.parentId) ? n.parentId : null;
    children.set(key, [...(children.get(key) ?? []), n]);
  }
  const out: { node: TreeNode; depth: number }[] = [];
  const visit = (parent: string | null, depth: number) => {
    for (const n of (children.get(parent) ?? []).toSorted((a, b) => a.name.localeCompare(b.name))) {
      if ((counts[n.id] ?? 0) > 0 || selected.includes(n.id)) {
        out.push({ node: n, depth });
        visit(n.id, depth + 1);
      }
    }
  };
  visit(null, 0);
  return out;
}

export function FacetPanel({
  filters,
  facets,
  options,
  showOwnerNone = true,
}: {
  filters: LibraryFilters;
  facets: Facets;
  options: FacetOptions;
  showOwnerNone?: boolean;
}) {
  const themeRows = walk(options.themes, facets.themes, filters.themes);
  const placeRows = walk(options.locations, facets.locations, filters.locations);
  const tagNames = Object.keys(facets.tags).toSorted((a, b) => a.localeCompare(b));
  // The year form is a plain GET, so it carries every other active filter as hidden fields.
  const yearHidden = [
    ...new URLSearchParams(
      filtersToQuery({ ...filters, yearMin: null, yearMax: null, page: 1 }).slice(1),
    ),
  ];
  const unownedHref = `/sets${filtersToQuery({ ...filters, includeUnowned: !filters.includeUnowned, page: 1 })}`;

  return (
    <div className={classes.panel}>
      <Link
        href={unownedHref}
        className={classes.toggle}
        scroll={false}
        role="switch"
        aria-checked={filters.includeUnowned}
      >
        <span
          className={classes.switch}
          data-on={filters.includeUnowned || undefined}
          aria-hidden
        />
        Include sets with no copies
      </Link>
      <p className={classes.note}>
        {filters.includeUnowned
          ? `Showing owned and unowned sets (${facets.unowned} unowned).`
          : 'Showing sets we own.'}
      </p>

      <Group title="Brand" active={filters.brands.length > 0} defaultOpen>
        <ul>
          {options.brands.map((b) => (
            <Row
              key={b.id}
              filters={filters}
              facetKey="brands"
              value={b.id}
              label={b.name}
              count={facets.brands[b.id] ?? 0}
            />
          ))}
        </ul>
      </Group>

      {themeRows.length > 0 && (
        <Group title="Theme" active={filters.themes.length > 0} defaultOpen>
          <ul>
            {themeRows.map(({ node, depth }) => (
              <Row
                key={node.id}
                filters={filters}
                facetKey="themes"
                value={node.id}
                label={node.name}
                count={facets.themes[node.id] ?? 0}
                depth={depth}
              />
            ))}
          </ul>
        </Group>
      )}

      <Group title="Completeness" active={filters.completeness.length > 0} defaultOpen>
        <ul>
          <Row
            filters={filters}
            facetKey="completeness"
            value="missing"
            label="Missing pieces"
            count={facets.completeness.missing}
          />
          <Row
            filters={filters}
            facetKey="completeness"
            value="complete"
            label="Complete"
            count={facets.completeness.complete}
          />
          <Row
            filters={filters}
            facetKey="completeness"
            value="not_checked"
            label="Not checked"
            count={facets.completeness.not_checked}
          />
        </ul>
      </Group>

      <Group title="Place" active={filters.locations.length > 0}>
        <ul>
          {placeRows.map(({ node, depth }) => (
            <Row
              key={node.id}
              filters={filters}
              facetKey="locations"
              value={node.id}
              label={node.name}
              count={facets.locations[node.id] ?? 0}
              depth={depth}
            />
          ))}
          <Row
            filters={filters}
            facetKey="locations"
            value="none"
            label="No place set"
            count={facets.locations.none ?? 0}
          />
        </ul>
      </Group>

      <Group title="Owner" active={filters.owners.length > 0}>
        <ul>
          {showOwnerNone && (
            <Row
              filters={filters}
              facetKey="owners"
              value="none"
              label="Ours"
              count={facets.owners.none ?? 0}
            />
          )}
          {options.owners.map((o) => (
            <Row
              key={o.id}
              filters={filters}
              facetKey="owners"
              value={o.id}
              label={o.name}
              count={facets.owners[o.id] ?? 0}
            />
          ))}
        </ul>
      </Group>

      <Group title="Year" active={filters.yearMin !== null || filters.yearMax !== null}>
        <form action="/sets" className={classes.years}>
          {yearHidden.map(([k, v], i) => (
            <input key={`${k}-${i}`} type="hidden" name={k} value={v} />
          ))}
          <label>
            From
            <input
              name="from"
              type="number"
              inputMode="numeric"
              min={1900}
              max={2200}
              defaultValue={filters.yearMin ?? ''}
            />
          </label>
          <label>
            To
            <input
              name="to"
              type="number"
              inputMode="numeric"
              min={1900}
              max={2200}
              defaultValue={filters.yearMax ?? ''}
            />
          </label>
          <button type="submit" className={classes.apply}>
            Apply
          </button>
        </form>
      </Group>

      <Group title="Pieces" active={filters.bands.length > 0}>
        <ul>
          {PIECE_BANDS.map((b) => (
            <Row
              key={b.id}
              filters={filters}
              facetKey="bands"
              value={b.id}
              label={b.label}
              count={facets.bands[b.id] ?? 0}
            />
          ))}
        </ul>
      </Group>

      <Group title="Instructions" active={filters.hasInstructions} defaultOpen>
        <ul>
          <li>
            <Link
              href={`/sets${filtersToQuery({ ...filters, hasInstructions: !filters.hasInstructions, page: 1 })}`}
              className={classes.row}
              data-selected={filters.hasInstructions || undefined}
              data-empty={facets.instructions === 0 && !filters.hasInstructions ? true : undefined}
              scroll={false}
            >
              <span className={classes.box} aria-hidden>
                {filters.hasInstructions && <IconCheck size={15} stroke={3} />}
              </span>
              <span className={classes.label}>
                Has instructions
                {filters.hasInstructions && <span className={classes.sr}> (selected)</span>}
              </span>
              <span className={classes.count} data-zero={facets.instructions === 0 || undefined}>
                {facets.instructions}
              </span>
            </Link>
          </li>
        </ul>
      </Group>

      {(tagNames.length > 0 || filters.tags.length > 0) && (
        <Group title="Tags" active={filters.tags.length > 0}>
          <ul>
            {[...new Set([...tagNames, ...filters.tags])].map((t) => (
              <Row
                key={t}
                filters={filters}
                facetKey="tags"
                value={t}
                label={t}
                count={facets.tags[t] ?? 0}
              />
            ))}
          </ul>
        </Group>
      )}
    </div>
  );
}
