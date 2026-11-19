'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Button, Checkbox } from '@mantine/core';
import { IconChevronRight } from '@tabler/icons-react';
import { useRouter } from 'next/navigation';

import { LocalTime } from '@/components/LocalTime';
import { Note } from '@/components/Note';
import ui from '@/components/ui/ui.module.css';

import classes from './Catalog.module.css';

type Availability =
  | { available: true }
  | { available: false; reason: 'running' }
  | { available: false; reason: 'locked'; availableAt: string };

interface Run {
  id: string;
  status: 'running' | 'succeeded' | 'failed';
  step: string | null;
  filesDone: number;
  filesTotal: number;
  bytesDownloaded: number;
  rowsLoaded: number;
  error: string | null;
}

interface Preview {
  source: 'pasted' | 'fetched';
  catalogUpdated: string | null;
  schemaSvg: boolean;
  ldrawTotal: number;
  ldrawChanged: number;
  ldrawBytes: number;
  dropped: number;
  unknownZips: number;
  stale: boolean;
}

interface Problem {
  error: string;
  problems: string[];
  code?: string;
}

const mb = (n: number) => (n >= 1e9 ? `${(n / 1e9).toFixed(1)} GB` : `${Math.round(n / 1e6)} MB`);

const day = (iso: string) =>
  new Date(iso).toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  });

