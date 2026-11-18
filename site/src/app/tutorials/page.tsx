import type { Metadata } from 'next';
import Link from 'next/link';

import { PageHead } from '@/components/PageHead';
import { TUTORIAL_GROUPS, TUTORIALS, tutorialNumber } from '@/content/tutorials';
import { pageMetadata } from '@/lib/metadata';
import { ROUTES, tutorialHref } from '@/lib/site';
import { countWord } from '@/lib/words';

import classes from './Tutorials.module.css';

const COUNT = countWord(TUTORIALS.length);

export const metadata: Metadata = pageMetadata({
  title: 'Tutorials',
  description: `${COUNT} walk-throughs for Brick Bin, from the first run to checking what the collection is worth.`,
  path: ROUTES.tutorials,
});

export default function TutorialsIndex() {
  return (
    <div className={`wrap ${classes.page}`} data-section="tutorials">
      <PageHead
        crumbs={[{ label: 'Home', href: ROUTES.home }]}
        title={`${COUNT} tutorials, in the order you'll want them`}
        crumbLabel="Tutorials"
        lead="Each one has a goal, a short list of what you need, and numbered steps with pictures. Start at the top if the server is new. Otherwise, go straight to the job in front of you."
      />
      {TUTORIAL_GROUPS.map((g) => (
        <section key={g.id} className={classes.group} aria-labelledby={g.id}>
          <h2 id={g.id}>{g.title}</h2>
          <ul className={classes.list}>
            {g.tutorials.map((t) => {
              return (
                <li key={t.slug}>
                  <Link href={tutorialHref(t.slug)}>
                    <span className={classes.n}>{tutorialNumber(t.slug)}</span>
                    <b>{t.title}</b>
                    <span>{t.summary}</span>
                    <small>
                      {t.steps.length} {t.steps.length === 1 ? 'step' : 'steps'}
                    </small>
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </div>
  );
}
