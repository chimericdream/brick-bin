import { notFound } from 'next/navigation';
import { IconChevronRight } from '@tabler/icons-react';

import { EmptyState } from '@/components/ui/EmptyState';
import { requireContext } from '@/server/auth/current';
import { listLocationOptions, listLocationsWithCounts } from '@/server/data/places';

import { createPlaceAction, deletePlaceAction, renamePlaceAction } from '../actions';
import { DeleteWithGuard, NameForm } from '../Forms';
import classes from '../Settings.module.css';

export const dynamic = 'force-dynamic';

export default async function PlacesPage() {
  const { ctx } = await requireContext();
  if (ctx.viewer.role === 'restricted') notFound();
  const [places, options] = await Promise.all([
    listLocationsWithCounts(ctx),
    listLocationOptions(ctx),
  ]);
  const depth = (id: string | null): number => {
    let d = 0;
    for (let cur = places.find((p) => p.id === id); cur?.parentId;) {
      d++;
      cur = places.find((p) => p.id === cur!.parentId);
      if (d > 20) break;
    }
    return d;
  };
  return (
    <div className={classes.stack}>
      <NameForm
        action={createPlaceAction}
        label="New place"
        placeholder="Attic"
        submit="Add place"
        parents={options}
      />
      {places.length === 0 ? (
        <EmptyState inline title="No places yet.">
          Add where your sets are kept: a room, a shelf, a bin.
        </EmptyState>
      ) : (
        <ul className={classes.list}>
          {places.map((p) => (
            <li key={p.id} data-depth={Math.min(depth(p.id), 4) || undefined}>
              <div className={classes.main}>
                <strong>{p.name}</strong>{' '}
                <span className={classes.muted}>
                  {p.copies} here{p.total !== p.copies ? ` · ${p.total} including sub-places` : ''}
                </span>
              </div>
              <DeleteWithGuard
                title={`Delete ${p.name}?`}
                triggerLabel="Delete"
                name={p.name}
                action={deletePlaceAction.bind(null, p.id)}
              >
                It moves to the trash. A place that still holds copies cannot be deleted.
              </DeleteWithGuard>
            </li>
          ))}
        </ul>
      )}
      {places.length > 0 && (
        <details className={classes.more}>
          <summary>
            <IconChevronRight size={20} stroke={1.75} aria-hidden />
            Rename or move a place
          </summary>
          {places.map((p) => (
            <div key={p.id} className={classes.morePanel}>
              <NameForm
                action={renamePlaceAction.bind(null, p.id)}
                label="Name"
                submit="Save"
                parents={options.filter((o) => o.value !== p.id)}
                defaults={{ name: p.name, parentId: p.parentId }}
              />
            </div>
          ))}
        </details>
      )}
    </div>
  );
}
