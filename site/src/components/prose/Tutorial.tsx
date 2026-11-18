import type { Tutorial } from '@/content/tutorials';

import classes from './Prose.module.css';

/** "What you need", modeled on the parts call-out in an instruction booklet (SPEC 6.21). */
export function Parts({ needs }: { needs: Tutorial['needs'] }) {
  return (
    <section className={classes.parts} aria-labelledby="need">
      <h2 id="need">What you need</h2>
      <ul className={classes.partsList}>
        {needs.map((n, i) => (
          <li key={i}>
            <b>{n.count}</b>
            <span>{n.text}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

/** Numbered steps on a real list; the number bricks come from a CSS counter. */
export function Steps({ steps }: { steps: Tutorial['steps'] }) {
  return (
    <ol className={classes.steps}>
      {steps.map((s) => (
        <li key={s.title}>
          <h3>{s.title}</h3>
          {s.body}
        </li>
      ))}
    </ol>
  );
}
