import { IconEyeOff, IconPencil, IconTrash } from '@tabler/icons-react';
import { notFound } from 'next/navigation';

import { ConfirmDelete, TRASH_SENTENCE } from '@/components/ConfirmDelete';
import { LinkButton } from '@/components/Links';
import { PageHead } from '@/components/layout/PageHead';
import { Tag } from '@/components/sets/Badges';
import { SetCover } from '@/components/sets/SetCover';
import { centsToInput, formatMoney } from '@/lib/money';
import { requireContext } from '@/server/auth/current';
import { lastEdit } from '@/server/data/audit';
import { listCopiesForSet } from '@/server/data/copies';
import { listInstructions } from '@/server/data/instructions';
import { boxNumber } from '@/server/catalog/reference';
import { instructionsMaxBytes } from '@/server/instructions-config';
import { listLocationOptions } from '@/server/data/places';
import { getSet } from '@/server/data/sets';
import { listMembers } from '@/server/data/members';

import { trashSetAction } from '../actions';
import { CopiesPanel, type CopyView } from './CopiesPanel';
import { InstructionsPanel, type InstructionView } from './InstructionsPanel';
import { ResyncButton } from './ResyncButton';
import classes from './Detail.module.css';

export const dynamic = 'force-dynamic';

const shortDate = (iso: string | null) =>
  iso
    ? new Date(`${iso}T12:00:00`).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
    : null;

/** A missing value is a muted dash. */
const Dash = () => <span className={classes.muted}>—</span>;

