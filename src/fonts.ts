import localFont from 'next/font/local';

/*
 * Both families are self-hosted (OFL licensed, see the licence files beside the font files), so
 * the app makes no request to a font service. Titles and numbers use Bricolage Grotesque; body
 * text uses Atkinson Hyperlegible Next.
 */

export const bricolage = localFont({
  src: [{ path: './fonts/bricolage-grotesque-latin-wght-normal.woff2', style: 'normal' }],
  variable: '--font-bricolage',
  display: 'swap',
  weight: '200 800',
  fallback: ['system-ui', 'Segoe UI', 'sans-serif'],
});

export const atkinson = localFont({
  src: [{ path: './fonts/atkinson-hyperlegible-next-latin-wght-normal.woff2', style: 'normal' }],
  variable: '--font-atkinson',
  display: 'swap',
  weight: '200 800',
  fallback: ['system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
});
