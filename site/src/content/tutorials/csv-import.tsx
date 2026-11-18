import Link from 'next/link';

import { Note } from '@/components/prose/Blocks';
import { Shot } from '@/components/Shot';
import { tutorialHref } from '@/lib/site';

import type { Tutorial } from './types';

export const csvImport: Tutorial = {
  slug: 'csv-import',
  title: 'Import from CSV',
  summary: 'Bring in a Rebrickable set list, a Brickset export or any spreadsheet.',
  audience: 'Admins and members',
  goal: (
    <>
      By the end, a collection kept somewhere else will be in Brick Bin, one copy per box, without
      typing it in again.
    </>
  ),
  goalMore: (
    <>Nothing is saved until you press Import. Before that you see, row by row, what will happen.</>
  ),
  needs: [
    {
      count: '1 ×',
      text: 'A CSV file: a Rebrickable set list, a Brickset collection export, or any spreadsheet with a column of set numbers',
    },
    { count: '2 MB', text: 'At most, and 2,000 rows. Split a bigger file in two' },
    {
      count: '1 ×',
      text: (
        <>
          The imported catalog, if the file has LEGO sets.{' '}
          <Link href={tutorialHref('import-catalog')}>Import it first</Link>
        </>
      ),
    },
  ],
  steps: [
    {
      title: 'Open Import',
      body: (
        <p>
          <b>Import</b> is in the sidebar. Choose the file under <b>CSV file</b>. Brick Bin reads it
          at once and shows a preview.
        </p>
      ),
    },
    {
      title: 'Check the file format',
      body: (
        <p>
          <b>File format</b> is detected from the column names: <b>Rebrickable set list</b>,{' '}
          <b>Brickset collection</b>, or <b>Other CSV (choose the columns)</b>. Change it if the
          guess is wrong.
        </p>
      ),
    },
    {
      title: 'Match the columns, for any other spreadsheet',
      body: (
        <>
          <p>
            For Other CSV, say which column holds what. Only <b>Set number</b> is required. The rest
            are <b>Name</b>, <b>Brand</b>, <b>Theme</b>, <b>Year</b>, <b>Pieces</b>,{' '}
            <b>Copies owned</b>, <b>Price paid</b>, <b>Notes</b>, and <b>Wanted</b>, which puts the
            row on your wishlist instead.
          </p>
          <Shot id="T09-01" />
        </>
      ),
    },
    {
      title: 'Choose a build state',
      body: (
        <p>
          <b>Build state for the copies</b> applies to every copy the file creates. Pick the most
          common one. The odd ones out can be changed afterward, one by one.
        </p>
      ),
    },
    {
      title: 'Read the preview',
      body: (
        <>
          <p>
            The <b>Preview</b> table shows each row, <b>What happens</b> to it, and any{' '}
            <b>Problem</b>. LEGO set numbers are matched against the catalog. Rows that can&apos;t
            be imported are skipped, and <b>Download the rows that cannot be imported</b> gives you
            them back as a file to fix.
          </p>
          <Shot id="T09-02" />
        </>
      ),
    },
    {
      title: 'Press Import',
      body: (
        <>
          <p>
            <b>Import finished</b> says how many sets, copies, wishes and brands were added. Open
            the library to see them.
          </p>
          <Note title="No covers yet">
            <p>
              An import downloads nothing, so the new sets have no cover. Open a set to add one.
            </p>
          </Note>
        </>
      ),
    },
  ],
  wrong: [
    {
      symptom: 'Import stays disabled.',
      fix: 'Nothing in the file can be imported. For Other CSV, check that Set number points at the right column.',
    },
    {
      symptom: '"The catalog has not been imported yet" on every row.',
      fix: (
        <>
          Rebrickable and Brickset files are LEGO lists, and every row is matched against the
          catalog. <Link href={tutorialHref('import-catalog')}>Import the catalog</Link>, then
          choose the file again.
        </>
      ),
    },
    {
      symptom: '"No brand, and the number is not in the catalog."',
      fix: 'In Other CSV, a row the catalog does not know needs a Brand column, and a Name.',
    },
    {
      symptom: 'The file is refused.',
      fix: 'It is over 2 MB or 2,000 rows. Split it and import each half.',
    },
  ],
  next: {
    href: tutorialHref('collection-value'),
    section: 'tutorials',
    title: 'Check collection value',
    line: 'Totals, paid against estimated value, and the values that need a fresh look.',
  },
  catalog: true,
};
