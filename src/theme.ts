import {
  ActionIcon,
  Badge,
  Button,
  Card,
  NumberInput,
  Paper,
  Select,
  Textarea,
  TextInput,
  createTheme,
  type CSSVariablesResolver,
  type MantineColorsTuple,
} from '@mantine/core';

/**
 * Visual system: "Brick Bin". A cool grey ground, "bin blue" for actions and small marks, and rust
 * for missing pieces and delete. Build states carry their own tinted badge pairs. Titles and
 * numbers are set in Bricolage Grotesque, everything else in Atkinson Hyperlegible Next. The
 * reference mockups and the full token table are in docs/design/brick-bin (tokens.md).
 */

/** Primary. Shade 6 is the light-mode fill; shade 3 is the lighter fill used in dark mode. */
const bin: MantineColorsTuple = [
  '#eef4fc',
  '#dbe7f6',
  '#b9d6f7',
  '#6fa9ea',
  '#3f82cc',
  '#2a6ab5',
  '#1d5ca6',
  '#123f78',
  '#0d2f5c',
  '#082044',
];

/** Missing pieces, errors and delete. Shade 6 on light grounds, shade 3 on dark ones. */
const rust: MantineColorsTuple = [
  '#fdf1ee',
  '#fde4de',
  '#ffb4a6',
  '#ff8f80',
  '#e0604f',
  '#c9402f',
  '#b42318',
  '#8a1c0f',
  '#6a150b',
  '#4a0e07',
];

/** Cool neutrals for chips, hovers and rules. */
const slate: MantineColorsTuple = [
  '#eef1f5',
  '#e4e9ef',
  '#d3dae3',
  '#a3b0be',
  '#7f8d9d',
  '#4f5d6c',
  '#3a4756',
  '#25303d',
  '#14202e',
  '#0e1319',
];

const SANS = 'var(--font-atkinson), system-ui, -apple-system, "Segoe UI", sans-serif';
const DISPLAY = 'var(--font-bricolage), system-ui, "Segoe UI", sans-serif';

export const theme = createTheme({
  primaryColor: 'bin',
  primaryShade: { light: 6, dark: 3 },
  autoContrast: true,
  // Mantine's red is the error colour in alerts, inputs and destructive buttons; make it rust.
  colors: { bin, rust, slate, red: rust },
  fontFamily: SANS,
  fontFamilyMonospace: 'ui-monospace, "Cascadia Mono", "Segoe UI Mono", monospace',
  headings: {
    fontFamily: DISPLAY,
    fontWeight: '700',
    sizes: {
      h1: { fontSize: 'clamp(28px, 3.4vw, 40px)', lineHeight: '1.1' },
      h2: { fontSize: '24px', lineHeight: '1.2' },
      h3: { fontSize: '20px', lineHeight: '1.25' },
      h4: { fontSize: '18px', lineHeight: '1.3' },
      h5: { fontSize: '16px', lineHeight: '1.35' },
      h6: { fontSize: '14px', lineHeight: '1.4' },
    },
  },
  fontSizes: { xs: '12px', sm: '13px', md: '15px', lg: '17px', xl: '20px' },
  radius: { xs: '6px', sm: '8px', md: '10px', lg: '12px', xl: '16px' },
  defaultRadius: 'sm',
  spacing: { xs: '8px', sm: '12px', md: '16px', lg: '24px', xl: '32px' },
  components: {
    Button: Button.extend({ defaultProps: { radius: 'sm', fw: 600 } }),
    ActionIcon: ActionIcon.extend({ defaultProps: { variant: 'subtle', color: 'gray' } }),
    Paper: Paper.extend({ defaultProps: { radius: 'lg', shadow: undefined } }),
    Card: Card.extend({ defaultProps: { radius: 'lg', shadow: undefined } }),
    TextInput: TextInput.extend({ defaultProps: { radius: 'sm' } }),
    NumberInput: NumberInput.extend({ defaultProps: { radius: 'sm' } }),
    Select: Select.extend({ defaultProps: { radius: 'sm' } }),
    Textarea: Textarea.extend({ defaultProps: { radius: 'sm' } }),
    Badge: Badge.extend({
      defaultProps: { variant: 'light', color: 'bin', radius: 6 },
      styles: { root: { textTransform: 'none', fontWeight: 600, letterSpacing: 0 } },
      // Nothing under 12px; build-state badges always pair an icon with the word.
      vars: (_theme, props) => ({
        root: {
          '--badge-fz': props.size === 'xs' ? '12px' : '13px',
          '--badge-height': props.size === 'xs' ? '20px' : '24px',
        },
      }),
    }),
  },
});

/**
 * The ground, surfaces and text for both colour schemes (secondary text reaches 4.5:1 on every
 * surface it sits on). `--app-*` variables are for the bespoke CSS modules; `--mantine-color-*`
 * overrides make Mantine's own components follow the same palette.
 */
