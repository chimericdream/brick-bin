import { boxNumber, matchCatalogSets, type CatalogSet } from '../catalog/reference';
import { parseCsv } from '../catalog/csv-stream';
import { listBrands } from '../data/brands';
import type { DataContext } from '../data/context';
import { findSetByNumber } from '../data/sets';
import { parseMoney } from '../../lib/money';

/**
 * CSV import (docs/PLAN.md 6.7). Everything here is pure planning: it reads the file, decides what
 * each row would do and why a row cannot be imported, and writes nothing. `commit.ts` does the
 * writing from the same plan, so the preview and the import can never disagree.
 */

export const MAX_IMPORT_BYTES = 2 * 1024 * 1024;
export const MAX_IMPORT_ROWS = 2000;
export const MAX_COPIES_PER_ROW = 50;

export type ImportFormat = 'rebrickable' | 'brickset' | 'generic';

export const FIELDS = [
  { key: 'setNumber', label: 'Set number', required: true },
  { key: 'name', label: 'Name' },
  { key: 'brand', label: 'Brand' },
  { key: 'theme', label: 'Theme' },
  { key: 'year', label: 'Year' },
  { key: 'pieces', label: 'Pieces' },
  { key: 'quantity', label: 'Copies owned' },
  { key: 'pricePaid', label: 'Price paid' },
  { key: 'notes', label: 'Notes' },
  { key: 'wanted', label: 'Wanted (goes to your wishlist)' },
] as const;
export type FieldKey = (typeof FIELDS)[number]['key'];
/** Column index per field, or null when the field is not mapped. */
export type Mapping = Record<FieldKey, number | null>;

export interface ParsedCsv {
  headers: string[];
  rows: string[][];
  tooMany: boolean;
}

export async function parseCsvText(text: string): Promise<ParsedCsv> {
  const out: string[][] = [];
  let headers: string[] | null = null;
  let tooMany = false;
  for await (const row of parseCsv(
    (async function* () {
      yield text;
    })(),
  )) {
    if (!headers) {
      headers = row.map((h) => h.trim());
      continue;
    }
    if (out.length >= MAX_IMPORT_ROWS) {
      tooMany = true;
      break;
    }
    out.push(row);
  }
  return { headers: headers ?? [], rows: out, tooMany };
}

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');

const emptyMapping = (): Mapping => ({
  setNumber: null,
  name: null,
  brand: null,
  theme: null,
  year: null,
  pieces: null,
  quantity: null,
  pricePaid: null,
  notes: null,
  wanted: null,
});

/** Header names that mean each field, after dropping case, spaces and punctuation. */
const GUESSES: Record<FieldKey, string[]> = {
  setNumber: ['setnumber', 'setnum', 'number', 'set', 'setno', 'setid'],
  name: ['name', 'setname', 'title', 'description'],
  brand: ['brand', 'manufacturer', 'maker', 'make'],
  theme: ['theme', 'series', 'line', 'category'],
  year: ['year', 'releaseyear', 'yearreleased'],
  pieces: ['pieces', 'piececount', 'parts', 'numparts', 'partcount'],
  quantity: ['quantity', 'qty', 'qtyowned', 'owncount', 'owned', 'copies', 'count'],
  pricePaid: ['pricepaid', 'paid', 'price', 'cost', 'purchaseprice'],
  notes: ['notes', 'note', 'comments', 'comment'],
  wanted: ['wanted', 'wishlist', 'want'],
};

export function guessMapping(headers: string[]): Mapping {
  const m = emptyMapping();
  const taken = new Set<number>();
  for (const f of FIELDS) {
    const i = headers.findIndex((h, idx) => !taken.has(idx) && GUESSES[f.key].includes(norm(h)));
    if (i >= 0) {
      m[f.key] = i;
      taken.add(i);
    }
  }
  return m;
}

