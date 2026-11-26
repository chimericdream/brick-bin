import '@mantine/core/styles/baseline.css';
import '@mantine/core/styles/default-css-variables.css';
import '@mantine/core/styles/global.css';
import '@mantine/core/styles/Paper.css';
import '@mantine/core/styles/ModalBase.css';
import '@mantine/core/styles/Drawer.css';
import '@/styles/tokens.css';
import '@/styles/base.css';

import { ColorSchemeScript } from '@mantine/core';
import type { Metadata, Viewport } from 'next';

import { SiteFooter } from '@/components/SiteFooter';
import { SiteHeader } from '@/components/SiteHeader';
import { albertSans, jetbrainsMono } from '@/fonts';
import { HOME_TITLE, pageMetadata } from '@/lib/metadata';
import { SITE_NAME, SITE_URL } from '@/lib/site';
import { NO_JS_SCRIPT, THEME_STORAGE_KEY } from '@/lib/theme';

import { Providers } from './Providers';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: HOME_TITLE, template: `%s · ${SITE_NAME}` },
  ...pageMetadata({ path: '/' }),
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f5f5f2' },
    { media: '(prefers-color-scheme: dark)', color: '#2a2b29' },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    // No data-mantine-color-scheme on the server: without scripts the device preference decides.
    // The scripts below set it (and drop .no-js) before first paint.
    <html
      lang="en"
      className={`no-js ${albertSans.variable} ${jetbrainsMono.variable}`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: NO_JS_SCRIPT }} />
        <ColorSchemeScript defaultColorScheme="auto" localStorageKey={THEME_STORAGE_KEY} />
      </head>
      <body id="top">
        <Providers>
          <a className="skip" href="#main">
            Skip to content
          </a>
          <SiteHeader />
          <main id="main">{children}</main>
          <SiteFooter />
        </Providers>
      </body>
    </html>
  );
}
