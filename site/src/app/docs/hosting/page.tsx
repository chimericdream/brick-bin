import type { Metadata } from 'next';
import Link from 'next/link';

import { DocsShell } from '@/components/docs/DocsShell';
import { PageHead } from '@/components/PageHead';
import { CodeBlock } from '@/components/prose/CodeBlock';
import { CatalogCredit, NextBrick, Note, Pager, StackTable } from '@/components/prose/Blocks';
import { ROUTES, TAILSCALE_URL, configHref, tutorialHref } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Hosting · Docs',
  description:
    'What Brick Bin runs, how much disk it wants, how to back it up and restore it, and when it goes online.',
  alternates: { canonical: ROUTES.hosting },
};

const TOC = [
  { id: 'runs', label: 'What runs' },
  { id: 'storage', label: 'Storage' },
  { id: 'backups', label: 'Backups' },
  { id: 'restoring', label: 'Restoring' },
  { id: 'no-tailscale', label: 'Running without Tailscale' },
  { id: 'downloads', label: 'What it downloads' },
];

const BACKUP = `# from the repository folder, on the Docker host, as root
COMPOSE="docker compose -f deploy/docker-compose.yml" scripts/backup.sh /srv/backups/brick-bin`;

const RESTORE = `# in the deploy folder of the new install
docker compose up -d db
gunzip -c db-<stamp>.sql.gz | docker compose exec -T db psql -U bricks -d bricks
docker compose up -d
docker compose exec -T app tar -C /data -xzf - < covers-<stamp>.tar.gz

# the PDFs go straight into the volume, as root
cp -a instructions/<stamp>/. "$(docker volume inspect -f '{{ .Mountpoint }}' brick-bin_app-data)/instructions/"`;

const VAR = (name: string) => (
  <Link href={configHref(name)}>
    <code>{name}</code>
  </Link>
);

