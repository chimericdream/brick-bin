import fs from 'node:fs';
import path from 'node:path';

import Image from 'next/image';

import { SHOTS, shotFileBase, type ShotId } from '@/content/shots';

import classes from './Shot.module.css';

const RATIO = { desktop: '16:10', phone: '9:19.5', crop: '4:5' } as const;
const SCREENSHOT_DIR = path.join(process.cwd(), 'public', 'screenshots');

/** Which real images exist, checked when the site is built. */
function realImages(id: ShotId) {
  const base = shotFileBase(id);
  const has = (theme: 'light' | 'dark') =>
    fs.existsSync(path.join(SCREENSHOT_DIR, `${base}.${theme}.png`));
  return { base, light: has('light'), dark: has('dark') };
}

/**
 * A screenshot (SPEC 6.14). Until the real image exists the frame shows the baseplate, a label and
 * the shot notes, all inside the frame. Drop `public/screenshots/<id>-<slug>.<theme>.png` in and the
 * next build shows it instead, with its one-line caption. If only one theme was captured, that file
 * is shown in both themes and the caption says which theme it is when the other one is active.
 */
export function Shot({ id }: { id: ShotId }) {
  const shot = SHOTS[id];
  const shapeClass =
    shot.shape === 'phone' ? classes.phone : shot.shape === 'crop' ? classes.crop : '';
  const figureClass = [classes.shot, shapeClass].filter(Boolean).join(' ');
  const { base, light, dark } = realImages(id);

  if (light || dark) {
    const img = (theme: 'light' | 'dark', className?: string) => (
      <Image
        key={theme}
        className={className}
        src={`/screenshots/${base}.${theme}.png`}
        alt={shot.alt}
        fill
        sizes={shot.shape === 'desktop' ? '(min-width: 1024px) 760px, 100vw' : '320px'}
      />
    );
    const only = light && dark ? null : light ? 'light' : 'dark';
    return (
      <figure className={figureClass}>
        <div className={classes.frame}>
          {only ? img(only) : [img('light', classes.onlyLight), img('dark', classes.onlyDark)]}
        </div>
        <figcaption>
          {shot.caption}
          {only && (
            <span className={only === 'light' ? classes.onlyDark : classes.onlyLight}>
              {' '}
              Shown in the {only} theme.
            </span>
          )}
        </figcaption>
      </figure>
    );
  }

  return (
    <figure className={figureClass}>
      <div className={classes.frame}>
        <div className={`${classes.art} baseplate`} role="img" aria-label={shot.alt} />
        <div className={classes.label}>
          <b>{id}</b>
          <strong>{shot.title}</strong>
          {shot.shape} · {RATIO[shot.shape]} · {shot.theme}
        </div>
        <div
          className={classes.notes}
          role="group"
          aria-label={`Shot notes for ${id}`}
          tabIndex={0}
        >
          <b>
            {id} · {shot.title}
          </b>
          <dl>
            <div>
              <dt>Screen</dt>
              <dd>{shot.screen}</dd>
            </div>
            <div>
              <dt>State</dt>
              <dd>{shot.state}</dd>
            </div>
            <div>
              <dt>Viewport and theme</dt>
              <dd>{shot.viewport}</dd>
            </div>
            <div>
              <dt>Focus</dt>
              <dd>{shot.focus}</dd>
            </div>
          </dl>
        </div>
      </div>
    </figure>
  );
}
