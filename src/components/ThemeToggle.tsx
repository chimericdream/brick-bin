'use client';

import { useMantineColorScheme, type MantineColorScheme } from '@mantine/core';
import { useMounted } from '@mantine/hooks';
import { IconDeviceDesktop, IconMoon, IconSun, type Icon } from '@tabler/icons-react';

import classes from './ThemeToggle.module.css';

const OPTIONS: { value: MantineColorScheme; label: string; icon: Icon }[] = [
  { value: 'auto', label: 'System', icon: IconDeviceDesktop },
  { value: 'light', label: 'Light', icon: IconSun },
  { value: 'dark', label: 'Dark', icon: IconMoon },
];

/**
 * System, Light or Dark. Mantine keeps the choice in local storage and the root layout's inline
 * script applies it before first paint. The pressed state is only known in the browser, so it is
 * shown once mounted.
 */
export function ThemeToggle({ withLabels = false }: { withLabels?: boolean }) {
  const { colorScheme, setColorScheme } = useMantineColorScheme();
  const mounted = useMounted();

  return (
    <div
      className={classes.seg}
      data-block={withLabels || undefined}
      role="group"
      aria-label="Theme"
    >
      {OPTIONS.map(({ value, label, icon: Glyph }) => (
        <button
          key={value}
          type="button"
          className={classes.option}
          aria-pressed={mounted ? colorScheme === value : undefined}
          title={withLabels ? undefined : label}
          onClick={() => setColorScheme(value)}
        >
          <Glyph size={20} stroke={1.75} aria-hidden />
          <span className={withLabels ? undefined : 'app-vh'}>{label}</span>
        </button>
      ))}
    </div>
  );
}
