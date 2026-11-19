import ui from './ui.module.css';

/**
 * A wide table that may scroll sideways inside its panel on a phone. It takes focus, so the
 * table can be scrolled from the keyboard too.
 */
export function TableScroll({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className={ui.tableWrap} tabIndex={0} role="group" aria-label={label}>
      {children}
    </div>
  );
}
