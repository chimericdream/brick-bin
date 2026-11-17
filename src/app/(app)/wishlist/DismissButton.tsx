'use client';

import { useTransition } from 'react';
import { Button } from '@mantine/core';

export function DismissButton({ action }: { action: () => Promise<void> }) {
  const [pending, start] = useTransition();
  return (
    <Button variant="light" size="compact-sm" loading={pending} onClick={() => start(action)}>
      Dismiss
    </Button>
  );
}
