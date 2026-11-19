import Link from 'next/link';

import classes from './PageHead.module.css';

export interface Crumb {
  label: string;
  /** Steps with no page of their own (a brand, a theme) are plain text. */
  href?: string;
}

/**
 * Every page in the shell opens with this brick: a breadcrumb, the one `h1`, one line about the
 * data, then the page's actions. It sits on the field (dark in both themes) with a stud row.
 */
export function PageHead({
  title,
  sub,
  crumbs,
  actions,
  actionsFromTablet = false,
}: {
  title: React.ReactNode;
  sub?: React.ReactNode;
  /** The current page is added at the end from `title` when it is a string. */
  crumbs?: Crumb[];
  actions?: React.ReactNode;
  /** Hide the actions on phones, where the tab bar or the page body offers them instead. */
  actionsFromTablet?: boolean;
}) {
  return (
    <header
      className={`${classes.head} app-studs`}
      data-actions-tablet={actionsFromTablet || undefined}
    >
      <div className={classes.text}>
        {crumbs && (
          <nav aria-label="Breadcrumb">
            <ol className={classes.crumbs}>
              {crumbs.map((c, i) => (
                <li key={`${c.label}-${i}`}>
                  {c.href ? <Link href={c.href}>{c.label}</Link> : c.label}
                </li>
              ))}
              {typeof title === 'string' && <li aria-current="page">{title}</li>}
            </ol>
          </nav>
        )}
        <h1 className={classes.title}>{title}</h1>
        {sub && <p className={classes.sub}>{sub}</p>}
      </div>
      {actions && <div className={classes.actions}>{actions}</div>}
    </header>
  );
}
