import { BUILD_STATES, type BuildState } from './completeness';

/** Piece-count bands offered in the library filter (docs/PLAN.md section 6.1). */
export const PIECE_BANDS = [
  { id: 'lt250', label: 'Under 250', min: 0, max: 249 },
  { id: '250', label: '250 to 999', min: 250, max: 999 },
  { id: '1000', label: '1,000 to 2,999', min: 1000, max: 2999 },
  { id: '3000', label: '3,000 or more', min: 3000, max: null },
] as const;
export type PieceBandId = (typeof PIECE_BANDS)[number]['id'];

export const COMPLETENESS_FILTERS = ['missing', 'complete', 'not_checked'] as const;
export type CompletenessFilter = (typeof COMPLETENESS_FILTERS)[number];

export const SORTS = ['name', 'number', 'year', 'pieces', 'recent', 'value'] as const;
export type Sort = (typeof SORTS)[number];

export const PAGE_SIZE = 24;

export interface LibraryFilters {
  q: string;
  brands: string[];
  themes: string[];
  states: BuildState[];
  completeness: CompletenessFilter[];
  /** Place ids; `locationNone` means "no place set". */
  locations: string[];
  owners: string[];
  yearMin: number | null;
  yearMax: number | null;
  bands: PieceBandId[];
  tags: string[];
  /** Only sets that have at least one instruction (a PDF or a link). */
  hasInstructions: boolean;
  /** Also list sets with no live copies (default: owned sets only). */
  includeUnowned: boolean;
  sort: Sort;
  page: number;
}

export type RawParams = Record<string, string | string[] | undefined>;

const list = (v: string | string[] | undefined): string[] =>
  (Array.isArray(v) ? v : v ? [v] : []).map((s) => s.trim()).filter(Boolean);

const num = (v: string | string[] | undefined): number | null => {
  const n = Number(Array.isArray(v) ? v[0] : v);
  return Number.isInteger(n) && n >= 0 && n < 10_000 ? n : null;
};

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const ids = (v: string | string[] | undefined) => list(v).filter((s) => UUID.test(s));

/** Everything in the library URL, validated. Unknown or malformed values are dropped, never thrown. */
export function parseLibraryFilters(
  raw: RawParams,
  opts: { allowValueSort?: boolean } = {},
): LibraryFilters {
  const sort = list(raw.sort)[0] as Sort | undefined;
  const sortOk = sort && (SORTS as readonly string[]).includes(sort);
  return {
    q: (list(raw.q)[0] ?? '').slice(0, 100),
    brands: ids(raw.brand),
    themes: ids(raw.theme),
    states: list(raw.state).filter((s): s is BuildState =>
      (BUILD_STATES as readonly string[]).includes(s),
    ),
    completeness: list(raw.completeness).filter((s): s is CompletenessFilter =>
      (COMPLETENESS_FILTERS as readonly string[]).includes(s),
    ),
    locations: list(raw.place).filter((s) => s === 'none' || UUID.test(s)),
    owners: list(raw.owner).filter((s) => s === 'none' || UUID.test(s)),
    yearMin: num(raw.from),
    yearMax: num(raw.to),
    bands: list(raw.pieces).filter((s): s is PieceBandId => PIECE_BANDS.some((b) => b.id === s)),
    tags: list(raw.tag).slice(0, 20),
    hasInstructions: list(raw.ins)[0] === '1',
    includeUnowned: list(raw.unowned)[0] === '1',
    // Value sort is for members and admins only; a restricted viewer falls back to the default.
    sort: sortOk && (sort !== 'value' || opts.allowValueSort) ? sort : 'name',
    page: Math.max(1, num(raw.page) ?? 1),
  };
}

type Key = keyof LibraryFilters;
const DEFAULTS: Partial<Record<Key, unknown>> = {
  sort: 'name',
  page: 1,
  includeUnowned: false,
  hasInstructions: false,
};

const PARAM: Partial<Record<Key, string>> = {
  q: 'q',
  brands: 'brand',
  themes: 'theme',
  states: 'state',
  completeness: 'completeness',
  locations: 'place',
  owners: 'owner',
  yearMin: 'from',
  yearMax: 'to',
  bands: 'pieces',
  tags: 'tag',
  hasInstructions: 'ins',
  includeUnowned: 'unowned',
  sort: 'sort',
  page: 'page',
};

/** The query string for a set of filters (default values are left out, so URLs stay short). */
export function filtersToQuery(f: LibraryFilters): string {
  const p = new URLSearchParams();
  for (const key of Object.keys(PARAM) as Key[]) {
    const v = f[key];
    const name = PARAM[key]!;
    if (v === null || v === '' || v === DEFAULTS[key]) continue;
    if (Array.isArray(v)) {
      for (const item of v) p.append(name, String(item));
    } else if (typeof v === 'boolean') {
      p.set(name, '1');
    } else {
      p.set(name, String(v));
    }
  }
  const s = p.toString();
  return s ? `?${s}` : '';
}

/** The filters with one value toggled in a list facet. Resets to page 1. */
export function toggleFilter<
  K extends
    | 'brands'
    | 'themes'
    | 'states'
    | 'completeness'
    | 'locations'
    | 'owners'
    | 'bands'
    | 'tags',
>(f: LibraryFilters, key: K, value: LibraryFilters[K][number]): LibraryFilters {
  const current = f[key] as unknown[];
  const next = current.includes(value) ? current.filter((v) => v !== value) : [...current, value];
  return { ...f, [key]: next, page: 1 };
}

export const hasActiveFilters = (f: LibraryFilters) =>
  Boolean(
    f.q ||
    f.brands.length ||
    f.themes.length ||
    f.states.length ||
    f.completeness.length ||
    f.locations.length ||
    f.owners.length ||
    f.yearMin !== null ||
    f.yearMax !== null ||
    f.bands.length ||
    f.tags.length,
  );
