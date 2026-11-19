import {
  ActionIcon,
  Button,
  Checkbox,
  Menu,
  Modal,
  Switch,
  createTheme,
  type CSSVariablesResolver,
  type MantineColorsTuple,
} from '@mantine/core';

/**
 * Visual system: "Sorted by state". A neutral room (off-white or charcoal, near-black ink, one
 * 3px radius, no shadows at rest) and six brick colours that each mean one build state and nothing
 * else. Albert Sans for everything, JetBrains Mono for identifiers. The design reference is in
 * docs/design/brick-bin (SPEC.md, TOKENS.md); the values below are its tokens as `--app-*` CSS
 * variables, which the CSS modules use. Sizes that change with the viewport (gutter, control
 * height, page-title size) are set in globals.css.
 */

/** The room, light. */
const LIGHT = {
  ground: '#f5f5f2',
  paper: '#ffffff',
  surface: '#eaeae5',
  'surface-2': '#dcdcd5',
  line: '#cfcfc7',
  edge: '#85857d',
  ink: '#121212',
  muted: '#4d4d48',
  field: '#17191c',
  'field-2': '#26292e',
  'field-line': '#3a3e44',
  'field-ink': '#f5f5f2',
  'field-muted': '#b8bbbf',
  btn: '#121212',
  'btn-ink': '#f5f5f2',
  'btn-hover': '#34342f',
  focus: '#0b5fc4',
  'focus-field': '#7cc0ff',
  danger: '#b3261e',
  'danger-hover': '#8f1d17',
  'danger-ink': '#ffffff',
  'danger-bg': '#fbeae7',
  'danger-text': '#7a1711',
  dot: 'rgb(18 18 18 / 0.13)',
  scrim: 'rgb(18 18 18 / 0.55)',
} as const;

/** The room, dark. The bricks do not change; the room darkens. */
const DARK: Record<keyof typeof LIGHT, string> = {
  ground: '#141517',
  paper: '#191b1e',
  surface: '#1e2023',
  'surface-2': '#2a2d31',
  line: '#34373c',
  edge: '#767a80',
  ink: '#efefea',
  muted: '#abaeb2',
  field: '#0b0c0d',
  'field-2': '#1c1e21',
  'field-line': '#2c2f33',
  'field-ink': '#efefea',
  'field-muted': '#abaeb2',
  btn: '#efefea',
  'btn-ink': '#121212',
  'btn-hover': '#ffffff',
  focus: '#7cc0ff',
  'focus-field': '#7cc0ff',
  danger: '#ff9a8d',
  'danger-hover': '#ffb4ab',
  'danger-ink': '#121212',
  'danger-bg': '#3a1a17',
  'danger-text': '#ffb4ab',
  dot: 'rgb(239 239 234 / 0.12)',
  scrim: 'rgb(0 0 0 / 0.66)',
};

/** The bricks: one colour per build state, the same in both themes, always with ink on top. */
export const BRICKS = {
  'st-sealed': '#d8bc88',
  'st-opened': '#f49ac1',
  'st-progress': '#ff8c1a',
  'st-built': '#6cc04a',
  'st-apart': '#4db3e6',
  'st-mixed': '#a0a5a9',
  'brick-ink': '#121212',
} as const;

const FONT = 'var(--font-albert-sans), "Albert Sans", system-ui, "Segoe UI", sans-serif';
const MONO =
  'var(--font-jetbrains-mono), "JetBrains Mono", ui-monospace, "Cascadia Mono", Consolas, monospace';

/** Whole studs only: a 20 by 6 tile with one 12px stud, repeated with `mask-repeat: round`. */
const STUD_MASK =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 6' preserveAspectRatio='none'%3E%3Crect x='4' width='12' height='6'/%3E%3C/svg%3E\")";

