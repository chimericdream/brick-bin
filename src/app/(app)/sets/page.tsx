import { IconPlus } from '@tabler/icons-react';
import Link from 'next/link';

import { LinkButton } from '@/components/Links';
import { requireContext } from '@/server/auth/current';
import { listBrands } from '@/server/data/brands';
import { listLibrary } from '@/server/data/library';
import {
  PAGE_SIZE,
  filtersToQuery,
  hasActiveFilters,
  parseLibraryFilters,
  type RawParams,
} from '@/server/data/library-filters';
import { listMembers } from '@/server/data/members';
import { listLocations } from '@/server/data/places';
import { listThemes } from '@/server/data/themes';

import { FacetPanel } from './FacetPanel';
import { FilterShell } from './FilterShell';
import classes from './Library.module.css';
import { SearchSort } from './SearchSort';
import { SetTile } from './SetTile';

export const dynamic = 'force-dynamic';

export default async function LibraryPage({ searchParams }: { searchParams: Promise<RawParams> }) {
  const { ctx } = await requireContext();
  const restricted = ctx.viewer.role === 'restricted';
  const filters = parseLibraryFilters(await searchParams, { allowValueSort: !restricted });

  const [result, brands, themes, locations, members] = await Promise.all([
    listLibrary(ctx, filters),
    listBrands(ctx),
    listThemes(ctx),
    listLocations(ctx),
    listMembers(ctx),
  ]);
  const { tiles, total, page, pages, facets } = result;

  // Only brands, themes and places this viewer can see anything in are offered, so a kid's panel
  // never names a brand or a theme that holds only hidden sets.
  const options = {
    brands: brands
      .filter((b) => !restricted || (facets.brands[b.id] ?? 0) > 0 || filters.brands.includes(b.id))
      .map((b) => ({ id: b.id, name: b.name })),
    themes: themes.map((t) => ({ id: t.id, name: t.name, parentId: t.parentId })),
    locations: locations.map((l) => ({ id: l.id, name: l.name, parentId: l.parentId })),
    owners: members.map((m) => ({ id: m.id, name: m.name })),
  };

  const active =
    filters.brands.length +
    filters.themes.length +
    filters.states.length +
    filters.completeness.length +
    filters.locations.length +
    filters.owners.length +
    filters.bands.length +
    filters.tags.length +
    (filters.yearMin !== null || filters.yearMax !== null ? 1 : 0);

  const hidden = [
    ...new URLSearchParams(filtersToQuery({ ...filters, q: '', sort: 'name', page: 1 }).slice(1)),
  ];
  const pageHref = (p: number) => `/sets${filtersToQuery({ ...filters, page: p })}`;
  const first = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const last = Math.min(page * PAGE_SIZE, total);

  return (
    <>
      <div className={classes.head}>
        <div>
          <h1>Library</h1>
          <p className={classes.sub}>
            {total} {total === 1 ? 'set' : 'sets'}
            {hasActiveFilters(filters) && ' match'}
            {facets.completeness.missing > 0 && !restricted && (
              <>
                {' · '}
                <Link
                  href={`/sets${filtersToQuery({ ...filters, completeness: ['missing'], page: 1 })}`}
                >
                  {facets.completeness.missing}{' '}
                  {facets.completeness.missing === 1 ? 'set has' : 'sets have'} missing pieces
                </Link>
              </>
            )}
          </p>
        </div>
        {!restricted && (
          <LinkButton href="/sets/new" leftSection={<IconPlus size={18} />}>
            Add set
          </LinkButton>
        )}
      </div>

      <div className={classes.layout}>
        <div>
          <FilterShell activeCount={active} total={total}>
            <FacetPanel filters={filters} facets={facets} options={options} />
          </FilterShell>
        </div>
        <section aria-label="Sets">
          <SearchSort
            q={filters.q}
            sort={filters.sort}
            hidden={hidden}
            allowValueSort={!restricted}
          />
          {tiles.length === 0 ? (
            <div className={classes.empty}>
              {hasActiveFilters(filters) ? (
                <>
                  <p>No sets match these filters.</p>
                  <Link href="/sets">Clear all filters</Link>
                </>
              ) : (
                <>
                  <p>No sets yet.</p>
                  {!restricted && <Link href="/sets/new">Add your first set</Link>}
                </>
              )}
            </div>
          ) : (
            <ul className={classes.grid}>
              {tiles.map((t) => (
                <SetTile key={t.id} tile={t} />
              ))}
            </ul>
          )}
          {pages > 1 && (
            <nav className={classes.pager} aria-label="Pages">
              {page > 1 ? <Link href={pageHref(page - 1)}>Previous</Link> : <span />}
              <span>
                Showing {first} to {last} of {total}
              </span>
              {page < pages ? <Link href={pageHref(page + 1)}>Next</Link> : <span />}
            </nav>
          )}
        </section>
      </div>
    </>
  );
}
