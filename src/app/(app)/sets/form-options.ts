import { listBrands } from '@/server/data/brands';
import type { DataContext } from '@/server/data/context';
import { listLocationOptions } from '@/server/data/places';
import { listTags } from '@/server/data/tags';
import { listThemeOptions } from '@/server/data/themes';
import { listMembers } from '@/server/data/members';

/** Everything the set and copy forms need to offer in their pickers. */
export async function loadFormOptions(ctx: DataContext) {
  const [brands, themes, locations, members, tags] = await Promise.all([
    listBrands(ctx),
    listThemeOptions(ctx),
    listLocationOptions(ctx),
    listMembers(ctx),
    listTags(ctx),
  ]);
  return {
    brands: brands.map((b) => ({ value: b.id, label: b.name })),
    themes,
    locations,
    members: members.map((m) => ({ value: m.id, label: m.name })),
    tagSuggestions: tags.map((t) => t.name),
  };
}
