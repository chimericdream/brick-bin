import { IconChartBar, IconChevronRight, IconSettings, IconUpload } from '@tabler/icons-react';
import Link from 'next/link';
import { eq } from 'drizzle-orm';

import { PageHead } from '@/components/layout/PageHead';
import { ThemeToggle } from '@/components/ThemeToggle';
import { requireContext } from '@/server/auth/current';
import { households } from '@/server/db/schema';

import { logoutAction } from '../../(auth)/actions';
import classes from './More.module.css';

export const dynamic = 'force-dynamic';

const ROWS = [
  {
    href: '/collection',
    label: 'Collection',
    line: 'Totals, value and what is sealed',
    icon: IconChartBar,
  },
  { href: '/import', label: 'Import', line: 'Sets from a CSV file', icon: IconUpload },
  {
    href: '/settings',
    label: 'Settings',
    line: 'Places, brands, people, catalog, activity, trash',
    icon: IconSettings,
  },
];

const ROLE = { admin: 'Admin', member: 'Member', restricted: 'Kid' } as const;

/**
 * Who is signed in, everything without a tab of its own, the theme and Sign out. The phone tab
 * bar's last tab; on a computer the sidebar's person tile leads here. A kid gets only their name,
 * the theme and Sign out.
 */
export default async function MorePage() {
  const { ctx, user } = await requireContext();
  const kid = ctx.viewer.role === 'restricted';
  // The household name is one row keyed by the session's own household, as in the app layout.
  const [household] = await ctx.db
    .select({ name: households.name })
    .from(households)
    .where(eq(households.id, ctx.householdId));

  return (
    <>
      <PageHead title="More" sub={`Signed in as ${user.name}`} />
      <div className={classes.stack}>
        <div className={classes.person}>
          <span className={classes.tile} aria-hidden>
            {user.name.slice(0, 1).toUpperCase()}
          </span>
          <div>
            <b>{user.name}</b>
            <p className={classes.muted}>
              {ROLE[user.role]}
              {household?.name ? ` · ${household.name}` : ''}
            </p>
          </div>
        </div>
        {!kid && (
          <nav className={classes.subnav} aria-label="More">
            {ROWS.map(({ href, label, line, icon: Glyph }) => (
              <Link key={href} href={href}>
                <Glyph size={20} stroke={1.75} aria-hidden />
                <span>
                  <b>{label}</b>
                  <span className={classes.muted}>{line}</span>
                </span>
                <IconChevronRight size={20} stroke={1.75} aria-hidden className={classes.chev} />
              </Link>
            ))}
          </nav>
        )}
        <section className={classes.panel} aria-labelledby="h-theme">
          <h2 id="h-theme" className={classes.h2}>
            Theme
          </h2>
          <ThemeToggle withLabels />
        </section>
        <form action={logoutAction}>
          <button type="submit" className={classes.out}>
            Sign out
          </button>
        </form>
        <p className={classes.muted}>
          Catalog data from <a href="https://rebrickable.com/">Rebrickable</a>. Brick Bin is not
          affiliated with the LEGO Group or any other brick maker.
        </p>
      </div>
    </>
  );
}
