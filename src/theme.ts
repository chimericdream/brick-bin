import { createTheme, type CSSVariablesResolver } from '@mantine/core';

/**
 * Placeholder theme. Phase 1 (design mockups) replaces these tokens with the approved palette,
 * fonts and component defaults. See docs/PLAN.md section 9.
 */
export const theme = createTheme({});

export const cssVariablesResolver: CSSVariablesResolver = () => ({
  variables: {},
  light: {
    '--app-ground': '#f4f4f1',
    '--app-ink': '#1c1f22',
  },
  dark: {
    '--app-ground': '#16181a',
    '--app-ink': '#e8eaec',
  },
});
