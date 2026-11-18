'use client';

import { useState } from 'react';

import classes from './BuildPile.module.css';

type State = 'sealed' | 'opened' | 'progress' | 'built' | 'apart' | 'mixed';
/** [x, y, rotation, opacity]; a missing opacity means 1. */
type Pose = [number, number, number, number?];

/** Parks a piece inside the box, invisible. */
const OUT: Pose = [200, 196, 0, 0];
const BUILT: Pose[] = [
  [60, 228, 0],
  [180, 228, 0],
  [340, 228, 0],
  [100, 196, 0],
  [180, 196, 0],
  [300, 196, 0],
  [140, 164, 0],
  [260, 164, 0],
  [200, 132, 0],
];

/** The poses come from the mockups (site/design/assets/js/site.js, SPEC 6.7). */
const POSES: Record<State, { p: Pose[]; box: boolean; lid?: string; tub?: boolean }> = {
  sealed: { p: Array.from({ length: 11 }, (): Pose => [...OUT]), box: true },
  opened: {
    p: [OUT, OUT, OUT, [150, 96, -10], OUT, OUT, OUT, [262, 92, 12], [206, 84, 0], OUT, OUT],
    box: true,
    lid: 'translate(-58px,-34px) rotate(-22deg)',
  },
  progress: {
    p: [...BUILT.slice(0, 7), [-34, 228, 0], [432, 218, 12], OUT, OUT],
    box: false,
  },
  built: { p: [...BUILT, OUT, OUT], box: false },
  apart: {
    p: [
      [0, 228, 0],
      [126, 228, 0],
      [396, 190, 10],
      [14, 190, -8],
      [150, 196, 0],
      [290, 192, -6],
      [292, 228, 0],
      [200, 158, -14],
      [60, 152, 8],
      OUT,
      OUT,
    ],
    box: false,
  },
  mixed: {
    p: [
      [54, 222, 0],
      [306, 222, 0],
      [196, 222, 0],
      [70, 184, -12],
      [222, 186, 6],
      [350, 182, 16],
      [120, 142, 22],
      [300, 140, -18],
      [210, 146, 4],
      [166, 190, -24],
      [392, 142, 30],
    ],
    box: false,
    tub: true,
  },
};

const STATES: { value: State; label: string; note: [string, string] }[] = [
  {
    value: 'sealed',
    label: 'Sealed',
    note: ['Sealed.', 'Still in the shrink-wrap. Admire from a distance.'],
  },
  {
    value: 'opened',
    label: 'Opened',
    note: ['Opened.', 'The bags are out. No promises were made.'],
  },
  {
    value: 'progress',
    label: 'In progress',
    note: ['In progress.', 'Bag three of seven. The table is spoken for.'],
  },
  { value: 'built', label: 'Built', note: ['Built.', 'Done, on display, and due for dusting.'] },
  {
    value: 'apart',
    label: 'Disassembled',
    note: ['Disassembled.', 'Back in pieces, on purpose, and still all together.'],
  },
  {
    value: 'mixed',
    label: 'Mixed',
    note: ['Mixed.', 'No longer a set. Its parts are in the big tub with everything else.'],
  },
];

/** Nine bricks in the section colors, then the two "strangers" that only the Mixed state shows. */
const PIECES: { fill: string; studs: number }[] = [
  { fill: '#ff8c1a', studs: 3 },
  { fill: '#4db3e6', studs: 4 },
  { fill: '#6cc04a', studs: 2 },
  { fill: '#f49ac1', studs: 2 },
  { fill: '#d8bc88', studs: 3 },
  { fill: '#ff8c1a', studs: 2 },
  { fill: '#6cc04a', studs: 3 },
  { fill: '#4db3e6', studs: 2 },
  { fill: '#f49ac1', studs: 2 },
  { fill: '#a0a5a9', studs: 2 },
  { fill: '#958a73', studs: 1 },
];

const studPath = (n: number) =>
  Array.from({ length: n }, (_, i) => `M${8 + i * 40}-8h24v8H${8 + i * 40}z`).join('');

/**
 * The one moving thing on the site (SPEC 6.7): a small pile of bricks showing the six build
 * states. Everything rests on the floor line at y=260. Without scripts it shows Built and the
 * buttons and hint are hidden; the note is live, so screen readers hear each state.
 */
export function BuildPile() {
  const [state, setState] = useState<State>('built');
  const pose = POSES[state];
  const note = STATES.find((s) => s.value === state)!.note;
  return (
    <div className={classes.toy}>
      <svg
        viewBox="-40 52 560 220"
        role="img"
        aria-label="A small pile of bricks that rearranges itself to show each build state"
      >
        <path
          className={classes.part}
          d="M-12 116V257H492V116"
          fill="none"
          stroke="#f5f5f2"
          strokeWidth="6"
          strokeLinejoin="round"
          style={{ opacity: pose.tub ? 1 : 0 }}
        />
        <path d="M-40 261H520" stroke="#3a3e44" strokeWidth="2" />
        {PIECES.map((piece, i) => {
          const [x, y, r, o = 1] = pose.p[i]!;
          return (
            <g
              key={i}
              className={classes.part}
              fill={piece.fill}
              style={{ transform: `translate(${x}px,${y}px) rotate(${r}deg)`, opacity: o }}
            >
              <rect width={piece.studs * 40} height="32" rx="2" />
              <path d={studPath(piece.studs)} />
            </g>
          );
        })}
        <g className={classes.part} style={{ opacity: pose.box ? 1 : 0 }}>
          <rect x="150" y="124" width="180" height="136" rx="2" fill="#eaeae5" />
          <rect x="170" y="172" width="140" height="56" rx="2" fill="#dcdcd5" />
          <path d="M186 216h48v-18h-48zM194 198v-6h12v6zM214 198v-6h12v6z" fill="#17191c" />
          <rect
            className={classes.part}
            x="142"
            y="106"
            width="196"
            height="24"
            rx="2"
            fill="#cfcfc7"
            style={{ transform: pose.lid ?? '' }}
          />
        </g>
      </svg>
      <p className={classes.note} aria-live="polite">
        <b>{note[0]}</b> {note[1]}
      </p>
      <fieldset className={`${classes.states} js-only`}>
        <legend className="vh">Build state of this copy</legend>
        {STATES.map((s) => (
          <button
            key={s.value}
            type="button"
            aria-pressed={state === s.value}
            onClick={() => setState(s.value)}
          >
            {s.label}
          </button>
        ))}
      </fieldset>
      <p className={`${classes.hint} js-only`}>
        Every copy you own is in one of these six states. Changing it takes one tap. Go on.
      </p>
    </div>
  );
}
