'use client';

import { useEffect, useState } from 'react';
import { Button } from '@mantine/core';
import { IconAdjustments, IconX } from '@tabler/icons-react';

import classes from './Library.module.css';

/**
 * Holds the server-rendered facet panel once. On desktop it is a sticky left column; on phones the
 * same markup becomes a bottom sheet that this button opens.
 */
export function FilterShell({
  activeCount,
  total,
  children,
}: {
  activeCount: number;
  total: number;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  return (
    <>
      <Button
        variant="default"
        className={classes.filterToggle}
        leftSection={<IconAdjustments size={18} />}
        onClick={() => setOpen(true)}
        h={44}
        aria-expanded={open}
      >
        Filters{activeCount > 0 ? ` (${activeCount})` : ''}
      </Button>
      <aside
        className={classes.filters}
        data-open={open || undefined}
        aria-label="Filters"
        onClick={(e) => e.target === e.currentTarget && setOpen(false)}
      >
        <div className={`${classes.sheet} ${classes.sticky}`}>
          <div className={classes.sheetHead}>
            <strong>Filters</strong>
            <Button
              variant="subtle"
              onClick={() => setOpen(false)}
              leftSection={<IconX size={16} />}
            >
              Show {total} {total === 1 ? 'set' : 'sets'}
            </Button>
          </div>
          {children}
        </div>
      </aside>
    </>
  );
}
