import { notFound } from 'next/navigation';
import { Text, Title } from '@mantine/core';

import { requireContext } from '@/server/auth/current';
import { listBrandsWithCounts } from '@/server/data/brands';
import { listThemeOptions, listThemesWithCounts } from '@/server/data/themes';

import {
  createBrandAction,
  createThemeAction,
  deleteBrandAction,
  deleteThemeAction,
  mergeThemesAction,
  renameThemeAction,
  updateBrandAction,
} from '../actions';
import { DeleteWithGuard, MergeThemesForm, NameForm } from '../Forms';
import classes from '../Settings.module.css';

export const dynamic = 'force-dynamic';

export default async function BrandsPage() {
  const { ctx } = await requireContext();
  if (ctx.viewer.role === 'restricted') notFound();
  const [brands, themes, themeOptions] = await Promise.all([
    listBrandsWithCounts(ctx),
    listThemesWithCounts(ctx),
    listThemeOptions(ctx),
  ]);
  const label = new Map(themeOptions.map((o) => [o.value, o.label]));
  return (
    <>
      <Title order={2} size="h3">
        Brands
      </Title>
      <NameForm
        action={createBrandAction}
        label="New brand"
        placeholder="Mould King"
        submit="Add brand"
        extra={[['websiteUrl', 'Website (optional)']]}
      />
      <ul className={classes.list}>
        {brands.map((b) => (
          <li key={b.id}>
            <div>
              <strong>{b.name}</strong>{' '}
              <span className={classes.muted}>
                {b.sets} {b.sets === 1 ? 'set' : 'sets'}
                {b.isLego ? ' · catalog lookup on' : ''}
              </span>
            </div>
            <DeleteWithGuard
              title={`Delete ${b.name}?`}
              triggerLabel="Delete"
              action={deleteBrandAction.bind(null, b.id)}
              confirmLabel="Delete brand"
            >
              An unused brand is deleted for good. A brand that has sets cannot be deleted.
            </DeleteWithGuard>
          </li>
        ))}
      </ul>
      <details className={classes.section}>
        <summary>Rename a brand</summary>
        {brands.map((b) => (
          <div key={b.id} style={{ marginTop: 12 }}>
            <NameForm
              action={updateBrandAction.bind(null, b.id)}
              label="Name"
              submit="Save"
              defaults={{ name: b.name }}
              extra={[['websiteUrl', 'Website', b.websiteUrl ?? '']]}
            />
          </div>
        ))}
      </details>

      <section className={classes.section}>
        <Title order={2} size="h3">
          Themes
        </Title>
        <Text size="sm" c="dimmed" mb="sm">
          Themes can nest, like Star Wars › Ultimate Collector Series. Only themes you own sets in
          show up as library filters.
        </Text>
        <NameForm
          action={createThemeAction}
          label="New theme"
          placeholder="Technic"
          submit="Add theme"
          parents={themeOptions}
        />
        <ul className={classes.list}>
          {themes.length === 0 && (
            <li>
              <Text c="dimmed">No themes yet.</Text>
            </li>
          )}
          {themeOptions.map((o) => {
            const t = themes.find((x) => x.id === o.value)!;
            return (
              <li key={o.value}>
                <div>
                  <strong>{o.label}</strong>{' '}
                  <span className={classes.muted}>
                    {t.sets} {t.sets === 1 ? 'set' : 'sets'}
                  </span>
                </div>
                <DeleteWithGuard
                  title={`Delete ${t.name}?`}
                  triggerLabel="Delete"
                  action={deleteThemeAction.bind(null, t.id)}
                  confirmLabel="Delete theme"
                >
                  An unused theme is deleted for good. To remove one with sets, merge it into
                  another.
                </DeleteWithGuard>
              </li>
            );
          })}
        </ul>
        {themes.length > 1 && (
          <details className={classes.section}>
            <summary>Merge two themes</summary>
            <MergeThemesForm action={mergeThemesAction} themes={themeOptions} />
          </details>
        )}
        {themes.length > 0 && (
          <details className={classes.section}>
            <summary>Rename a theme</summary>
            {themes.map((t) => (
              <div key={t.id} style={{ marginTop: 12 }}>
                <NameForm
                  action={renameThemeAction.bind(null, t.id)}
                  label={label.get(t.id) ?? t.name}
                  submit="Rename"
                  defaults={{ name: t.name }}
                />
              </div>
            ))}
          </details>
        )}
      </section>
    </>
  );
}
