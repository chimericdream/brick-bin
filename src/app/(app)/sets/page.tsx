import { IconListCheck, IconPlus } from '@tabler/icons-react';
import Link from 'next/link';

import { LinkButton } from '@/components/Links';
import { PageHead } from '@/components/layout/PageHead';
import { BUILD_STATE_INFO } from '@/components/sets/Badges';
import { requireContext } from '@/server/auth/current';
import { listBrands } from '@/server/data/brands';
import { BUILD_STATES } from '@/server/data/completeness';
import { listLibrary } from '@/server/data/library';
import {
  PAGE_SIZE,
  PIECE_BANDS,
  filtersToQuery,
  hasActiveFilters,
  parseLibraryFilters,
  toggleFilter,
  type LibraryFilters,
  type RawParams,
} from '@/server/data/library-filters';
import { listMembers } from '@/server/data/members';
import { listLocations } from '@/server/data/places';
import { listThemes } from '@/server/data/themes';

import { FacetPanel } from './FacetPanel';
import classes from './Library.module.css';
import { LibraryBody } from './LibraryBody';
import { Pager } from './Pager';
import { SetRow } from './SetRow';
import { Sorter } from './Sorter';

export const dynamic = 'force-dynamic';

interface TreeOption {
  id: string;
  name: string;
  parentId: string | null;
}

/**
 * For a kid profile, keeps only the nodes that hold a visible set, and their parents. Names of
 * anything else (including ones passed in the URL by id) are never sent to the page.
 */
function visibleTree(nodes: TreeOption[], counts: Record<string, number>, restricted: boolean) {
  if (!restricted) return nodes;
  const byId = new Map(nodes.map((n) => [n.id, n]));
  const keep = new Set<string>();
  for (const n of nodes) {
    if ((counts[n.id] ?? 0) <= 0) continue;
    let at: TreeOption | undefined = n;
    while (at && !keep.has(at.id)) {
      keep.add(at.id);
      at = at.parentId ? byId.get(at.parentId) : undefined;
    }
  }
  return nodes.filter((n) => keep.has(n.id));
}

/** Every filter off, keeping the search, the sort and the no-copies switch. */
const withoutFilters = (f: LibraryFilters): LibraryFilters => ({
  ...f,
  brands: [],
  themes: [],
  states: [],
  completeness: [],
  locations: [],
  owners: [],
  yearMin: null,
  yearMax: null,
  bands: [],
  tags: [],
  hasInstructions: false,
  page: 1,
});

const COMPLETENESS_LABEL = {
  missing: 'Missing pieces',
  complete: 'Complete',
  not_checked: 'Not checked',
} as const;

const nameOf = (list: { id: string; name: string }[], id: string) =>
  list.find((x) => x.id === id)?.name;

const plural = (n: number, one: string, many: string) =>
  `${n.toLocaleString('en-US')} ${n === 1 ? one : many}`;

