'use client';

import {
  IconChartBar,
  IconDots,
  IconHeart,
  IconLayoutGrid,
  IconListCheck,
  IconLogout,
  IconPlus,
  IconSettings,
  IconUpload,
  type Icon,
} from '@tabler/icons-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { BrickMark } from '@/components/BrickMark';
import { ThemeToggle } from '@/components/ThemeToggle';

import { logoutAction } from '../(auth)/actions';
import classes from './Shell.module.css';

interface Props {
  user: { name: string; role: 'admin' | 'member' | 'restricted' };
  householdName: string;
  children: React.ReactNode;
}

interface NavItem {
  href: string;
  label: string;
  /** The rail and the tab bar have room for one word. */
  short: string;
  icon: Icon;
  /** The phone tab bar shows this item; the rest live under More. */
  tab?: boolean;
  /** Kid profiles get only these; the server refuses them everything else as well. */
  kid?: boolean;
}

const NAV: NavItem[] = [
  {
    href: '/sets',
    label: 'Library',
    short: 'Library',
    icon: IconLayoutGrid,
    tab: true,
    kid: true,
  },
  { href: '/missing', label: 'Shopping list', short: 'Shopping', icon: IconListCheck, tab: true },
  {
    href: '/wishlist',
    label: 'Wishlist',
    short: 'Wishlist',
    icon: IconHeart,
    tab: true,
    kid: true,
  },
  { href: '/collection', label: 'Collection', short: 'Collection', icon: IconChartBar },
  { href: '/import', label: 'Import', short: 'Import', icon: IconUpload },
];

const ROLE: Record<Props['user']['role'], string> = {
  admin: 'Admin',
  member: 'Member',
  restricted: 'Kid',
};

function NavLink({ item, active }: { item: NavItem; active: boolean }) {
  const Glyph = item.icon;
  return (
    <Link href={item.href} aria-current={active ? 'page' : undefined} aria-label={item.label}>
      <Glyph size={20} stroke={1.75} aria-hidden />
      <span className={classes.long} aria-hidden>
        {item.label}
      </span>
      <span className={classes.short} aria-hidden>
        {item.short}
      </span>
      <span className={classes.b1} aria-hidden />
    </Link>
  );
}

/**
 * The app shell. Phones: a top bar that scrolls away and a tab bar fixed to the bottom. From 768
 * a rail of icons, and from 1024 the labelled sidebar. Links a kid may not follow are not
 * rendered at all.
 */
export function Shell({ user, householdName, children }: Props) {
  const pathname = usePathname();
  const kid = user.role === 'restricted';
  const items = NAV.filter((i) => !kid || i.kid);
  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);
  const moreActive =
    isActive('/more') || isActive('/settings') || items.some((i) => !i.tab && isActive(i.href));
  const initial = user.name.slice(0, 1).toUpperCase();

  return (
    <>
      <a className={classes.skip} href="#main">
        Skip to the content
      </a>
      <div className={classes.app}>
        <header className={classes.topbar} data-noprint>
          <Link href="/sets" className={classes.logo} aria-label="Brick Bin, home">
            <BrickMark />
            <span>Brick Bin</span>
          </Link>
          <span className={classes.topHome}>{householdName}</span>
        </header>

        <aside className={classes.side} data-noprint>
          <Link href="/sets" className={classes.logo} aria-label="Brick Bin, home">
            <BrickMark />
            <span className={classes.wide}>Brick Bin</span>
          </Link>
          <p className={classes.home}>{householdName}</p>
          {!kid && (
            <Link href="/sets/new" className={`${classes.add} app-studs`} aria-label="Add set">
              <IconPlus size={20} stroke={2} aria-hidden />
              <span className={classes.wide}>Add set</span>
            </Link>
          )}
          <nav className={classes.nav} aria-label="Main">
            {items.map((item) => (
              <NavLink key={item.href} item={item} active={isActive(item.href)} />
            ))}
          </nav>
          {!kid && (
            <>
              <p className={classes.label} id="nav-household">
                Household
              </p>
              <nav className={classes.nav} aria-labelledby="nav-household">
                <NavLink
                  item={{
                    href: '/settings',
                    label: 'Settings',
                    short: 'Settings',
                    icon: IconSettings,
                  }}
                  active={isActive('/settings')}
                />
              </nav>
            </>
          )}
          <div className={classes.foot}>
            <Link href="/more" className={classes.who}>
              <span className={classes.tile} aria-hidden>
                {initial}
              </span>
              <span className={classes.whoText}>
                <b>{user.name}</b>
                <span className={classes.role}>
                  <span className="app-vh">, </span>
                  {ROLE[user.role]}
                  <span className="app-vh">. Account and theme</span>
                </span>
              </span>
            </Link>
            <div className={classes.theme}>
              <ThemeToggle />
            </div>
            <form action={logoutAction}>
              <button type="submit" className={classes.out} aria-label="Sign out">
                <IconLogout size={20} stroke={1.75} aria-hidden />
                <span className={classes.wide}>Sign out</span>
              </button>
            </form>
            <p className={classes.credit}>
              Catalog data from <a href="https://rebrickable.com/">Rebrickable</a>
            </p>
          </div>
        </aside>

        <main id="main" className={classes.main}>
          {children}
        </main>

        <nav className={`${classes.tabbar} app-studs`} aria-label="Tabs" data-noprint>
          {items
            .filter((i) => i.tab)
            .map((item, i) => {
              const Glyph = item.icon;
              return (
                <span key={item.href} className={classes.slot}>
                  {!kid && i === 2 && (
                    <Link href="/sets/new" className={`${classes.tab} ${classes.tabAdd}`}>
                      <span className={`${classes.addBrick} app-studs`}>
                        <IconPlus size={20} stroke={2.25} aria-hidden />
                      </span>
                      <span>Add</span>
                    </Link>
                  )}
                  <Link
                    href={item.href}
                    className={classes.tab}
                    aria-current={isActive(item.href) ? 'page' : undefined}
                  >
                    <Glyph size={24} stroke={1.75} aria-hidden />
                    <span>{item.short}</span>
                  </Link>
                </span>
              );
            })}
          <Link href="/more" className={classes.tab} aria-current={moreActive ? 'page' : undefined}>
            <IconDots size={24} stroke={1.75} aria-hidden />
            <span>More</span>
          </Link>
        </nav>
      </div>
    </>
  );
}
