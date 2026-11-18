import type { Metadata } from 'next';
import Link from 'next/link';

import { Button } from '@/components/Button';
import { BuildPile } from '@/components/landing/BuildPile';
import { Shot } from '@/components/Shot';
import { TUTORIALS } from '@/content/tutorials';
import { REBRICKABLE_URL, REPO_URL, ROUTES } from '@/lib/site';
import { countWord } from '@/lib/words';

import classes from './Landing.module.css';

export const metadata: Metadata = { alternates: { canonical: ROUTES.home } };

const FEATURES: { title: string; chips: React.ReactNode; body: React.ReactNode }[] = [
  {
    title: 'Build state',
    chips: (
      <>
        <span className={classes.chip}>Opened</span>
        <span className={`${classes.chip} ${classes.chipOn}`}>In progress</span>
        <span className={classes.chip}>Built</span>
      </>
    ),
    body: 'Sealed, opened, in progress, built, disassembled or mixed. Each copy has a one-tap menu to move between them.',
  },
  {
    title: 'Missing pieces',
    chips: (
      <>
        <span className={classes.chip}>
          <span className={classes.swatch} />
          Plate 1 × 2, dark tan
        </span>
        <span className="tag tag--missing">× 4</span>
      </>
    ),
    body: "Logged as real catalog parts: part, color and quantity, with pictures. Pick from the set's own inventory or search the whole catalog.",
  },
  {
    title: 'Shopping list',
    chips: (
      <>
        <span className={classes.chip}>Store trip</span>
        <span className={classes.chip}>BrickLink XML</span>
        <span className={classes.chip}>CSV</span>
      </>
    ),
    body: 'Everything missing, grouped by part and color. Use store-trip mode on your phone, or export to BrickLink wanted-list XML, Rebrickable CSV or plain CSV.',
  },
  {
    title: 'Catalog lookup',
    chips: (
      <>
        <span className={`${classes.chip} ${classes.chipBig}`}>48 h</span>
        <span>between imports, at least</span>
      </>
    ),
    body: (
      <>
        Search LEGO sets using <a href={REBRICKABLE_URL}>Rebrickable</a> data you import yourself.
        Nothing is fetched on a schedule. An admin presses the button.
      </>
    ),
  },
  {
    title: 'Instructions',
    chips: (
      <>
        <span className={`${classes.chip} ${classes.chipBig}`}>p. 37</span>
        <span>of 112</span>
      </>
    ),
    body: 'Upload PDFs, save a link, or save a PDF from a web address. On a phone you can jump around the file.',
  },
  {
    title: 'Collection and value',
    chips: (
      <>
        <span className={classes.chip}>Paid</span>
        <span className={classes.chip}>Estimated</span>
        <span className="tag tag--missing">3 stale</span>
      </>
    ),
    body: "Totals, what you paid against estimated value, values that have gone stale, and what's still sealed.",
  },
  {
    title: 'Wishlists, with a secret',
    chips: (
      <>
        <span className={`${classes.chip} ${classes.chipOn}`}>I bought this</span>
        <span>Only you see this mark</span>
      </>
    ),
    body: 'One list per person. Anyone can privately mark "I bought this", and only they ever see it. Not admins, not the activity log. "We got it" turns a wish into a set.',
  },
  {
    title: 'Kid profiles',
    chips: (
      <>
        <span className={classes.chip}>
          Price <span className={classes.redact} />
        </span>
        <span className={classes.chip}>Read-only</span>
      </>
    ),
    body: "Read-only, with no prices and no shopping list. Kids manage their own wishlist. Sets marked hidden look as if they don't exist, and the server enforces it.",
  },
  {
    title: 'Private by construction',
    chips: (
      <>
        <span className={classes.chip}>On your disk</span>
        <span className={classes.chip}>No CDN</span>
      </>
    ),
    body: 'Your data stays on your server. Nothing loads from a CDN, and the app makes no background downloads.',
  },
];

const COPIES: { n: number; state: string; place: React.ReactNode }[] = [
  { n: 1, state: 'Sealed', place: 'Hall closet' },
  { n: 2, state: 'Built', place: 'Living-room shelf' },
  { n: 3, state: 'Disassembled', place: 'Blue tub' },
  {
    n: 4,
    state: 'Disassembled',
    place: (
      <>
        Blue tub · <span className="tag tag--missing">4 missing</span>
      </>
    ),
  },
  { n: 5, state: 'Mixed', place: 'Somewhere in the big tub' },
];