export default async function SetDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { ctx } = await requireContext();
  const detail = await getSet(ctx, id);
  if (!detail) notFound();
  const { set, brand, themePath, tags } = detail;
  const restricted = ctx.viewer.role === 'restricted';
  const canEdit = !restricted;

  const [cards, locations, members, edited, instructionRows] = await Promise.all([
    listCopiesForSet(ctx, id),
    canEdit ? listLocationOptions(ctx) : Promise.resolve([]),
    canEdit ? listMembers(ctx) : Promise.resolve([]),
    canEdit ? lastEdit(ctx, 'set', id) : Promise.resolve(null),
    listInstructions(ctx, id),
  ]);

  const sizeText = (bytes: number | null) =>
    bytes === null
      ? ''
      : bytes >= 1e6
        ? `${(bytes / 1e6).toFixed(1)} MB`
        : `${Math.round(bytes / 1e3)} KB`;
  const host = (u: string | null) => {
    try {
      return u ? new URL(u).hostname : null;
    } catch {
      return null;
    }
  };
  const instructions: InstructionView[] = instructionRows.map((i) => ({
    id: i.id,
    kind: i.kind,
    label: i.label,
    detail:
      i.kind === 'file'
        ? `${sizeText(i.fileBytes)} · added ${i.createdAt.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}`
        : (host(i.url) ?? ''),
    href: i.kind === 'file' ? `/api/instructions/${i.id}` : (i.url ?? '#'),
    sourceHost: i.kind === 'file' ? host(i.sourceUrl) : null,
  }));
  // A link to the maker's own instructions page. Nothing is fetched from it.
  const find =
    brand.isLego && set.setNumber
      ? {
          label: 'Find on LEGO.com',
          href: `https://www.lego.com/service/buildinginstructions/${encodeURIComponent(boxNumber(set.setNumber))}`,
        }
      : brand.websiteUrl
        ? { label: `Find on ${brand.name} site`, href: brand.websiteUrl }
        : null;

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

  // Money never reaches a kid's page: the rows are only built for people who may edit.
  const showRetail = !restricted && set.retailPriceCents !== null;
  const showDesigner = !restricted && Boolean(set.designer);
  const showCatalog = Boolean(set.rbSetNum && brand.isLego && canEdit);
  const showHidden = set.hiddenFromRestricted && canEdit;
  const hasKv = showRetail || showDesigner || tags.length > 0 || showCatalog || showHidden;

  return (
    <>
      <PageHead
        crumbs={[
          { label: 'Library', href: '/sets' },
          { label: brand.name },
          ...themePath.map((t) => ({ label: t.name })),
        ]}
        title={set.name}
        sub={
          <>
            {brand.name}
            {set.setNumber && (
              <>
                {' '}
                <span className="app-mono">{set.setNumber}</span>
              </>
            )}
          </>
        }
        actions={
          canEdit && (
            <LinkButton
              href={`/sets/${id}/edit`}
              variant="default"
              leftSection={<IconPencil size={20} stroke={1.75} />}
            >
              Edit set
            </LinkButton>
          )
        }
      />

      <section className={classes.about} aria-label="About this set">
        <div className={classes.cover}>
          <SetCover
            setId={id}
            hasCover={set.coverImage !== null}
            alt={`Box art for ${set.name}`}
            eager
          />
        </div>
        <div className={classes.aboutText}>
          <dl className={classes.facts}>
            <div>
              <dt>Year</dt>
              <dd>{set.year ?? <Dash />}</dd>
            </div>
            <div>
              <dt>Pieces</dt>
              <dd>{set.pieceCount?.toLocaleString('en-US') ?? <Dash />}</dd>
            </div>
            <div>
              <dt>Minifigs</dt>
              <dd>{set.minifigCount ?? <Dash />}</dd>
            </div>
            <div>
              <dt>Age</dt>
              <dd>{set.minAge ? `${set.minAge}+` : <Dash />}</dd>
            </div>
          </dl>
          {hasKv && (
            <dl className={`${classes.kv} ${classes.kvPanel}`}>
              {showRetail && (
                <>
                  <dt>Retail price</dt>
                  <dd className="app-num">{formatMoney(set.retailPriceCents)}</dd>
                </>
              )}
              {showDesigner && (
                <>
                  <dt>Designer</dt>
                  <dd>{set.designer}</dd>
                </>
              )}
              {tags.length > 0 && (
                <>
                  <dt>Tags</dt>
                  <dd className={classes.chips}>
                    {tags.map((t) => (
                      <Tag key={t} variant="quiet">
                        {t}
                      </Tag>
                    ))}
                  </dd>
                </>
              )}
              {showCatalog && (
                <>
                  <dt>Catalog</dt>
                  <dd>
                    Linked to Rebrickable <span className="app-mono">{set.rbSetNum}</span>. Catalog
                    data from <a href="https://rebrickable.com/">Rebrickable</a>.
                    <div className={classes.resync}>
                      <ResyncButton setId={id} setNum={set.rbSetNum!} />
                    </div>
                  </dd>
                </>
              )}
              {showHidden && (
                <>
                  <dt>Kid profiles</dt>
                  <dd>
                    <Tag>
                      <IconEyeOff size={16} stroke={1.75} aria-hidden />
                      Hidden from kids
                    </Tag>
                  </dd>
                </>
              )}
            </dl>
          )}
          {set.description && <p className={classes.description}>{set.description}</p>}
        </div>
      </section>

      <CopiesPanel
        setId={id}
        copies={copies}
        canEdit={canEdit}
        members={members.map((m) => ({ value: m.id, label: m.name }))}
        locations={locations}
      />

      <InstructionsPanel
        setId={id}
        items={instructions}
        canEdit={canEdit}
        maxMb={Math.round(instructionsMaxBytes() / 1_048_576)}
        find={find}
      />

      {canEdit && (
        <div className={classes.bottom}>
          {edited ? (
            <p className={classes.small}>
              Last edited by {edited.actorName ?? 'someone'} on{' '}
              {edited.at.toLocaleDateString('en-US', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              })}
            </p>
          ) : (
            <span />
          )}
          <ConfirmDelete
            title={`Delete ${set.name}?`}
            triggerLabel="Delete set"
            triggerLeftSection={<IconTrash size={16} stroke={1.75} />}
            blocked={
              copies.length > 0
                ? `This set still has ${copies.length} ${copies.length === 1 ? 'copy' : 'copies'}. Remove ${copies.length === 1 ? 'it' : 'them'} first.`
                : undefined
            }
            action={trashSetAction.bind(null, id)}
          >
            {TRASH_SENTENCE}
          </ConfirmDelete>
        </div>
      )}
    </>
  );
}
