import type { Metadata } from 'next';

import { DocsShell } from '@/components/docs/DocsShell';
import { PageHead } from '@/components/PageHead';
import { CatalogCredit, NextBrick, Pager } from '@/components/prose/Blocks';
import { Parts, Steps } from '@/components/prose/Tutorial';
import { TUTORIALS, tutorialBySlug, tutorialNumber } from '@/content/tutorials';
import { pageMetadata } from '@/lib/metadata';
import { ROUTES, tutorialHref } from '@/lib/site';

/** Every tutorial uses these five headings, so "On this page" never changes (SPEC 7.3). */
const TOC = [
  { id: 'goal', label: 'The goal' },
  { id: 'need', label: 'What you need' },
  { id: 'steps', label: 'Steps' },
  { id: 'wrong', label: 'If something goes wrong' },
  { id: 'next', label: 'What next' },
];

export const dynamicParams = false;

export function generateStaticParams() {
  return TUTORIALS.map((t) => ({ slug: t.slug }));
}

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const t = tutorialBySlug((await params).slug)!;
  return pageMetadata({
    title: `${t.title} · Tutorials`,
    description: t.summary,
    path: tutorialHref(t.slug),
  });
}

export default async function TutorialPage({ params }: Props) {
  const { slug } = await params;
  const t = tutorialBySlug(slug)!;
  const n = tutorialNumber(slug);
  const prev = TUTORIALS[n - 2];
  return (
    <DocsShell
      section="tutorials"
      nav="tutorials"
      href={tutorialHref(slug)}
      toc={TOC}
      head={
        <PageHead
          crumbs={[
            { label: 'Home', href: ROUTES.home },
            { label: 'Tutorials', href: ROUTES.tutorials },
          ]}
          title={t.title}
          meta={[
            `Tutorial ${n} of ${TUTORIALS.length}`,
            `${t.steps.length} ${t.steps.length === 1 ? 'step' : 'steps'}`,
            t.audience,
          ]}
        />
      }
    >
      <h2 id="goal">The goal</h2>
      <p className="lead">{t.goal}</p>
      {t.goalMore && <p>{t.goalMore}</p>}
      <Parts needs={t.needs} />
      <h2 id="steps">Steps</h2>
      <Steps steps={t.steps} />
      <h2 id="wrong">If something goes wrong</h2>
      <ul>
        {t.wrong.map((w) => (
          <li key={w.symptom}>
            <b>{w.symptom}</b> {w.fix}
          </li>
        ))}
      </ul>
      <NextBrick
        id="next"
        href={t.next.href}
        section={t.next.section}
        label={t.next.label ?? 'What next'}
        title={t.next.title}
      >
        {t.next.line}
      </NextBrick>
      <Pager
        prev={prev && { href: tutorialHref(prev.slug), label: prev.title }}
        right={{ href: ROUTES.tutorials, label: 'All tutorials' }}
      />
      {t.catalog && <CatalogCredit />}
    </DocsShell>
  );
}
