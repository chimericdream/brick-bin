'use server';

import { revalidatePath } from 'next/cache';

import { requireContext } from '@/server/auth/current';
import { BUILD_STATES, type BuildState } from '@/server/data/completeness';
import { commitImport, type ImportResult } from '@/server/import/commit';
import {
  detectFormat,
  failedRowsCsv,
  FIELDS,
  guessMapping,
  MAX_IMPORT_BYTES,
  parseCsvText,
  planImport,
  type FieldKey,
  type ImportFormat,
  type ImportPlan,
  type Mapping,
} from '@/server/import/plan';

export interface PreviewRow {
  line: number;
  action: string;
  label: string;
  note: string;
}

export interface Preview {
  headers: string[];
  format: ImportFormat;
  detected: ImportFormat;
  mapping: Mapping;
  summary: ImportPlan['summary'];
  tooMany: boolean;
  /** The first rows, for the table. */
  rows: PreviewRow[];
  failedCsv: string | null;
}

export interface ImportState {
  error?: string;
  preview?: Preview;
  result?: ImportResult & { failedCsv: string | null; failed: number };
}

const ACTION_TEXT = {
  'create-set': 'New set',
  'add-copies': 'More copies of a set you have',
  wishlist: 'Wishlist',
} as const;

async function read(fd: FormData) {
  const { ctx } = await requireContext();
  if (ctx.viewer.role === 'restricted') throw new Error('Kid profiles cannot import');
  const file = fd.get('file');
  if (!(file instanceof File) || file.size === 0) return { error: 'Choose a CSV file first.' };
  if (file.size > MAX_IMPORT_BYTES)
    return { error: 'That file is over 2 MB. Split it and import in parts.' };
  const parsed = await parseCsvText(await file.text());
  if (parsed.headers.length === 0 || parsed.rows.length === 0) {
    return { error: 'The file has no rows. The first line must be the column names.' };
  }
  const detected = detectFormat(parsed.headers);
  const asked = fd.get('format');
  const format: ImportFormat =
    asked === 'rebrickable' || asked === 'brickset' || asked === 'generic'
      ? asked
      : detected.format;
  // Mapping: what the form sent, else the detected or guessed one for the chosen format.
  const sent = FIELDS.some((f) => fd.has(`map.${f.key}`));
  const mapping: Mapping =
    sent && format === 'generic'
      ? (Object.fromEntries(
          FIELDS.map((f) => {
            const v = fd.get(`map.${f.key}`);
            return [f.key, typeof v === 'string' && v !== '' ? Number(v) : null];
          }),
        ) as Mapping)
      : format === detected.format
        ? detected.mapping
        : guessMapping(parsed.headers);
  if (mapping.setNumber === null) {
    return {
      ctx,
      parsed,
      format,
      detected: detected.format,
      mapping,
      error: 'Choose which column holds the set number.',
    };
  }
  return { ctx, parsed, format, detected: detected.format, mapping };
}

export async function previewImportAction(fd: FormData): Promise<ImportState> {
  try {
    const r = await read(fd);
    if (!r.ctx || !r.parsed) return { error: r.error };
    const base = {
      headers: r.parsed.headers,
      format: r.format,
      detected: r.detected,
      mapping: r.mapping,
    };
    if (r.error) {
      return {
        error: r.error,
        preview: {
          ...base,
          summary: {
            rows: r.parsed.rows.length,
            newSets: 0,
            existingSets: 0,
            copies: 0,
            wishlist: 0,
            failed: 0,
            newBrands: [],
          },
          tooMany: r.parsed.tooMany,
          rows: [],
          failedCsv: null,
        },
      };
    }
    const plan = await planImport(r.ctx, r.parsed, r.format, r.mapping);
    return {
      preview: {
        ...base,
        summary: plan.summary,
        tooMany: plan.tooMany,
        rows: plan.rows.slice(0, 100).map((row) => ({
          line: row.line,
          action: row.failure ? 'Cannot import' : row.action ? ACTION_TEXT[row.action] : '',
          label: `${row.name || row.setNumber || '(blank)'}${row.copies > 1 ? ` ×${row.copies}` : ''}`,
          note: row.failure ?? '',
        })),
        failedCsv: plan.summary.failed > 0 ? failedRowsCsv(r.parsed.headers, plan) : null,
      },
    };
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Could not read that file.' };
  }
}

export async function runImportAction(fd: FormData): Promise<ImportState> {
  try {
    const r = await read(fd);
    if (!r.ctx || !r.parsed || r.error) return { error: r.error };
    const plan = await planImport(r.ctx, r.parsed, r.format, r.mapping);
    const state = String(fd.get('buildState') ?? 'sealed');
    const buildState = (BUILD_STATES as readonly string[]).includes(state)
      ? (state as BuildState)
      : 'sealed';
    if (plan.rows.every((row) => row.failure)) return { error: 'No row can be imported.' };
    const result = await commitImport(r.ctx, plan, { buildState });
    revalidatePath('/sets');
    revalidatePath('/wishlist');
    return {
      result: {
        ...result,
        failed: plan.summary.failed,
        failedCsv: plan.summary.failed > 0 ? failedRowsCsv(r.parsed.headers, plan) : null,
      },
    };
  } catch (e) {
    return {
      error: `Nothing was imported. ${e instanceof Error ? e.message : 'Something went wrong.'}`,
    };
  }
}

export type { FieldKey };
