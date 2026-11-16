/** The Brick Bin mark: an open bin with two dividers. Not a stud pattern. */
export function BrickMark({ size = 28 }: { size?: number }) {
  return (
    <svg viewBox="0 0 32 32" width={size} height={size} aria-hidden="true" focusable="false">
      <rect
        x="3"
        y="7"
        width="26"
        height="20"
        rx="4"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.4"
      />
      <path d="M12 7v20M21 7v20" stroke="currentColor" strokeWidth="2.4" />
      <rect x="5" y="3" width="22" height="4" rx="2" fill="currentColor" />
    </svg>
  );
}
