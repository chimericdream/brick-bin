'use client';

import { MantineProvider } from '@mantine/core';
import { Notifications } from '@mantine/notifications';

import { cssVariablesResolver, theme } from '@/theme';

/** Client boundary for the Mantine theme: its component `.extend()` helpers only exist client-side. */
export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <MantineProvider
      theme={theme}
      cssVariablesResolver={cssVariablesResolver}
      defaultColorScheme="auto"
    >
      <Notifications position="bottom-right" containerWidth={440} />
      {children}
    </MantineProvider>
  );
}
