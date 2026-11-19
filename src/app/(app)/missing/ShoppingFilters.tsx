'use client';

import { useState } from 'react';
import { Button, Modal } from '@mantine/core';
import { IconAdjustmentsHorizontal } from '@tabler/icons-react';

import classes from './Shopping.module.css';

/**
 * The five filters. From 1024 they sit in one row with Apply; below that the Filters button opens
 * the same form in a sheet. It is a plain GET form either way.
 */
export function ShoppingFilters({
  activeCount,
  children,
}: {
  activeCount: number;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button
        variant="default"
        className={classes.filterButton}
        leftSection={<IconAdjustmentsHorizontal size={20} stroke={1.75} />}
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        aria-expanded={open}
      >
        Filters
        {activeCount > 0 && (
          <span className={classes.activeCount}>
            {activeCount}
            <span className="app-vh"> active</span>
          </span>
        )}
      </Button>
      <div className={classes.inlineFilters}>{children}</div>
      <Modal opened={open} onClose={() => setOpen(false)} title="Filters" size={600}>
        <div className={classes.sheetFilters} onSubmitCapture={() => setOpen(false)}>
          {children}
        </div>
      </Modal>
    </>
  );
}
