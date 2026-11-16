import type { AuditEntry } from '@/server/data/audit';

const ENTITY: Record<string, string> = {
  set: 'set',
  copy: 'copy',
  missing_item: 'missing piece',
  instruction: 'instructions',
  wishlist_item: 'wishlist item',
  location: 'place',
  brand: 'brand',
  theme: 'theme',
  tag: 'tag',
  user: 'person',
  catalog_run: 'catalog import',
};

const FIELD: Record<string, string> = {
  name: 'name',
  setNumber: 'set number',
  brandId: 'brand',
  themeId: 'theme',
  year: 'year',
  pieceCount: 'piece count',
  minifigCount: 'minifig count',
  minAge: 'minimum age',
  description: 'description',
  retailPriceCents: 'retail price',
  designer: 'designer',
  notes: 'notes',
  coverImage: 'cover',
  hiddenFromRestricted: 'kid visibility',
  tags: 'tags',
  buildState: 'build state',
  ownerUserId: 'owner',
  locationId: 'place',
  piecesCheckedOn: 'piece check',
  hasBox: 'box',
  hasInstructions: 'booklets',
  conditionNotes: 'condition notes',
  acquiredOn: 'date acquired',
  pricePaidCents: 'price paid',
  estimatedValueCents: 'estimated value',
  valuedOn: 'valuation date',
  parentId: 'parent',
  websiteUrl: 'website',
};

const BUILD_LABEL: Record<string, string> = {
  sealed: 'Sealed',
  opened: 'Opened',
  in_progress: 'In progress',
  built: 'Built',
  disassembled: 'Disassembled',
  mixed: 'Mixed',
};

/** The name a row goes by in the feed, from whichever identifying field its entry carries. */
function label(entry: AuditEntry): string | null {
  for (const key of ['name', 'title']) {
    const pair = entry.changes[key];
    const v = pair ? (pair[1] ?? pair[0]) : null;
    if (typeof v === 'string') return v;
  }
  return null;
}

const fields = (entry: AuditEntry) => {
  const names = [
    ...new Set(
      Object.keys(entry.changes)
        .filter((k) => !['deletedAt', 'permanent', 'automatic', 'mergedInto'].includes(k))
        .map((k) => FIELD[k] ?? k),
    ),
  ];
  return names.length <= 3 ? names.join(', ') : `${names.slice(0, 3).join(', ')} and more`;
};

/** One sentence for the activity feed, without the actor ("added the set Titanic"). */
export function describeEntry(entry: AuditEntry): string {
  const noun = ENTITY[entry.entityType] ?? entry.entityType;
  const name = label(entry);
  const named = name ? ` ${name}` : '';
  const build = entry.changes.buildState;
  if (entry.entityType === 'copy' && build && entry.action === 'update') {
    const [from, to] = build as [string | null, string | null];
    return `changed a copy from ${BUILD_LABEL[from ?? ''] ?? from} to ${BUILD_LABEL[to ?? ''] ?? to}`;
  }
  const deleted = entry.changes.deletedAt;
  if (deleted) {
    return deleted[1] === null
      ? `restored the ${noun}${named}`
      : `moved the ${noun}${named} to the trash`;
  }
  if (entry.changes.permanent) return `deleted the ${noun}${named} for good`;
  if (entry.action === 'create') return `added the ${noun}${named}`;
  if (entry.action === 'delete') return `deleted the ${noun}${named}`;
  const what = fields(entry);
  return `changed the ${what || 'details'} of the ${noun}${named}`;
}
