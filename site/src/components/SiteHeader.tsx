'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { sectionOf } from '@/lib/nav';
import { ROUTES } from '@/lib/site';

import { Button } from './Button';
import classes from './SiteHeader.module.css';
import { Logo } from './Logo';
import { PhoneMenu } from './PhoneMenu';
import { ThemeToggle } from './ThemeToggle';

const NAV = [
  { href: ROUTES.tutorials, label: 'Tutorials', match: ['tutorials'] },
  { href: ROUTES.setup, label: 'Docs', match: ['setup', 'hosting', 'config'] },
  { href: ROUTES.faq, label: 'FAQ', match: ['faq'] },
];

/** SPEC 6.1. Not sticky. Under 900px: the logo and the Menu control only. */
export function SiteHeader() {
  const section = sectionOf(usePathname());
  return (
    <header className={classes.header}>
      <div className="wrap">
        <Logo />
        <nav className={classes.nav} aria-label="Main">
          {NAV.map(({ href, label, match }) => {
            const current = section !== null && match.includes(section);
            return (
              <Link
                key={href}
                href={href}
                className={current ? `sec-${section}` : undefined}
                aria-current={current ? 'page' : undefined}
              >
                {label}
              </Link>
            );
          })}
        </nav>
        <div className={classes.tools}>
          <ThemeToggle variant="icons" />
          <Button href={ROUTES.setup} size="small">
            Set it up
          </Button>
        </div>
        <PhoneMenu section={section} />
      </div>
    </header>
  );
}
