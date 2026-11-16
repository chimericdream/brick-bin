import { notFound } from 'next/navigation';

import { LocalTime } from '@/components/LocalTime';
import { ago } from '@/lib/ago';
import { requireContext } from '@/server/auth/current';
import { catalogConfig, catalogPaths } from '@/server/catalog/config';
import { dirSize, formatBytes, freeBytes } from '@/server/catalog/disk';
import { catalogStatus, getAvailability, listRuns } from '@/server/catalog/runs';

import { CatalogPanel } from './CatalogPanel';
import classes from './Catalog.module.css';

export const dynamic = 'force-dynamic';

export default async function CatalogPage() {
  const { ctx } = await requireContext();
  if (ctx.viewer.role !== 'admin') notFound();
  const config = catalogConfig();
  const paths = catalogPaths(config.dataDir);
  const [status, availability, runs, imagesBytes, free] = await Promise.all([
    catalogStatus(ctx.db),
    getAvailability(ctx.db),
    listRuns(ctx.db, 15),
    dirSize(paths.ldraw),
    freeBytes(config.dataDir),
  ]);
  const running = runs.find((r) => r.status === 'running') ?? null;

  return (
    <>
      <section aria-labelledby="last-imported" className={classes.hero}>
        {status.lastImportedAt ? (
          <h2 id="last-imported">
            Last imported <LocalTime iso={status.lastImportedAt.toISOString()} />{' '}
            <span className={classes.ago}>({ago(status.lastImportedAt)})</span>
          </h2>
        ) : (
          <h2 id="last-imported">Never imported</h2>
        )}
        {!status.lastImportedAt && (
          <p className={classes.lead}>Set lookup and part picking need the catalog.</p>
        )}
        <dl className={classes.facts}>
          {status.catalogUpdated && (
            <div>
              <dt>Rebrickable updated the catalog</dt>
              <dd>
                <LocalTime iso={status.catalogUpdated.toISOString()} format="date" />
              </dd>
            </div>
          )}
          <div>
            <dt>Sets</dt>
            <dd>{status.sets.toLocaleString('en-US')}</dd>
          </div>
          <div>
            <dt>Parts</dt>
            <dd>{status.parts.toLocaleString('en-US')}</dd>
          </div>
          <div>
            <dt>Colours</dt>
            <dd>{status.colors.toLocaleString('en-US')}</dd>
          </div>
          <div>
            <dt>Part images on disk</dt>
            <dd>{formatBytes(imagesBytes)}</dd>
          </div>
          {free !== null && (
            <div>
              <dt>Free disk space</dt>
              <dd>{formatBytes(free)}</dd>
            </div>
          )}
        </dl>
      </section>

      <CatalogPanel
        pageFetch={config.pageFetch}
        everImported={status.lastImportedAt !== null}
        freeBytes={free}
        initial={{
          availability: JSON.parse(JSON.stringify(availability)),
          run: running ? JSON.parse(JSON.stringify(running)) : null,
        }}
      />

      <section className={classes.section} aria-labelledby="history">
        <h2 id="history">Import history</h2>
        {runs.length === 0 ? (
          <p className={classes.muted}>No imports yet.</p>
        ) : (
          <div className={classes.tableWrap}>
            <table className={classes.table}>
              <thead>
                <tr>
                  <th>Started</th>
                  <th>Result</th>
                  <th>Source</th>
                  <th>Files</th>
                  <th>Details</th>
                </tr>
              </thead>
              <tbody>
                {runs.map((r) => (
                  <tr key={r.id}>
                    <td>
                      <LocalTime iso={r.startedAt.toISOString()} />
                    </td>
                    <td>
                      <span className={classes.result} data-status={r.status}>
                        {r.status === 'succeeded'
                          ? 'Succeeded'
                          : r.status === 'failed'
                            ? 'Failed'
                            : 'Running'}
                      </span>
                    </td>
                    <td>{r.source === 'fetched' ? 'Fetched' : 'Pasted page'}</td>
                    <td>
                      {r.filesDownloaded} downloaded, {r.filesSkipped} unchanged
                    </td>
                    <td>
                      {r.error && <span>{r.error}</span>}
                      {r.notes.length > 0 && (
                        <ul className={classes.notes}>
                          {r.notes.map((n, i) => (
                            <li key={i}>{n}</li>
                          ))}
                        </ul>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className={classes.section} aria-labelledby="diagram">
        <h2 id="diagram">How the files fit together</h2>
        <p className={classes.muted}>
          The diagram Rebrickable publishes for its CSV files, saved on this server.
        </p>
        {/* oxlint-disable-next-line nextjs/no-img-element */}
        {status.lastImportedAt ? (
          <a href="/api/catalog/schema.svg" target="_blank" rel="noreferrer">
            Open the diagram
          </a>
        ) : (
          <p className={classes.muted}>Available after the first import.</p>
        )}
      </section>

      <p className={classes.attribution}>
        Catalog data from <a href="https://rebrickable.com">Rebrickable</a>, free to use with
        credit. Brick Bin is not affiliated with Rebrickable or any set maker.
      </p>
    </>
  );
}
