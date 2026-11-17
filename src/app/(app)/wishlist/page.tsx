import { Alert, Text, Title } from '@mantine/core';

import { ConfirmDelete } from '@/components/ConfirmDelete';
import { centsToInput, formatMoney } from '@/lib/money';
import { requireContext } from '@/server/auth/current';
import { listBrands } from '@/server/data/brands';
import { listRemovedForMe, listWishlists, type WishView } from '@/server/data/wishlist';

import { loadLookup } from '../sets/form-options';
import { dismissRemovedAction, removeWishAction } from './actions';
import { DismissButton } from './DismissButton';
import { AddWish, BoughtButton, EditWish, GotItButton } from './WishForms';
import classes from './Wishlist.module.css';

export const dynamic = 'force-dynamic';

export default async function WishlistPage() {
  const { ctx } = await requireContext();
  const kid = ctx.viewer.role === 'restricted';
  const admin = ctx.viewer.role === 'admin';
  const [lists, removed, lookup, brands] = await Promise.all([
    listWishlists(ctx),
    listRemovedForMe(ctx),
    loadLookup(ctx),
    kid ? Promise.resolve([]) : listBrands(ctx),
  ]);
  const brandOptions = brands.map((b) => ({ value: b.id, label: b.name }));

  function renderItem(w: WishView) {
    const canEdit = w.mine || admin;
    return (
      <li key={w.id} className={classes.item}>
        {w.hasCover ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img className={classes.cover} src={`/api/wishlist/${w.id}/cover`} alt="" />
        ) : (
          <div className={classes.noCover} aria-hidden>
            No image
          </div>
        )}
        <div>
          <strong>{w.title}</strong>
          <div className={classes.meta}>
            {[w.brandName, w.setNumber, w.priceCents !== null ? formatMoney(w.priceCents) : null]
              .filter(Boolean)
              .join(' · ')}
          </div>
          {w.notes && <div className={classes.meta}>{w.notes}</div>}
          {w.url && (
            <div className={classes.meta}>
              <a href={w.url} target="_blank" rel="noopener noreferrer">
                Link
              </a>
            </div>
          )}
          <div className={classes.actions}>
            {!kid && !w.mine && <BoughtButton id={w.id} title={w.title} mark={w.myPurchase} />}
            {!kid && (
              <GotItButton
                id={w.id}
                title={w.title}
                brands={brandOptions}
                defaultBrandId={w.brandId ?? (w.rbSetNum ? (lookup.legoBrandId ?? null) : null)}
              />
            )}
            {canEdit && (
              <EditWish
                id={w.id}
                showPrice={!kid}
                d={{
                  title: w.title,
                  setNumber: w.setNumber,
                  rbSetNum: w.rbSetNum,
                  brandId: w.brandId,
                  url: w.url,
                  price: centsToInput(w.priceCents),
                  notes: w.notes,
                }}
              />
            )}
            {canEdit && (
              <ConfirmDelete
                compact
                title={`Remove ${w.title}?`}
                triggerLabel="Remove"
                action={removeWishAction.bind(null, w.id)}
              >
                It leaves the wishlist and goes to the trash, where it can be restored.
              </ConfirmDelete>
            )}
          </div>
        </div>
      </li>
    );
  }

  return (
    <>
      <Title order={1}>Wishlist</Title>

      {removed.length > 0 && (
        <section aria-labelledby="h-removed" className={classes.person}>
          <h2 id="h-removed">Removed from the list</h2>
          <Alert color="yellow" variant="light" mb="sm">
            You marked these as bought, then they were taken off the list. Only you can see this.
          </Alert>
          <ul className={classes.list}>
            {removed.map((r) => (
              <li key={r.id} className={classes.item} style={{ gridTemplateColumns: '1fr' }}>
                <div>
                  <strong>{r.title}</strong>
                  <div className={classes.meta}>
                    {r.requesterName}&rsquo;s wish · you bought it on {r.purchasedOn}
                    {r.note ? ` · ${r.note}` : ''}
                  </div>
                  <div className={classes.actions}>
                    <DismissButton action={dismissRemovedAction.bind(null, r.id)} />
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section aria-labelledby="h-add" className={classes.person}>
        <h2 id="h-add">Add to my wishlist</h2>
        <AddWish
          catalogReady={lookup.catalogReady}
          canImport={lookup.canImport}
          legoBrandId={lookup.legoBrandId}
          showPrice={!kid}
        />
      </section>

      {lists.map((l) => (
        <section key={l.userId} aria-labelledby={`h-${l.userId}`} className={classes.person}>
          <h2 id={`h-${l.userId}`}>{l.isMe ? 'My wishlist' : `${l.name}’s wishlist`}</h2>
          {l.items.length === 0 ? (
            <Text className={classes.empty}>
              {l.isMe ? 'Nothing on your list yet.' : 'Nothing on this list yet.'}
            </Text>
          ) : (
            <ul className={classes.list}>{l.items.map((w) => renderItem(w))}</ul>
          )}
        </section>
      ))}
    </>
  );
}