export default function HostingPage() {
  return (
    <DocsShell
      section="hosting"
      nav="docs"
      href={ROUTES.hosting}
      toc={TOC}
      head={
        <PageHead
          crumbs={[{ label: 'Home', href: ROUTES.home }, { label: 'Docs' }]}
          title="Hosting"
          lead="Brick Bin is built for one household on one small server. This page covers what's running, what it stores, and what to copy somewhere safe."
        />
      }
    >
      <h2 id="runs">What runs</h2>
      <p>
        The recommended home is a Proxmox VM or LXC with Docker, reached over{' '}
        <a href={TAILSCALE_URL}>Tailscale</a>. The compose file in <code>deploy</code> starts four
        containers, and shares nothing with any other stack on the host.
      </p>
      <StackTable
        columns={[
          { label: 'Container' },
          { label: 'What it does' },
          { label: 'Updates', stackLabel: true },
        ]}
        rows={[
          ['App', 'Brick Bin itself, from the published image.', 'Watchtower, every five minutes'],
          [
            'Postgres 17',
            'The app’s own database. It isn’t shared with anything else.',
            'Never automatic',
          ],
          [
            'Tailscale sidecar',
            <>
              Serves HTTPS at <code>https://brick-bin.&lt;your-tailnet&gt;.ts.net</code>.
            </>,
            'By you',
          ],
          ['Watchtower', 'Pulls a new app image when one is published.', 'By you'],
        ]}
      />
      <p>
        The stack also publishes port 3000 on the host, so a home dashboard can check{' '}
        <code>/healthz</code>. Signing in needs HTTPS, so use the tailnet address for everything
        else.
      </p>

      <h2 id="storage">Storage</h2>
      <p>
        Everything the app stores outside the database lives under {VAR('DATA_DIR')}, which is{' '}
        <code>/data</code> on the <code>app-data</code> volume. The database has a volume of its
        own.
      </p>
      <StackTable
        columns={[{ label: 'What' }, { label: 'Holds' }, { label: 'Plan for', stackLabel: true }]}
        rows={[
          [
            'Catalog',
            'Part images and catalog files from Rebrickable.',
            'About 6 GB of images, plus up to 220 MB while a file is unpacked',
          ],
          [
            'Database',
            'Sets, copies, people, wishlists, the activity trail and the catalog tables.',
            'A few hundred MB',
          ],
          ['Instruction PDFs', 'Whatever you upload or save.', 'Tens of GB over time'],
          ['Covers', 'Set and wish pictures.', 'Small'],
        ]}
      />
      <p>
        A single PDF can be up to 200 MB by default. Change that with {VAR('INSTRUCTIONS_MAX_MB')}.
      </p>

      <h2 id="backups">Backups</h2>
      <p>
        The repository&apos;s <code>scripts/backup.sh</code> writes a backup in three parts. Run it
        nightly from cron on the Docker host. It keeps the newest 14 of each.
      </p>
      <ul>
        <li>
          <b>A database dump</b>, <code>db-&lt;stamp&gt;.sql.gz</code>. The catalog tables are left
          empty, because an import rebuilds them.
        </li>
        <li>
          <b>Covers</b>, <code>covers-&lt;stamp&gt;.tar.gz</code>.
        </li>
        <li>
          <b>Instruction PDFs</b>, as a snapshot in <code>instructions/&lt;stamp&gt;/</code>. Files
          that haven&apos;t changed are hard links, so only new ones take space. This part needs{' '}
          <code>rsync</code> and read access to the Docker volume, which usually means root.
        </li>
      </ul>
      <CodeBlock label="Terminal" code={BACKUP} />
      <p>
        Keep a copy of your <code>.env</code> with the backups.
      </p>
      <Note title="Catalog images are not backed up" variant="mind">
        <p>
          They&apos;re about 6 GB of files you can download again, so the backup leaves them out.
          After a restore, expect to run a catalog import.
        </p>
      </Note>

      <h2 id="restoring">Restoring</h2>
      <ol>
        <li>
          Set up the stack as in <Link href={`${ROUTES.setup}#install`}>Setup</Link>, with the same{' '}
          <code>.env</code>, but don&apos;t open it yet.
        </li>
        <li>
          Start only the database and load the dump into it, then start the rest and put the covers
          and the instruction PDFs back:
          <CodeBlock label="Terminal" code={RESTORE} />
        </li>
        <li>
          Sign in and <Link href={tutorialHref('import-catalog')}>run a catalog import</Link>. Your
          sets and copies are already there. The import brings back catalog lookup and the part
          pictures. The import history isn&apos;t restored, so the 48-hour wait starts fresh: if you
          imported on the old machine in the last two days, wait out the rest of that window.
        </li>
      </ol>

      <h2 id="no-tailscale">Running without Tailscale</h2>
      <p>
        <code>docker-compose.prod.yml</code>, in the root of the repository, runs the app and its
        Postgres only, and publishes the app on port 3000. Change the port with {VAR('APP_PORT')}.
        It builds the image from source, so Watchtower has nothing to update: pull the repository
        and run the build again to upgrade. If you put your own reverse proxy in front and serve
        HTTPS, set {VAR('COOKIE_SECURE')} to <code>true</code>.
      </p>

      <h2 id="downloads">What it downloads, and when</h2>
      <p>
        Brick Bin makes no background downloads, and nothing in the app loads from a CDN. It reaches
        out in four cases, each started by a person:
      </p>
      <ul>
        <li>
          An admin runs a catalog import. Downloads come only from the origins in{' '}
          {VAR('REBRICKABLE_ALLOWED_ORIGINS')}, over HTTPS, one file at a time.
        </li>
        <li>
          Someone saves a set picked from the catalog, and its cover is fetched once from{' '}
          {VAR('CATALOG_IMAGE_ORIGIN')}.
        </li>
        <li>Someone scans a barcode, and the code is looked up with a public barcode service.</li>
        <li>
          Someone asks to save an instruction PDF from a web address. Only public HTTPS addresses
          are allowed; addresses on your own network or tailnet are refused.
        </li>
      </ul>
      <p>
        The rest of the stack has its own habits: Watchtower checks for a new app image every five
        minutes, and the Tailscale sidecar stays connected to Tailscale.
      </p>
      <CatalogCredit />

      <NextBrick
        href={ROUTES.config}
        section="config"
        label="Next in the docs"
        title="Configuration"
      >
        Every environment variable, with its default.
      </NextBrick>
      <Pager prev={{ href: ROUTES.setup, label: 'Setup' }} />
    </DocsShell>
  );
}
