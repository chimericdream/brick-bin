'use client';

import { useRef, useState, useTransition } from 'react';
import { Alert, Button, Group, Paper, Select, Stack, Table, Text } from '@mantine/core';
import Link from 'next/link';

import { previewImportAction, runImportAction, type ImportState, type Preview } from './actions';

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
      <Stack gap="md" maw={760}>
        <Alert color="green" variant="light" role="status" title="Import finished">
          {r.setsCreated} new {r.setsCreated === 1 ? 'set' : 'sets'}, {r.copiesAdded}{' '}
          {r.copiesAdded === 1 ? 'copy' : 'copies'} added
          {r.wishesAdded > 0 && `, ${r.wishesAdded} on your wishlist`}
          {r.brandsCreated > 0 &&
            `, ${r.brandsCreated} new ${r.brandsCreated === 1 ? 'brand' : 'brands'}`}
          .
        </Alert>
        {r.failedCsv && (
          <Alert color="yellow" variant="light" role="status">
            {r.failed} {r.failed === 1 ? 'row was' : 'rows were'} skipped.{' '}
            <Button
              size="compact-sm"
              variant="light"
              onClick={() => download('rows-not-imported.csv', r.failedCsv!)}
            >
              Download the skipped rows
            </Button>
          </Alert>
        )}
        <Group>
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
        </Group>
      </Stack>
    );
  }

  return (
    <Stack gap="md" maw={820}>
      <Paper withBorder p="md">
        <Stack gap="xs">
          <label htmlFor="csv-file">
            <Text fw={700}>CSV file</Text>
          </label>
          <input
            id="csv-file"
            type="file"
            accept=".csv,text/csv"
            onChange={(e) => {
              const f = e.currentTarget.files?.[0] ?? null;
              setFile(f);
              setState({});
              setFormat(null);
              setMapping({});
              if (f) check(f, { format: null, mapping: {} });
            }}
          />
          <Text size="sm" c="dimmed">
            Up to 2,000 rows and 2 MB. Nothing is saved until you press Import.
          </Text>
        </Stack>
      </Paper>

      {state.error && (
        <Alert color="red" variant="light" role="alert">
          {state.error}
        </Alert>
      )}

      {p && file && (
        <>
          <Paper withBorder p="md">
            <Stack gap="sm">
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
                <Group grow align="flex-start">
                  <Stack gap="xs">
                    {FIELDS.slice(0, 5).map((f) => (
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
                  </Stack>
                  <Stack gap="xs">
                    {FIELDS.slice(5).map((f) => (
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
                  </Stack>
                </Group>
              )}
              <Select
                label="Build state for the copies"
                description="Applied to every copy this file creates. You can change them one by one afterwards."
                data={STATES}
                value={buildState}
                allowDeselect={false}
                onChange={(v) => setBuildState(v ?? 'sealed')}
              />
            </Stack>
          </Paper>

          <Paper withBorder p="md" aria-labelledby="h-preview">
            <Stack gap="sm">
              <h2 id="h-preview">Preview</h2>
              <ul>
                <li>{p.summary.newSets} new sets</li>
                <li>{p.summary.existingSets} rows add copies to sets you already have</li>
                <li>{p.summary.copies} copies in all</li>
                {p.summary.wishlist > 0 && <li>{p.summary.wishlist} wishlist entries</li>}
                {p.summary.newBrands.length > 0 && (
                  <li>New brands: {p.summary.newBrands.join(', ')}</li>
                )}
                <li>
                  {p.summary.failed} {p.summary.failed === 1 ? 'row' : 'rows'} cannot be imported
                </li>
              </ul>
              {p.tooMany && (
                <Alert color="yellow" variant="light" role="status">
                  Only the first 2,000 rows are read. Import the rest in a second file.
                </Alert>
              )}
              <Table striped aria-label="First rows">
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>Line</Table.Th>
                    <Table.Th>Row</Table.Th>
                    <Table.Th>What happens</Table.Th>
                    <Table.Th>Problem</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {p.rows.map((r, i) => (
                    <Table.Tr key={`${r.line}-${i}`}>
                      <Table.Td>{r.line}</Table.Td>
                      <Table.Td>{r.label}</Table.Td>
                      <Table.Td>{r.action}</Table.Td>
                      <Table.Td>{r.note}</Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
              {p.summary.rows > p.rows.length && (
                <Text size="sm" c="dimmed">
                  Showing the first {p.rows.length} rows.
                </Text>
              )}
              <Group>
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
              </Group>
            </Stack>
          </Paper>
        </>
      )}
    </Stack>
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
