import { Text } from '@mantine/core';
import { notFound } from 'next/navigation';

import { requireContext } from '@/server/auth/current';
import { listTrash, purgeDate, retentionDays } from '@/server/data/trash';

import { TrashRow } from './TrashRow';
import classes from '../Settings.module.css';

export const dynamic = 'force-dynamic';

const day = (d: Date) =>
  d.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });

export default async function TrashPage() {
  const { ctx } = await requireContext();
  if (ctx.viewer.role === 'restricted') notFound();
  const items = await listTrash(ctx);
  const days = retentionDays();
  return (
    <>
      <Text c="dimmed" size="sm">
        {days > 0
          ? `Deleted items stay here for ${days} days, then are removed for good.`
          : 'Deleted items stay here until an admin deletes them for good.'}
        {ctx.viewer.role !== 'admin' && ' You see what you deleted yourself.'}
      </Text>
      <ul className={classes.list}>
        {items.length === 0 && (
          <li>
            <Text c="dimmed">The trash is empty.</Text>
          </li>
        )}
        {items.map((i) => {
          const purgeOn = purgeDate(i.deletedAt, days);
          return (
            <li key={`${i.kind}-${i.id}`}>
              <div>
                <strong>{i.title}</strong>
                <div className={classes.muted}>
                  {i.detail} · deleted {day(i.deletedAt)}
                  {i.deletedByName ? ` by ${i.deletedByName}` : ''}
                  {purgeOn ? ` · removed for good ${day(purgeOn)}` : ''}
                </div>
              </div>
              <TrashRow
                kind={i.kind}
                id={i.id}
                title={i.title}
                canRestore={i.canRestore}
                canPurge={ctx.viewer.role === 'admin'}
              />
            </li>
          );
        })}
      </ul>
    </>
  );
}
