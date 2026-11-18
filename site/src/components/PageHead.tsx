import Link from 'next/link';

import classes from './PageHead.module.css';

export interface Crumb {
  label: string;
  /** Omit for a step with no page of its own ("Docs"). */
  href?: string;
}

interface Props {
  /** Every crumb before the current page, which is the title. */
  crumbs: Crumb[];
  title: string;
  /** The current page's name in the breadcrumb, when it differs from the title. */
  crumbLabel?: string;
  lead?: React.ReactNode;
  /** Tutorial facts: "Tutorial 2 of 10", "7 steps", "Admins only". */
  meta?: string[];
}

/** Every inner page opens with its brick, in the section color (SPEC 6.6 and 6.26). */
export function PageHead({ crumbs, title, crumbLabel, lead, meta }: Props) {
  return (
    <header className={`${classes.head} studs`}>
      <nav aria-label="Breadcrumb">
        <ol className={classes.crumbs}>
          {crumbs.map((c) => (
            <li key={c.label}>{c.href ? <Link href={c.href}>{c.label}</Link> : c.label}</li>
          ))}
          <li aria-current="page">{crumbLabel ?? title}</li>
        </ol>
      </nav>
      <h1>{title}</h1>
      {lead && <p className="lead">{lead}</p>}
      {meta && (
        <ul className={classes.meta}>
          {meta.map((m) => (
            <li key={m}>{m}</li>
          ))}
        </ul>
      )}
    </header>
  );
}
