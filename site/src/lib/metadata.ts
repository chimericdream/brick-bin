import type { Metadata } from 'next';

import { DESCRIPTION, SITE_NAME, TAGLINE } from './site';

export const HOME_TITLE = `${SITE_NAME}: ${TAGLINE.charAt(0).toLowerCase()}${TAGLINE.slice(1)}`;

const OG_IMAGE = {
  url: '/og.png',
  width: 1200,
  height: 630,
  alt: 'Brick Bin: know what’s in every box. A row of colored bricks.',
};

/**
 * A page's title, description, canonical address and social cards. Next.js replaces a parent's
 * openGraph and twitter objects instead of merging them, so every page sets all of it here.
 * `title` is the page's own part ("Setup · Docs"); the root layout adds " · Brick Bin".
 */
export function pageMetadata({
  title,
  description = DESCRIPTION,
  path,
}: {
  title?: string;
  description?: string;
  path: string;
}): Metadata {
  const full = title ? `${title} · ${SITE_NAME}` : HOME_TITLE;
  return {
    ...(title ? { title } : {}),
    description,
    alternates: { canonical: path },
    openGraph: {
      type: 'website',
      siteName: SITE_NAME,
      title: full,
      description,
      url: path,
      images: [OG_IMAGE],
    },
    twitter: { card: 'summary_large_image', title: full, description, images: [OG_IMAGE] },
  };
}
