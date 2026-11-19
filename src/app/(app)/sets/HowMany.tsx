'use client';

import { useRef } from 'react';
import { ActionIcon, NumberInput, type NumberInputHandlers } from '@mantine/core';
import { IconMinus, IconPlus } from '@tabler/icons-react';

import classes from './HowMany.module.css';

/** "How many?": minus, the number, plus, in one frame. */
export function HowMany({ name = 'quantity' }: { name?: string }) {
  const handlers = useRef<NumberInputHandlers>(undefined);
  return (
    <NumberInput
      name={name}
      label="How many?"
      description="Creates that many identical copies at once."
      min={1}
      max={50}
      defaultValue={1}
      clampBehavior="strict"
      allowDecimal={false}
      hideControls
      handlersRef={handlers}
      className={classes.howMany}
      leftSectionWidth={44}
      rightSectionWidth={44}
      leftSection={
        <ActionIcon
          variant="subtle"
          size={42}
          aria-label="One fewer"
          onClick={() => handlers.current?.decrement()}
        >
          <IconMinus size={20} stroke={2} />
        </ActionIcon>
      }
      rightSection={
        <ActionIcon
          variant="subtle"
          size={42}
          aria-label="One more"
          onClick={() => handlers.current?.increment()}
        >
          <IconPlus size={20} stroke={2} />
        </ActionIcon>
      }
    />
  );
}
