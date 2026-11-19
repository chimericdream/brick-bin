import { IconCheck } from '@tabler/icons-react';
import { notFound } from 'next/navigation';

import { LocalTime } from '@/components/LocalTime';
import { Tag } from '@/components/sets/Badges';
import { EmptyState } from '@/components/ui/EmptyState';
import ui from '@/components/ui/ui.module.css';
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
    <div className={ui.stack}>
      <section aria-labelledby="last-imported" className={`${ui.panel} ${ui.pad}`}>
        <div className={ui.panelHead}>
          {status.lastImportedAt ? (
            <h2 id="last-imported">
              Last imported <LocalTime iso={status.lastImportedAt.toISOString()} />{' '}
              <span className={classes.ago}>{ago(status.lastImportedAt)}</span>
            </h2>
          ) : (
            <h2 id="last-imported">Never imported</h2>
          )}
        </div>
        {!status.lastImportedAt && (
          <p className={classes.p}>Set lookup and part picking need the catalog.</p>
        )}
        <dl className={ui.facts}>
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
            <dt>Colors</dt>
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
        lastImportedAt={status.lastImportedAt?.toISOString() ?? null}
        initial={{
          availability: JSON.parse(JSON.stringify(availability)),
          run: running ? JSON.parse(JSON.stringify(running)) : null,
        }}
      />

      <section className={ui.stack} aria-labelledby="history">
        <h2 id="history" className={classes.h2}>
          Import history
        </h2>
        {runs.length === 0 ? (
          <EmptyState inline title="No imports yet.">
            The first run will be listed here.
          </EmptyState>
        ) : (
          <div className={`${ui.panel} ${ui.pad}`}>
            <div className={ui.tableWrap}>
              <table className={`${ui.table} ${classes.history}`}>
                <thead>
                  <tr>
                    <th scope="col">Started</th>
                    <th scope="col">Result</th>
                    <th scope="col">Source</th>
                    <th scope="col">Files</th>
                    <th scope="col">Details</th>
                  </tr>
                </thead>
                <tbody>
                  {runs.map((r) => (
                    <tr key={r.id}>
                      <td>
                        <LocalTime iso={r.startedAt.toISOString()} />
                      </td>
                      <td>
                        {r.status === 'succeeded' ? (
                          <Tag variant="quiet">
                            <IconCheck size={16} stroke={2.5} aria-hidden />
                            Succeeded
                          </Tag>
                        ) : r.status === 'failed' ? (
                          <Tag variant="dash">Failed</Tag>
                        ) : (
                          <Tag variant="line">Running</Tag>
                        )}
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
                        {!r.error && r.notes.length === 0 && <span className={ui.muted}>—</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>

      <section className={ui.stack} aria-labelledby="diagram">
        <h2 id="diagram" className={classes.h2}>
          How the files fit together
        </h2>
        <p className={ui.small}>
          The diagram Rebrickable publishes for its CSV files, saved on this server.
        </p>
        {status.lastImportedAt ? (
          <p className={classes.p}>
            <a href="/api/catalog/schema.svg" target="_blank" rel="noreferrer">
              Open the diagram
            </a>
          </p>
        ) : (
          <p className={ui.small}>Available after the first import.</p>
        )}
      </section>

      <p className={ui.credit}>
        Catalog data from <a href="https://rebrickable.com/">Rebrickable</a>, free to use with
        credit. Brick Bin is not affiliated with Rebrickable or any set maker.
      </p>
    </div>
  );
}
