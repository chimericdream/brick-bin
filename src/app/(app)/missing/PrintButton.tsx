'use client';

import { Button } from '@mantine/core';
import { IconPrinter } from '@tabler/icons-react';

export function PrintButton() {
  return (
    <Button
      variant="default"
      leftSection={<IconPrinter size={16} />}
      onClick={() => window.print()}
    >
      Print
    </Button>
  );
}
