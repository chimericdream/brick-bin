/*
 * Pictures of bricks: the pile on the sign-in panel and the wall on the not-found page. Flat
 * shapes in the brick colours, with no letters or logos on the studs.
 */

/** A pile of bricks, built up and sitting on a floor line. Decoration on the sign-in panel. */
export function HeroPile({ className }: { className?: string }) {
  const brick = (x: number, y: number, w: number, fill: string) => {
    const studs = [];
    for (let i = 0; i * 40 + 32 <= w; i++) studs.push(`M${8 + i * 40}-8h24v8H${8 + i * 40}z`);
    return (
      <g key={`${x}-${y}`} transform={`translate(${x} ${y})`} fill={fill}>
        <rect width={w} height="32" rx="2" />
        <path d={studs.join('')} />
      </g>
    );
  };
  return (
    <svg viewBox="-40 96 560 172" className={className} aria-hidden="true" focusable="false">
      <path d="M-40 261H520" stroke="var(--app-field-line)" strokeWidth="2" />
      {brick(60, 228, 120, 'var(--app-st-progress)')}
      {brick(180, 228, 160, 'var(--app-st-apart)')}
      {brick(340, 228, 80, 'var(--app-st-built)')}
      {brick(100, 196, 80, 'var(--app-st-opened)')}
      {brick(180, 196, 120, 'var(--app-st-sealed)')}
      {brick(300, 196, 80, 'var(--app-st-progress)')}
      {brick(140, 164, 120, 'var(--app-st-built)')}
      {brick(260, 164, 80, 'var(--app-st-apart)')}
      {brick(200, 132, 80, 'var(--app-st-opened)')}
    </svg>
  );
}

/** A wall of bricks with one missing, its place marked by a dashed outline. */
export function MissingWall({ className }: { className?: string }) {
  const rows: [number, number, string][][] = [
    [
      [0, 116, 'apart'],
      [120, 156, 'opened'],
      [280, 76, 'built'],
      [360, 120, 'sealed'],
    ],
    [
      [0, 76, 'progress'],
      [80, 116, 'built'],
      [320, 76, 'apart'],
      [400, 80, 'opened'],
    ],
    [
      [0, 156, 'sealed'],
      [160, 116, 'progress'],
      [280, 116, 'built'],
      [400, 80, 'apart'],
    ],
    [
      [0, 116, 'opened'],
      [120, 76, 'apart'],
      [200, 156, 'sealed'],
      [360, 120, 'progress'],
    ],
  ];
  return (
    <svg viewBox="0 0 480 220" className={className} aria-hidden="true" focusable="false">
      {rows.map((row, r) =>
        row.map(([x, w, st]) => (
          <rect
            key={`${r}-${x}`}
            x={x}
            y={16 + r * 52}
            width={w}
            height="48"
            rx="2"
            fill={`var(--app-st-${st})`}
          />
        )),
      )}
      {rows[0]!.map(([x, w, st]) => {
        const studs = [];
        for (let i = 0; i * 40 + 24 <= w - 8; i++) studs.push(`M${x + 10 + i * 40} 16V6h24v10z`);
        return <path key={`s-${x}`} d={studs.join('')} fill={`var(--app-st-${st})`} />;
      })}
      <rect
        x="201.5"
        y="69.5"
        width="113"
        height="45"
        rx="2"
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        strokeDasharray="9 7"
      />
      <text
        x="258"
        y="100"
        textAnchor="middle"
        fontFamily="var(--app-font)"
        fontWeight="800"
        fontSize="24"
        fill="currentColor"
      >
        404
      </text>
    </svg>
  );
}
