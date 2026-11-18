/** Addresses and names used across the site. One place, so a moved repository is one edit. */
export const SITE_URL = 'https://brick-bin.app';
export const SITE_NAME = 'Brick Bin';
export const TAGLINE = "Know what's in every box";
export const DESCRIPTION =
  "A free, self-hosted web app for a household's building-brick sets. Any brand, your own server.";

export const REPO_URL = 'https://github.com/chimericdream/brick-bin';
export const ISSUES_URL = `${REPO_URL}/issues`;
export const LICENSE_URL = `${REPO_URL}/blob/main/LICENSE`;
export const REBRICKABLE_URL = 'https://rebrickable.com/';
export const REBRICKABLE_DOWNLOADS_URL = 'https://rebrickable.com/downloads/';
export const TAILSCALE_URL = 'https://tailscale.com/';

/** The five sections. Each is a brick color (SPEC 2.2). The landing page and the 404 have none. */
export type Section = 'tutorials' | 'setup' | 'hosting' | 'config' | 'faq';

export const ROUTES = {
  home: '/',
  tutorials: '/tutorials/',
  setup: '/docs/setup/',
  hosting: '/docs/hosting/',
  config: '/docs/configuration/',
  faq: '/faq/',
} as const;

export const tutorialHref = (slug: string) => `/tutorials/${slug}/`;
/** A link to one configuration variable's row. */
export const configHref = (name: string) => `${ROUTES.config}#${name}`;
