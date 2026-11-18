import type { Metadata } from 'next';

import { Button } from '@/components/Button';
import { ROUTES } from '@/lib/site';

import classes from './NotFound.module.css';

export const metadata: Metadata = {
  title: 'Page not found',
  description: 'This page is missing.',
};

const WALL = (
  <svg
    viewBox="0 0 480 220"
    role="img"
    aria-label="A wall of colored bricks with one brick missing, its place marked by a dashed outline"
  >
    <g fill="#4db3e6">
      <rect x="0" y="16" width="116" height="48" rx="2" />
      <path d="M10 16V6h24v10zM50 16V6h24v10zM90 16V6h16v10z" />
    </g>
    <g fill="#f49ac1">
      <rect x="120" y="16" width="156" height="48" rx="2" />
      <path d="M128 16V6h24v10zM168 16V6h24v10zM208 16V6h24v10zM248 16V6h20v10z" />
    </g>
    <g fill="#6cc04a">
      <rect x="280" y="16" width="76" height="48" rx="2" />
      <path d="M288 16V6h24v10zM328 16V6h20v10z" />
    </g>
    <g fill="#d8bc88">
      <rect x="360" y="16" width="120" height="48" rx="2" />
      <path d="M368 16V6h24v10zM408 16V6h24v10zM448 16V6h24v10z" />
    </g>
    <rect fill="#ff8c1a" x="0" y="68" width="76" height="48" rx="2" />
    <rect fill="#6cc04a" x="80" y="68" width="116" height="48" rx="2" />
    <rect
      x="201.5"
      y="69.5"
      width="113"
      height="45"
      rx="2"
      fill="none"
      stroke="var(--ink)"
      strokeWidth="3"
      strokeDasharray="9 7"
    />
    <text
      x="258"
      y="100"
      textAnchor="middle"
      fontFamily="var(--font)"
      fontWeight="800"
      fontSize="24"
      fill="var(--ink)"
    >
      404
    </text>
    <rect fill="#4db3e6" x="320" y="68" width="76" height="48" rx="2" />
    <rect fill="#f49ac1" x="400" y="68" width="80" height="48" rx="2" />
    <rect fill="#d8bc88" x="0" y="120" width="156" height="48" rx="2" />
    <rect fill="#ff8c1a" x="160" y="120" width="116" height="48" rx="2" />
    <rect fill="#6cc04a" x="280" y="120" width="116" height="48" rx="2" />
    <rect fill="#4db3e6" x="400" y="120" width="80" height="48" rx="2" />
    <rect fill="#f49ac1" x="0" y="172" width="116" height="48" rx="2" />
    <rect fill="#4db3e6" x="120" y="172" width="76" height="48" rx="2" />
    <rect fill="#d8bc88" x="200" y="172" width="156" height="48" rx="2" />
    <rect fill="#ff8c1a" x="360" y="172" width="120" height="48" rx="2" />
  </svg>
);

/** SPEC 6.24. The normal header and footer stay. */
export default function NotFound() {
  return (
    <div className={`wrap ${classes.lost}`}>
      <div className={`${classes.art} baseplate`}>{WALL}</div>
      <div>
        <h1>This piece is missing.</h1>
        <p className="lead">
          We&apos;ve checked under the sofa and inside the vacuum cleaner. There&apos;s no page at
          this address.
        </p>
        <p className={classes.part}>
          <b>1 ×</b>
          <b>Page, color unknown</b>
          <span>Not added to your shopping list. We checked.</span>
        </p>
        <div className={classes.btnRow}>
          <Button href={ROUTES.home}>Back to the start</Button>
          <Button href={ROUTES.tutorials} variant="quiet">
            Tutorials
          </Button>
          <Button href={ROUTES.setup} variant="quiet">
            Docs
          </Button>
        </div>
        <p className="small muted">
          Error 404: page not found. It may have moved, or the link may have a typo in it.
        </p>
      </div>
    </div>
  );
}