export const cssVariablesResolver: CSSVariablesResolver = () => ({
  variables: {
    '--app-display': DISPLAY,
    '--app-radius-card': '12px',
    '--app-radius-tile': '10px',
    '--app-radius-control': '8px',
    '--app-radius-badge': '6px',
  },
  light: {
    '--mantine-color-body': '#eef1f5',
    '--mantine-color-text': '#14202e',
    '--mantine-color-dimmed': '#4f5d6c',
    '--mantine-color-placeholder': '#566371',
    '--mantine-color-default': '#ffffff',
    '--mantine-color-default-hover': '#e4e9ef',
    '--mantine-color-default-border': '#7f8d9d',
    '--app-ground': '#eef1f5',
    '--app-surface': '#ffffff',
    '--app-sunk': '#e4e9ef',
    '--app-ink': '#14202e',
    '--app-muted': '#4f5d6c',
    '--app-tint': '#dbe7f6',
    '--app-accent': '#1d5ca6',
    '--app-on-accent': '#ffffff',
    '--app-accent-ink': '#123f78',
    '--app-border': '#d3dae3',
    '--app-rule': '#e3e8ee',
    '--app-control': '#7f8d9d',
    '--app-rail': '#cdd5de',
    '--app-rail-hi': '#e9eef3',
    '--app-scrim': 'rgba(14, 20, 28, 0.5)',
    '--app-s-sealed-bg': '#e3e8ee',
    '--app-s-sealed-ink': '#25303d',
    '--app-s-opened-bg': '#d6efec',
    '--app-s-opened-ink': '#0d4a45',
    '--app-s-progress-bg': '#dbe7f6',
    '--app-s-progress-ink': '#123f78',
    '--app-s-built-bg': '#d9efdf',
    '--app-s-built-ink': '#14532d',
    '--app-s-disassembled-bg': '#efe6d3',
    '--app-s-disassembled-ink': '#5b4511',
    '--app-s-mixed-bg': '#e6e8ec',
    '--app-s-mixed-ink': '#2f3a47',
    '--app-warn-bg': '#fde4de',
    '--app-warn-ink': '#8a1c0f',
    '--app-ok-bg': '#d9efdf',
    '--app-ok-ink': '#14532d',
    '--app-notice-bg': '#fff5d6',
    '--app-notice-border': '#ecd88a',
    '--app-notice-ink': '#6b4a00',
    '--app-danger': '#b42318',
    '--app-danger-bg': '#fde4de',
    '--app-danger-ink': '#8a1c0f',
  },
  dark: {
    // Mantine derives the contrast colour from the light shade; the dark fill is lighter, so text on it is dark.
    '--mantine-primary-color-contrast': '#0e1319',
    '--mantine-color-bin-contrast': '#0e1319',
    '--mantine-color-body': '#0e1319',
    '--mantine-color-text': '#e8edf3',
    '--mantine-color-dimmed': '#a3b0be',
    '--mantine-color-placeholder': '#97a5b4',
    '--mantine-color-default': '#161d25',
    '--mantine-color-default-hover': '#1e2730',
    '--mantine-color-default-border': '#6b7a8b',
    '--app-ground': '#0e1319',
    '--app-surface': '#161d25',
    '--app-sunk': '#0a0e13',
    '--app-ink': '#e8edf3',
    '--app-muted': '#a3b0be',
    '--app-tint': '#1b2d44',
    '--app-accent': '#6fa9ea',
    '--app-on-accent': '#06182c',
    '--app-accent-ink': '#b9d6f7',
    '--app-border': '#28323d',
    '--app-rule': '#1e2730',
    '--app-control': '#6b7a8b',
    '--app-rail': '#2b3642',
    '--app-rail-hi': '#37444f',
    '--app-scrim': 'rgba(0, 0, 0, 0.62)',
    '--app-s-sealed-bg': '#232d38',
    '--app-s-sealed-ink': '#d5dde6',
    '--app-s-opened-bg': '#12332f',
    '--app-s-opened-ink': '#9fe0d8',
    '--app-s-progress-bg': '#1b2d44',
    '--app-s-progress-ink': '#b9d6f7',
    '--app-s-built-bg': '#143323',
    '--app-s-built-ink': '#9be0b4',
    '--app-s-disassembled-bg': '#38301c',
    '--app-s-disassembled-ink': '#e8d49a',
    '--app-s-mixed-bg': '#262c35',
    '--app-s-mixed-ink': '#cfd8e2',
    '--app-warn-bg': '#3d1c17',
    '--app-warn-ink': '#ffb4a6',
    '--app-ok-bg': '#143323',
    '--app-ok-ink': '#9be0b4',
    '--app-notice-bg': '#3a3114',
    '--app-notice-border': '#6b5a1f',
    '--app-notice-ink': '#f0dc8e',
    '--app-danger': '#ff8f80',
    '--app-danger-bg': '#3d1c17',
    '--app-danger-ink': '#ffb4a6',
  },
});
