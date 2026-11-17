import { catalogThemeChain } from '../catalog/reference';
import { createBrand, listBrands } from '../data/brands';
import type { BuildState } from '../data/completeness';
import type { DataContext } from '../data/context';
import { assertCanWrite } from '../data/visibility';
import { addCopies } from '../data/copies';
import { createSet, findSetByNumber } from '../data/sets';
import { createTheme, findOrCreateThemeChain, listThemes } from '../data/themes';
import { createOwnWishlistItem } from '../data/wishlist';
import type { ImportPlan, PlannedRow } from './plan';

export interface ImportResult {
  setsCreated: number;
  copiesAdded: number;
  wishesAdded: number;
  brandsCreated: number;
}

/**
 * Writes a plan in ONE transaction: if anything fails, nothing is imported. The data-layer calls
 * open savepoints inside it and write their own audit rows, so there is one audit entry per created
 * brand, theme, set, copy and wish. Rows the plan marked as failed are skipped. No image is
 * downloaded: a bulk import must not make a request per set (docs/PLAN.md architecture rule 6).
 */
export async function commitImport(
  ctx: DataContext,
  plan: ImportPlan,
  opts: { buildState: BuildState },
): Promise<ImportResult> {
  assertCanWrite(ctx);
  const result: ImportResult = { setsCreated: 0, copiesAdded: 0, wishesAdded: 0, brandsCreated: 0 };
  await ctx.db.transaction(async (tx) => {
    const inner: DataContext = { ...ctx, db: tx as unknown as DataContext['db'] };
    const brandIds = new Map((await listBrands(inner)).map((b) => [b.name.toLowerCase(), b.id]));
    const themeIds = new Map(
      (await listThemes(inner)).filter((t) => !t.parentId).map((t) => [t.name.toLowerCase(), t.id]),
    );

    const brandFor = async (row: PlannedRow) => {
      if (row.brandId) return row.brandId;
      const known = brandIds.get((row.brandName ?? '').toLowerCase());
      if (known) return known;
      const created = await createBrand(inner, { name: row.brandName ?? '' });
      brandIds.set(created.name.toLowerCase(), created.id);
      result.brandsCreated++;
      return created.id;
    };

    const themeFor = async (row: PlannedRow) => {
      // A catalog theme keeps the catalog's whole chain, the same as adding the set by hand.
      if (row.rbThemeId !== null) {
        return findOrCreateThemeChain(inner, await catalogThemeChain(inner.db, row.rbThemeId));
      }
      if (!row.themeName) return null;
      const known = themeIds.get(row.themeName.toLowerCase());
      if (known) return known;
      const created = await createTheme(inner, { name: row.themeName });
      themeIds.set(created.name.toLowerCase(), created.id);
      return created.id;
    };

    for (const row of plan.rows) {
      if (row.failure || !row.action) continue;
      const brandId = await brandFor(row);
      if (row.action === 'wishlist') {
        await createOwnWishlistItem(inner, {
          title: row.name,
          brandId,
          setNumber: row.setNumber,
          rbSetNum: row.rbSetNum,
          notes: row.notes,
        });
        result.wishesAdded++;
        continue;
      }
      let setId = (await findSetByNumber(inner, brandId, row.setNumber))?.id ?? null;
      if (!setId) {
        const set = await createSet(inner, {
          brandId,
          setNumber: row.setNumber,
          name: row.name,
          themeId: await themeFor(row),
          year: row.year,
          pieceCount: row.pieces,
          rbSetNum: row.isLego ? row.rbSetNum : null,
          notes: null,
        });
        setId = set.id;
        result.setsCreated++;
      }
      await addCopies(
        inner,
        setId,
        { buildState: opts.buildState, pricePaidCents: row.pricePaidCents, notes: row.notes },
        row.copies,
      );
      result.copiesAdded += row.copies;
    }
  });
  return result;
}
