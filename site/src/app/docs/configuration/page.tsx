import type { Metadata } from 'next';
import Link from 'next/link';
import { Fragment } from 'react';

import { DocsShell } from '@/components/docs/DocsShell';
import { PageHead } from '@/components/PageHead';
import { CodeBlock } from '@/components/prose/CodeBlock';
import { ConfigTable } from '@/components/prose/ConfigTable';
import { NextBrick, Note, Pager, SmallNote } from '@/components/prose/Blocks';
import { CONFIG_COUNT, CONFIG_GROUPS } from '@/content/config';
import { ROUTES, tutorialHref } from '@/lib/site';
import { countWord } from '@/lib/words';

export const metadata: Metadata = {
  title: 'Configuration · Docs',
  description: 'Every Brick Bin environment variable, what it does and its default.',
  alternates: { canonical: ROUTES.config },
};

const TOC = [
  ...CONFIG_GROUPS.map((g) => ({ id: g.id, label: g.title })),
  { id: 'example', label: 'A typical .env' },
];

const ENV = `POSTGRES_PASSWORD=choose-something-long
TS_AUTHKEY=tskey-auth-…`;

export default function ConfigurationPage() {
  const must = CONFIG_GROUPS[0]!.vars.length;
  return (
    <DocsShell
      section="config"
      nav="docs"
      href={ROUTES.config}
      toc={TOC}
      head={
        <PageHead
          crumbs={[{ label: 'Home', href: ROUTES.home }, { label: 'Docs' }]}
          title="Configuration"
          lead={`Brick Bin is configured with environment variables. There are ${countWord(CONFIG_COUNT).toLowerCase()}. Most installs set ${countWord(must).toLowerCase()} and leave the rest alone.`}
        />
      }
    >
      <p>
        Put them in the <code>.env</code> file beside your compose file, then run{' '}
        <code>docker compose up -d</code> again so the app restarts with them. Every variable name
        below is a link you can share.
      </p>
      <Note title="Not every variable reaches the app from .env" variant="mind">
        <p>
          The compose files pass some variables from <code>.env</code> to the app and set others
          themselves. Where a variable is handled differently, its row says so. To set one they
          leave out, add it to the <code>environment</code> list of the <code>app</code> service in
          the compose file.
        </p>
      </Note>

      {CONFIG_GROUPS.map((g) => (
        <Fragment key={g.id}>
          <h2 id={g.id}>{g.title}</h2>
          {g.intro && <p>{g.intro}</p>}
          <ConfigTable vars={g.vars} />
          {g.id === 'catalog' && (
            <Note title="Leave the page fetch off for now" variant="mind">
              <p>
                Until Rebrickable confirms that automated page reads are fine, keep{' '}
                <code>REBRICKABLE_PAGE_FETCH</code> at <code>false</code> and paste the page.{' '}
                <Link href={tutorialHref('import-catalog')}>The tutorial shows how</Link>.
              </p>
            </Note>
          )}
        </Fragment>
      ))}

      <h2 id="example">A typical .env</h2>
      <p>The recommended Tailscale install, with everything else left at its default.</p>
      <CodeBlock label=".env" code={ENV} />
      <p>Keep a copy of this file with your backups, and keep it out of any repository.</p>
      <SmallNote>Variables used only by the project&apos;s tests aren&apos;t listed.</SmallNote>

      <NextBrick href={ROUTES.faq} section="faq" label="Questions?" title="FAQ">
        Short answers, including the ones that are &ldquo;not yet&rdquo;.
      </NextBrick>
      <Pager prev={{ href: ROUTES.hosting, label: 'Hosting' }} />
    </DocsShell>
  );
}
