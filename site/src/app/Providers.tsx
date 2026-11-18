'use client';

import {
  createTheme,
  localStorageColorSchemeManager,
  MantineProvider,
  type CSSVariablesResolver,
} from '@mantine/core';

import { THEME_STORAGE_KEY } from '@/lib/theme';

/**
 * Mantine's theme, pointed at the design tokens in styles/tokens.css. The tokens themselves stay CSS
 * variables (the CSS modules read them); `other` mirrors their names for TypeScript use.
 */
const theme = createTheme({
  fontFamily: 'var(--font)',
  fontFamilyMonospace: 'var(--mono)',
  headings: { fontFamily: 'var(--font)', fontWeight: '800' },
  defaultRadius: 3,
  focusRing: 'never',
  breakpoints: { xs: '40em', sm: '48em', md: '56.25em', lg: '64em', xl: '80em' },
  other: {
    ground: 'var(--ground)',
    surface: 'var(--surface)',
    surface2: 'var(--surface-2)',
    line: 'var(--line)',
    ink: 'var(--ink)',
    muted: 'var(--muted)',
    field: 'var(--field)',
    focus: 'var(--focus)',
    radius: 'var(--r)',
  },
});

const cssVariablesResolver: CSSVariablesResolver = () => ({
  variables: {},
  light: { '--mantine-color-body': 'var(--ground)', '--mantine-color-text': 'var(--ink)' },
  dark: { '--mantine-color-body': 'var(--ground)', '--mantine-color-text': 'var(--ink)' },
});

const colorSchemeManager = localStorageColorSchemeManager({ key: THEME_STORAGE_KEY });

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <MantineProvider
      theme={theme}
      cssVariablesResolver={cssVariablesResolver}
      colorSchemeManager={colorSchemeManager}
      defaultColorScheme="auto"
    >
      {children}
    </MantineProvider>
  );
}
