'use client';

import { Avatar, Button } from '@mantine/core';
import {
  IconDots,
  IconHeart,
  IconLayoutGrid,
  IconListDetails,
  IconLogout,
  IconPlus,
  IconSettings,
  IconUpload,
  IconChartBar,
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
  icon: Icon;
  /** Phone tab bar shows this item directly; everything else lives under More. */
  tab?: boolean;
}

const NAV: NavItem[] = [
  { href: '/sets', label: 'Library', icon: IconLayoutGrid, tab: true },
  { href: '/missing', label: 'Shopping list', icon: IconListDetails, tab: true },
  { href: '/wishlist', label: 'Wishlist', icon: IconHeart, tab: true },
  { href: '/collection', label: 'Collection', icon: IconChartBar },
  { href: '/import', label: 'Import', icon: IconUpload },
];

/** Restricted (kid) profiles see only the library and their own wishlist. */
const RESTRICTED_NAV = new Set(['/sets', '/wishlist']);

export function Shell({ user, householdName, children }: Props) {
  const pathname = usePathname();
  const restricted = user.role === 'restricted';
  const items = NAV.filter(({ href }) => !restricted || RESTRICTED_NAV.has(href));
  const tabs = items.filter((i) => i.tab);
  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);
  const moreActive =
    !restricted &&
    (pathname.startsWith('/more') ||
      pathname.startsWith('/settings') ||
      items.some((i) => !i.tab && isActive(i.href)));

  return (
    <div className={classes.root}>
      <aside className={classes.side} data-noprint>
        <Link href="/sets" className={classes.brand}>
          <BrickMark size={30} />
          Brick Bin
        </Link>
        <div className={classes.household}>
          <strong>{householdName}</strong>
        </div>
        {!restricted && (
          <Link href="/sets/new" className={classes.addButton}>
            <IconPlus size={18} aria-hidden /> Add set
          </Link>
        )}
        <nav aria-label="Main" className={classes.nav}>
          {items.map(({ href, label, icon: Glyph }) => (
            <Link
              key={href}
              href={href}
              data-active={isActive(href) || undefined}
              aria-current={isActive(href) ? 'page' : undefined}
            >
              <Glyph size={20} stroke={1.8} aria-hidden />
              {label}
            </Link>
          ))}
          {!restricted && (
            <>
              <div className={classes.group}>Household</div>
              <Link
                href="/settings"
                data-active={isActive('/settings') || undefined}
                aria-current={isActive('/settings') ? 'page' : undefined}
              >
                <IconSettings size={20} stroke={1.8} aria-hidden />
                Settings
              </Link>
            </>
          )}
        </nav>
        <div className={classes.foot}>
          <div className={classes.who}>
            <Avatar color="bin" radius="xl" size={32} aria-hidden>
              {user.name.slice(0, 1).toUpperCase()}
            </Avatar>
            <div>
              <div className={classes.whoName}>{user.name}</div>
              <div className={classes.whoRole}>
                {user.role === 'restricted' ? 'Kid' : user.role}
              </div>
            </div>
            <ThemeToggle />
          </div>
          <form action={logoutAction}>
            <Button
              type="submit"
              variant="subtle"
              color="gray"
              size="compact-sm"
              leftSection={<IconLogout size={16} />}
            >
              Sign out
            </Button>
          </form>
          <p className={classes.attribution}>
            Catalog data from <a href="https://rebrickable.com">Rebrickable</a>
          </p>
        </div>
      </aside>

      <header className={classes.topbar} data-noprint>
        <Link href="/sets" className={classes.brand}>
          <BrickMark size={26} />
          Brick Bin
        </Link>
        <ThemeToggle />
      </header>

      <main className={classes.main}>{children}</main>

      <nav
        aria-label="Tabs"
        className={classes.tabs}
        data-count={tabs.length + (restricted ? 0 : 2)}
        data-noprint
      >
        {tabs.map(({ href, label, icon: Glyph }, i) => (
          <span key={href} className={classes.tabSlot}>
            {!restricted && i === 2 && (
              <Link href="/sets/new" className={`${classes.tab} ${classes.plus}`}>
                <span className={classes.plusIcon}>
                  <IconPlus size={22} aria-hidden />
                </span>
                Add
              </Link>
            )}
            <Link
              href={href}
              className={classes.tab}
              data-active={isActive(href) || undefined}
              aria-current={isActive(href) ? 'page' : undefined}
            >
              <span className={classes.tabIcon}>
                <Glyph size={22} stroke={1.8} aria-hidden />
              </span>
              {label.replace(' list', '')}
            </Link>
          </span>
        ))}
        {!restricted && (
          <Link
            href="/more"
            className={classes.tab}
            data-active={moreActive || undefined}
            aria-current={moreActive ? 'page' : undefined}
          >
            <span className={classes.tabIcon}>
              <IconDots size={22} stroke={1.8} aria-hidden />
            </span>
            More
          </Link>
        )}
      </nav>
    </div>
  );
}
