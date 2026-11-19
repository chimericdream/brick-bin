import classes from './EmptyState.module.css';

/**
 * Something is waiting to go here: a baseplate with a card in the middle holding a title, one or
 * two sentences and the actions. `inline` is one sentence on a small card for use in a section.
 */
export function EmptyState({
  title,
  children,
  actions,
  inline = false,
  headingLevel = 2,
}: {
  title: React.ReactNode;
  children?: React.ReactNode;
  actions?: React.ReactNode;
  inline?: boolean;
  headingLevel?: 2 | 3;
}) {
  const H = headingLevel === 2 ? 'h2' : 'h3';
  if (inline) {
    return (
      <div className={`${classes.inline} app-baseplate`}>
        <p className={classes.inlineCard}>
          <b>{title}</b>
          {children && <> {children}</>}
        </p>
      </div>
    );
  }
  return (
    <div className={`${classes.empty} app-baseplate`}>
      <div className={classes.card}>
        <H className={classes.title}>{title}</H>
        {children && <div className={classes.text}>{children}</div>}
        {actions && <div className={classes.actions}>{actions}</div>}
      </div>
    </div>
  );
}