const BOND: { title: string; body: React.ReactNode }[] = [
  {
    title: 'Start the stack',
    body: 'On a Proxmox VM or LXC with Docker, one compose file starts the app and its own Postgres 17.',
  },
  {
    title: 'Reach it over Tailscale',
    body: (
      <>
        A Tailscale sidecar serves HTTPS at{' '}
        <code>https://brick-bin.&lt;your-tailnet&gt;.ts.net</code>, so the app answers only on your
        network.
      </>
    ),
  },
  {
    title: 'Create the household',
    body: 'The first visit asks you to name the household and create the admin account. Everyone else is added from there.',
  },
  {
    title: 'Import the catalog',
    body: 'An admin presses the button and Brick Bin loads the LEGO catalog from Rebrickable: about 6 GB of part images plus a data archive.',
  },
];

const NOT_YET = [
  'Loose-brick inventory',
  'Owned minifigures',
  'A build log',
  'Loans',
  'Ratings',
  'Guest share links',
  'Price-guide integrations',
  'Currencies other than USD',
];

const tutorialCount = countWord(TUTORIALS.length);

const STACK: { section: string; href: string; name: string; line: string }[] = [
  { section: 'faq', href: ROUTES.faq, name: 'FAQ', line: 'Short answers to fair questions' },
  {
    section: 'config',
    href: ROUTES.config,
    name: 'Configuration',
    line: 'Every setting, with its default',
  },
  {
    section: 'hosting',
    href: ROUTES.hosting,
    name: 'Hosting',
    line: 'What runs, what it stores, how to back it up',
  },
  {
    section: 'tutorials',
    href: ROUTES.tutorials,
    name: 'Tutorials',
    line: `${tutorialCount} walk-throughs, from first run to collection value`,
  },
];