export function CatalogPanel({
  pageFetch,
  everImported,
  freeBytes,
  lastImportedAt = null,
  initial,
}: {
  pageFetch: boolean;
  everImported: boolean;
  freeBytes: number | null;
  /** When the last import finished, for the "Nothing new to import" note. */
  lastImportedAt?: string | null;
  initial: { availability: Availability; run: Run | null };
}) {
  const router = useRouter();
  const [availability, setAvailability] = useState<Availability>(initial.availability);
  const [run, setRun] = useState<Run | null>(initial.run);
  const [html, setHtml] = useState('');
  const [preview, setPreview] = useState<Preview | null>(null);
  const [problem, setProblem] = useState<Problem | null>(null);
  const [busy, setBusy] = useState(false);
  const [confirmStale, setConfirmStale] = useState(false);
  const wasRunning = useRef(initial.run?.status === 'running');

  const running =
    run?.status === 'running' || (!availability.available && availability.reason === 'running');
  const locked = !availability.available && availability.reason === 'locked';

  const poll = useCallback(async () => {
    const res = await fetch('/api/catalog/status', { cache: 'no-store' });
    if (!res.ok) return;
    const data = (await res.json()) as { run: Run | null; availability: Availability };
    setAvailability(data.availability);
    setRun(data.run);
    if (wasRunning.current && data.run?.status !== 'running') {
      wasRunning.current = false;
      router.refresh();
    }
    if (data.run?.status === 'running') wasRunning.current = true;
  }, [router]);

  useEffect(() => {
    if (!running) return;
    const id = setInterval(poll, 1500);
    return () => clearInterval(id);
  }, [running, poll]);

  async function post(url: string, body: string, headers: Record<string, string> = {}) {
    setBusy(true);
    setProblem(null);
    try {
      const res = await fetch(url, {
        method: 'POST',
        body,
        headers: { 'Content-Type': 'text/html', ...headers },
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setProblem({
          error: data.error ?? 'Something went wrong.',
          problems: data.problems ?? [],
          code: data.code,
        });
        return null;
      }
      return data;
    } finally {
      setBusy(false);
    }
  }

  async function check() {
    setPreview(null);
    setConfirmStale(false);
    const data = await post('/api/catalog/preview', html);
    if (data) setPreview(data as Preview);
  }

  async function start(body: string) {
    const data = await post(
      '/api/catalog/import',
      body,
      confirmStale ? { 'x-confirm-stale': '1' } : {},
    );
    if (data) {
      wasRunning.current = true;
      setPreview(null);
      setHtml('');
      setRun({
        id: data.runId,
        status: 'running',
        step: 'Starting',
        filesDone: 0,
        filesTotal: 0,
        bytesDownloaded: 0,
        rowsLoaded: 0,
        error: null,
      });
      setAvailability({ available: false, reason: 'running' });
    }
  }

  const pasteForm = (
    <div className={ui.stack}>
      <ol className={ui.steps}>
        <li>
          <span>
            Open{' '}
            <a href="https://rebrickable.com/downloads/" target="_blank" rel="noreferrer">
              rebrickable.com/downloads
            </a>{' '}
            in your browser.
          </span>
        </li>
        <li>
          <span>View the page source (Ctrl+U), select all, and copy.</span>
        </li>
        <li>
          <span>Paste it here and check it before importing.</span>
        </li>
      </ol>
      <div className={ui.field}>
        <label htmlFor="paste-page" className={ui.label}>
          Rebrickable downloads page source
        </label>
        <textarea
          id="paste-page"
          className={classes.paste}
          value={html}
          onChange={(e) => {
            setHtml(e.target.value);
            setPreview(null);
            setProblem(null);
          }}
          placeholder="Paste the page source here"
          spellCheck={false}
          disabled={locked || running}
        />
      </div>
      {preview && !running && (
        <div role="status" className={ui.stack}>
          {preview.stale ? (
            <Note>
              <b>Nothing new to import</b>
              None of the dates on this page are newer than your last import
              {lastImportedAt ? (
                <>
                  , on <LocalTime iso={lastImportedAt} format="date" />
                </>
              ) : null}
              . Rebrickable has not published anything since, so you can stop here.
            </Note>
          ) : (
            <Note>
              <b>The page checks out</b>
              <span>
                This will download: the catalog archive
                {preview.catalogUpdated ? ` (updated ${day(preview.catalogUpdated)})` : ''}
                {preview.schemaSvg ? ', the schema diagram' : ''}, and {preview.ldrawChanged} of{' '}
                {preview.ldrawTotal} color image ZIPs that changed ({mb(preview.ldrawBytes)}).
              </span>
              {preview.dropped > 0 && (
                <span className={classes.block}>
                  {preview.dropped} links to other sites were ignored.
                </span>
              )}
              {preview.unknownZips > 0 && (
                <span className={classes.block}>
                  {preview.unknownZips} other ZIP files on the page will not be downloaded.
                </span>
              )}
            </Note>
          )}
          {preview.stale && (
            <>
              <Checkbox
                checked={confirmStale}
                onChange={(e) => setConfirmStale(e.currentTarget.checked)}
                label="This page is older than your last import. Use it anyway."
              />
            </>
          )}
        </div>
      )}
      <div className={ui.actions}>
        {preview && (
          <Button
            onClick={() => start(html)}
            loading={busy}
            disabled={preview.stale && !confirmStale}
          >
            Import catalog
          </Button>
        )}
        <Button
          variant="default"
          onClick={check}
          loading={busy && !preview}
          disabled={!html.trim() || locked || running}
        >
          Check the page
        </Button>
      </div>
      {!html.trim() && !locked && !running && (
        <p className={ui.small}>Paste the page source first.</p>
      )}
      {preview && !preview.stale && (
        <p className={ui.small}>After this run, the next one is available 48 hours later.</p>
      )}
    </div>
  );

  return (
    <section className={`${ui.panel} ${ui.pad}`} aria-labelledby="import-heading">
      <div className={ui.panelHead}>
        <h2 id="import-heading">Import catalog</h2>
      </div>

      {running ? (
        <div className={ui.stack} role="status" aria-busy="true">
          <p className={classes.runTitle}>
            Import running{run?.filesTotal ? `: ${run.filesDone} of ${run.filesTotal} files` : ''}
          </p>
          <div
            className={classes.progress}
            role="progressbar"
            aria-label="Import progress"
            aria-valuemin={0}
            aria-valuemax={Math.max(1, run?.filesTotal ?? 1)}
            aria-valuenow={run?.filesDone ?? 0}
          >
            {(run?.filesDone ?? 0) > 0 && (
              <span
                className={`${classes.progressFill} app-studs`}
                style={{
                  width: `${((run?.filesDone ?? 0) / Math.max(1, run?.filesTotal ?? 1)) * 100}%`,
                }}
              />
            )}
          </div>
          <p className={ui.small}>{run?.step ?? 'Working'}</p>
          <p className={ui.small}>
            {run ? `${mb(run.bytesDownloaded)} downloaded` : ''}
            {run && run.rowsLoaded > 0
              ? ` · ${run.rowsLoaded.toLocaleString('en-US')} rows loaded`
              : ''}
            . It is safe to leave this page; the import carries on.
          </p>
        </div>
      ) : (
        <>
          {run?.status === 'failed' && (
            <Note variant="error">The last import failed: {run.error}</Note>
          )}
          {locked && !availability.available && availability.reason === 'locked' && (
            <Note>
              <b>
                Available again <LocalTime iso={availability.availableAt} />
              </b>
              Imports are limited to one every 48 hours.
            </Note>
          )}
          {!everImported && !locked && (
            <p className={classes.p}>
              The first import downloads about 6 GB of part images plus the catalog archive and can
              take a while.
              {freeBytes !== null ? ` There is ${mb(freeBytes)} free on this disk.` : ''} Nothing is
              fetched until you confirm.
            </p>
          )}

          {pageFetch ? (
            <>
              <div className={ui.actions}>
                <Button
                  onClick={() => start('')}
                  loading={busy}
                  disabled={locked}
                  aria-describedby="import-heading"
                >
                  Import catalog
                </Button>
              </div>
              <details className={ui.more}>
                <summary>
                  <IconChevronRight size={20} stroke={1.75} aria-hidden />
                  Other ways to import: paste the downloads page
                </summary>
                {pasteForm}
              </details>
            </>
          ) : (
            pasteForm
          )}
        </>
      )}

      {problem && (
        <Note variant="error">
          <b>{problem.error}</b>
          {problem.problems.length > 0 && (
            <ul className={classes.problems}>
              {problem.problems.map((p) => (
                <li key={p}>{p}</li>
              ))}
            </ul>
          )}
        </Note>
      )}
    </section>
  );
}
