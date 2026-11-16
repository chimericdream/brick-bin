'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import classes from './Settings.module.css';

const TABS: { href: string; label: string; admin?: boolean }[] = [
  { href: '/settings/places', label: 'Places' },
  { href: '/settings/brands', label: 'Brands and themes' },
  { href: '/settings/people', label: 'People' },
  { href: '/settings/catalog', label: 'Catalog', admin: true },
  { href: '/settings/activity', label: 'Activity' },
  { href: '/settings/trash', label: 'Trash' },
];

export function SettingsTabs({ admin }: { admin: boolean }) {
  const pathname = usePathname();
  return (
    <nav aria-label="Settings" className={classes.tabs}>
      {TABS.filter((t) => admin || !t.admin).map(({ href, label }) => (
        <Link
          key={href}
          href={href}
          data-active={pathname.startsWith(href) || undefined}
          aria-current={pathname.startsWith(href) ? 'page' : undefined}
        >
          {label}
        </Link>
      ))}
    </nav>
  );
}