/** Recognises the two supported export formats from their header rows. */
export function detectFormat(headers: string[]): { format: ImportFormat; mapping: Mapping } {
  const h = headers.map(norm);
  const at = (...names: string[]) => {
    const i = h.findIndex((x) => names.includes(x));
    return i >= 0 ? i : null;
  };
  // Rebrickable "set list" export: Set Number, Quantity, Includes Spares, Inventory Ver.
  if (h.includes('setnumber') && h.includes('quantity') && h.includes('includesspares')) {
    return {
      format: 'rebrickable',
      mapping: { ...emptyMapping(), setNumber: at('setnumber'), quantity: at('quantity') },
    };
  }
  // Brickset collection export: Number, SetName, Year, Theme, Pieces, ..., QtyOwned or Owned, Wanted.
  if (
    h.includes('number') &&
    h.includes('setname') &&
    (h.includes('qtyowned') || h.includes('owned') || h.includes('wanted'))
  ) {
    return {
      format: 'brickset',
      mapping: {
        ...emptyMapping(),
        setNumber: at('number'),
        name: at('setname'),
        year: at('year'),
        theme: at('theme'),
        pieces: at('pieces'),
        quantity: at('qtyowned', 'owned'),
        wanted: at('wanted'),
        notes: at('notes', 'comments'),
        pricePaid: at('ownedprice', 'pricepaid'),
      },
    };
  }
  return { format: 'generic', mapping: guessMapping(headers) };
}

const truthy = (v: string) => ['1', 'true', 'yes', 'y', 'x'].includes(v.trim().toLowerCase());

export interface PlannedRow {
  /** Line number in the file (the header is line 1). */
  line: number;
  raw: string[];
  /** Why the row cannot be imported. Rows with a reason are not written. */
  failure: string | null;
  action: 'create-set' | 'add-copies' | 'wishlist' | null;
  setNumber: string;
  name: string;
  /** The brand to use: its id when it exists, else the name to create. */
  brandId: string | null;
  brandName: string | null;
  isLego: boolean;
  themeName: string | null;
  rbSetNum: string | null;
  rbThemeId: number | null;
  year: number | null;
  pieces: number | null;
  copies: number;
  pricePaidCents: number | null;
  notes: string | null;
}

export interface ImportPlan {
  rows: PlannedRow[];
  summary: {
    rows: number;
    newSets: number;
    existingSets: number;
    copies: number;
    wishlist: number;
    failed: number;
    newBrands: string[];
  };
  tooMany: boolean;
}

const intOrNull = (v: string | undefined) => {
  const n = Number((v ?? '').replaceAll(',', '').trim());
  return v && v.trim() !== '' && Number.isInteger(n) && n >= 0 ? n : null;
};

