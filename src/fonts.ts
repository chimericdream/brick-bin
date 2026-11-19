import localFont from 'next/font/local';

/*
 * Both families are self-hosted (SIL OFL 1.1, see the licence files beside the font files), so
 * the app makes no request to a font service. Albert Sans sets everything; JetBrains Mono sets
 * identifiers only (set numbers, part numbers, file names). Both files are Latin subsets.
 */

export const albertSans = localFont({
  src: [{ path: './fonts/albert-sans-latin-wght-normal.woff2', style: 'normal' }],
  variable: '--font-albert-sans',
  display: 'swap',
  weight: '100 900',
  fallback: ['system-ui', 'Segoe UI', 'sans-serif'],
});

export const jetbrainsMono = localFont({
  src: [{ path: './fonts/jetbrains-mono-latin-wght-normal.woff2', style: 'normal' }],
  variable: '--font-jetbrains-mono',
  display: 'swap',
  weight: '100 800',
  preload: false,
  fallback: ['ui-monospace', 'Cascadia Mono', 'Consolas', 'monospace'],
});
