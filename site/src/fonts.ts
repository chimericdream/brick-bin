import localFont from 'next/font/local';

/**
 * Self-hosted, never fetched from a font service. Albert Sans is preloaded; JetBrains Mono only
 * loads on pages that show code. Both are the full upstream variable fonts (SIL OFL 1.1, licenses
 * beside the files).
 */
export const albertSans = localFont({
  src: './fonts/AlbertSans-Variable.woff2',
  weight: '100 900',
  style: 'normal',
  display: 'swap',
  variable: '--font-albert',
});

export const jetbrainsMono = localFont({
  src: './fonts/JetBrainsMono-Variable.woff2',
  weight: '100 800',
  style: 'normal',
  display: 'swap',
  preload: false,
  variable: '--font-jetbrains',
});
