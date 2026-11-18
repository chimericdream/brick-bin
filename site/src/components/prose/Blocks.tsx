import Link from 'next/link';

import { REBRICKABLE_URL, type Section } from '@/lib/site';

import classes from './Prose.module.css';

/** The article column (SPEC 6.17). */
export function Prose({ children }: { children: React.ReactNode }) {
  return <div className={classes.prose}>{children}</div>;
}

/**
 * Callouts (SPEC 6.19). "note" is background and reasons. "mind" is something that will catch you
 * out. One or two per page.
 */
export function Note({
  title,
  variant = 'note',
  children,
}: {
  title: string;
  variant?: 'note' | 'mind';
  children: React.ReactNode;
}) {
  return (
    <div className={variant === 'mind' ? `${classes.note} ${classes.mind}` : classes.note}>
      <p className={classes.noteTitle}>
        {variant === 'note' && <span className="b1" />}
        {title}
      </p>
      {children}
    </div>
  );
}

export interface Column {
  label: string;
  /** Repeats the column name before the value when rows stack on phones. */
  stackLabel?: boolean;
}

/** A real table that stacks into blocks under 720px (SPEC 6.20). The first cell is a row header. */
export function StackTable({ columns, rows }: { columns: Column[]; rows: React.ReactNode[][] }) {
  return (
    <div className={classes.tableWrap}>
      <table className={classes.stack}>
        <thead>
          <tr>
            {columns.map((c) => (
              <th key={c.label} scope="col">
                {c.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((cells, r) => (
            <tr key={r}>
              {cells.map((cell, i) =>
                i === 0 ? (
                  <th key={i} scope="row">
                    {cell}
                  </th>
                ) : (
                  <td key={i} data-label={columns[i]?.stackLabel ? columns[i].label : undefined}>
                    {cell}
                  </td>
                ),
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** "What next": a brick in the color of where it leads (SPEC 6.21). */
export function NextBrick({
  href,
  section,
  label,
  title,
  children,
  id,
}: {
  href: string;
  section: Section;
  label: string;
  title: string;
  children: React.ReactNode;
  id?: string;
}) {
  return (
    <Link className={`${classes.next} studs sec-${section}`} href={href} id={id}>
      <small>{label}</small>
      <b>{title} &rarr;</b>
      <span>{children}</span>
    </Link>
  );
}

/** Plain links under the "next" brick: previous on the left, something else on the right. */
export function Pager({
  prev,
  right,
}: {
  prev?: { href: string; label: string };
  right?: { href: string; label: string };
}) {
  return (
    <div className={classes.pager}>
      {prev ? <Link href={prev.href}>&larr; {prev.label}</Link> : <span />}
      {right ? <Link href={right.href}>{right.label}</Link> : <span />}
    </div>
  );
}

/** Closes any page that discusses catalog data (SPEC 6.17). */
export function CatalogCredit() {
  return (
    <p className={classes.credit}>
      Catalog data comes from <a href={REBRICKABLE_URL}>Rebrickable</a>.
    </p>
  );
}

export function SmallNote({ children }: { children: React.ReactNode }) {
  return <p className={classes.credit}>{children}</p>;
}
