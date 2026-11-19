import { ConfirmDelete } from '@/components/ConfirmDelete';
import { PageHead } from '@/components/layout/PageHead';
import { Note } from '@/components/Note';
import { EmptyState } from '@/components/ui/EmptyState';
import ui from '@/components/ui/ui.module.css';
import { centsToInput, formatMoney } from '@/lib/money';
import { requireContext } from '@/server/auth/current';
import { listBrands } from '@/server/data/brands';
import { listRemovedForMe, listWishlists, type WishView } from '@/server/data/wishlist';

import { loadLookup } from '../sets/form-options';
import { dismissRemovedAction, removeWishAction } from './actions';
import { DismissButton } from './DismissButton';
import { AddWish, AddWishSheet, BoughtButton, EditWish, GotItButton } from './WishForms';
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
      <li key={w.id} className={classes.wish}>
        {w.hasCover ? (
          <span className={classes.cover}>
            {/* oxlint-disable-next-line nextjs/no-img-element */}
            <img src={`/api/wishlist/${w.id}/cover`} alt="" />
          </span>
        ) : (
          <span className={`${classes.cover} app-baseplate`}>
            <span className="app-vh">No cover</span>
          </span>
        )}
        <div className={classes.body}>
          <h3 className={classes.name}>{w.title}</h3>
          <p className={classes.meta}>
            {w.brandName}
            {w.brandName && w.setNumber && ' · '}
            {w.setNumber && <span className="app-mono">{w.setNumber}</span>}
            {w.priceCents !== null && (
              <>
                {(w.brandName || w.setNumber) && ' · '}
                <span className="app-num">{formatMoney(w.priceCents)}</span>
              </>
            )}
          </p>
          {w.notes && <p className={classes.notes}>{w.notes}</p>}
          {w.url && (
            <p className={classes.notes}>
              <a href={w.url} target="_blank" rel="noopener noreferrer">
                Link
              </a>
            </p>
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

  const addProps = {
    catalogReady: lookup.catalogReady,
    canImport: lookup.canImport,
    legoBrandId: lookup.legoBrandId,
    showPrice: !kid,
  };

  return (
    <>
      <PageHead
        title="Wishlist"
        sub={
          kid
            ? 'Your list. The rest of the household can see it.'
            : 'Everyone’s lists. Purchase marks stay private.'
        }
        actions={
          <span className={classes.narrowOnly}>
            <AddWishSheet {...addProps} />
          </span>
        }
      />

      <div className={classes.layout}>
        <div className={ui.stack}>
          {removed.length > 0 && (
            <section aria-labelledby="h-removed" className={ui.stack}>
              <div className={ui.sectionHead}>
                <h2 id="h-removed">Removed from the list</h2>
              </div>
              <Note>
                You marked these as bought, then they were taken off the list. Only you can see
                this.
              </Note>
              <ul className={`${ui.panel} ${ui.rows}`}>
                {removed.map((r) => (
                  <li key={r.id} className={ui.row}>
                    <div className={ui.rowMain}>
                      <p className={ui.rowTitle}>{r.title}</p>
                      <p className={ui.small}>
                        {r.requesterName}&rsquo;s wish · you bought it on {r.purchasedOn}
                        {r.note ? ` · ${r.note}` : ''}
                      </p>
                    </div>
                    <DismissButton action={dismissRemovedAction.bind(null, r.id)} />
                  </li>
                ))}
              </ul>
            </section>
          )}

          {lists.map((l) => (
            <section key={l.userId} aria-labelledby={`h-${l.userId}`} className={classes.person}>
              <div className={ui.sectionHead}>
                <h2 id={`h-${l.userId}`}>{l.isMe ? 'My wishlist' : `${l.name}’s wishlist`}</h2>
              </div>
              {l.items.length === 0 ? (
                l.isMe ? (
                  <EmptyState
                    title="Nothing on your list yet."
                    actions={
                      <span className={classes.narrowOnly}>
                        <AddWishSheet {...addProps} />
                      </span>
                    }
                  >
                    <p>
                      Add a set you have your eye on. The rest of the household can see it, and
                      nobody can see who has already bought it.
                    </p>
                  </EmptyState>
                ) : (
                  <EmptyState inline title="Nothing on this list yet." />
                )
              ) : (
                <ul className={`${ui.panel} ${ui.rows}`}>{l.items.map((w) => renderItem(w))}</ul>
              )}
            </section>
          ))}
        </div>

        <aside className={classes.formColumn} aria-labelledby="h-add">
          <h2 id="h-add" className={classes.formTitle}>
            Add to my wishlist
          </h2>
          <AddWish {...addProps} />
        </aside>
      </div>
    </>
  );
}
