import { Text } from '@mantine/core';

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
  const entries = await recentActivity(ctx, { limit: 100 });
  return (
    <>
      <Text c="dimmed" size="sm">
        The last 100 changes. Passwords and private wishlist purchase marks never appear here.
      </Text>
      <ul className={classes.list}>
        {entries.length === 0 && (
          <li>
            <Text c="dimmed">Nothing has changed yet.</Text>
          </li>
        )}
        {entries.map((e) => (
          <li key={e.id}>
            <span>
              <strong>{e.actorName ?? 'Someone'}</strong> {describeEntry(e)}
            </span>
            <span className={classes.muted}>{when(e.at)}</span>
          </li>
        ))}
      </ul>
    </>
  );
}
