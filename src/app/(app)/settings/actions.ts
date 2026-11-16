'use server';

import { revalidatePath } from 'next/cache';

import { createUser } from '@/server/auth/accounts';
import { requireContext } from '@/server/auth/current';
import { createBrand, deleteBrand, updateBrand } from '@/server/data/brands';
import { assertAdmin } from '@/server/data/visibility';
import { createLocation, deleteLocation, updateLocation } from '@/server/data/places';
import { createTheme, deleteTheme, mergeThemes, renameTheme } from '@/server/data/themes';
import { purgeTrashed, restoreTrashed, isTrashKind } from '@/server/data/trash';
import { removeStored } from '@/server/storage';

export interface FormState {
  error?: string;
  ok?: boolean;
}

const str = (fd: FormData, key: string) => {
  const v = fd.get(key);
  return typeof v === 'string' ? v.trim() : '';
};
const orNull = (v: string) => (v === '' ? null : v);

const fail = (e: unknown): FormState => ({
  error:
    e instanceof Error && e.name !== 'ZodError'
      ? e.message
      : 'Check what you entered and try again.',
});

async function run(
  path: string,
  fn: (ctx: Awaited<ReturnType<typeof requireContext>>['ctx']) => Promise<FormState | void>,
) {
  const { ctx } = await requireContext();
  try {
    const result = await fn(ctx);
    if (result && result.error) return result;
  } catch (e) {
    return fail(e);
  }
  revalidatePath(path);
  return { ok: true } as FormState;
}

// Places -------------------------------------------------------------------

export async function createPlaceAction(_p: FormState, fd: FormData) {
  return run('/settings/places', (ctx) =>
    createLocation(ctx, str(fd, 'name'), orNull(str(fd, 'parentId'))).then(() => undefined),
  );
}

export async function renamePlaceAction(id: string, _p: FormState, fd: FormData) {
  return run('/settings/places', (ctx) =>
    updateLocation(ctx, id, { name: str(fd, 'name'), parentId: orNull(str(fd, 'parentId')) }).then(
      () => undefined,
    ),
  );
}

export async function deletePlaceAction(id: string) {
  return run('/settings/places', async (ctx) => {
    const r = await deleteLocation(ctx, id);
    if (r.ok) return;
    if (r.reason === 'has_copies')
      return { error: `${r.copies} copies are kept here. Move them first.` };
    if (r.reason === 'has_children')
      return { error: 'This place has sub-places. Remove or move them first.' };
    return { error: 'Place not found.' };
  });
}

// Brands -------------------------------------------------------------------

export async function createBrandAction(_p: FormState, fd: FormData) {
  return run('/settings/brands', (ctx) =>
    createBrand(ctx, { name: str(fd, 'name'), websiteUrl: str(fd, 'websiteUrl') }).then(
      () => undefined,
    ),
  );
}

export async function updateBrandAction(id: string, _p: FormState, fd: FormData) {
  return run('/settings/brands', (ctx) =>
    updateBrand(ctx, id, {
      name: str(fd, 'name'),
      websiteUrl: str(fd, 'websiteUrl'),
      notes: str(fd, 'notes'),
    }).then(() => undefined),
  );
}

export async function deleteBrandAction(id: string) {
  return run('/settings/brands', async (ctx) => {
    const r = await deleteBrand(ctx, id);
    if (r.ok) return;
    if (r.reason === 'has_sets')
      return { error: `${r.sets} sets use this brand, so it cannot be deleted.` };
    return { error: 'Brand not found.' };
  });
}

// Themes -------------------------------------------------------------------

export async function createThemeAction(_p: FormState, fd: FormData) {
  return run('/settings/brands', (ctx) =>
    createTheme(ctx, { name: str(fd, 'name'), parentId: orNull(str(fd, 'parentId')) }).then(
      () => undefined,
    ),
  );
}

export async function renameThemeAction(id: string, _p: FormState, fd: FormData) {
  return run('/settings/brands', (ctx) =>
    renameTheme(ctx, id, str(fd, 'name')).then(() => undefined),
  );
}

export async function mergeThemesAction(_p: FormState, fd: FormData) {
  return run('/settings/brands', (ctx) => mergeThemes(ctx, str(fd, 'fromId'), str(fd, 'intoId')));
}

export async function deleteThemeAction(id: string) {
  return run('/settings/brands', async (ctx) => {
    const r = await deleteTheme(ctx, id);
    if (r.ok) return;
    if (r.reason === 'in_use')
      return {
        error: `This theme has ${r.sets} sets and ${r.children} sub-themes. Merge it instead.`,
      };
    return { error: 'Theme not found.' };
  });
}

// People -------------------------------------------------------------------

export async function createUserAction(_p: FormState, fd: FormData) {
  return run('/settings/people', async (ctx) => {
    assertAdmin(ctx);
    const role = str(fd, 'role');
    if (role !== 'admin' && role !== 'member' && role !== 'restricted')
      return { error: 'Pick a role.' };
    await createUser(
      ctx.db,
      ctx.householdId,
      { name: str(fd, 'name'), email: str(fd, 'email'), password: str(fd, 'password'), role },
      ctx.viewer.userId,
    );
  });
}

// Trash --------------------------------------------------------------------

export async function restoreTrashAction(kind: string, id: string, withoutLocation = false) {
  return run('/settings/trash', async (ctx) => {
    if (!isTrashKind(kind)) return { error: 'Unknown item.' };
    const r = await restoreTrashed(ctx, kind, id, { withoutLocation });
    if (!r.ok) return { error: r.error };
    revalidatePath('/sets');
  });
}

export async function purgeTrashAction(kind: string, id: string) {
  return run('/settings/trash', async (ctx) => {
    if (!isTrashKind(kind)) return { error: 'Unknown item.' };
    const r = await purgeTrashed(ctx, kind, id);
    if (!r.ok) return { error: r.error };
    // Files go only after the row delete has committed.
    for (const file of r.files) await removeStored(file);
  });
}
