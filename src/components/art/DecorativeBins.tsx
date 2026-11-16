import classes from './DecorativeBins.module.css';

type Shape = 'car' | 'house' | 'ship' | 'tower' | 'crane';

/** Invented box art for the sign-in wall: flat colour blocks, no real sets, no brand marks. */
const BOXES: { bg: string; sky: string; shape: Shape }[] = [
  { bg: '#9a5a1f', sky: '#f1ddb8', shape: 'car' },
  { bg: '#2f6a42', sky: '#d9ecd9', shape: 'house' },
  { bg: '#1f5f9a', sky: '#cfe6f4', shape: 'ship' },
  { bg: '#7a2f2a', sky: '#efdcc8', shape: 'house' },
  { bg: '#26334a', sky: '#9fb3cf', shape: 'tower' },
  { bg: '#b0651c', sky: '#d3e3ee', shape: 'crane' },
  { bg: '#3a2f57', sky: '#e5dcef', shape: 'tower' },
  { bg: '#2d6b6e', sky: '#d6ecec', shape: 'car' },
  { bg: '#4a4a1f', sky: '#e8e4c8', shape: 'ship' },
];

function Art({ shape }: { shape: Shape }) {
  switch (shape) {
    case 'car':
      return (
        <>
          <path d="M20 58h80l-8-18H46z" fill="#e0a02f" />
          <circle cx="42" cy="62" r="9" fill="#1b2430" />
          <circle cx="80" cy="62" r="9" fill="#1b2430" />
        </>
      );
    case 'house':
      return (
        <>
          <rect x="34" y="40" width="52" height="26" fill="#f4efe6" />
          <path d="M28 42l32-24 32 24z" fill="#b2402f" />
          <rect x="54" y="50" width="12" height="16" fill="#6a4b2f" />
        </>
      );
    case 'ship':
      return (
        <>
          <path d="M24 56h72l-10 12H34z" fill="#4a3a2a" />
          <path d="M58 20v36l22-8z" fill="#f4efe6" />
        </>
      );
    case 'tower':
      return (
        <>
          <rect x="50" y="22" width="20" height="46" fill="#f4efe6" />
          <rect x="46" y="16" width="28" height="8" fill="#b2402f" />
        </>
      );
    case 'crane':
      return (
        <>
          <rect x="30" y="20" width="6" height="48" fill="#e0a02f" />
          <rect x="30" y="20" width="56" height="6" fill="#e0a02f" />
          <rect x="74" y="26" width="3" height="20" fill="#26334a" />
          <rect x="22" y="60" width="76" height="8" fill="#26334a" />
        </>
      );
  }
}

export function DecorativeBins() {
  return (
    <div className={classes.wall} aria-hidden>
      {[0, 1, 2].map((row) => (
        <div key={row} className={classes.rail}>
          {BOXES.slice(row * 3, row * 3 + 3).map((box, i) => (
            <svg key={i} viewBox="0 0 120 80" className={classes.box} role="presentation">
              <rect width="120" height="80" rx="6" fill={box.bg} />
              <rect x="6" y="6" width="108" height="68" rx="3" fill={box.sky} />
              <Art shape={box.shape} />
            </svg>
          ))}
        </div>
      ))}
    </div>
  );
}
