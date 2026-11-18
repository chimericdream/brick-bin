import Link from 'next/link';

import { Shot } from '@/components/Shot';
import { ROUTES, configHref, tutorialHref } from '@/lib/site';

import type { Tutorial } from './types';

export const firstRun: Tutorial = {
  slug: 'first-run',
  title: 'First run',
  summary: 'Create your household and the admin account on the first visit.',
  audience: 'For whoever set up the server',
  goal: (
    <>
      By the end, Brick Bin will have a household, you will be its admin, and you will know where
      the settings are.
    </>
  ),
  goalMore: (
    <>
      The first person to open a new install becomes the admin. There is no default account and no
      default password, so there is nothing to change afterward.
    </>
  ),
  needs: [
    {
      count: '1 ×',
      text: (
        <>
          A running install, from <Link href={ROUTES.setup}>Setup</Link>
        </>
      ),
    },
    { count: '1 ×', text: 'An email address and a password of at least 8 characters' },
    { count: '5 min', text: 'Most of it spent choosing a household name' },
  ],
  steps: [
    {
      title: 'Open Brick Bin',
      body: (
        <>
          <p>
            On the recommended install, open{' '}
            <code>https://brick-bin.&lt;your-tailnet&gt;.ts.net</code> from any device on your
            tailnet. On the try-out install, open <code>http://&lt;your-server&gt;:3000</code>.
          </p>
          <p>
            A new install goes straight to a page called <b>Set up your bin</b>. It only appears
            while the household is empty.
          </p>
        </>
      ),
    },
    {
      title: 'Name the household and yourself',
      body: (
        <>
          <p>
            Fill in <b>Household name</b>, <b>Your name</b>, <b>Email</b> and <b>Password</b>. The
            email and password are what you sign in with. Nothing is sent anywhere: the account
            lives on your server.
          </p>
          <Shot id="T01-01" />
        </>
      ),
    },
    {
      title: 'Press Create household',
      body: (
        <>
          <p>
            You are signed in as the admin and land in the <b>Library</b>, which says{' '}
            <b>No sets yet</b>.
          </p>
          <Shot id="T01-02" />
        </>
      ),
    },
    {
      title: 'Look around Settings',
      body: (
        <>
          <p>
            Open <b>Settings</b> from the sidebar. It has <b>Places</b>, <b>Brands and themes</b>,{' '}
            <b>People</b>, <b>Catalog</b> (admins only), <b>Activity</b> and <b>Trash</b>.
          </p>
          <ul>
            <li>
              <b>Places</b> is worth five minutes now. Add where your sets are kept, such as a room,
              a shelf or a bin, and nest them with <b>Inside</b>. Copies can then say where they
              live.
            </li>
            <li>
              <b>Brands and themes</b> already has LEGO. Other brands can be added here, or as you
              add their first set.
            </li>
            <li>
              <b>People</b> is where everyone else in the household gets an account.{' '}
              <Link href={tutorialHref('kid-profile')}>Setting up a kid profile</Link> covers it.
            </li>
          </ul>
        </>
      ),
    },
  ],
  wrong: [
    {
      symptom: 'You get a sign-in page instead.',
      fix: (
        <>
          Someone has already created the household. Set up your bin appears only once, while the
          household is empty. Ask the person who did it to add you under People.
        </>
      ),
    },
    {
      symptom: '"Use at least 8 characters."',
      fix: 'The password is too short. Choose a longer one.',
    },
    {
      symptom: 'After signing in you are back on the sign-in page.',
      fix: (
        <>
          The browser is not keeping the session cookie, which happens when{' '}
          <Link href={configHref('COOKIE_SECURE')}>
            <code>COOKIE_SECURE</code>
          </Link>{' '}
          is <code>true</code> but the page is served over plain HTTP. On the Tailscale install, use
          the <code>https://</code> tailnet address, not port 3000.
        </>
      ),
    },
  ],
  next: {
    href: tutorialHref('import-catalog'),
    section: 'tutorials',
    title: 'Import the LEGO catalog',
    line: 'Set lookup and part pictures, from Rebrickable data you import yourself.',
  },
};
