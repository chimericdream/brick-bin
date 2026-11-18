import { ROUTES, type Section } from './site';

/** Which section a path belongs to, for the header, the phone menu and the docs navigation. */
export function sectionOf(pathname: string): Section | null {
  const p = pathname.endsWith('/') ? pathname : `${pathname}/`;
  if (p.startsWith('/tutorials/')) return 'tutorials';
  if (p === ROUTES.setup) return 'setup';
  if (p === ROUTES.hosting) return 'hosting';
  if (p === ROUTES.config) return 'config';
  if (p === ROUTES.faq) return 'faq';
  return null;
}

/** The phone menu's five section bricks, in order (SPEC 6.2). */
export const MENU_SECTIONS: { section: Section; href: string; name: string; hint: string }[] = [
  { section: 'tutorials', href: ROUTES.tutorials, name: 'Tutorials', hint: 'Ten walk-throughs' },
  { section: 'setup', href: ROUTES.setup, name: 'Setup', hint: 'Start here' },
  {
    section: 'hosting',
    href: ROUTES.hosting,
    name: 'Hosting',
    hint: 'Proxmox, Tailscale, backups',
  },
  { section: 'config', href: ROUTES.config, name: 'Configuration', hint: 'Every setting' },
  { section: 'faq', href: ROUTES.faq, name: 'FAQ', hint: 'Short answers' },
];

/** The three docs pages, as the sidebar and the phone tabs list them. */
export const DOCS_PAGES: { section: Section; href: string; name: string }[] = [
  { section: 'setup', href: ROUTES.setup, name: 'Setup' },
  { section: 'hosting', href: ROUTES.hosting, name: 'Hosting' },
  { section: 'config', href: ROUTES.config, name: 'Configuration' },
];
