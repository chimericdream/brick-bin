'use client';

import {
  IconChevronRight,
  IconDatabase,
  IconHistory,
  IconMapPin,
  IconTags,
  IconTrash,
  IconUsers,
  type Icon,
} from '@tabler/icons-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { PageHead } from '@/components/layout/PageHead';

import classes from './Settings.module.css';

const AREAS: { href: string; label: string; line: string; icon: Icon; admin?: boolean }[] = [
  { href: '/settings/places', label: 'Places', line: 'Where sets are kept', icon: IconMapPin },
  {
    href: '/settings/brands',
    label: 'Brands and themes',
    line: 'The names sets are filed under',
    icon: IconTags,
  },
  {
    href: '/settings/people',
    label: 'People',
    line: 'Who can sign in, and what they can do',
    icon: IconUsers,
  },
  {
    href: '/settings/catalog',
    label: 'Catalog',
    line: 'The LEGO catalog, from Rebrickable',
    icon: IconDatabase,
    admin: true,
  },
  {
    href: '/settings/activity',
    label: 'Activity',
    line: 'The last 100 changes',
    icon: IconHistory,
  },
  {
    href: '/settings/trash',
    label: 'Trash',
    line: 'Deleted things, kept for 30 days',
    icon: IconTrash,
  },
];

/**
 * Settings: a list of its areas, each with a line about what is in it. On phones `/settings` is
 * that list and each area is its own page; from 1024 the list is a column beside every area, and
 * `/settings` itself shows Places.
 */
export function SettingsFrame({
  admin,
  householdName,
  children,
}: {
  admin: boolean;
  householdName: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const home = pathname === '/settings';
  const areas = AREAS.filter((a) => admin || !a.admin);
  const current = areas.find((a) => pathname.startsWith(a.href));

  return (
    <>
      {home || !current ? (
        <PageHead title="Settings" sub={householdName} />
      ) : (
        <PageHead
          crumbs={[{ label: 'Settings', href: '/settings' }]}
          title={current.label}
          sub={current.line}
        />
      )}
      <div className={classes.frame} data-home={home || undefined}>
        <nav aria-label="Settings" className={classes.subnav}>
          {areas.map(({ href, label, line, icon: Glyph }) => {
            const isCurrent = current?.href === href;
            // On /settings the desktop shows Places, so the list marks it there (from 1024 only).
            const deskCurrent = home && href === '/settings/places';
            return (
              <Link
                key={href}
                href={href}
                aria-current={isCurrent ? 'page' : undefined}
                data-desk-current={deskCurrent || undefined}
              >
                <Glyph size={20} stroke={1.75} aria-hidden />
                <span>
                  <b>{label}</b>
                  <span>{line}</span>
                </span>
                <IconChevronRight size={20} stroke={1.75} aria-hidden className={classes.chev} />
              </Link>
            );
          })}
        </nav>
        <div className={classes.content}>{children}</div>
      </div>
    </>
  );
}
