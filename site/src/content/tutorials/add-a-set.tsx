import Link from 'next/link';

import { Note } from '@/components/prose/Blocks';
import { Shot } from '@/components/Shot';
import { ROUTES, tutorialHref } from '@/lib/site';

import type { Tutorial } from './types';

export const addASet: Tutorial = {
  slug: 'add-a-set',
  title: 'Add your first set',
  summary:
    'Three ways in: look it up in the catalog, scan a barcode, or type in an off-brand set by hand.',
  audience: 'Admins and members',
  goal: <>By the end, your first set will be in the library, with a copy of it that you own.</>,
  goalMore: (
    <>
      A set is the design: its number, name and pieces. A copy is a box you own. Adding a set adds
      one copy by default, and{' '}
      <Link href={tutorialHref('copies-and-build-state')}>the next tutorial</Link> covers adding
      more.
    </>
  ),
  needs: [
    { count: '1 ×', text: 'A set, in its box or out of it' },
    {
      count: '1 ×',
      text: (
        <>
          The imported catalog, for LEGO lookup.{' '}
          <Link href={tutorialHref('import-catalog')}>Import it first</Link>, or add sets by hand.
        </>
      ),
    },
  ],
  steps: [
    {
      title: 'Open Add set',
      body: (
        <p>
          Press <b>Add set</b> in the sidebar, or <b>Add</b> in the tab bar on a phone. The page is
          called <b>Add a set</b>, and starts with <b>Look up a LEGO set</b>.
        </p>
      ),
    },
    {
      title: 'Look it up in the catalog',
      body: (
        <>
          <p>
            For a LEGO set, type its number or part of its name into <b>Set number or name</b>, then
            pick the right match. The form fills in, and a note says it is linked to a Rebrickable
            set. The theme is added for you, and the cover is downloaded once, when you save.
          </p>
          <Shot id="T03-01" />
        </>
      ),
    },
    {
      title: 'Or scan the barcode',
      body: (
        <>
          <p>
            On a browser that can read barcodes, a <b>Scan barcode</b> button sits beside the
            search. Point the camera at the barcode on the box. If the code matches a catalog set,
            it shows up as a match. If not, the product name is filled in for you.
          </p>
          <Shot id="T03-02" />
          <Note title="Where the barcode goes">
            <p>
              A scan is one of the few times Brick Bin goes online: the barcode is looked up with a
              public barcode service, and nothing else is sent. If your browser has no{' '}
              <b>Scan barcode</b> button, it can&apos;t read barcodes, and the search does the same
              job.
            </p>
          </Note>
        </>
      ),
    },
    {
      title: 'Or type it in by hand',
      body: (
        <>
          <p>
            Sets from other brands, and LEGO sets the catalog doesn&apos;t have, are added with the
            form below the lookup. Choose the <b>Brand</b>, or press <b>+ New brand</b> to add one
            such as Mould King. <b>Set number</b> is optional for unnumbered kits. Only <b>Name</b>{' '}
            is required.
          </p>
          <p>
            <b>Cover image</b> takes a picture from your device. <b>Hide from kid profiles</b> keeps
            a set out of sight of kids, which is handy for presents.
          </p>
          <Shot id="T03-03" />
        </>
      ),
    },
    {
      title: 'Describe your copy',
      body: (
        <p>
          <b>Add a copy I own</b> is ticked already. Under it, <b>How many?</b> makes several
          identical copies at once, and the copy fields say what state it is in, whose it is, where
          it lives and what it cost. All of them can be filled in later.
        </p>
      ),
    },
    {
      title: 'Press Add set',
      body: (
        <p>
          The set page opens, with your copy listed under <b>Copies</b>. It is also in the{' '}
          <b>Library</b> now.
        </p>
      ),
    },
  ],
  wrong: [
    {
      symptom: '"The catalog has not been imported yet, so lookup is off."',
      fix: (
        <>
          An admin needs to <Link href={tutorialHref('import-catalog')}>import the catalog</Link>.
          Until then, add the set by hand.
        </>
      ),
    },
    {
      symptom: 'There is no Scan barcode button.',
      fix: 'Your browser does not support barcode reading. Search by number or name instead.',
    },
    {
      symptom: '"That barcode was not recognised."',
      fix: 'The barcode service did not know it. Search by number or name, or add it by hand.',
    },
    {
      symptom: 'The set has no cover after saving.',
      fix: (
        <>
          Covers come from the catalog only for linked LEGO sets. For anything else, edit the set
          and add a <b>Cover image</b>. See{' '}
          <Link href={`${ROUTES.hosting}#downloads`}>what Brick Bin downloads, and when</Link>.
        </>
      ),
    },
  ],
  next: {
    href: tutorialHref('copies-and-build-state'),
    section: 'tutorials',
    title: 'Track several copies',
    line: 'Give each box its own place, owner and price, and change its build state.',
  },
  catalog: true,
};