export default function Landing() {
  return (
    <div className="wrap">
      <section className={`${classes.hero} studs`} aria-labelledby="hero-h">
        <div className={classes.heroText}>
          <h1 id="hero-h">Know what&apos;s in every box.</h1>
          <p className="lead">
            Brick Bin is a free, self-hosted web app for a household&apos;s building-brick sets:
            LEGO, Mould King, CaDA, COBI, BlueBrixx, Lumibricks and whatever arrives next.
          </p>
          <p className={classes.heroSub}>
            It runs on your own server and remembers each box you own, where it lives, how built it
            is and which pieces have gone missing. It&apos;s for families and collectors who run a
            small home server, or are curious enough to start.
          </p>
          <div className={classes.heroActions}>
            <Button href={ROUTES.setup} variant="start" arrow>
              Read the setup guide
            </Button>
            <Link className={classes.textLink} href={ROUTES.tutorials}>
              See the tutorials
            </Link>
            <a className={classes.textLink} href={REPO_URL}>
              Source code
            </a>
          </div>
        </div>
        <BuildPile />
      </section>

      <section className={`${classes.section} ${classes.setcopy}`} aria-labelledby="sc-h">
        <div>
          <h2 id="sc-h">
            A set is the design. <br />A copy is a box you own.
          </h2>
          <p className="lead">
            Five copies of one polybag is normal here. Brick Bin keeps the five apart, each with its
            own build state, place, owner, price and value.
          </p>
        </div>
        <figure className={classes.copies} aria-label="Example: one set with five copies">
          <div className={classes.copiesSet}>
            <span>Polybag racer</span>
            <span>5 copies</span>
          </div>
          <ul>
            {COPIES.map((c) => (
              <li key={c.n}>
                <b>Copy {c.n}</b>
                <span>{c.state}</span>
                <span>{c.place}</span>
              </li>
            ))}
          </ul>
          <figcaption>An illustration, drawn for this page. The real screen is below.</figcaption>
        </figure>
      </section>

      <section className={classes.section} aria-labelledby="feat-h">
        <div className={classes.head}>
          <h2 id="feat-h">What it keeps track of</h2>
          <p>
            Sets, the boxes you own of each, and everything that goes missing from them. All of this
            is in version 1 today.
          </p>
        </div>
        <ul className={classes.features}>
          {FEATURES.map((f) => (
            <li key={f.title} className={classes.feature}>
              <div className={classes.chipRow} aria-hidden="true">
                {f.chips}
              </div>
              <h3>{f.title}</h3>
              <p>{f.body}</p>
            </li>
          ))}
        </ul>
        <p className={classes.also}>
          Also in the bin: CSV import from a Rebrickable set list, a Brickset export or any
          spreadsheet, an activity trail, a trash you can restore from, light and dark themes, and
          layouts made for phones first.
        </p>
      </section>

      <section className={classes.section} aria-labelledby="shots-h">
        <div className={classes.head}>
          <h2 id="shots-h">One page per set, one row per box</h2>
          <p>
            The set page shows the design once, with every copy you own listed beneath it. On a
            phone, the shopping list becomes a checklist you can work through in the store aisle.
          </p>
        </div>
        <div className={classes.shots}>
          <Shot id="LND-01" />
          <Shot id="LND-02" />
        </div>
      </section>

      <section className={`${classes.section} sec-hosting`} aria-labelledby="host-h">
        <div className={classes.head}>
          <p className={classes.eyebrow}>
            <span className="b1" />
            How self-hosting works
          </p>
          <h2 id="host-h">Four bricks, bottom to top</h2>
          <p>
            Brick Bin lives on a machine you own and answers on your own network. Most of the time
            goes on waiting for the catalog to download, which is a fine excuse to go build
            something.
          </p>
        </div>
        <ol className={classes.bond}>
          {BOND.map((b) => (
            <li key={b.title} className="studs">
              <h3>{b.title}</h3>
              <p>{b.body}</p>
            </li>
          ))}
        </ol>
        <div className={classes.hostingNotes}>
          <p>
            <b>Updates look after themselves.</b> Watchtower checks for a new app image every five
            minutes. Postgres is never auto-updated, because databases deserve a human in the room.
          </p>
          <p>
            <b>Only want a look?</b> Run the production compose file without Tailscale and open port
            3000. <Link href={`${ROUTES.hosting}#no-tailscale`}>How hosting works</Link>
          </p>
        </div>
      </section>

      <section className={`${classes.section} ${classes.wont}`} aria-labelledby="wont-h">
        <div>
          <div className={classes.head}>
            <h2 id="wont-h">What you won&apos;t find here</h2>
          </div>
          <ul className={classes.ledger}>
            <li>
              <b>An account with us</b>
              <span className="tag tag--missing">None</span>
              <p>You create the household and its admin on your own server. We never see either.</p>
            </li>
            <li>
              <b>A subscription</b>
              <span className="tag tag--missing">$0</span>
              <p>Brick Bin is free and open source. There is no paid tier further down the page.</p>
            </li>
            <li>
              <b>Tracking</b>
              <span className="tag tag--missing">None</span>
              <p>This site has no analytics and no trackers. The app loads nothing from a CDN.</p>
            </li>
          </ul>
        </div>
        <div>
          <h3>Not in version 1, either</h3>
          <ul className={`${classes.ledger} ${classes.tight}`}>
            {NOT_YET.map((item) => (
              <li key={item}>
                <span>{item}</span>
                <span className="tag tag--missing">Not yet</span>
              </li>
            ))}
          </ul>
          <p className={`small muted ${classes.wontNote}`}>
            If one of those is the thing you need, better to hear it now than after the catalog
            download.
          </p>
        </div>
      </section>

      <section className={classes.section} aria-labelledby="cta-h">
        <ul className={classes.stack}>
          {STACK.map((s) => (
            <li key={s.section}>
              <Link className={`${classes.brick} studs sec-${s.section}`} href={s.href}>
                <b>{s.name}</b>
                <span>{s.line}</span>
                <i aria-hidden="true">&rarr;</i>
              </Link>
            </li>
          ))}
          <li>
            <div className={`${classes.open} studs sec-setup`}>
              <h2 id="cta-h">Got a spare evening and a server?</h2>
              <p>
                The setup guide goes from an empty VM to your first set on the shelf. Bring a
                Tailscale key and several gigabytes of disk.
              </p>
              <Button href={ROUTES.setup} arrow>
                Start the setup guide
              </Button>
            </div>
          </li>
        </ul>
      </section>
    </div>
  );
}
