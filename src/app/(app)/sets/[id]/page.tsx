import { Group, Text, Title } from '@mantine/core';
import { IconPencil } from '@tabler/icons-react';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { ConfirmDelete } from '@/components/ConfirmDelete';
import { LinkButton } from '@/components/Links';
import { SetCover } from '@/components/sets/SetCover';
import { centsToInput, formatMoney } from '@/lib/money';
import { requireContext } from '@/server/auth/current';
import { lastEdit } from '@/server/data/audit';
import { listCopiesForSet } from '@/server/data/copies';
import { listLocationOptions } from '@/server/data/places';
import { getSet } from '@/server/data/sets';
import { listMembers } from '@/server/data/members';

import { trashSetAction } from '../actions';
import { CopiesPanel, type CopyView } from './CopiesPanel';
import classes from './Detail.module.css';

export const dynamic = 'force-dynamic';

const shortDate = (iso: string | null) =>
  iso
    ? new Date(`${iso}T12:00:00`).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
    : null;

export default async function SetDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { ctx } = await requireContext();
  const detail = await getSet(ctx, id);
  if (!detail) notFound();
  const { set, brand, themePath, tags } = detail;
  const restricted = ctx.viewer.role === 'restricted';
  const canEdit = !restricted;

  const [cards, locations, members, edited] = await Promise.all([
    listCopiesForSet(ctx, id),
    canEdit ? listLocationOptions(ctx) : Promise.resolve([]),
    canEdit ? listMembers(ctx) : Promise.resolve([]),
    canEdit ? lastEdit(ctx, 'set', id) : Promise.resolve(null),
  ]);

  const copies: CopyView[] = cards.map((c) => ({
    id: c.copy.id,
    position: c.position,
    ownerName: c.ownerName,
    locationPath: c.locationPath,
    buildState: c.copy.buildState,
    completeness: c.completeness,
    hasBox: c.copy.hasBox,
    hasInstructions: c.copy.hasInstructions,
    conditionNotes: c.copy.conditionNotes,
    acquiredOn: c.copy.acquiredOn,
    money: restricted
      ? null
      : {
          paid: formatMoney(c.copy.pricePaidCents),
          value: formatMoney(c.copy.estimatedValueCents),
          valued: shortDate(c.copy.valuedOn),
        },
    defaults: {
      ownerUserId: c.copy.ownerUserId,
      locationId: c.copy.locationId,
      buildState: c.copy.buildState,
      piecesCheckedOn: c.copy.piecesCheckedOn,
      hasBox: c.copy.hasBox,
      hasInstructions: c.copy.hasInstructions,
      conditionNotes: c.copy.conditionNotes,
      acquiredOn: c.copy.acquiredOn,
      pricePaid: centsToInput(c.copy.pricePaidCents),
      estimatedValue: centsToInput(c.copy.estimatedValueCents),
      notes: c.copy.notes,
    },
  }));

  return (
    <>
      <nav aria-label="Breadcrumb" className={classes.crumbs}>
        <Link href="/sets">Library</Link>›<span>{brand.name}</span>
        {themePath.map((t) => (
          <span key={t.id}>› {t.name}</span>
        ))}
      </nav>
      <Group justify="space-between" align="flex-start" mt="xs" wrap="wrap">
        <div>
          <Title order={1}>{set.name}</Title>
          <Text c="dimmed">
            {brand.name}
            {set.setNumber ? ` ${set.setNumber}` : ''}
          </Text>
        </div>
        {canEdit && (
          <Group gap="xs">
            <LinkButton
              href={`/sets/${id}/edit`}
              variant="default"
              leftSection={<IconPencil size={16} />}
            >
              Edit set
            </LinkButton>
          </Group>
        )}
      </Group>

      <div className={classes.top}>
        <div>
          <SetCover setId={id} hasCover={set.coverImage !== null} alt={`${set.name} box`} eager />
        </div>
        <div>
          <dl className={classes.facts4}>
            <div>
              <dt>Year</dt>
              <dd>{set.year ?? '–'}</dd>
            </div>
            <div>
              <dt>Pieces</dt>
              <dd>{set.pieceCount?.toLocaleString('en-US') ?? '–'}</dd>
            </div>
            <div>
              <dt>Minifigs</dt>
              <dd>{set.minifigCount ?? '–'}</dd>
            </div>
            <div>
              <dt>Age</dt>
              <dd>{set.minAge ? `${set.minAge}+` : '–'}</dd>
            </div>
          </dl>
          {set.description && (
            <Text mt="sm" maw="60ch" style={{ whiteSpace: 'pre-line' }}>
              {set.description}
            </Text>
          )}
          {tags.length > 0 && (
            <Text size="sm" c="dimmed" mt="sm">
              Tags: {tags.join(', ')}
            </Text>
          )}
          {!restricted && (set.retailPriceCents !== null || set.designer) && (
            <Text size="sm" c="dimmed" mt="sm">
              {set.retailPriceCents !== null && (
                <>Retail price {formatMoney(set.retailPriceCents)}</>
              )}
              {set.retailPriceCents !== null && set.designer && ' · '}
              {set.designer && <>Designer: {set.designer}</>}
            </Text>
          )}
          {set.hiddenFromRestricted && canEdit && (
            <Text size="sm" c="dimmed" mt="sm">
              Hidden from kid profiles.
            </Text>
          )}
        </div>
      </div>

      <CopiesPanel
        setId={id}
        copies={copies}
        canEdit={canEdit}
        members={members.map((m) => ({ value: m.id, label: m.name }))}
        locations={locations}
      />

      {canEdit && (
        <Group mt="xl" justify="space-between" align="center">
          {edited ? (
            <Text size="sm" c="dimmed">
              Last edited by {edited.actorName ?? 'someone'} on{' '}
              {edited.at.toLocaleDateString('en-US', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              })}
            </Text>
          ) : (
            <span />
          )}
          <ConfirmDelete
            title={`Delete ${set.name}?`}
            triggerLabel="Delete set"
            blocked={
              copies.length > 0
                ? `This set still has ${copies.length} ${copies.length === 1 ? 'copy' : 'copies'}. Remove ${copies.length === 1 ? 'it' : 'them'} first.`
                : undefined
            }
            action={trashSetAction.bind(null, id)}
          >
            It moves to the trash. You can restore it from Settings &gt; Trash.
          </ConfirmDelete>
        </Group>
      )}
    </>
  );
}
