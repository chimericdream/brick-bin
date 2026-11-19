'use client';

import { useRef, useState, useTransition } from 'react';
import { Button, Select } from '@mantine/core';
import { IconCheck, IconDownload } from '@tabler/icons-react';
import Link from 'next/link';

import { Note } from '@/components/Note';
import { Tag } from '@/components/sets/Badges';
import { TableScroll } from '@/components/ui/TableScroll';
import ui from '@/components/ui/ui.module.css';

import { previewImportAction, runImportAction, type ImportState, type Preview } from './actions';
import classes from './Import.module.css';

const MAX_BYTES = 2 * 1024 * 1024;

const FORMATS = [
  { value: 'rebrickable', label: 'Rebrickable set list' },
  { value: 'brickset', label: 'Brickset collection' },
  { value: 'generic', label: 'Other CSV (choose the columns)' },
];

const FIELDS = [
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
];

const STATES = [
  { value: 'sealed', label: 'Sealed' },
  { value: 'opened', label: 'Opened' },
  { value: 'built', label: 'Built' },
  { value: 'in_progress', label: 'In progress' },
  { value: 'disassembled', label: 'Disassembled' },
];

function download(name: string, text: string) {
  const url = URL.createObjectURL(new Blob([text], { type: 'text/csv;charset=utf-8' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}

export function ImportForm() {
  const [file, setFile] = useState<File | null>(null);
  const [format, setFormat] = useState<string | null>(null);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [buildState, setBuildState] = useState<string>('sealed');
  const [state, setState] = useState<ImportState>({});
  const [pending, start] = useTransition();

  function body(f: File, over: { format?: string | null; mapping?: Record<string, string> } = {}) {
    const fd = new FormData();
    fd.set('file', f);
    const fmt = over.format === undefined ? format : over.format;
    if (fmt) fd.set('format', fmt);
    if (fmt === 'generic' || (!fmt && Object.keys(over.mapping ?? mapping).length > 0)) {
      for (const [k, v] of Object.entries(over.mapping ?? mapping)) fd.set(`map.${k}`, v);
    }
    fd.set('buildState', buildState);
    return fd;
  }

  const latest = useRef(0);

  function check(f: File, over: { format?: string | null; mapping?: Record<string, string> } = {}) {
    if (f.size > MAX_BYTES) {
      setState({ error: 'That file is over 2 MB. Split it and import in parts.' });
      return;
    }
    const mine = ++latest.current;
    // The column choices come from the server only when none were sent (a new file or format).
    const sentMapping = Object.keys(over.mapping ?? {}).length > 0;
    start(async () => {
      const next = await previewImportAction(body(f, over));
      // A newer request is already running: this answer is out of date.
      if (mine !== latest.current) return;
      setState(next);
      if (next.preview) {
        setFormat(next.preview.format);
        if (!sentMapping) {
          setMapping(
            Object.fromEntries(
              Object.entries(next.preview.mapping).map(([k, v]) => [
                k,
                v === null ? '' : String(v),
              ]),
            ),
          );
        }
      }
    });
  }

  const p: Preview | undefined = state.preview;
  const importable = p
    ? p.summary.rows - p.summary.failed + p.summary.wishlist > 0 && !state.error
    : false;

  if (state.result) {
    const r = state.result;
    return (
      <div className={ui.narrow}>
        <section className={`${ui.panel} ${ui.pad}`} aria-labelledby="h-done" role="status">
          <div className={ui.panelHead}>
            <h2 id="h-done" className={classes.done}>
              <IconCheck size={22} stroke={2.5} aria-hidden />
              Import finished
            </h2>
          </div>
          <p className={classes.p}>
            {r.setsCreated} new {r.setsCreated === 1 ? 'set' : 'sets'}, {r.copiesAdded}{' '}
            {r.copiesAdded === 1 ? 'copy' : 'copies'} added
            {r.wishesAdded > 0 && `, ${r.wishesAdded} on your wishlist`}
            {r.brandsCreated > 0 &&
              `, ${r.brandsCreated} new ${r.brandsCreated === 1 ? 'brand' : 'brands'}`}
            .
          </p>
        </section>
        {r.failedCsv && (
          <Note variant="mind">
            <span className={classes.skipped}>
              <b>
                {r.failed} {r.failed === 1 ? 'row was' : 'rows were'} skipped.
              </b>
              <Button
                size="compact-md"
                variant="default"
                leftSection={<IconDownload size={16} stroke={1.75} />}
                onClick={() => download('rows-not-imported.csv', r.failedCsv!)}
              >
                Download the skipped rows
              </Button>
            </span>
          </Note>
        )}
        <div className={ui.actions}>
          <Button component={Link} href="/sets">
            Open the library
          </Button>
          <Button
            variant="default"
            onClick={() => {
              setState({});
              setFile(null);
              setFormat(null);
              setMapping({});
            }}
          >
            Import another file
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={ui.narrow}>
      {!p && (
        <p className={classes.p}>
          Bring in a collection from a CSV file: a Rebrickable set list, a Brickset collection
          export, or any spreadsheet with a column of set numbers. You see exactly what will happen
          before anything is saved.
        </p>
      )}
      <section className={`${ui.panel} ${ui.pad}`} aria-label="File and settings">
        <div className={ui.field}>
          <label htmlFor="csv-file" className={ui.label}>
            CSV file
          </label>
          <span className={ui.small}>
            Up to 2,000 rows and 2 MB. Nothing is saved until you press Import.
          </span>
          <input
            id="csv-file"
            type="file"
            accept=".csv,text/csv"
            className={ui.file}
            onChange={(e) => {
              const f = e.currentTarget.files?.[0] ?? null;
              setFile(f);
              setState({});
              setFormat(null);
              setMapping({});
              if (f) check(f, { format: null, mapping: {} });
            }}
          />
        </div>
        {p && file && (
          <>
            <Select
              label="File format"
              description={
                p.format === p.detected
                  ? `Detected from the column names.`
                  : `The file looks like ${FORMATS.find((f) => f.value === p.detected)?.label}.`
              }
              data={FORMATS}
              value={format}
              allowDeselect={false}
              onChange={(v) => {
                setFormat(v);
                check(file, { format: v, mapping: {} });
              }}
            />
            {format === 'generic' && (
              <fieldset className={classes.columns}>
                <legend className={ui.label}>Columns in the file</legend>
                <div className={ui.row2}>
                  {FIELDS.map((f) => (
                    <ColumnSelect
                      key={f.key}
                      f={f}
                      headers={p.headers}
                      mapping={mapping}
                      onChange={(m) => {
                        setMapping(m);
                        check(file, { format, mapping: m });
                      }}
                    />
                  ))}
                </div>
              </fieldset>
            )}
            <Select
              label="Build state for the copies"
              description="Applied to every copy this file creates. You can change them one by one afterwards."
              data={STATES}
              value={buildState}
              allowDeselect={false}
              onChange={(v) => setBuildState(v ?? 'sealed')}
            />
          </>
        )}
      </section>

      {!p && (
        <Note>
          <b>Two things to know first</b>
          LEGO sets are matched against the catalog, so import it first in Settings. Cover images
          are not downloaded during an import; open a set to add one.
        </Note>
      )}

      {state.error && <Note variant="error">{state.error}</Note>}

      {p && file && (
        <>
          {p.tooMany && (
            <Note variant="mind">
              Only the first 2,000 rows are read. Import the rest in a second file.
            </Note>
          )}

          <section aria-labelledby="h-preview" className={ui.stack}>
            <h2 id="h-preview" className={classes.h2}>
              Preview
            </h2>
            <ul className={`${ui.panel} ${ui.rows}`}>
              <li className={classes.fact}>{p.summary.newSets} new sets</li>
              <li className={classes.fact}>
                {p.summary.existingSets} rows add copies to sets you already have
              </li>
              <li className={classes.fact}>{p.summary.copies} copies in all</li>
              {p.summary.wishlist > 0 && (
                <li className={classes.fact}>{p.summary.wishlist} wishlist entries</li>
              )}
              {p.summary.newBrands.length > 0 && (
                <li className={classes.fact}>New brands: {p.summary.newBrands.join(', ')}</li>
              )}
              {p.summary.failed > 0 && (
                <li className={classes.fact}>
                  <Tag variant="dash">
                    {p.summary.failed} {p.summary.failed === 1 ? 'row' : 'rows'} cannot be imported
                  </Tag>
                </li>
              )}
            </ul>
          </section>

          <section aria-labelledby="h-first" className={ui.stack}>
            <h2 id="h-first" className={classes.h2}>
              First rows
            </h2>
            <div className={`${ui.panel} ${ui.pad}`}>
              <TableScroll label="First rows">
                <table className={`${ui.table} ${classes.rowsTable}`} aria-label="First rows">
                  <thead>
                    <tr>
                      <th scope="col" className={ui.r}>
                        Line
                      </th>
                      <th scope="col">Row</th>
                      <th scope="col">What happens</th>
                      <th scope="col">Problem</th>
                    </tr>
                  </thead>
                  <tbody>
                    {p.rows.map((r, i) => (
                      <tr key={`${r.line}-${i}`}>
                        <td className={ui.r}>{r.line}</td>
                        <td>{r.label}</td>
                        <td>{r.action}</td>
                        <td>{r.note || <span className={ui.muted}>—</span>}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </TableScroll>
              {p.summary.rows > p.rows.length && (
                <p className={ui.small}>Showing the first {p.rows.length} rows.</p>
              )}
            </div>
          </section>

          <div className={ui.actionbar}>
            <Button
              disabled={!importable}
              loading={pending}
              onClick={() =>
                start(async () => {
                  setState(await runImportAction(body(file)));
                })
              }
            >
              Import
            </Button>
            {p.failedCsv && (
              <Button
                variant="default"
                onClick={() => download('rows-not-imported.csv', p.failedCsv!)}
              >
                Download the rows that cannot be imported
              </Button>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function ColumnSelect({
  f,
  headers,
  mapping,
  onChange,
}: {
  f: { key: string; label: string; required?: boolean };
  headers: string[];
  mapping: Record<string, string>;
  onChange: (m: Record<string, string>) => void;
}) {
  return (
    <Select
      label={f.label}
      required={f.required}
      placeholder="Not in the file"
      clearable={!f.required}
      allowDeselect={false}
      data={headers.map((h, i) => ({ value: String(i), label: h || `Column ${i + 1}` }))}
      value={mapping[f.key] || null}
      onChange={(v) => onChange({ ...mapping, [f.key]: v ?? '' })}
    />
  );
}
