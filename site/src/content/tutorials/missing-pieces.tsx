import Link from 'next/link';

import { Note } from '@/components/prose/Blocks';
import { Shot } from '@/components/Shot';
import { tutorialHref } from '@/lib/site';

import type { Tutorial } from './types';

export const missingPieces: Tutorial = {
  slug: 'missing-pieces',
  title: 'Record missing pieces and work the shopping list',
  summary: 'Log the parts a copy is short of, then take the list to the store or export it.',
  audience: 'Admins and members',
  goal: (
    <>
      By the end, a copy will list what it is missing, and the shopping list will gather it with
      everything else that is missing.
    </>
  ),
  goalMore: (
    <>
      Missing pieces belong to a copy, not to the set, because two boxes of the same set rarely lose
      the same parts.
    </>
  ),
  needs: [
    { count: '1 ×', text: 'A copy that is short of something' },
    {
      count: '1 ×',
      text: (
        <>
          The imported catalog, for part pictures and the set&apos;s own parts list.{' '}
          <Link href={tutorialHref('import-catalog')}>Import it first</Link>
        </>
      ),
    },
  ],
  steps: [
    {
      title: "Open the copy's missing pieces",
      body: (
        <p>
          On the set page, press <b>Missing pieces</b> on the copy. The page lists what is already
          recorded, and has <b>Add missing pieces</b> below.
        </p>
      ),
    },
    {
      title: 'Pick the parts',
      body: (
        <>
          <p>There are four tabs:</p>
          <ul>
            <li>
              <b>Set parts</b>: the set&apos;s own inventory, with pictures. Search by part number,
              name or color, set the quantity and press <b>Add</b>.
            </li>
            <li>
              <b>Minifigs</b>: the set&apos;s minifigures.
            </li>
            <li>
              <b>Whole catalog</b>: any part in any color, for one that isn&apos;t in the set&apos;s
              list.
            </li>
            <li>
              <b>Other</b>: anything else, typed in, such as a sticker sheet.
            </li>
          </ul>
          <p>Set parts and Minifigs only appear for sets linked to the catalog.</p>
          <Shot id="T05-01" />
        </>
      ),
    },
    {
      title: 'Mark the rest as checked',
      body: (
        <p>
          Once you have counted the whole copy, press <b>Everything else is here</b>. The copy then
          shows what it is missing and when its pieces were last checked.
        </p>
      ),
    },
    {
      title: 'Open the shopping list',
      body: (
        <p>
          <b>Shopping list</b> gathers what every copy is missing, grouped by part and color, with
          filters for set, owner, place and color.
        </p>
      ),
    },
    {
      title: 'Take it to the store',
      body: (
        <>
          <p>
            On a phone, press <b>Store-trip mode</b>. Each part gets a large picture and a checkbox.
            Tick parts as they go in the basket. The ticks are kept on that phone, so a dropped
            signal in the store aisle costs nothing.
          </p>
          <p>
            Press <b>Done</b> to mark the ticked pieces as bought. Each part fills the oldest
            missing rows first, and you can change which copy gets them before you confirm.
          </p>
          <Shot id="T05-02" />
        </>
      ),
    },
    {
      title: 'Or export it',
      body: (
        <>
          <p>
            <b>Export</b> offers three files: a <b>BrickLink wanted list (XML)</b>, a{' '}
            <b>Rebrickable parts list (CSV)</b> and a <b>Plain CSV</b>. Each one follows the filters
            you have set.
          </p>
          <Shot id="T05-03" />
        </>
      ),
    },
    {
      title: 'Resolve what turns up',
      body: (
        <>
          <p>
            Back on a copy&apos;s missing pieces, each row has <b>Found</b>, <b>Bought</b> and{' '}
            <b>Substituted</b>. Each asks how many, so two of four can turn up and the other two
            stay on the list.
          </p>
          <Note title="Delete is for mistakes">
            <p>
              Deleting a row removes it for good, with no trash. If a piece turned up, use Found, so
              the history stays right.
            </p>
          </Note>
        </>
      ),
    },
  ],
  wrong: [
    {
      symptom: 'There is no Set parts tab.',
      fix: 'The set is not linked to the catalog. Use Whole catalog, or Other.',
    },
    {
      symptom: 'A part is left out of the BrickLink file.',
      fix: 'It has no BrickLink ID in the catalog. The page says how many lines were left out. Use one of the CSV files for those.',
    },
    {
      symptom: 'A sealed copy shows no missing pieces in the library.',
      fix: 'A sealed copy always shows as Sealed, whatever is listed. Change its build state first.',
    },
  ],
  next: {
    href: tutorialHref('instructions'),
    section: 'tutorials',
    title: 'Attach instructions',
    line: 'Upload a PDF, save a link, or have Brick Bin save a PDF from a web address.',
  },
  catalog: true,
};
