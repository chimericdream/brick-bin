import type { Metadata } from 'next';
import Link from 'next/link';

import { DocsShell } from '@/components/docs/DocsShell';
import { PageHead } from '@/components/PageHead';
import { CodeBlock } from '@/components/prose/CodeBlock';
import { NextBrick, Note } from '@/components/prose/Blocks';
import { Shot } from '@/components/Shot';
import {
  REBRICKABLE_URL,
  REPO_URL,
  ROUTES,
  TAILSCALE_URL,
  configHref,
  tutorialHref,
} from '@/lib/site';

export const metadata: Metadata = {
  title: 'Setup · Docs',
  description:
    'Install Brick Bin on your own server: a quick try-out on port 3000, or the recommended Proxmox, Docker and Tailscale route.',
  alternates: { canonical: ROUTES.setup },
};

const TOC = [
  { id: 'before', label: 'Before you start' },
  { id: 'try-out', label: 'Quick try-out' },
  { id: 'install', label: 'Recommended install' },
  { id: 'first-visit', label: 'First visit' },
  { id: 'catalog', label: 'Import the catalog' },
  { id: 'updates', label: 'Staying up to date' },
];

const TRY_OUT = `# fetch the source
git clone ${REPO_URL}.git
cd brick-bin

# choose a database password, for this try-out only
echo "POSTGRES_PASSWORD=choose-something-long" > .env

# build the app and start it with its own Postgres
docker compose -f docker-compose.prod.yml up -d --build

# then open
http://<your-server>:3000`;

const GET_DEPLOY = `git clone ${REPO_URL}.git
cd brick-bin/deploy`;

const ENV = `POSTGRES_PASSWORD=choose-something-long
TS_AUTHKEY=tskey-auth-…`;

export default function SetupPage() {
  return (
    <DocsShell
      section="setup"
      nav="docs"
      href={ROUTES.setup}
      toc={TOC}
      head={
        <PageHead
          crumbs={[{ label: 'Home', href: ROUTES.home }, { label: 'Docs' }]}
          title="Setup"
          lead="From an empty machine to the first-visit screen. The recommended route uses Tailscale. There's a shorter one if you only want a look around."
        />
      }
    >
      <h2 id="before">Before you start</h2>
      <p>
        Brick Bin is a self-hosted app. You run it on your own server and reach it over your own
        network. You&apos;ll need:
      </p>
      <ul>
        <li>A machine that runs Docker with Compose. We recommend a Proxmox VM or LXC.</li>
        <li>
          A <a href={TAILSCALE_URL}>Tailscale</a> account and an auth key, if you&apos;re following
          the recommended route.
        </li>
        <li>Git, to fetch the compose files from the repository.</li>
        <li>
          Disk space: about 6 GB for the catalog, a few hundred MB for the database, and tens of GB
          for instruction PDFs over time.{' '}
          <Link href={`${ROUTES.hosting}#storage`}>Storage in detail</Link>.
        </li>
      </ul>

      <h2 id="try-out">Quick try-out, without Tailscale</h2>
      <p>
        To see Brick Bin before committing to anything, build it from the repository with its
        production compose file, <code>docker-compose.prod.yml</code>, and open port 3000.
      </p>
      <CodeBlock label="Terminal" code={TRY_OUT} />
      <Note title="Fine for a look, not for keeps" variant="mind">
        <p>
          This serves plain HTTP on your network, and the image is built on your machine, so nothing
          keeps it up to date. If you put HTTPS in front of it, set{' '}
          <Link href={configHref('COOKIE_SECURE')}>
            <code>COOKIE_SECURE</code>
          </Link>{' '}
          to <code>true</code>.
        </p>
      </Note>

      <h2 id="install">Recommended install, with Tailscale</h2>
      <p>
        The repository&apos;s <code>deploy</code> folder is the full stack, four containers: the
        app, its own Postgres 17, a Tailscale sidecar that serves HTTPS, and Watchtower to keep the
        app image current. <Link href={`${ROUTES.hosting}#runs`}>What each one does</Link>.
      </p>
      <ol>
        <li>Create a Proxmox VM or LXC and install Docker on it.</li>
        <li>
          Fetch the repository and go into its <code>deploy</code> folder, which holds{' '}
          <code>docker-compose.yml</code> and <code>serve.json</code>:
          <CodeBlock label="Terminal" code={GET_DEPLOY} />
        </li>
        <li>
          In the Tailscale admin console, make sure MagicDNS and HTTPS certificates are on for your
          tailnet, and create an auth key.
        </li>
        <li>
          Create a file called <code>.env</code> in the <code>deploy</code> folder with these two
          lines:
          <CodeBlock label=".env" code={ENV} />
        </li>
        <li>
          Start it: <code>docker compose up -d</code>
        </li>
        <li>
          Open <code>https://brick-bin.&lt;your-tailnet&gt;.ts.net</code> from any device on your
          tailnet.
        </li>
      </ol>
      <p>
        The compose file turns on secure cookies and builds the database address itself, so most
        installs only set those two. Every setting is listed in{' '}
        <Link href={ROUTES.config}>Configuration</Link>.
      </p>

      <h2 id="first-visit">First visit</h2>
      <p>
        The first time anyone opens Brick Bin, it asks you to create the household and the admin
        account. There&apos;s no default password to change, because there&apos;s no default
        account.
      </p>
      <Shot id="SET-01" />
      <p>
        The step-by-step version is the{' '}
        <Link href={tutorialHref('first-run')}>first-run tutorial</Link>.
      </p>

      <h2 id="catalog">Import the catalog</h2>
      <p>
        Brick Bin works without the catalog, but LEGO set lookup and part pictures need it. The
        first import downloads about 6 GB of part images plus a data archive from{' '}
        <a href={REBRICKABLE_URL}>Rebrickable</a>, and only runs when an admin starts it.
      </p>
      <p>
        <Link href={tutorialHref('import-catalog')}>Tutorial: import the LEGO catalog</Link>
      </p>

      <h2 id="updates">Staying up to date</h2>
      <p>
        Watchtower checks for a new app image every five minutes and swaps it in. Database
        migrations run when the app starts.
      </p>
      <p>
        Postgres is never updated automatically, and neither are the Tailscale and Watchtower
        containers. When you choose to, take a backup, then run <code>docker compose pull</code> and{' '}
        <code>docker compose up -d</code> in the <code>deploy</code> folder.
      </p>

      <NextBrick href={ROUTES.hosting} section="hosting" label="Next in the docs" title="Hosting">
        What runs, how much disk it wants, and how to back it up.
      </NextBrick>
    </DocsShell>
  );
}
