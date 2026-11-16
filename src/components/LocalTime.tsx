'use client';

import { useSyncExternalStore } from 'react';

const FORMATS = {
  datetime: { day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit' },
  date: { day: 'numeric', month: 'short', year: 'numeric' },
} as const satisfies Record<string, Intl.DateTimeFormatOptions>;

const subscribe = () => () => {};

/**
 * A moment in the viewer's own time zone. The server cannot know it, so the first render (and the
 * server's HTML) uses UTC, and the browser swaps in local time right after hydrating.
 */
export function LocalTime({
  iso,
  format = 'datetime',
}: {
  iso: string;
  format?: keyof typeof FORMATS;
}) {
  // The server snapshot is used for the server HTML and hydration; the browser then switches.
  const where = useSyncExternalStore(
    subscribe,
    () => 'browser',
    () => 'server',
  );
  const text = new Date(iso).toLocaleString('en-US', {
    ...FORMATS[format],
    timeZone: where === 'server' ? 'UTC' : undefined,
  });
  return <time dateTime={iso}>{text}</time>;
}
