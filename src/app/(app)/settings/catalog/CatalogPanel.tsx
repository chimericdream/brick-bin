'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Button, Checkbox } from '@mantine/core';
import { useRouter } from 'next/navigation';

import { LocalTime } from '@/components/LocalTime';

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
  initial,
}: {
  pageFetch: boolean;
  everImported: boolean;
  freeBytes: number | null;
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
    <div>
      <ol className={classes.steps}>
        <li>
          Open{' '}
          <a href="https://rebrickable.com/downloads/" target="_blank" rel="noreferrer">
            rebrickable.com/downloads
          </a>{' '}
          in your browser.
        </li>
        <li>View the page source (Ctrl+U), select all, and copy.</li>
        <li>Paste it here and check it before importing.</li>
      </ol>
      <label htmlFor="paste-page" className="sr-only" style={{ position: 'absolute', left: -9999 }}>
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
      <div className={classes.actions}>
        <Button
          variant="default"
          onClick={check}
          loading={busy && !preview}
          disabled={!html.trim() || locked || running}
        >
          Check the page
        </Button>
        {preview && (
          <Button
            onClick={() => start(html)}
            loading={busy}
            disabled={preview.stale && !confirmStale}
          >
            Import catalog
          </Button>
        )}
      </div>
    </div>
  );

  return (
    <section className={classes.panel} aria-labelledby="import-heading">
      <h2 id="import-heading">Import catalog</h2>

      {running ? (
        <div className={classes.progress} role="status">
          <p>
            <strong>
              Import running{run?.filesTotal ? `: ${run.filesDone} of ${run.filesTotal} files` : ''}
            </strong>
          </p>
          <p className={classes.muted}>{run?.step ?? 'Working'}</p>
          <progress
            value={run?.filesDone ?? 0}
            max={Math.max(1, run?.filesTotal ?? 1)}
            aria-label="Import progress"
          />
          <p className={classes.muted}>
            {run ? `${mb(run.bytesDownloaded)} downloaded` : ''}
            {run && run.rowsLoaded > 0
              ? ` · ${run.rowsLoaded.toLocaleString('en-US')} rows loaded`
              : ''}
          </p>
        </div>
      ) : (
        <>
          {run?.status === 'failed' && (
            <div className={classes.problem} role="alert">
              The last import failed: {run.error}
            </div>
          )}
          {locked && !availability.available && availability.reason === 'locked' && (
            <p className={classes.muted}>
              Available again <LocalTime iso={availability.availableAt} />. Imports are limited to
              one every 48 hours.
            </p>
          )}
          {!everImported && !locked && (
            <div className={classes.warn}>
              The first import downloads about 6 GB of part images plus the catalog archive and can
              take a while.
              {freeBytes !== null ? ` There is ${mb(freeBytes)} free on this disk.` : ''} Nothing is
              fetched until you confirm.
            </div>
          )}

          {pageFetch ? (
            <>
              <div className={classes.actions}>
                <Button
                  onClick={() => start('')}
                  loading={busy}
                  disabled={locked}
                  aria-describedby="import-heading"
                >
                  Import catalog
                </Button>
              </div>
              <details style={{ marginTop: 16 }}>
                <summary>Other ways to import: paste the downloads page</summary>
                {pasteForm}
              </details>
            </>
          ) : (
            pasteForm
          )}
        </>
      )}

      {problem && (
        <div className={classes.problem} role="alert">
          <strong>{problem.error}</strong>
          {problem.problems.length > 0 && (
            <ul>
              {problem.problems.map((p) => (
                <li key={p}>{p}</li>
              ))}
            </ul>
          )}
        </div>
      )}

      {preview && !running && (
        <div className={classes.preview} role="status">
          <p>
            <strong>This will download:</strong> the catalog archive
            {preview.catalogUpdated ? ` (updated ${day(preview.catalogUpdated)})` : ''}
            {preview.schemaSvg ? ', the schema diagram' : ''}, and {preview.ldrawChanged} of{' '}
            {preview.ldrawTotal} colour image ZIPs that changed ({mb(preview.ldrawBytes)}).
          </p>
          {preview.dropped > 0 && <p>{preview.dropped} links to other sites were ignored.</p>}
          {preview.unknownZips > 0 && (
            <p>{preview.unknownZips} other ZIP files on the page will not be downloaded.</p>
          )}
          {preview.stale && (
            <Checkbox
              checked={confirmStale}
              onChange={(e) => setConfirmStale(e.currentTarget.checked)}
              label="This page is older than your last import. Use it anyway."
              mt="xs"
            />
          )}
        </div>
      )}
    </section>
  );
}
