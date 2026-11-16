import { Text } from '@mantine/core';

import { requireContext } from '@/server/auth/current';
import { listLocationOptions, listLocationsWithCounts } from '@/server/data/places';

import { createPlaceAction, deletePlaceAction, renamePlaceAction } from '../actions';
import { DeleteWithGuard, NameForm } from '../Forms';
import classes from '../Settings.module.css';

export const dynamic = 'force-dynamic';

export default async function PlacesPage() {
  const { ctx } = await requireContext();
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
    <>
      <NameForm
        action={createPlaceAction}
        label="New place"
        placeholder="Attic"
        submit="Add place"
        parents={options}
      />
      <ul className={classes.list}>
        {places.length === 0 && (
          <li>
            <Text c="dimmed">
              No places yet. Add where your sets are kept: a room, a shelf, a bin.
            </Text>
          </li>
        )}
        {places.map((p) => (
          <li key={p.id} style={{ paddingLeft: 16 + depth(p.id) * 24 }}>
            <div>
              <strong>{p.name}</strong>{' '}
              <span className={classes.muted}>
                {p.copies} here{p.total !== p.copies ? ` · ${p.total} including sub-places` : ''}
              </span>
            </div>
            <DeleteWithGuard
              title={`Delete ${p.name}?`}
              triggerLabel="Delete"
              action={deletePlaceAction.bind(null, p.id)}
            >
              It moves to the trash. A place that still holds copies cannot be deleted.
            </DeleteWithGuard>
          </li>
        ))}
      </ul>
      {places.length > 0 && (
        <details className={classes.section}>
          <summary>Rename or move a place</summary>
          {places.map((p) => (
            <div key={p.id} style={{ marginTop: 12 }}>
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
    </>
  );
}
