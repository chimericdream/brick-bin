import Link from 'next/link';

import { Shot } from '@/components/Shot';
import { tutorialHref } from '@/lib/site';

import type { Tutorial } from './types';

export const copiesAndBuildState: Tutorial = {
  slug: 'copies-and-build-state',
  title: 'Track several copies and change build state',
  summary:
    'Give each box its own place, owner and price, then move it from sealed to built in two taps.',
  audience: 'Admins and members',
  goal: (
    <>
      By the end, a set will have more than one copy, each with its own owner, place and build
      state.
    </>
  ),
  goalMore: (
    <>
      Five copies of one polybag is normal. Brick Bin keeps them apart: each copy has its own build
      state, place, owner, price, value and missing pieces.
    </>
  ),
  needs: [
    {
      count: '1 ×',
      text: (
        <>
          A set in the library, from{' '}
          <Link href={tutorialHref('add-a-set')}>adding your first set</Link>
        </>
      ),
    },
    { count: '1 ×', text: 'A few places set up under Settings, Places (optional, and quick)' },
  ],
  steps: [
    {
      title: 'Open the set',
      body: (
        <p>
          Find it in the <b>Library</b> and open it. Its copies are listed under <b>Copies</b>, with
          the count beside the heading.
        </p>
      ),
    },
    {
      title: 'Press Add copy',
      body: (
        <p>
          The <b>Add a copy</b> dialog asks <b>How many?</b> and then the same fields every copy
          has: <b>Build state</b>, <b>Owner</b>, <b>Place</b>, <b>Acquired on</b>, <b>Price paid</b>
          , <b>Estimated value</b>, <b>Pieces last checked</b>, whether it <b>Has the box</b> and{' '}
          <b>Has paper booklets</b>, and notes. Press <b>Add copy</b>.
        </p>
      ),
    },
    {
      title: 'Give each copy its owner and place',
      body: (
        <>
          <p>
            <b>Owner</b> is a person in the household, or empty for a copy that belongs to everyone,
            which shows as <b>Ours</b>. <b>Place</b> comes from the list under Settings, Places, and
            shows as a path, such as Living room › Shelf 2.
          </p>
          <p>
            To change a copy later, press <b>Edit copy</b> on it.
          </p>
          <Shot id="T04-01" />
        </>
      ),
    },
    {
      title: 'Change the build state',
      body: (
        <>
          <p>Each copy shows its build state at the top right. Tap it, and pick one of six:</p>
          <ul>
            <li>
              <b>Sealed</b>: factory sealed, never opened.
            </li>
            <li>
              <b>Opened</b>: opened, not built.
            </li>
            <li>
              <b>In progress</b>: being built right now.
            </li>
            <li>
              <b>Built</b>: finished and on display.
            </li>
            <li>
              <b>Disassembled</b>: taken apart, and still kept together.
            </li>
            <li>
              <b>Mixed</b>: no longer a set. Its parts are in with everything else.
            </li>
          </ul>
          <Shot id="T04-02" />
        </>
      ),
    },
    {
      title: 'Check the library',
      body: (
        <p>
          Back in the <b>Library</b>, the set&apos;s tile shows a badge for each copy, up to three,
          then how many more. The filters can narrow the library to one build state, owner or place.
        </p>
      ),
    },
  ],
  wrong: [
    {
      symptom: 'The place you want is not in the list.',
      fix: 'Add it under Settings, Places first. Places can sit inside other places.',
    },
    {
      symptom: 'A copy was added by mistake.',
      fix: 'Press Remove copy on it. It goes to the trash, and Settings, Trash can bring it back.',
    },
  ],
  next: {
    href: tutorialHref('missing-pieces'),
    section: 'tutorials',
    title: 'Record missing pieces',
    line: 'Log the parts a copy is short of, then work the shopping list.',
  },
};
