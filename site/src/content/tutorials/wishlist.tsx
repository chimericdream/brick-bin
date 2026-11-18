import { Note } from '@/components/prose/Blocks';
import { Shot } from '@/components/Shot';
import { tutorialHref } from '@/lib/site';

import type { Tutorial } from './types';

export const wishlist: Tutorial = {
  slug: 'wishlist',
  title: 'Run a wishlist',
  summary: 'Private "I bought this" marks, and "We got it" when the box arrives.',
  audience: 'Everyone, kids included',
  goal: (
    <>
      By the end, you will have a wishlist of your own, and will know how to buy from someone
      else&apos;s without giving the game away.
    </>
  ),
  goalMore: (
    <>
      Everyone in the household has one list, and can see everyone else&apos;s, which is the point
      of them. A kid profile sees only its own.
    </>
  ),
  needs: [
    { count: '1 ×', text: 'An account in the household' },
    { count: '1 ×', text: 'Something you want, or something you plan to buy for someone' },
  ],
  steps: [
    {
      title: 'Open Wishlist',
      body: (
        <p>
          <b>Wishlist</b> shows <b>My wishlist</b> and everyone else&apos;s, with{' '}
          <b>Add to my wishlist</b> at the top.
        </p>
      ),
    },
    {
      title: 'Add a wish',
      body: (
        <p>
          For a LEGO set, look it up and pick it. Otherwise fill in <b>Name</b>, and, if you like,
          the <b>Set number</b>, <b>Price seen</b>, a <b>Link</b> and <b>Notes for gift-givers</b>.
          Press <b>Add to my wishlist</b>. Kid profiles add wishes the same way, without the price.
        </p>
      ),
    },
    {
      title: "Buy from someone else's list",
      body: (
        <>
          <p>
            On another person&apos;s wish, press <b>I bought this</b>. Add the <b>Date</b> and, if
            it helps, a <b>Note to yourself</b> such as where it is hidden, then press{' '}
            <b>Mark as bought</b>.
          </p>
          <Shot id="T08-01" />
          <Note title="Only you see the mark">
            <p>
              The mark is kept apart from everything else and only ever shown to the person who made
              it. Not the person whose wish it is, not other buyers, not admins, and not the
              activity trail. Two people can mark the same wish, so compare notes before the
              birthday if it matters.
            </p>
          </Note>
        </>
      ),
    },
    {
      title: 'Take a mark back',
      body: (
        <p>
          Changed your mind, or the store was out? Press <b>Undo</b> on your mark. Nobody else will
          know it was there.
        </p>
      ),
    },
    {
      title: 'Press We got it when it arrives',
      body: (
        <>
          <p>
            <b>We got it</b> turns the wish into a set in the collection, where everyone in the
            household can see it. Choose the <b>Brand</b>, keep <b>Add a sealed copy</b> ticked to
            add the box itself, and tick <b>Hide it from kid profiles for now</b> if it is a
            present. Then press <b>Add to the collection</b>. Any private marks on the wish are
            deleted.
          </p>
          <Shot id="T08-02" />
        </>
      ),
    },
  ],
  wrong: [
    {
      symptom: 'There is no I bought this button.',
      fix: 'It only shows on other people’s wishes, and not for kid profiles.',
    },
    {
      symptom: 'A wish was removed by mistake.',
      fix: 'Removed wishes go to the trash, and Settings, Trash can bring them back.',
    },
  ],
  next: {
    href: tutorialHref('csv-import'),
    section: 'tutorials',
    title: 'Import from CSV',
    line: 'Bring in a Rebrickable set list, a Brickset export or any spreadsheet.',
  },
};