const STATIC = {
  font: FONT,
  mono: MONO,
  'fs-small': '0.875rem',
  'fs-body': '1rem',
  'fs-lead': '1.125rem',
  'fs-h3': '1.25rem',
  'fs-h2': '1.375rem',
  'fs-figure': '1.75rem',
  s1: '4px',
  s2: '8px',
  s3: '12px',
  s4: '16px',
  s5: '24px',
  s6: '32px',
  s7: '48px',
  s8: '64px',
  max: '1280px',
  side: '248px',
  rail: '96px',
  tabbar: '64px',
  r: '3px',
  't-fast': '120ms',
  't-med': '240ms',
  ease: 'cubic-bezier(0.2, 0.7, 0.2, 1)',
  snap: 'cubic-bezier(0.3, 1.4, 0.5, 1)',
  'shadow-float': '0 18px 48px rgb(0 0 0 / 0.28), 0 2px 6px rgb(0 0 0 / 0.18)',
  'stud-mask': STUD_MASK,
  // The primary button on a field (page head) brightens to white on hover, in both themes.
  'field-btn-hover': '#ffffff',
  ...BRICKS,
} as const;

/** Mantine's own colour scale only matters where Mantine paints something we have not restyled. */
const ink: MantineColorsTuple = [
  '#f5f5f2',
  '#eaeae5',
  '#dcdcd5',
  '#cfcfc7',
  '#85857d',
  '#4d4d48',
  '#34342f',
  '#121212',
  '#0b0c0d',
  '#000000',
];

const appVars = (values: Record<string, string>) =>
  Object.fromEntries(Object.entries(values).map(([k, v]) => [`--app-${k}`, v]));

/**
 * Old tokens that screens not yet redesigned still read. Each points at its nearest new token.
 * Delete this block once nothing uses them.
 */
const LEGACY = {
  '--app-display': 'var(--app-font)',
  '--app-radius-card': 'var(--app-r)',
  '--app-radius-tile': 'var(--app-r)',
  '--app-radius-control': 'var(--app-r)',
  '--app-sunk': 'var(--app-surface)',
  '--app-tint': 'var(--app-surface-2)',
  '--app-accent': 'var(--app-ink)',
  '--app-on-accent': 'var(--app-ground)',
  '--app-accent-ink': 'var(--app-ink)',
  '--app-border': 'var(--app-line)',
  '--app-rule': 'var(--app-line)',
  '--app-control': 'var(--app-edge)',
  '--app-ok-ink': 'var(--app-ink)',
  '--app-notice-bg': 'var(--app-surface)',
  '--app-notice-border': 'var(--app-line)',
  '--app-notice-ink': 'var(--app-ink)',
};

/** Points Mantine's own variables at the room, so its components follow both themes. */
const MANTINE = {
  '--mantine-color-body': 'var(--app-ground)',
  '--mantine-color-text': 'var(--app-ink)',
  '--mantine-color-dimmed': 'var(--app-muted)',
  '--mantine-color-placeholder': 'var(--app-muted)',
  '--mantine-color-anchor': 'var(--app-ink)',
  '--mantine-color-default': 'var(--app-paper)',
  '--mantine-color-default-hover': 'var(--app-surface)',
  '--mantine-color-default-color': 'var(--app-ink)',
  '--mantine-color-default-border': 'var(--app-edge)',
  '--mantine-color-error': 'var(--app-danger)',
  '--mantine-color-disabled': 'var(--app-surface)',
  '--mantine-color-disabled-color': 'var(--app-muted)',
  '--mantine-color-disabled-border': 'var(--app-line)',
  '--mantine-primary-color-filled': 'var(--app-btn)',
  '--mantine-primary-color-filled-hover': 'var(--app-btn-hover)',
  '--mantine-primary-color-contrast': 'var(--app-btn-ink)',
  '--mantine-primary-color-light': 'var(--app-surface-2)',
  '--mantine-primary-color-light-hover': 'var(--app-line)',
  '--mantine-primary-color-light-color': 'var(--app-ink)',
  '--mantine-color-ink-filled': 'var(--app-btn)',
  '--mantine-color-ink-filled-hover': 'var(--app-btn-hover)',
  '--mantine-color-ink-light': 'var(--app-surface-2)',
  '--mantine-color-ink-light-hover': 'var(--app-line)',
  '--mantine-color-ink-light-color': 'var(--app-ink)',
  '--mantine-color-ink-text': 'var(--app-ink)',
  '--mantine-color-red-filled': 'var(--app-danger)',
  '--mantine-color-red-filled-hover': 'var(--app-danger-hover)',
  '--mantine-color-red-light': 'var(--app-danger-bg)',
  '--mantine-color-red-light-hover': 'var(--app-danger-bg)',
  '--mantine-color-red-light-color': 'var(--app-danger-text)',
  '--mantine-color-red-text': 'var(--app-danger)',
};

