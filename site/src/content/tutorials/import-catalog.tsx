import Link from 'next/link';

import { Note } from '@/components/prose/Blocks';
import { Shot } from '@/components/Shot';
import {
  REBRICKABLE_DOWNLOADS_URL,
  REBRICKABLE_URL,
  ROUTES,
  configHref,
  tutorialHref,
} from '@/lib/site';

import type { Tutorial } from './types';

export const importCatalog: Tutorial = {
  slug: 'import-catalog',
  title: 'Import the LEGO catalog',
  summary:
    "Load Rebrickable's catalog by pasting its downloads page, and learn why the button then rests for 48 hours.",
  audience: 'Admins only',
  goal: (
    <>
      By the end, looking up a LEGO set by number or name will find it, and missing pieces will come
      with pictures.
    </>
  ),
  goalMore: (
    <>
      The catalog is data from <a href={REBRICKABLE_URL}>Rebrickable</a>. Brick Bin never fetches it
      on a schedule. It arrives when an admin asks for it, and at no other time.
    </>
  ),
  needs: [
    {
      count: '1 ×',
      text: (
        <>
          An admin account, from the{' '}
          <Link href={tutorialHref('first-run')}>first-run tutorial</Link>
        </>
      ),
    },
    {
      count: '1 ×',
      text: "A computer with a browser. Copying a page's source is easier there than on a phone.",
    },
    { count: '6 GB', text: 'Free disk for part images, plus room for the data archive' },
    { count: '48 h', text: 'Since the last successful import, if there was one' },
  ],
  steps: [
    {
      title: 'Open the catalog page',
      body: (
        <>
          <p>
            Sign in as an admin and open <b>Settings</b>, then <b>Catalog</b>. On a new install the
            page says <b>Never imported</b>, warns that the first import downloads about 6 GB, shows
            how much disk is free, and has an empty paste box.
          </p>
          <Shot id="T02-01" />
        </>
      ),
    },
    {
      title: "Open Rebrickable's downloads page",
      body: (
        <p>
          In a new tab, go to <a href={REBRICKABLE_DOWNLOADS_URL}>rebrickable.com/downloads</a>. You
          don&apos;t need to sign in or click anything there.
        </p>
      ),
    },
    {
      title: "Copy the page's source",
      body: (
        <>
          <p>View the page source, select everything and copy it.</p>
          <ul>
            <li>
              Windows and Linux: <kbd>Ctrl</kbd> + <kbd>U</kbd>, then <kbd>Ctrl</kbd> + <kbd>A</kbd>{' '}
              and <kbd>Ctrl</kbd> + <kbd>C</kbd>
            </li>
            <li>
              Mac, in Chrome or Safari: <kbd>⌥</kbd> + <kbd>⌘</kbd> + <kbd>U</kbd>, then{' '}
              <kbd>⌘</kbd> + <kbd>A</kbd> and <kbd>⌘</kbd> + <kbd>C</kbd>
            </li>
          </ul>
          <Note title="Why the copy and paste?">
            <p>
              Until Rebrickable confirms that automated page reads are fine, Brick Bin won&apos;t
              read that page for you. For now, you are the fetch. If that answer ever comes,{' '}
              <Link href={configHref('REBRICKABLE_PAGE_FETCH')}>
                <code>REBRICKABLE_PAGE_FETCH</code>
              </Link>{' '}
              switches it on and the Catalog page gets a single Import catalog button.
            </p>
          </Note>
        </>
      ),
    },
    {
      title: 'Paste it and check it',
      body: (
        <>
          <p>
            Back on the Catalog page, paste into the box and press <b>Check the page</b>. Brick Bin
            reads what you pasted and says what it will download: the catalog archive, the schema
            diagram and the part-image files that changed since the last import. Nothing is
            downloaded yet.
          </p>
          <Shot id="T02-02" />
        </>
      ),
    },
    {
      title: 'Press Import catalog',
      body: (
        <>
          <p>
            The first import downloads about 6 GB of part images plus the data archive, one file at
            a time. How long that takes is up to your connection, so this is a good moment to go
            make coffee. The page shows <b>Import running</b> with a file count and a progress bar,
            and you can leave it: the import carries on without the page open.
          </p>
          <Shot id="T02-03" />
        </>
      ),
    },
    {
      title: 'Check that it worked',
      body: (
        <>
          <p>
            When the page says <b>Last imported</b> with today&apos;s date, open <b>Add set</b> and
            type a set number you know into <b>Look up a LEGO set</b>. If it turns up in the list,
            the catalog is in. The set&apos;s cover is downloaded when you save it, not while you
            type.
          </p>
          <Shot id="T02-04" />
        </>
      ),
    },
    {
      title: 'Leave it alone for 48 hours',
      body: (
        <>
          <p>
            An import can run at most once every 48 hours, counted from the end of the last one that
            succeeded. Until then the paste box is switched off and the page says when it is{' '}
            <b>Available again</b>. <Link href={`${ROUTES.faq}#wait`}>Why 48 hours?</Link>
          </p>
          <Note title="Nothing updates by itself" variant="mind">
            <p>
              The catalog is only as fresh as the last time an admin pressed the button. If a
              brand-new set is missing from the lookup, run another import once the 48 hours are up.
              Once a month is plenty.
            </p>
          </Note>
        </>
      ),
    },
  ],
  wrong: [
    {
      symptom: '"This does not look like the whole Rebrickable downloads page."',
      fix: 'You probably copied the visible text and not the page source. Go back to step 3.',
    },
    {
      symptom: '"This page is older than your last import."',
      fix: 'The paste is out of date. Copy the page again, or tick the box to use it anyway.',
    },
    {
      symptom: '"The last import failed."',
      fix: (
        <>
          Check free disk space first: the part images need about 6 GB. A failed import does not
          start the 48-hour wait, so you can try again. Files it already downloaded are kept, and
          each file is downloaded at most once a day, so a quick retry may be told to wait for one
          of them.
        </>
      ),
    },
    {
      symptom: 'You restored from a backup and the pictures are gone.',
      fix: (
        <>
          That&apos;s expected. Catalog data and images aren&apos;t backed up, so run an import
          again. See <Link href={`${ROUTES.hosting}#restoring`}>restoring</Link>.
        </>
      ),
    },
  ],
  next: {
    href: tutorialHref('add-a-set'),
    section: 'tutorials',
    title: 'Add your first set',
    line: 'Catalog lookup, a barcode scan, or typing in an off-brand set by hand.',
  },
  catalog: true,
};
