import Link from 'next/link';

import { Shot } from '@/components/Shot';
import { configHref, tutorialHref } from '@/lib/site';

import type { Tutorial } from './types';

export const instructions: Tutorial = {
  slug: 'instructions',
  title: 'Attach instructions',
  summary: 'Upload a PDF, save a link, or have Brick Bin save a PDF from a web address.',
  audience: 'Admins and members',
  goal: <>By the end, a set will have its building instructions one tap away.</>,
  goalMore: (
    <>
      Instructions belong to the set, so every copy shares them. PDFs are stored on your server and
      served from there, so they keep working when the maker&apos;s site moves things around.
    </>
  ),
  needs: [
    { count: '1 ×', text: 'A set in the library' },
    {
      count: '1 ×',
      text: (
        <>
          A PDF, or its web address. Up to 200 MB each, unless{' '}
          <Link href={configHref('INSTRUCTIONS_MAX_MB')}>
            <code>INSTRUCTIONS_MAX_MB</code>
          </Link>{' '}
          says otherwise
        </>
      ),
    },
  ],
  steps: [
    {
      title: 'Find the Instructions section',
      body: (
        <>
          <p>
            Open the set. Below its copies, <b>Instructions</b> lists what the set already has, with
            three buttons: <b>Upload PDF</b>, <b>Add link</b> and <b>Save PDF from a link</b>.
          </p>
          <Shot id="T06-01" />
        </>
      ),
    },
    {
      title: 'Upload a PDF',
      body: (
        <p>
          <b>Upload PDF</b> takes a file from your device and a <b>Name</b>, such as Book 1. A
          progress bar shows while it uploads, and Brick Bin checks that the file really is a PDF.
        </p>
      ),
    },
    {
      title: 'Or save one from a web address',
      body: (
        <>
          <p>
            <b>Save PDF from a link</b> takes the <b>Address of the PDF</b>, downloads it to your
            server and stores it like an upload. The address must be public and start with{' '}
            <code>https://</code>. Addresses on your own network or tailnet are refused.
          </p>
          <Shot id="T06-02" />
        </>
      ),
    },
    {
      title: 'Or keep a link',
      body: (
        <p>
          <b>Add link</b> saves a <b>Web address</b> without downloading anything, for a page rather
          than a file.
        </p>
      ),
    },
    {
      title: 'Open them',
      body: (
        <p>
          Each item has <b>Open</b> for a stored PDF or <b>Visit</b> for a link, and can be renamed,
          moved up or down, or removed. PDFs open in the browser&apos;s own viewer, which can jump
          straight to a page in the middle of a long booklet.
        </p>
      ),
    },
  ],
  wrong: [
    {
      symptom: 'The upload is refused as too large.',
      fix: (
        <>
          The file is over the limit, which is 200 MB unless{' '}
          <Link href={configHref('INSTRUCTIONS_MAX_MB')}>
            <code>INSTRUCTIONS_MAX_MB</code>
          </Link>{' '}
          says otherwise.
        </>
      ),
    },
    {
      symptom: 'Saving from a link fails.',
      fix: 'The address has to be public https, and has to return a PDF. A page that links to the PDF is not enough: open it, and copy the PDF’s own address.',
    },
  ],
  next: {
    href: tutorialHref('kid-profile'),
    section: 'tutorials',
    title: 'Set up a kid profile',
    line: 'Read-only, with no prices and no shopping list.',
  },
};
