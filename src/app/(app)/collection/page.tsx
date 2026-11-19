import Link from 'next/link';
import { notFound } from 'next/navigation';

import { PageHead } from '@/components/layout/PageHead';
import { BUILD_STATE_INFO, StateTag, Tag } from '@/components/sets/Badges';
import { EmptyState } from '@/components/ui/EmptyState';
import ui from '@/components/ui/ui.module.css';
import { formatMoney } from '@/lib/money';
import { requireContext } from '@/server/auth/current';
import { getCollection, type Breakdown } from '@/server/data/collection';
import { BUILD_STATES } from '@/server/data/completeness';

import classes from './Collection.module.css';

export const dynamic = 'force-dynamic';

const when = (iso: string | null) =>
  iso
    ? new Date(`${iso}T12:00:00`).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
    : null;

/** Money with two decimals; a real zero is printed, in the muted tone. */
function Money({ cents }: { cents: number | null }) {
  if (cents === null) return <span className={ui.muted}>—</span>;
  return <span className={cents === 0 ? ui.muted : undefined}>{formatMoney(cents)}</span>;
}

function Table({ title, rows }: { title: string; rows: Breakdown[] }) {
  const headingId = `h-${title.replaceAll(' ', '-').toLowerCase()}`;
  return (
    <section aria-labelledby={headingId} className={`${ui.panel} ${ui.pad}`}>
      <div className={ui.panelHead}>
        <h2 id={headingId}>{title}</h2>
      </div>
      <table className={ui.table}>
        <thead>
          <tr>
            <th scope="col">Name</th>
            <th scope="col" className={ui.r}>
              Copies
            </th>
            <th scope="col" className={ui.r}>
              Paid
            </th>
            <th scope="col" className={ui.r}>
              Value
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.name}>
              <th scope="row">{r.name}</th>
              <td className={ui.r}>{r.copies}</td>
              <td className={ui.r}>
                <Money cents={r.paidCents} />
              </td>
              <td className={ui.r}>
                <Money cents={r.estimatedCents} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

export default async function CollectionPage() {
  const { ctx } = await requireContext();
  // Money and totals are for members and admins; kid profiles never get this page.
  if (ctx.viewer.role === 'restricted') notFound();
  const c = await getCollection(ctx);
  const diff = c.differenceCents;
  // Build states always appear in their fixed order.
  c.byState.sort((a, b) => BUILD_STATES.indexOf(a.state) - BUILD_STATES.indexOf(b.state));
  const stateTotal = c.byState.reduce((n, s) => n + s.copies, 0);
  const wallLabel = `Copies by build state: ${c.byState
    .filter((s) => s.copies > 0)
    .map((s) => `${s.copies} ${BUILD_STATE_INFO[s.state].label}`)
    .join(', ')}.`;

  return (
    <>
      <PageHead
        title="Collection"
        sub={`${c.sets} ${c.sets === 1 ? 'set' : 'sets'} · ${c.copies} ${c.copies === 1 ? 'copy' : 'copies'} · ${c.pieces.toLocaleString('en-US')} pieces`}
      />

      <dl className={classes.totals}>
        <div>
          <dt>Paid</dt>
          <dd className={classes.figure}>{formatMoney(c.paidCents)}</dd>
          <dd className={classes.covers}>
            {c.copiesWithPrice} of {c.copies} copies have a price
          </dd>
        </div>
        <div>
          <dt>Estimated value</dt>
          <dd className={classes.figure}>{formatMoney(c.estimatedCents)}</dd>
          <dd className={classes.covers}>
            {c.copiesWithEstimate} of {c.copies} copies have an estimate
          </dd>
        </div>
        <div>
          <dt>Difference</dt>
          <dd className={classes.figure}>
            {diff > 0 ? '+' : diff < 0 ? '−' : ''}
            {formatMoney(Math.abs(diff))}
          </dd>
          <dd className={classes.covers}>Over copies that have both numbers</dd>
        </div>
      </dl>

      {c.copies === 0 ? (
        <EmptyState title="Nothing to total yet.">
          <p>Add a set with a copy, and give the copy a price paid and an estimated value.</p>
        </EmptyState>
      ) : (
        <div className={classes.blocks}>
          <div className={`${ui.grid2} ${ui.even}`}>
            <section aria-labelledby="h-state" className={`${ui.panel} ${ui.pad}`}>
              <div className={ui.panelHead}>
                <h2 id="h-state">By build state</h2>
              </div>
              <div className={classes.wall} role="img" aria-label={wallLabel}>
                {c.byState
                  .filter((s) => s.copies > 0)
                  .map((s) => (
                    <span
                      key={s.state}
                      className="app-studs"
                      data-st={BUILD_STATE_INFO[s.state].st}
                      style={{ flexGrow: s.copies, flexBasis: `${(s.copies / stateTotal) * 100}%` }}
                    >
                      {s.copies}
                    </span>
                  ))}
              </div>
              <ul className={classes.legend}>
                {c.byState.map((s) => (
                  <li key={s.state}>
                    <StateTag state={s.state} />
                    <b>{s.copies}</b>
                  </li>
                ))}
              </ul>
            </section>

            <div className={ui.stack}>
              <section aria-labelledby="h-missing" className={`${ui.panel} ${ui.pad}`}>
                <div className={ui.panelHead}>
                  <h2 id="h-missing">Missing pieces</h2>
                </div>
                {c.withMissing.copies === 0 ? (
                  <p className={classes.p}>No copy is missing anything.</p>
                ) : (
                  <p className={classes.p}>
                    <Tag variant="dash">
                      {c.withMissing.pieces} {c.withMissing.pieces === 1 ? 'piece' : 'pieces'}
                    </Tag>{' '}
                    missing from {c.withMissing.copies}{' '}
                    {c.withMissing.copies === 1 ? 'copy' : 'copies'}.{' '}
                    <Link href="/missing">Open the shopping list</Link>
                  </p>
                )}
              </section>

              <section aria-labelledby="h-sealed" className={`${ui.panel} ${ui.pad}`}>
                <div className={ui.panelHead}>
                  <h2 id="h-sealed">Sealed sets</h2>
                </div>
                {c.sealed.length === 0 ? (
                  <p className={classes.p}>Nothing is sealed.</p>
                ) : (
                  <ul className={classes.list}>
                    {c.sealed.map((s) => (
                      <li key={s.setId}>
                        <Link href={`/sets/${s.setId}`}>{s.name}</Link>
                        <b>{s.copies > 1 ? `×${s.copies}` : ''}</b>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            </div>
          </div>

          <div className={`${ui.grid2} ${ui.even}`}>
            <Table title="By brand" rows={c.byBrand} />
            <Table title="By theme" rows={c.byTheme} />
          </div>

          <section aria-labelledby="h-stale" className={`${ui.panel} ${ui.pad}`}>
            <div>
              <div className={ui.panelHead}>
                <h2 id="h-stale">
                  Value not set in over a year
                  {c.staleValues.length > 0 && (
                    <small className={ui.count}>{c.staleValues.length}</small>
                  )}
                </h2>
              </div>
              {c.staleValues.length > 0 && (
                <p className={ui.small}>
                  Copies whose estimate is missing or old. Open one and edit the copy to set it.
                </p>
              )}
            </div>
            {c.staleValues.length === 0 ? (
              <p className={classes.p}>Every copy has a recent estimate.</p>
            ) : (
              <div className={ui.tableWrap}>
                <table className={ui.table}>
                  <thead>
                    <tr>
                      <th scope="col">Set</th>
                      <th scope="col" className={ui.r}>
                        Estimate
                      </th>
                      <th scope="col" className={ui.r}>
                        Last valued
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {c.staleValues.map((s) => (
                      <tr key={s.copyId}>
                        <th scope="row">
                          <Link href={`/sets/${s.setId}`}>{s.setName}</Link>
                        </th>
                        <td className={ui.r}>
                          {s.estimatedCents === null ? (
                            <span className={ui.muted}>No estimate</span>
                          ) : (
                            <Money cents={s.estimatedCents} />
                          )}
                        </td>
                        <td className={ui.r}>
                          {when(s.valuedOn) ?? <span className={ui.muted}>Never</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
      )}
    </>
  );
}
