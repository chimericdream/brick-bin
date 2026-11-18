import type { ReactNode } from 'react';

import type { Section } from '@/lib/site';

/**
 * One tutorial. Every tutorial has the same five parts, so "On this page" is always the same five
 * links (SPEC 7.3): the goal, what you need, the steps, what to do if something goes wrong, and
 * what next. The step count shown on the index is the length of `steps`.
 */
export interface Tutorial {
  /** The address: /tutorials/<slug>/ */
  slug: string;
  title: string;
  /** One sentence for the tutorials index and the page description. */
  summary: string;
  /** Who it is for, shown in the page head: "Admins only". */
  audience: string;
  /** "By the end, …", one sentence. */
  goal: ReactNode;
  /** One paragraph under the goal. */
  goalMore?: ReactNode;
  /** The parts call-out: a bold count and a line of text. */
  needs: { count: string; text: ReactNode }[];
  steps: { title: string; body: ReactNode }[];
  /** Each item starts with the symptom, in bold. */
  wrong: { symptom: string; fix: ReactNode }[];
  next: { href: string; section: Section; label?: string; title: string; line: string };
  /** Adds the Rebrickable credit line at the end. */
  catalog?: boolean;
}
