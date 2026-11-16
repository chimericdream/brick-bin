'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import classes from './Settings.module.css';

const TABS = [
  { href: '/settings/places', label: 'Places' },
  { href: '/settings/brands', label: 'Brands and themes' },
  { href: '/settings/people', label: 'People' },
  { href: '/settings/activity', label: 'Activity' },
  { href: '/settings/trash', label: 'Trash' },
];

export function SettingsTabs() {
  const pathname = usePathname();
  return (
    <nav aria-label="Settings" className={classes.tabs}>
      {TABS.map(({ href, label }) => (
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
