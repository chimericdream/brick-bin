import { Text, Title } from '@mantine/core';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { BUILD_STATE_INFO } from '@/components/sets/Badges';
import { formatMoney } from '@/lib/money';
import { requireContext } from '@/server/auth/current';
import { getCollection, type Breakdown } from '@/server/data/collection';

import classes from './Collection.module.css';

export const dynamic = 'force-dynamic';

const when = (iso: string | null) =>
  iso
    ? new Date(`${iso}T12:00:00`).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
    : 'never valued';

function Table({ title, rows }: { title: string; rows: Breakdown[] }) {
  const headingId = `h-${title.replaceAll(' ', '-').toLowerCase()}`;
  return (
    <section aria-labelledby={headingId} className={classes.panel}>
      <h2 id={headingId}>{title}</h2>
      <table className={classes.table}>
        <thead>
          <tr>
            <th scope="col">Name</th>
            <th scope="col">Copies</th>
            <th scope="col">Paid</th>
            <th scope="col">Value</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.name}>
              <th scope="row">{r.name}</th>
              <td>{r.copies}</td>
              <td>{formatMoney(r.paidCents)}</td>
              <td>{formatMoney(r.estimatedCents)}</td>
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

  return (
    <>
      <Title order={1}>Collection</Title>
      <Text c="dimmed">
        {c.sets} {c.sets === 1 ? 'set' : 'sets'} · {c.copies} {c.copies === 1 ? 'copy' : 'copies'} ·{' '}
        {c.pieces.toLocaleString('en-US')} pieces
      </Text>

      <dl className={classes.stats}>
        <div>
          <dt>Paid</dt>
          <dd>{formatMoney(c.paidCents)}</dd>
          <dd className={classes.note}>
            {c.copiesWithPrice} of {c.copies} copies have a price
          </dd>
        </div>
        <div>
          <dt>Estimated value</dt>
          <dd>{formatMoney(c.estimatedCents)}</dd>
          <dd className={classes.note}>
            {c.copiesWithEstimate} of {c.copies} copies have an estimate
          </dd>
        </div>
        <div>
          <dt>Difference</dt>
          <dd data-sign={diff > 0 ? 'up' : diff < 0 ? 'down' : undefined}>
            {diff > 0 ? '+' : diff < 0 ? '−' : ''}
            {formatMoney(Math.abs(diff))}
          </dd>
          <dd className={classes.note}>Over copies that have both numbers</dd>
        </div>
      </dl>

      {c.copies === 0 ? (
        <p className={classes.empty}>
          Nothing to total yet. Add a set with a copy, and give the copy a price paid and an
          estimated value.
        </p>
      ) : (
        <>
          <div className={classes.cols}>
            <Table title="By brand" rows={c.byBrand} />
            <Table title="By theme" rows={c.byTheme} />
          </div>

          <div className={classes.cols}>
            <section aria-labelledby="h-state" className={classes.panel}>
              <h2 id="h-state">By build state</h2>
              <ul className={classes.plain}>
                {c.byState.map((s) => (
                  <li key={s.state}>
                    <span>{BUILD_STATE_INFO[s.state].label}</span>
                    <strong>{s.copies}</strong>
                  </li>
                ))}
              </ul>
            </section>

            <section aria-labelledby="h-missing" className={classes.panel}>
              <h2 id="h-missing">Missing pieces</h2>
              {c.withMissing.copies === 0 ? (
                <p>No copy is missing anything.</p>
              ) : (
                <p>
                  {c.withMissing.pieces} {c.withMissing.pieces === 1 ? 'piece' : 'pieces'} missing
                  from {c.withMissing.copies} {c.withMissing.copies === 1 ? 'copy' : 'copies'}.{' '}
                  <Link href="/missing">Open the shopping list</Link>
                </p>
              )}
            </section>
          </div>

          <section aria-labelledby="h-sealed" className={classes.panel}>
            <h2 id="h-sealed">Sealed sets</h2>
            {c.sealed.length === 0 ? (
              <p>Nothing is sealed.</p>
            ) : (
              <ul className={classes.plain}>
                {c.sealed.map((s) => (
                  <li key={s.setId}>
                    <Link href={`/sets/${s.setId}`}>{s.name}</Link>
                    <strong>{s.copies > 1 ? `×${s.copies}` : ''}</strong>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section aria-labelledby="h-stale" className={classes.panel}>
            <h2 id="h-stale">Value not set in over a year</h2>
            {c.staleValues.length === 0 ? (
              <p>Every copy has a recent estimate.</p>
            ) : (
              <ul className={classes.plain}>
                {c.staleValues.map((s) => (
                  <li key={s.copyId}>
                    <Link href={`/sets/${s.setId}`}>{s.setName}</Link>
                    <span>
                      {s.estimatedCents === null ? 'no estimate' : formatMoney(s.estimatedCents)} ·{' '}
                      {when(s.valuedOn)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}
    </>
  );
}
