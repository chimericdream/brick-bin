import { notFound } from 'next/navigation';

import { EmptyState } from '@/components/ui/EmptyState';
import { describeEntry } from '@/lib/activity';
import { requireContext } from '@/server/auth/current';
import { recentActivity } from '@/server/data/audit';

import classes from '../Settings.module.css';

export const dynamic = 'force-dynamic';

const when = (d: Date) =>
  d.toLocaleString('en-US', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });

export default async function ActivityPage() {
  const { ctx } = await requireContext();
  if (ctx.viewer.role === 'restricted') notFound();
  const entries = await recentActivity(ctx, { limit: 100 });
  return (
    <div className={classes.stack}>
      <p className={classes.muted}>
        The last 100 changes. Passwords and private wishlist purchase marks never appear here.
      </p>
      {entries.length === 0 ? (
        <EmptyState title="Nothing has happened yet.">
          <p>Add a set, move a copy, rename a place: each change is noted here with who made it.</p>
        </EmptyState>
      ) : (
        <ul className={classes.list}>
          {entries.map((e) => (
            <li key={e.id} className={classes.activity}>
              <span className={`${classes.who} ${classes.whoSm}`} aria-hidden>
                {(e.actorName ?? 'S').slice(0, 1).toUpperCase()}
              </span>
              <span className={classes.main}>
                <strong>{e.actorName ?? 'Someone'}</strong> {describeEntry(e)}
              </span>
              <span className={classes.time}>{when(e.at)}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
