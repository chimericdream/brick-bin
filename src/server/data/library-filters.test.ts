import { describe, expect, it } from 'vitest';

import {
  filtersToQuery,
  hasActiveFilters,
  parseLibraryFilters,
  toggleFilter,
  type LibraryFilters,
} from './library-filters';

const empty = (over: Partial<LibraryFilters> = {}) => ({ ...parseLibraryFilters({}), ...over });

describe('parseLibraryFilters', () => {
  it('has sensible defaults', () => {
    const f = parseLibraryFilters({});
    expect(f).toMatchObject({ sort: 'name', page: 1, includeUnowned: false, brands: [], q: '' });
    expect(hasActiveFilters(f)).toBe(false);
  });

  it('drops malformed ids, unknown states and out-of-range numbers instead of throwing', () => {
    const f = parseLibraryFilters({
      brand: ['not-a-uuid', '3b1f7f0e-1111-4222-8333-444455556666'],
      state: ['built', 'exploded'],
      completeness: 'missing',
      pieces: ['lt250', 'huge'],
      from: 'abc',
      to: '99999',
      page: '-3',
      sort: 'drop table',
    });
    expect(f.brands).toEqual(['3b1f7f0e-1111-4222-8333-444455556666']);
    expect(f.states).toEqual(['built']);
    expect(f.completeness).toEqual(['missing']);
    expect(f.bands).toEqual(['lt250']);
    expect(f.yearMin).toBeNull();
    expect(f.yearMax).toBeNull();
    expect(f.page).toBe(1);
    expect(f.sort).toBe('name');
  });

  it('only lets members sort by value', () => {
    expect(parseLibraryFilters({ sort: 'value' }).sort).toBe('name');
    expect(parseLibraryFilters({ sort: 'value' }, { allowValueSort: true }).sort).toBe('value');
  });

  it('accepts "none" for place and owner', () => {
    const f = parseLibraryFilters({ place: 'none', owner: 'none' });
    expect(f.locations).toEqual(['none']);
    expect(f.owners).toEqual(['none']);
  });
});

describe('filtersToQuery and toggleFilter', () => {
  it('round-trips and leaves defaults out', () => {
    const f = empty({
      q: 'crane',
      states: ['built', 'sealed'],
      bands: ['1000'],
      sort: 'year',
      page: 3,
    });
    const q = filtersToQuery(f);
    expect(q).toBe('?q=crane&state=built&state=sealed&pieces=1000&sort=year&page=3');
    const back = parseLibraryFilters(Object.fromEntries(new URLSearchParams(q.slice(1))) as never);
    expect(back.q).toBe('crane');
    expect(filtersToQuery(empty())).toBe('');
  });

  it('toggling adds, removes and returns to page 1', () => {
    const on = toggleFilter(empty({ page: 4 }), 'states', 'built');
    expect(on.states).toEqual(['built']);
    expect(on.page).toBe(1);
    expect(toggleFilter(on, 'states', 'built').states).toEqual([]);
  });
});
