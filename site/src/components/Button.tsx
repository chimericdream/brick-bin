import Link from 'next/link';

import classes from './Button.module.css';

interface Props {
  href: string;
  children: React.ReactNode;
  /** primary: the one main action in a block. start: only the hero's setup button. */
  variant?: 'primary' | 'start' | 'quiet';
  size?: 'default' | 'small';
  /** Adds the arrow that slides on hover. */
  arrow?: boolean;
}

const isInternal = (href: string) => href.startsWith('/');

/** A link styled as a button (SPEC 6.5). Primary and start buttons carry a stud row. */
export function Button({ href, children, variant = 'primary', size = 'default', arrow }: Props) {
  const className = [
    classes.btn,
    variant !== 'quiet' && 'studs',
    variant === 'start' && classes.start,
    variant === 'quiet' && classes.quiet,
    size === 'small' && classes.small,
  ]
    .filter(Boolean)
    .join(' ');
  const content = (
    <>
      {children}
      {arrow && (
        <span className={classes.arrow} aria-hidden="true">
          &rarr;
        </span>
      )}
    </>
  );
  return isInternal(href) ? (
    <Link className={className} href={href}>
      {content}
    </Link>
  ) : (
    <a className={className} href={href}>
      {content}
    </a>
  );
}
