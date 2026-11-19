import { notFound } from 'next/navigation';

import { PageHead } from '@/components/layout/PageHead';
import { CompletenessBadge, StateTag } from '@/components/sets/Badges';
import { getCatalogColors, partImageColors, pickImageColor } from '@/server/catalog/reference';
import { requireContext } from '@/server/auth/current';
import { completenessOf } from '@/server/data/completeness';
import { getCopyContext } from '@/server/data/copies';
import { listMissing } from '@/server/data/missing';

import { MissingList, type MissingRow } from './MissingList';
import { MissingPicker } from './MissingPicker';

export const dynamic = 'force-dynamic';

export default async function MissingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { ctx } = await requireContext();
  const copy = await getCopyContext(ctx, id);
  if (!copy) notFound();
  const canEdit = ctx.viewer.role !== 'restricted';

  const { open, resolved } = await listMissing(ctx, id);
  const all = [...open, ...resolved];
  const [colors, images] = await Promise.all([
    getCatalogColors(
      ctx.db,
      all.flatMap((r) => (r.rbColorId === null ? [] : [r.rbColorId])),
    ),
    partImageColors(ctx.db, [...new Set(all.flatMap((r) => (r.rbPartNum ? [r.rbPartNum] : [])))]),
  ]);

  const view = (r: (typeof all)[number]): MissingRow => {
    const color = r.rbColorId === null ? null : colors.get(r.rbColorId);
    return {
      id: r.id,
      kind: r.kind,
      title: r.snapshotName ?? r.description ?? 'Piece',
      partNum: r.rbPartNum,
      figNum: r.rbFigNum,
      colorId: r.rbColorId,
      colorName: r.snapshotColorName,
      rgb: color?.rgb ?? null,
      imageColorId:
        r.rbPartNum && r.rbColorId !== null
          ? pickImageColor(images.get(r.rbPartNum) ?? [], r.rbColorId)
          : null,
      imageColorName:
        r.rbPartNum && r.rbColorId !== null
          ? (() => {
              const used = pickImageColor(images.get(r.rbPartNum!) ?? [], r.rbColorId!);
              return used !== null && used !== r.rbColorId
                ? (colors.get(used)?.name ?? `color ${used}`)
                : null;
            })()
          : null,
      quantity: r.quantity,
      resolution: r.resolution,
      notes: r.notes,
    };
  };

  const missingTotal = open.reduce((n, r) => n + r.quantity, 0);
  const completeness = completenessOf({
    buildState: copy.copy.buildState,
    piecesCheckedOn: copy.copy.piecesCheckedOn,
    missingPieces: missingTotal,
  });

  return (
    <>
      <PageHead
        crumbs={[
          { label: 'Library', href: '/sets' },
          { label: copy.set.name, href: `/sets/${copy.set.id}` },
        ]}
        title="Missing pieces"
        sub={
          <>
            {copy.set.name}
            {copy.total > 1 ? ` · copy ${copy.position} of ${copy.total}` : ''}
          </>
        }
        extra={
          <>
            <StateTag state={copy.copy.buildState} />
            <CompletenessBadge completeness={completeness} />
          </>
        }
      />

      <MissingList
        copyId={id}
        setId={copy.set.id}
        open={open.map(view)}
        resolved={resolved.map(view)}
        canEdit={canEdit}
        checkedOn={copy.copy.piecesCheckedOn}
        sealed={copy.copy.buildState === 'sealed'}
      />

      {canEdit && (
        <MissingPicker
          copyId={id}
          setId={copy.set.id}
          linked={Boolean(copy.set.rbSetNum) && copy.brand.isLego}
          setNum={copy.set.rbSetNum}
        />
      )}
    </>
  );
}