export const theme = createTheme({
  primaryColor: 'ink',
  colors: { ink },
  fontFamily: FONT,
  fontFamilyMonospace: MONO,
  headings: {
    fontFamily: FONT,
    fontWeight: '800',
    sizes: {
      h1: { fontSize: 'var(--app-fs-h1)', lineHeight: '1.1' },
      h2: { fontSize: 'var(--app-fs-h2)', lineHeight: '1.1' },
      h3: { fontSize: 'var(--app-fs-h3)', lineHeight: '1.2', fontWeight: '700' },
      h4: { fontSize: 'var(--app-fs-lead)', lineHeight: '1.2', fontWeight: '700' },
      h5: { fontSize: '1rem', lineHeight: '1.3', fontWeight: '700' },
      h6: { fontSize: '0.875rem', lineHeight: '1.4', fontWeight: '700' },
    },
  },
  // Nothing is set under 14px.
  fontSizes: { xs: '0.875rem', sm: '0.875rem', md: '1rem', lg: '1.125rem', xl: '1.25rem' },
  lineHeights: { xs: '1.4', sm: '1.45', md: '1.5', lg: '1.5', xl: '1.5' },
  // One molded edge everywhere; pieces inside a 3px container use 2px.
  radius: { xs: '2px', sm: '3px', md: '3px', lg: '3px', xl: '3px' },
  defaultRadius: 'sm',
  spacing: { xs: '8px', sm: '12px', md: '16px', lg: '24px', xl: '32px' },
  // No shadow at rest; menus, dialogs and toasts float (they use md, lg and xl).
  shadows: {
    xs: 'none',
    sm: 'none',
    md: 'var(--app-shadow-float)',
    lg: 'var(--app-shadow-float)',
    xl: 'var(--app-shadow-float)',
  },
  breakpoints: { xs: '30em', sm: '48em', md: '56.25em', lg: '64em', xl: '77.5em' },
  focusRing: 'auto',
  other: {
    light: LIGHT,
    dark: DARK,
    ...STATIC,
  },
  components: {
    Button: Button.extend({
      defaultProps: { radius: 'sm' },
      // Controls are 48px under 1024 and 44px above; "compact" sizes are the small row buttons.
      vars: (_theme, props) => {
        const compact = String(props.size ?? '').startsWith('compact');
        return {
          root: {
            '--button-height': compact ? 'var(--app-ctl-sm)' : 'var(--app-ctl)',
            '--button-padding-x': compact ? '12px' : '16px',
            '--button-fz': compact ? '0.9375rem' : '1rem',
          },
        };
      },
    }),
    ActionIcon: ActionIcon.extend({ defaultProps: { variant: 'subtle', color: 'gray' } }),
    Checkbox: Checkbox.extend({ defaultProps: { radius: 'sm', size: 'md' } }),
    Switch: Switch.extend({ defaultProps: { radius: 'xs' } }),
    Menu: Menu.extend({ defaultProps: { radius: 'sm', shadow: 'md' } }),
    Modal: Modal.extend({
      defaultProps: {
        centered: true,
        radius: 'sm',
        overlayProps: { blur: 0 },
        closeButtonProps: { 'aria-label': 'Close' },
        transitionProps: { transition: 'fade', duration: 200 },
      },
    }),
  },
});

/**
 * Light and dark values are keyed off Mantine's `data-mantine-color-scheme` attribute, which the
 * inline script in the root layout sets before first paint.
 */
export const cssVariablesResolver: CSSVariablesResolver = () => ({
  variables: { ...appVars(STATIC), ...LEGACY },
  // Mantine sets its own colour variables per scheme, so ours go in the same blocks to win.
  light: { ...appVars(LIGHT), ...MANTINE },
  dark: { ...appVars(DARK), ...MANTINE },
});
