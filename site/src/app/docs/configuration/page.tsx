import type { Metadata } from 'next';
import Link from 'next/link';
import { Fragment } from 'react';

import { DocsShell } from '@/components/docs/DocsShell';
import { PageHead } from '@/components/PageHead';
import { CodeBlock } from '@/components/prose/CodeBlock';
import { ConfigTable } from '@/components/prose/ConfigTable';
import { NextBrick, Note, Pager, SmallNote } from '@/components/prose/Blocks';
import { CONFIG_COUNT, CONFIG_GROUPS } from '@/content/config';
import { pageMetadata } from '@/lib/metadata';
import { ROUTES, tutorialHref } from '@/lib/site';
import { countWord } from '@/lib/words';

export const metadata: Metadata = pageMetadata({
  title: 'Configuration · Docs',
  description: 'Every Brick Bin environment variable, what it does and its default.',
  path: ROUTES.config,
});

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
        <code>docker compose up -d</code> again so the app restarts with them. The{' '}
        <code>.env.example</code> next to each compose file lists them. Every variable name below is
        a link you can share.
      </p>
      <p>
        The Default column is the app&apos;s own default, and a variable you leave out keeps it. The
        note under a row says what the compose files do instead.
      </p>

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
