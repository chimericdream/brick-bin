import { and, eq, inArray } from 'drizzle-orm';

import type { Db } from '../db/client';
import { rbColorMappings, rbPartMappings, rbSetMappings } from '../db/schema';
import type { ShoppingGroup } from './shopping';

// ---------------------------------------------------------------------------
// CSV helpers
// ---------------------------------------------------------------------------

/**
 * One CSV field. A value that starts with `=`, `+`, `-` or `@` would run as a formula when the file
 * is opened in a spreadsheet, so it gets a leading apostrophe. Commas, quotes and line breaks are quoted.
 */
export function csvField(value: string | number | null | undefined): string {
  let s = value === null || value === undefined ? '' : String(value);
  if (typeof value === 'string' && /^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return /[",\r\n]/.test(s) ? `"${s.replaceAll('"', '""')}"` : s;
}

const csvLine = (fields: (string | number | null | undefined)[]) => fields.map(csvField).join(',');

/** CRLF line ends and no trailing blank line problems: what spreadsheets and Rebrickable expect. */
const csv = (lines: string[]) => `${lines.join('\r\n')}\r\n`;

// ---------------------------------------------------------------------------
// Rebrickable parts list (Part,Color,Quantity)
// ---------------------------------------------------------------------------

/**
 * Rebrickable's parts-list import format. It only takes parts, so minifigures and "other" rows are
 * left out and returned in `skipped` for the page to list.
 */
export function toRebrickableCsv(groups: ShoppingGroup[]): {
  csv: string;
  skipped: ShoppingGroup[];
} {
  const parts = groups.filter((g) => g.kind === 'part' && g.partNum !== null && g.colorId !== null);
  return {
    csv: csv([
      'Part,Color,Quantity',
      ...parts.map((g) => csvLine([g.partNum, g.colorId, g.quantity])),
    ]),
    skipped: groups.filter((g) => !parts.includes(g)),
  };
}

// ---------------------------------------------------------------------------
// Plain CSV
// ---------------------------------------------------------------------------

const setsText = (g: ShoppingGroup) => {
  const bySet = new Map<string, number>();
  for (const s of g.sources) bySet.set(s.setName, (bySet.get(s.setName) ?? 0) + s.quantity);
  return [...bySet].map(([name, n]) => `${name} x${n}`).join('; ');
};

export function toPlainCsv(groups: ShoppingGroup[]): string {
  return csv([
    'Type,Part or figure,Name,Colour,Element id,Quantity,Sets,Alternates',
    ...groups.map((g) =>
      csvLine([
        g.kind === 'part' ? 'Part' : g.kind === 'minifig' ? 'Minifigure' : 'Other',
        g.partNum ?? g.figNum ?? '',
        g.name,
        g.colorName ?? '',
        g.elementId ?? '',
        g.quantity,
        setsText(g),
        g.hints.join(' '),
      ]),
    ),
  ]);
}

// ---------------------------------------------------------------------------
// BrickLink wanted list (XML)
// ---------------------------------------------------------------------------

export interface BrickLinkMaps {
  /** Rebrickable part number to BrickLink part id. */
  parts: Map<string, string>;
  /** Rebrickable colour id to BrickLink colour id. */
  colors: Map<number, string>;
  /** Rebrickable figure number to BrickLink minifigure id. */
  figs: Map<string, string>;
}

const xmlEscape = (s: string) =>
  s
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');

/**
 * BrickLink's "Upload wanted list" XML. Rows with no BrickLink id for the part or the colour are left
 * out of the file and returned in `unmapped`, so the page can say "4 parts have no BrickLink id".
 * "Other" rows are never in the file.
 */
export function toBrickLinkXml(
  groups: ShoppingGroup[],
  maps: BrickLinkMaps,
): { xml: string; unmapped: ShoppingGroup[] } {
  const items: string[] = [];
  const unmapped: ShoppingGroup[] = [];
  for (const g of groups) {
    if (g.kind === 'other') {
      unmapped.push(g);
    } else if (g.kind === 'part') {
      const part = g.partNum ? maps.parts.get(g.partNum) : undefined;
      const color = g.colorId === null ? undefined : maps.colors.get(g.colorId);
      if (!part || color === undefined) {
        unmapped.push(g);
        continue;
      }
      items.push(
        `  <ITEM><ITEMTYPE>P</ITEMTYPE><ITEMID>${xmlEscape(part)}</ITEMID><COLOR>${xmlEscape(color)}</COLOR><MINQTY>${g.quantity}</MINQTY></ITEM>`,
      );
    } else {
      const fig = g.figNum ? maps.figs.get(g.figNum) : undefined;
      if (!fig) {
        unmapped.push(g);
        continue;
      }
      items.push(
        `  <ITEM><ITEMTYPE>M</ITEMTYPE><ITEMID>${xmlEscape(fig)}</ITEMID><MINQTY>${g.quantity}</MINQTY></ITEM>`,
      );
    }
  }
  return {
    xml: `<INVENTORY>\n${items.join('\n')}${items.length ? '\n' : ''}</INVENTORY>\n`,
    unmapped,
  };
}

/**
 * BrickLink ids for these parts, colours and figures, from the imported mapping files. Only `BL`
 * rows count, and the row flagged as the export id wins when there are several.
 */
export async function loadBrickLinkMaps(db: Db, groups: ShoppingGroup[]): Promise<BrickLinkMaps> {
  const partNums = [...new Set(groups.flatMap((g) => (g.partNum ? [g.partNum] : [])))];
  const colorIds = [...new Set(groups.flatMap((g) => (g.colorId === null ? [] : [g.colorId])))];
  const figNums = [...new Set(groups.flatMap((g) => (g.figNum ? [g.figNum] : [])))];
  const maps: BrickLinkMaps = { parts: new Map(), colors: new Map(), figs: new Map() };

  if (partNums.length) {
    const rows = await db
      .select({
        partNum: rbPartMappings.partNum,
        extId: rbPartMappings.extId,
        isExport: rbPartMappings.isExportId,
      })
      .from(rbPartMappings)
      .where(and(eq(rbPartMappings.extSystem, 'BL'), inArray(rbPartMappings.partNum, partNums)));
    for (const r of rows.toSorted((a, b) => Number(a.isExport) - Number(b.isExport))) {
      if (r.isExport || !maps.parts.has(r.partNum)) maps.parts.set(r.partNum, r.extId);
    }
  }
  if (colorIds.length) {
    const rows = await db
      .select({
        id: rbColorMappings.id,
        extId: rbColorMappings.extId,
        isExport: rbColorMappings.isExportId,
      })
      .from(rbColorMappings)
      .where(and(eq(rbColorMappings.extSystem, 'BL'), inArray(rbColorMappings.id, colorIds)));
    for (const r of rows.toSorted((a, b) => Number(a.isExport) - Number(b.isExport))) {
      if (r.isExport || !maps.colors.has(r.id)) maps.colors.set(r.id, r.extId);
    }
  }
  if (figNums.length) {
    const rows = await db
      .select({ setNum: rbSetMappings.setNum, extId: rbSetMappings.extId })
      .from(rbSetMappings)
      .where(and(eq(rbSetMappings.extSystem, 'BL'), inArray(rbSetMappings.setNum, figNums)));
    for (const r of rows) maps.figs.set(r.setNum, r.extId);
  }
  return maps;
}