export default async function LibraryPage({ searchParams }: { searchParams: Promise<RawParams> }) {
  const { ctx } = await requireContext();
  const restricted = ctx.viewer.role === 'restricted';
  const filters = parseLibraryFilters(await searchParams, { allowValueSort: !restricted });
  const cleared = withoutFilters(filters);
  const filtered = JSON.stringify(cleared) !== JSON.stringify({ ...filters, page: 1 });

  const [result, brands, themes, locations, members, unfiltered] = await Promise.all([
    listLibrary(ctx, filters),
    listBrands(ctx),
    listThemes(ctx),
    listLocations(ctx),
    listMembers(ctx),
    // The "of 14 sets" in the head line: the same visibility-filtered list with no filters.
    filtered || filters.q ? listLibrary(ctx, { ...cleared, q: '' }) : null,
  ]);
  const { tiles, total, page, pages, facets } = result;

  // Only brands, themes and places this viewer can see anything in are offered, so a kid's panel
  // never names a brand or a theme that holds only hidden sets.
  const options = {
    brands: brands
      .filter((b) => !restricted || (facets.brands[b.id] ?? 0) > 0)
      .map((b) => ({ id: b.id, name: b.name })),
    themes: visibleTree(
      themes.map((t) => ({ id: t.id, name: t.name, parentId: t.parentId })),
      facets.themes,
      restricted,
    ),
    locations: visibleTree(
      locations.map((l) => ({ id: l.id, name: l.name, parentId: l.parentId })),
      facets.locations,
      restricted,
    ),
    owners: members.map((m) => ({ id: m.id, name: m.name })),
  };

  // Filters in the panel (the sheet's button counts these); build states are on the sorter.
  const panelActive =
    filters.brands.length +
    filters.themes.length +
    filters.completeness.length +
    filters.locations.length +
    filters.owners.length +
    filters.bands.length +
    filters.tags.length +
    (filters.hasInstructions ? 1 : 0) +
    (filters.yearMin !== null || filters.yearMax !== null ? 1 : 0);

  // The names of what is switched on, for the head line ("4 of 14 sets · LEGO, Sealed").
  const on = [
    ...filters.brands.map((id) => nameOf(options.brands, id)),
    ...filters.themes.map((id) => nameOf(options.themes, id)),
    ...filters.states.map((s) => BUILD_STATE_INFO[s].label),
    ...filters.completeness.map((c) => COMPLETENESS_LABEL[c]),
    ...filters.locations.map((id) =>
      id === 'none' ? 'No place set' : nameOf(options.locations, id),
    ),
    ...filters.owners.map((id) => (id === 'none' ? 'Ours' : nameOf(options.owners, id))),
    ...filters.bands.map((b) => PIECE_BANDS.find((x) => x.id === b)?.label),
    ...filters.tags,
    filters.hasInstructions ? 'Has instructions' : undefined,
    filters.yearMin !== null || filters.yearMax !== null
      ? [filters.yearMin, filters.yearMax].map((y) => y ?? '…').join(' to ')
      : undefined,
  ].filter((x): x is string => Boolean(x));

  const ofAll = unfiltered ? unfiltered.total : total;
  const sub =
    !filtered && !filters.q ? (
      <>
        {total === 0 ? <span>No sets yet</span> : <span>{plural(total, 'set', 'sets')}</span>}
        {facets.completeness.missing > 0 && !restricted && (
          <>
            {' · '}
            <Link
              href={`/sets${filtersToQuery({ ...filters, completeness: ['missing'], page: 1 })}`}
            >
              {plural(facets.completeness.missing, 'set has', 'sets have')} missing pieces
            </Link>
          </>
        )}
      </>
    ) : (
      <>
        <span>
          {filtered
            ? `${total.toLocaleString('en-US')} of ${plural(ofAll, 'set', 'sets')}`
            : plural(total, 'set', 'sets')}
          {filters.q && (
            <>
              {' '}
              {total === 1 && !filtered ? 'matches' : 'match'} “{filters.q}”
            </>
          )}
        </span>
        {on.length > 0 && ` · ${on.join(', ')}`}
      </>
    );

  const hidden = [
    ...new URLSearchParams(filtersToQuery({ ...filters, q: '', sort: 'name', page: 1 }).slice(1)),
  ];
  const pageHref = (p: number) => `/sets${filtersToQuery({ ...filters, page: p })}`;
  const first = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const last = Math.min(page * PAGE_SIZE, total);
  const shoppingHref = `/missing?lib=${encodeURIComponent(filtersToQuery({ ...filters, page: 1, sort: 'name' }).slice(1))}`;
  const otherFilters = filtered || filters.hasInstructions;

  return (
    <>
      <PageHead
        title="Library"
        sub={sub}
        actionsFromTablet
        actions={
          !restricted && (
            <>
              <LinkButton
                href={shoppingHref}
                variant="default"
                leftSection={<IconListCheck size={20} stroke={1.75} />}
              >
                Shopping list for these…
              </LinkButton>
              <LinkButton href="/sets/new" leftSection={<IconPlus size={20} stroke={2} />}>
                Add set
              </LinkButton>
            </>
          )
        }
      />

      <Sorter
        bricks={BUILD_STATES.map((state) => ({
          state,
          count: facets.states[state] ?? 0,
          pressed: filters.states.includes(state),
          href: `/sets${filtersToQuery(toggleFilter(filters, 'states', state))}`,
        }))}
      />

      <LibraryBody
        q={filters.q}
        sort={filters.sort}
        hidden={hidden}
        allowValueSort={!restricted}
        activeCount={panelActive}
        total={total}
        clearHref={`/sets${filtersToQuery({ ...withoutFilters(filters), states: filters.states })}`}
        panel={<FacetPanel filters={filters} facets={facets} options={options} />}
      >
        {tiles.length === 0 ? (
          hasActiveFilters(filters) || filters.hasInstructions ? (
            <div className={`${classes.empty} app-baseplate`}>
              <div className={classes.emptyCard}>
                <h2>Nothing in the bin matches that.</h2>
                <p>
                  Check the spelling, try the set number, or clear the search. Sets with no copies
                  are left out unless you include them.
                </p>
                <div className={classes.emptyActions}>
                  {filters.q && (
                    <LinkButton
                      href={`/sets${filtersToQuery({ ...filters, q: '', page: 1 })}`}
                      variant="default"
                    >
                      Clear the search
                    </LinkButton>
                  )}
                  {otherFilters && (
                    <LinkButton href="/sets" variant="default">
                      Clear all filters
                    </LinkButton>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className={`${classes.empty} app-baseplate`}>
              <div className={classes.emptyCard}>
                <h2>The bin is empty.</h2>
                {!restricted && (
                  <>
                    <p>
                      Add the first set and it shows up here, with a row for every box you own. Got
                      a spreadsheet already? Import it instead.
                    </p>
                    <div className={classes.emptyActions}>
                      <LinkButton href="/sets/new" leftSection={<IconPlus size={20} stroke={2} />}>
                        Add set
                      </LinkButton>
                      <LinkButton href="/import" variant="default">
                        Import a CSV file
                      </LinkButton>
                    </div>
                  </>
                )}
              </div>
            </div>
          )
        ) : (
          <>
            <h2 className="app-vh">Sets</h2>
            <ul className={classes.sets}>
              {tiles.map((t) => (
                <SetRow key={t.id} tile={t} />
              ))}
            </ul>
          </>
        )}
        {pages > 1 && (
          <Pager
            page={page}
            pages={pages}
            first={first}
            last={last}
            total={total}
            noun="sets"
            href={pageHref}
          />
        )}
        {!restricted && tiles.length > 0 && (
          <p className={classes.phoneOnly}>
            <LinkButton
              href={shoppingHref}
              variant="default"
              fullWidth
              leftSection={<IconListCheck size={20} stroke={1.75} />}
            >
              Shopping list for these…
            </LinkButton>
          </p>
        )}
      </LibraryBody>
      <p className={classes.credit}>
        Catalog data from <a href="https://rebrickable.com/">Rebrickable</a>
      </p>
    </>
  );
}
