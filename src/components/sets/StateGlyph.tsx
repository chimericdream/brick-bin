import type { BuildState } from '@/server/data/completeness';

/*
 * Six one-colour glyphs, one per build state, drawn from bricks: a taped box, a box with its lid
 * up, a half-built stack, a finished stack, loose bricks in a row, a tub with pieces askew. They
 * always sit beside the state's word, so they are decoration to assistive technology.
 */
const PATHS: Record<BuildState, React.ReactNode> = {
  sealed: (
    <>
      <path d="M2 3.5h16v3H2z" />
      <path fillRule="evenodd" d="M3 8h14v9H3zM8.75 8v4h2.5V8z" />
    </>
  ),
  opened: (
    <>
      <path d="M2.2 6.8l11.2-4.3 1 2.6L3.2 9.4z" />
      <path d="M3 10h14v7H3z" />
      <path d="M12 6.6h3.5V9H12z" />
    </>
  ),
  in_progress: (
    <>
      <path d="M2 12h16v5H2z" />
      <path d="M2 6.5h9v4.5H2zM3.5 4.5h2.5v2H3.5zM7 4.5h2.5v2H7zM12.5 10h2.5v2h-2.5z" />
    </>
  ),
  built: <path d="M2 13h16v4H2zM5 8.5h10v3.5H5zM8 4h4v3.5H8zM9 2.5h2V4H9z" />,
  disassembled: (
    <>
      <path d="M1.5 11.5h5V16h-5zM7.5 11.5h5V16h-5zM13.5 11.5h5V16h-5zM3 9.5h2v2H3zM9 9.5h2v2H9zM15 9.5h2v2h-2z" />
      <path d="M4.5 4h5v3.5h-5zM6 2.5h2V4H6z" />
    </>
  ),
  mixed: (
    <>
      <path fillRule="evenodd" d="M1.5 6h2v9.5h13V6h2v11.5h-17z" />
      <path d="M5.2 10.3l4.6-1.7 1 2.8-4.6 1.7zM10.6 12.2l4.7 1.2-.7 2.1H10zM11.5 6.6l3 .8-.7 2.6-3-.8z" />
    </>
  ),
};

export function StateGlyph({ state, size = 18 }: { state: BuildState; size?: number }) {
  return (
    <svg
      viewBox="0 0 20 20"
      width={size}
      height={size}
      fill="currentColor"
      aria-hidden="true"
      focusable="false"
      style={{ flex: 'none' }}
    >
      {PATHS[state]}
    </svg>
  );
}
