'use client';

import { useTransition } from 'react';
import { Button } from '@mantine/core';

export function DismissButton({ action }: { action: () => Promise<void> }) {
  const [pending, start] = useTransition();
  return (
    <Button variant="default" size="compact-md" loading={pending} onClick={() => start(action)}>
      Dismiss
    </Button>
  );
}
