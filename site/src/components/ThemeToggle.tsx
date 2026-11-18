'use client';

import { useMantineColorScheme, type MantineColorScheme } from '@mantine/core';
import { useMounted } from '@mantine/hooks';

import { IconDark, IconLight, IconSystem } from './Icons';
import classes from './ThemeToggle.module.css';

const CHOICES: { value: MantineColorScheme; label: string; Icon: () => React.JSX.Element }[] = [
  { value: 'auto', label: 'System', Icon: IconSystem },
  { value: 'light', label: 'Light', Icon: IconLight },
  { value: 'dark', label: 'Dark', Icon: IconDark },
];

interface Props {
  /** icons: header and footer. words: the phone menu. */
  variant: 'icons' | 'words';
  /** Sits on the dark field (the footer). */
  onField?: boolean;
  labelledBy?: string;
}

/**
 * System, Light, Dark (SPEC 6.4). The choice is applied before first paint by Mantine's
 * ColorSchemeScript in <head>; this only changes it. Hidden when scripts are off.
 */
export function ThemeToggle({ variant, onField, labelledBy }: Props) {
  const { colorScheme, setColorScheme } = useMantineColorScheme();
  // The stored choice is only known in the browser, so nothing is pressed until hydration.
  const mounted = useMounted();
  return (
    <div
      className={[
        classes.theme,
        variant === 'icons' ? classes.icons : classes.words,
        onField && classes.field,
        'js-only',
      ]
        .filter(Boolean)
        .join(' ')}
      role="group"
      aria-label={labelledBy ? undefined : 'Theme'}
      aria-labelledby={labelledBy}
    >
      {CHOICES.map(({ value, label, Icon }) => (
        <button
          key={value}
          type="button"
          title={label}
          aria-pressed={mounted && colorScheme === value}
          onClick={() => setColorScheme(value)}
        >
          <Icon />
          <span>{label}</span>
        </button>
      ))}
    </div>
  );
}
