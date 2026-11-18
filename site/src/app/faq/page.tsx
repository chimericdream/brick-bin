import type { Metadata } from 'next';

import { Button } from '@/components/Button';
import { PageHead } from '@/components/PageHead';
import { FAQ } from '@/content/faq';
import { ISSUES_URL, ROUTES } from '@/lib/site';

import classes from './Faq.module.css';

export const metadata: Metadata = {
  title: 'FAQ',
  description:
    'Short, honest answers about Brick Bin: brands, internet access, the catalog, kids, Tailscale, backups, loose bricks and cost.',
  alternates: { canonical: ROUTES.faq },
};

/** Every answer is open. No accordion (SPEC 6.23). */
export default function FaqPage() {
  return (
    <div data-section="faq" data-footer="tight">
      <div className="wrap">
        <PageHead
          crumbs={[{ label: 'Home', href: ROUTES.home }]}
          title="Questions, answered briefly"
          crumbLabel="FAQ"
          lead="The short answer comes first. The reasons follow, for anyone who wants them."
        />
      </div>
      <div className={`wrap ${classes.faq}`}>
        <div className={classes.list}>
          {FAQ.map((q) => (
            <section key={q.id} className={classes.item} id={q.id} aria-labelledby={`${q.id}-q`}>
              <h2 id={`${q.id}-q`}>
                <span className="b1" />
                {q.question}
              </h2>
              <p>{q.answer}</p>
              {q.more.map((m, i) => (
                <p key={i}>{m}</p>
              ))}
            </section>
          ))}
        </div>
        <aside className={classes.aside}>
          <nav aria-labelledby="jump-h">
            <h2 id="jump-h">Jump to</h2>
            <ul className={classes.jump}>
              {FAQ.map((q) => (
                <li key={q.id}>
                  <a href={`#${q.id}`}>{q.jump ?? q.question}</a>
                </li>
              ))}
            </ul>
          </nav>
          <div>
            <h2>Still stuck?</h2>
            <p>
              If it&apos;s about getting Brick Bin running, the docs are the place. If you think
              you&apos;ve found a bug, the issue tracker is where to say so.
            </p>
            <div className={classes.btnRow}>
              <Button href={ROUTES.setup}>Read the docs</Button>
              <Button href={ISSUES_URL} variant="quiet">
                Report a problem
              </Button>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
