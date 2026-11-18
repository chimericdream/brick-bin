import Link from 'next/link';
import type { ReactNode } from 'react';

import { REBRICKABLE_DOWNLOADS_URL, REBRICKABLE_URL, ROUTES, tutorialHref } from '@/lib/site';

/**
 * The FAQ, in order (SPEC 7.5). Every answer is visible. `answer` starts with the short answer in
 * bold; `more` holds the reasons. `jump` is the shorter wording for the "Jump to" list. To add a
 * question, add one entry.
 */
export interface FaqItem {
  id: string;
  question: string;
  jump?: string;
  answer: ReactNode;
  more: ReactNode[];
}

export const FAQ: FaqItem[] = [
  {
    id: 'lego',
    question: 'Is this a LEGO app?',
    answer: (
      <>
        <b>No.</b> Brick Bin works with any brand of building brick, including Mould King, CaDA,
        COBI, BlueBrixx and Lumibricks. It isn&apos;t affiliated with the LEGO Group.
      </>
    ),
    more: [
      <>
        The catalog lookup covers LEGO sets, because that&apos;s what Rebrickable&apos;s data
        describes. Sets from other brands are added by hand, or from a spreadsheet.
      </>,
    ],
  },
  {
    id: 'internet',
    question: 'Does it need the internet?',
    answer: (
      <>
        <b>Not day to day.</b> Your data stays on your server, nothing loads from a CDN, and the app
        makes no background downloads.
      </>
    ),
    more: [
      <>
        It goes online only when someone asks it to: an admin importing the catalog, a cover being
        fetched for a set you add from the catalog, a barcode you scan, or a PDF you ask it to save
        from a web address. Separately, the recommended install&apos;s Watchtower checks for a new
        app image every five minutes.{' '}
        <Link href={`${ROUTES.hosting}#downloads`}>The full list</Link>.
      </>,
    ],
  },
  {
    id: 'catalog',
    question: 'Where does the catalog come from?',
    answer: (
      <>
        <b>
          <a href={REBRICKABLE_URL}>Rebrickable</a>.
        </b>{' '}
        You import their data yourself, onto your own server.
      </>
    ),
    more: [
      <>
        Nothing is fetched on a schedule. An admin presses the button, and can do so at most once
        every 48 hours. <Link href={tutorialHref('import-catalog')}>The import tutorial</Link> walks
        through it.
      </>,
    ],
  },
  {
    id: 'wait',
    question: 'Why do I have to wait 48 hours between imports from Rebrickable?',
    jump: 'Why wait 48 hours between imports?',
    answer: (
      <>
        <b>To stay well inside Rebrickable&apos;s rules.</b> Their{' '}
        <a href={REBRICKABLE_DOWNLOADS_URL}>downloads page</a> says: &ldquo;You may automate
        downloading these archives at most once a day.&rdquo; That is a little vague, so Brick Bin
        takes the cautious reading and waits 48 hours between imports.
      </>
    ),
    more: [
      <>
        In practice you&apos;ll rarely meet the limit. The import needs running a handful of times a
        year, once a month at most.
      </>,
      <>
        The same notice goes on: &ldquo;Scraping our web pages is strictly against our Terms and
        will get you banned.&rdquo; That is why Brick Bin doesn&apos;t read the downloads page
        itself, and an admin <Link href={tutorialHref('import-catalog')}>pastes its source in</Link>
        .
      </>,
    ],
  },
  {
    id: 'kids',
    question: 'Can my kids see prices?',
    answer: (
      <>
        <b>No.</b> Kid profiles are read-only, with no prices and no shopping list. They can still
        manage their own wishlist.
      </>
    ),
    more: [
      <>
        Sets you mark as hidden look, to a kid profile, as if they don&apos;t exist. That rule lives
        on the server and is covered by tests, so it doesn&apos;t depend on a button being tucked
        out of sight. Birthday presents are safe.
      </>,
    ],
  },
  {
    id: 'tailscale',
    question: 'Can I run it without Tailscale?',
    answer: (
      <>
        <b>Yes.</b> Run the production compose file and open port 3000.
      </>
    ),
    more: [
      <>
        Tailscale is what we recommend because it gives you HTTPS and a tidy address with very
        little work. Running without it is covered in{' '}
        <Link href={`${ROUTES.hosting}#no-tailscale`}>the hosting docs</Link>.
      </>,
    ],
  },
  {
    id: 'backups',
    question: 'How do I back it up?',
    answer: (
      <>
        <b>Three things:</b> database dumps, cover images and instruction PDFs.
      </>
    ),
    more: [
      <>
        The downloaded catalog images aren&apos;t backed up, and the dumps skip the catalog tables,
        because both can be imported again. After a restore, run a catalog import.{' '}
        <Link href={`${ROUTES.hosting}#backups`}>Backups in detail</Link>.
      </>,
    ],
  },
  {
    id: 'loose',
    question: 'Can I track loose bricks?',
    answer: (
      <>
        <b>Not yet.</b> Version 1 tracks sets and the copies you own of them, plus the pieces each
        copy is missing.
      </>
    ),
    more: [
      <>
        Also not in version 1: owned minifigures, a build log, loans, ratings, guest share links,
        price-guide integrations, and currencies other than USD.
      </>,
    ],
  },
  {
    id: 'cost',
    question: 'What does it cost?',
    answer: (
      <>
        <b>Nothing.</b> Brick Bin is free and open source, under the MIT license. There&apos;s no
        account with us and no subscription.
      </>
    ),
    more: [<>You do supply the server, the disk and the bricks.</>],
  },
];
