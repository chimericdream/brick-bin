import { notFound } from 'next/navigation';

import { centsToInput } from '@/lib/money';
import { requireContext } from '@/server/auth/current';
import { getSet } from '@/server/data/sets';

import { saveSetAction } from '../../actions';
import { loadFormOptions } from '../../form-options';
import { SetForm } from '../../SetForm';

export const dynamic = 'force-dynamic';

export default async function EditSetPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { ctx } = await requireContext();
  if (ctx.viewer.role === 'restricted') notFound();
  const detail = await getSet(ctx, id);
  if (!detail) notFound();
  const { set } = detail;
  const options = await loadFormOptions(ctx);
  return (
    <>
      <h1>Edit set</h1>
      <SetForm
        action={saveSetAction.bind(null, id)}
        setId={id}
        {...options}
        defaults={{
          brandId: set.brandId,
          setNumber: set.setNumber,
          name: set.name,
          themeId: set.themeId,
          year: set.year,
          pieceCount: set.pieceCount,
          minifigCount: set.minifigCount,
          minAge: set.minAge,
          description: set.description,
          retailPrice: centsToInput(set.retailPriceCents),
          designer: set.designer,
          notes: set.notes,
          hiddenFromRestricted: set.hiddenFromRestricted,
          tags: detail.tags,
        }}
      />
    </>
  );
}
