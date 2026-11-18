import Link from 'next/link';

import { Note } from '@/components/prose/Blocks';
import { Shot } from '@/components/Shot';
import { tutorialHref } from '@/lib/site';

import type { Tutorial } from './types';

export const kidProfile: Tutorial = {
  slug: 'kid-profile',
  title: 'Set up a kid profile',
  summary:
    'A read-only profile with no prices and no shopping list, and sets you can hide from it.',
  audience: 'Admins only',
  goal: (
    <>
      By the end, a kid will have their own sign-in that can browse the collection and keep a
      wishlist, and nothing else.
    </>
  ),
  goalMore: (
    <>
      A kid profile sees the library without prices, never sees the shopping list, the collection
      value, the activity trail or settings, and cannot change anything except their own wishlist.
      The server enforces all of it, so it doesn&apos;t depend on a button being out of sight.
    </>
  ),
  needs: [
    { count: '1 ×', text: 'An admin account' },
    {
      count: '1 ×',
      text: 'An email address and a password for the kid. The email is only a sign-in name and is never sent anything.',
    },
  ],
  steps: [
    {
      title: 'Open People',
      body: (
        <p>
          Open <b>Settings</b>, then <b>People</b>. Everyone in the household is listed, with{' '}
          <b>Add a person</b> below. Only admins can add people.
        </p>
      ),
    },
    {
      title: 'Add the kid',
      body: (
        <>
          <p>
            Fill in <b>Name</b>, <b>Email</b> and <b>Password</b> (at least 8 characters). Set{' '}
            <b>Role</b> to <b>Kid profile: read-only, own wishlist</b>, and press <b>Add person</b>.
          </p>
          <Shot id="T07-01" />
        </>
      ),
    },
    {
      title: 'Hide the sets they should not see',
      body: (
        <>
          <p>
            Open a set, press <b>Edit set</b>, tick <b>Hide from kid profiles</b> and press{' '}
            <b>Save changes</b>. The set, its copies and its cover disappear for kid profiles, as if
            they had never been added. It also works when you add a set, and in the wishlist&apos;s{' '}
            <b>We got it</b>.
          </p>
          <Note title="Birthday presents">
            <p>
              A hidden set is left out of everything a kid profile can reach, down to the library
              counts, tags and themes. The rule lives in the database queries, and the
              project&apos;s tests check that hidden sets never reach a kid profile.
            </p>
          </Note>
        </>
      ),
    },
    {
      title: 'Sign in as the kid, once',
      body: (
        <>
          <p>
            In a private browser window, sign in with the kid&apos;s email and password. The tab bar
            has <b>Library</b> and <b>Wishlist</b> only. Prices and the shopping list are gone, and
            the hidden set is nowhere.
          </p>
          <Shot id="T07-02" />
        </>
      ),
    },
    {
      title: 'Hand it over',
      body: (
        <p>
          Kids can add to their own wishlist, but can&apos;t see or enter prices on it, and
          can&apos;t mark anyone else&apos;s wishes as bought.{' '}
          <Link href={tutorialHref('wishlist')}>Running a wishlist</Link> covers the rest.
        </p>
      ),
    },
  ],
  wrong: [
    {
      symptom: 'There is no Add a person form.',
      fix: 'Only admins can add people. Ask an admin, or have one change your role.',
    },
    {
      symptom: 'The kid can still see a set you meant to hide.',
      fix: 'Hide from kid profiles is set on the set, not the copy. Edit the set and check the box is ticked, then reload the kid’s page.',
    },
  ],
  next: {
    href: tutorialHref('wishlist'),
    section: 'tutorials',
    title: 'Run a wishlist',
    line: 'Private "I bought this" marks, and "We got it" when the box arrives.',
  },
};
