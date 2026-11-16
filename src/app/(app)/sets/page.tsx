import Link from 'next/link';

import { SetCover } from '@/components/sets/SetCover';
import { requireContext } from '@/server/auth/current';
import { listSetSummaries } from '@/server/data/sets';

import classes from './Library.module.css';

export const dynamic = 'force-dynamic';

/** Placeholder library: a plain list until Phase 4 builds paging, facets and the plank tiles. */
export default async function SetsPage() {
  const { ctx } = await requireContext();
  const rows = await listSetSummaries(ctx);
  return (
    <>
      <h1>Library</h1>
      {rows.length === 0 ? (
        <p>
          No sets yet.
          {ctx.viewer.role !== 'restricted' && (
            <>
              {' '}
              <Link href="/sets/new">Add your first set</Link>.
            </>
          )}
        </p>
      ) : (
        <ul className={classes.list}>
          {rows.map((s) => (
            <li key={s.id}>
              <Link href={`/sets/${s.id}`} className={classes.item}>
                <SetCover setId={s.id} hasCover={s.hasCover} alt="" />
                <strong>{s.name}</strong>
                <span>
                  {s.brandName}
                  {s.setNumber ? ` · ${s.setNumber}` : ''}
                  {s.year ? ` · ${s.year}` : ''}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
