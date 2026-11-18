import type { MetadataRoute } from 'next';

import { TUTORIALS } from '@/content/tutorials';
import { ROUTES, SITE_URL, tutorialHref } from '@/lib/site';

export const dynamic = 'force-static';

export default function sitemap(): MetadataRoute.Sitemap {
  const paths = [
    ROUTES.home,
    ROUTES.setup,
    ROUTES.hosting,
    ROUTES.config,
    ROUTES.tutorials,
    ...TUTORIALS.map((t) => tutorialHref(t.slug)),
    ROUTES.faq,
  ];
  return paths.map((p) => ({ url: `${SITE_URL}${p}` }));
}
