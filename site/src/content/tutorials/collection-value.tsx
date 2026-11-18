import Link from 'next/link';

import { Shot } from '@/components/Shot';
import { ROUTES, tutorialHref } from '@/lib/site';

import type { Tutorial } from './types';

export const collectionValue: Tutorial = {
  slug: 'collection-value',
  title: 'Check collection value',
  summary: 'Totals, paid against estimated value, and the values that need a fresh look.',
  audience: 'Admins and members',
  goal: (
    <>
      By the end, you will know what the collection cost, roughly what it is worth, and which values
      are out of date.
    </>
  ),
  goalMore: (
    <>
      Values are what you type in. Brick Bin has no price guide and fetches no prices, so the page
      is only as good as the numbers on your copies. Amounts are in US dollars.
    </>
  ),
  needs: [
    {
      count: '1 ×',
      text: (
        <>
          Some copies with a <b>Price paid</b> or an <b>Estimated value</b>, from{' '}
          <Link href={tutorialHref('copies-and-build-state')}>tracking copies</Link>
        </>
      ),
    },
  ],
  steps: [
    {
      title: 'Give copies a price and a value',
      body: (
        <p>
          On a set page, press <b>Edit copy</b> and fill in <b>Price paid</b> and{' '}
          <b>Estimated value</b>. Saving a copy with an estimated value stamps the value with
          today&apos;s date, which is how the page knows when it gets old.
        </p>
      ),
    },
    {
      title: 'Open Collection',
      body: (
        <>
          <p>
            <b>Collection</b> opens with the number of sets, copies and pieces, then three totals:{' '}
            <b>Paid</b>, <b>Estimated value</b> and the <b>Difference</b>. The difference only
            counts copies that have both numbers, so a missing price never looks like a profit.
          </p>
          <Shot id="T10-01" />
        </>
      ),
    },
    {
      title: 'Read the breakdowns',
      body: (
        <p>
          Below the totals: copies, paid and value <b>By brand</b> and <b>By theme</b>, a count{' '}
          <b>By build state</b>, how many copies have <b>Missing pieces</b>, and the{' '}
          <b>Sealed sets</b>.
        </p>
      ),
    },
    {
      title: 'Refresh the old values',
      body: (
        <p>
          <b>Value not set in over a year</b> lists copies with no estimate, or an estimate more
          than a year old, the oldest first. Work down it with whatever price source you trust.
        </p>
      ),
    },
  ],
  wrong: [
    {
      symptom: 'Every total is $0.',
      fix: 'No copy has a price or a value yet. Step 1 fixes it.',
    },
    {
      symptom: 'A kid profile cannot open Collection.',
      fix: (
        <>
          That&apos;s by design. Kid profiles never see prices or values.{' '}
          <Link href={`${ROUTES.faq}#kids`}>Can my kids see prices?</Link>
        </>
      ),
    },
  ],
  next: {
    href: ROUTES.faq,
    section: 'faq',
    label: 'Questions?',
    title: 'FAQ',
    line: 'Short answers, including the ones that are "not yet".',
  },
};
