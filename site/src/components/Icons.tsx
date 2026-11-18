/** The design's own icons (site/design/assets/svg), inline so they follow currentColor. */

export function Mark() {
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true" focusable="false">
      <path fill="currentColor" d="M10.5 5.5H15V9h2V5.5h4.5V9H23v14H9V9h1.5z" />
      <path fill="currentColor" d="M3 13h4v13h18V13h4v17H3z" />
    </svg>
  );
}

export function IconSystem() {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <rect x="2.5" y="3.5" width="15" height="10" rx="1" />
      <path d="M7 17h6M10 13.5V17" />
    </svg>
  );
}

export function IconLight() {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <circle cx="10" cy="10" r="3.4" />
      <path d="M10 2v2M10 16v2M2 10h2M16 10h2M4.3 4.3l1.4 1.4M14.3 14.3l1.4 1.4M4.3 15.7l1.4-1.4M14.3 5.7l1.4-1.4" />
    </svg>
  );
}

export function IconDark() {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M16.5 11.8A7 7 0 0 1 8.2 3.5a7 7 0 1 0 8.3 8.3z" />
    </svg>
  );
}

export function IconMenu() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true">
      <path fill="currentColor" d="M2 4h16v2.5H2zM2 8.75h16v2.5H2zM2 13.5h16V16H2z" />
    </svg>
  );
}

export function IconClose() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true">
      <path stroke="currentColor" strokeWidth="2.5" d="M4 4l12 12M16 4L4 16" />
    </svg>
  );
}
