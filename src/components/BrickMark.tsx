/**
 * The Brick Bin mark: a two-stud brick sitting in a bin. The brick is the "built" green, the one
 * place a brick colour means something other than a build state; the bin takes the text colour.
 */
export function BrickMark({ size = 30 }: { size?: number }) {
  return (
    <svg viewBox="0 0 32 32" width={size} height={size} aria-hidden="true" focusable="false">
      <path fill="var(--app-st-built)" d="M10.5 5.5H15V9h2V5.5h4.5V9H23v14H9V9h1.5z" />
      <path fill="currentColor" d="M3 13h4v13h18V13h4v17H3z" />
    </svg>
  );
}
