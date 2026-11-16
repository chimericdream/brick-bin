/**
 * The Rebrickable CSV files and where each column lands. Columns follow the CSV headers as they
 * are (checked against a real archive, docs/REBRICKABLE_SPIKE.md). `catalog.test.ts` checks this
 * list against the Drizzle tables so the two cannot drift apart.
 */

export type ColType = 'int' | 'text' | 'bool';

export interface RbColumn {
  /** CSV header. */
  csv: string;
  /** Column name in the table. */
  db: string;
  type: ColType;
  /** An empty field becomes NULL. Otherwise an empty field is an error (text columns may be empty). */
  nullable?: boolean;
}

export interface RbFile {
  /** File name inside the archive. */
  file: string;
  table: string;
  columns: RbColumn[];
}

const int = (csv: string, nullable = false): RbColumn => ({ csv, db: csv, type: 'int', nullable });
const text = (csv: string, nullable = false): RbColumn => ({
  csv,
  db: csv,
  type: 'text',
  nullable,
});
const bool = (csv: string): RbColumn => ({ csv, db: csv, type: 'bool' });

export const RB_FILES: readonly RbFile[] = [
  {
    file: 'themes.csv',
    table: 'rb_themes',
    columns: [int('id'), text('name'), int('parent_id', true)],
  },
  {
    file: 'colors.csv',
    table: 'rb_colors',
    columns: [
      int('id'),
      text('name'),
      text('rgb'),
      bool('is_trans'),
      int('num_parts', true),
      int('num_sets', true),
      int('y1', true),
      int('y2', true),
    ],
  },
  {
    file: 'part_categories.csv',
    table: 'rb_part_categories',
    columns: [int('id'), text('name')],
  },
  {
    file: 'parts.csv',
    table: 'rb_parts',
    columns: [
      text('part_num'),
      text('name'),
      int('part_cat_id', true),
      text('part_material', true),
    ],
  },
  {
    file: 'part_relationships.csv',
    table: 'rb_part_relationships',
    columns: [text('rel_type'), text('child_part_num'), text('parent_part_num')],
  },
  {
    file: 'elements.csv',
    table: 'rb_elements',
    columns: [text('element_id'), text('part_num'), int('color_id'), text('design_id', true)],
  },
  {
    file: 'sets.csv',
    table: 'rb_sets',
    columns: [
      text('set_num'),
      text('name'),
      int('year', true),
      int('theme_id', true),
      int('num_parts', true),
      text('img_url', true),
    ],
  },
  {
    file: 'minifigs.csv',
    table: 'rb_minifigs',
    columns: [text('fig_num'), text('name'), int('num_parts', true), text('img_url', true)],
  },
  {
    file: 'inventories.csv',
    table: 'rb_inventories',
    columns: [int('id'), int('version'), text('set_num')],
  },
  {
    file: 'inventory_parts.csv',
    table: 'rb_inventory_parts',
    columns: [
      int('inventory_id'),
      text('part_num'),
      int('color_id'),
      int('quantity'),
      bool('is_spare'),
      text('img_url', true),
    ],
  },
  {
    file: 'inventory_minifigs.csv',
    table: 'rb_inventory_minifigs',
    columns: [int('inventory_id'), text('fig_num'), int('quantity')],
  },
  {
    file: 'inventory_sets.csv',
    table: 'rb_inventory_sets',
    columns: [int('inventory_id'), text('set_num'), int('quantity')],
  },
  {
    file: 'color_mappings.csv',
    table: 'rb_color_mappings',
    columns: [
      int('id'),
      text('ext_system'),
      text('ext_id'),
      text('ext_descr', true),
      bool('is_export_id'),
      bool('is_import_id'),
    ],
  },
  {
    file: 'part_mappings.csv',
    table: 'rb_part_mappings',
    columns: [
      text('part_num'),
      text('ext_system'),
      text('ext_id'),
      bool('is_export_id'),
      bool('is_import_id'),
    ],
  },
  {
    file: 'set_mappings.csv',
    table: 'rb_set_mappings',
    columns: [text('set_num'), text('ext_system'), text('ext_id')],
  },
];

/** Files whose absence makes an archive unusable (everything the app reads). */
export const REQUIRED_FILES = RB_FILES.map((f) => f.file);

export const fileSpec = (name: string) => RB_FILES.find((f) => f.file === name);

/** Parses one CSV field. Throws a short message the caller wraps with the file and line number. */
export function parseField(col: RbColumn, raw: string): number | string | boolean | null {
  if (raw === '') {
    if (col.nullable) return null;
    if (col.type === 'text') return '';
    throw new Error(`${col.csv} is empty`);
  }
  switch (col.type) {
    case 'text':
      return raw;
    case 'int': {
      if (!/^-?\d{1,15}$/.test(raw))
        throw new Error(`${col.csv} is not a whole number: "${raw.slice(0, 40)}"`);
      return Number(raw);
    }
    case 'bool':
      if (raw === 'True') return true;
      if (raw === 'False') return false;
      throw new Error(`${col.csv} is not True or False: "${raw.slice(0, 40)}"`);
  }
}