export async function planImport(
  ctx: DataContext,
  parsed: ParsedCsv,
  format: ImportFormat,
  mapping: Mapping,
): Promise<ImportPlan> {
  const brands = await listBrands(ctx);
  const lego = brands.find((b) => b.isLego) ?? null;
  const brandByName = new Map(brands.map((b) => [b.name.toLowerCase(), b]));
  const cell = (row: string[], key: FieldKey) => {
    const i = mapping[key];
    return i === null ? '' : (row[i] ?? '').trim();
  };

  const numbers = parsed.rows.map((r) => cell(r, 'setNumber')).filter(Boolean);
  const catalog = new Map<string, CatalogSet>();
  for (const s of await matchCatalogSets(ctx.db, [...new Set(numbers)])) {
    catalog.set(s.setNum, s);
    if (!catalog.has(boxNumber(s.setNum))) catalog.set(boxNumber(s.setNum), s);
  }

  const seen = new Set<string>();
  const newBrands = new Set<string>();
  const rows: PlannedRow[] = [];

  for (const [index, raw] of parsed.rows.entries()) {
    const line = index + 2;
    const setNumber = cell(raw, 'setNumber');
    const hit = setNumber ? (catalog.get(setNumber) ?? catalog.get(`${setNumber}-1`)) : undefined;
    const wanted = mapping.wanted !== null && truthy(cell(raw, 'wanted'));
    const qtyText = cell(raw, 'quantity');
    // A Brickset "Owned" of 1/true means one copy; a blank quantity means one copy.
    const qty =
      mapping.quantity === null || qtyText === '' ? 1 : truthy(qtyText) ? 1 : intOrNull(qtyText);
    const paid = parseMoney(cell(raw, 'pricePaid'));
    const row: PlannedRow = {
      line,
      raw,
      failure: null,
      action: null,
      setNumber: hit ? boxNumber(hit.setNum) : setNumber,
      name: cell(raw, 'name') || hit?.name || '',
      brandId: null,
      brandName: null,
      isLego: false,
      themeName: cell(raw, 'theme') || null,
      rbSetNum: hit?.setNum ?? null,
      rbThemeId: hit?.themeId ?? null,
      year: intOrNull(cell(raw, 'year')) ?? hit?.year ?? null,
      pieces: intOrNull(cell(raw, 'pieces')) ?? hit?.numParts ?? null,
      copies: 0,
      pricePaidCents: paid ?? null,
      notes: cell(raw, 'notes') || null,
    };
    const fail = (reason: string) => {
      row.failure = reason;
      row.action = null;
      rows.push(row);
    };

    if (!setNumber) {
      fail('No set number');
      continue;
    }
    if (qty === null) {
      fail(`"${qtyText}" is not a number of copies`);
      continue;
    }
    if (paid === undefined) {
      fail(`"${cell(raw, 'pricePaid')}" is not a price`);
      continue;
    }
    if (qty > MAX_COPIES_PER_ROW) {
      fail(`More than ${MAX_COPIES_PER_ROW} copies of one set`);
      continue;
    }
    // The two export formats are LEGO lists: a number the catalog does not know is a mistake.
    if (format !== 'generic' && !hit) {
      fail(
        catalogReady(catalog)
          ? 'Not found in the catalog'
          : 'The catalog has not been imported yet',
      );
      continue;
    }

    // Brand: LEGO for the export formats and for any catalog match without a brand column.
    const brandText = cell(raw, 'brand');
    let brand = brandText ? (brandByName.get(brandText.toLowerCase()) ?? null) : null;
    if (!brandText && (format !== 'generic' || hit)) brand = lego;
    if (!brand && !brandText) {
      fail('No brand, and the number is not in the catalog');
      continue;
    }
    row.brandId = brand?.id ?? null;
    row.brandName = brand?.name ?? brandText;
    row.isLego = brand?.isLego ?? false;
    if (!brand) newBrands.add(brandText);
    if (!row.name) {
      fail('No name, and the number is not in the catalog');
      continue;
    }

    if (qty === 0) {
      if (wanted) {
        row.action = 'wishlist';
        rows.push(row);
      } else {
        fail('Zero copies and not on the wanted list');
      }
      continue;
    }
    row.copies = qty;
    const key = `${(row.brandId ?? row.brandName ?? '').toLowerCase()}|${row.setNumber.toLowerCase()}`;
    const existing = row.brandId ? await findSetByNumber(ctx, row.brandId, row.setNumber) : null;
    row.action = existing || seen.has(key) ? 'add-copies' : 'create-set';
    seen.add(key);
    rows.push(row);
    if (wanted) {
      // A set that is both owned and wanted adds the copies and also a wish.
      rows.push({ ...row, action: 'wishlist', copies: 0 });
    }
  }

  const ok = rows.filter((r) => !r.failure);
  return {
    rows,
    tooMany: parsed.tooMany,
    summary: {
      rows: parsed.rows.length,
      newSets: ok.filter((r) => r.action === 'create-set').length,
      existingSets: ok.filter((r) => r.action === 'add-copies').length,
      copies: ok.reduce((n, r) => n + r.copies, 0),
      wishlist: ok.filter((r) => r.action === 'wishlist').length,
      failed: rows.filter((r) => r.failure).length,
      newBrands: [...newBrands],
    },
  };
}

const catalogReady = (c: Map<string, CatalogSet>) => c.size > 0;

const csvCell = (v: string) => {
  // Same guard as the shopping exports: a cell that starts like a formula is not one in a spreadsheet.
  const safe = /^[=+\-@\t\r]/.test(v) ? `'${v}` : v;
  return /[",\n\r]/.test(safe) ? `"${safe.replaceAll('"', '""')}"` : safe;
};

/** The rows that could not be imported, as a CSV the person can fix and import again. */
export function failedRowsCsv(headers: string[], plan: ImportPlan): string {
  const lines = [[...headers, 'Import problem'].map(csvCell).join(',')];
  for (const r of plan.rows) {
    if (r.failure) lines.push([...r.raw, r.failure].map(csvCell).join(','));
  }
  return lines.join('\r\n') + '\r\n';
}
