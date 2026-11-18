// Writes site/PLACEHOLDERS.md from src/content/shots.ts and the pages that use each shot.
// Run with: pnpm --filter brick-bin-site placeholders   (Node 24 runs TypeScript directly)
import fs from 'node:fs';
import path from 'node:path';

import { SHOTS, shotFileBase, type ShotId } from '../src/content/shots.ts';

const root = path.resolve(import.meta.dirname, '..');
const src = path.join(root, 'src');

/** The page a source file renders on. */
function pageOf(file: string): string {
  const rel = path.relative(src, file).split(path.sep).join('/');
  const tutorial = /^content\/tutorials\/(.+)\.tsx$/.exec(rel);
  if (tutorial) return `/tutorials/${tutorial[1]}/`;
  const app = /^app\/(.*)page\.tsx$/.exec(rel);
  if (app) return `/${app[1]}`;
  return rel;
}

function walk(dir: string): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((d) => {
    const p = path.join(dir, d.name);
    return d.isDirectory() ? walk(p) : p.endsWith('.tsx') ? [p] : [];
  });
}

const usedOn = new Map<string, string[]>();
for (const file of walk(src)) {
  for (const m of fs.readFileSync(file, 'utf8').matchAll(/<Shot id="([A-Z0-9-]+)"/g)) {
    const pages = usedOn.get(m[1]!) ?? [];
    pages.push(pageOf(file));
    usedOn.set(m[1]!, pages);
  }
}

const RATIO = { desktop: '16:10', phone: '9:19.5', crop: '4:5' };
const ids = Object.keys(SHOTS) as ShotId[];
const unused = ids.filter((id) => !usedOn.has(id));
if (unused.length) console.warn(`Not used on any page: ${unused.join(', ')}`);

const entries = ids
  .filter((id) => usedOn.has(id))
  .map((id) => {
    const s = SHOTS[id];
    const base = shotFileBase(id);
    return `### ${id}: ${s.title}

- **Used on:** ${usedOn
      .get(id)!
      .map((p) => `\`${p}\``)
      .join(', ')}
- **Files:** \`${base}.light.png\`, \`${base}.dark.png\` (${s.shape}, ratio ${RATIO[s.shape]}; first choice: ${s.theme})
- **Screen:** ${s.screen}
- **State:** ${s.state}
- **Viewport and theme:** ${s.viewport}
- **Focus:** ${s.focus}
- **Alt text:** ${s.alt}
- **Caption under the real image:** ${s.caption}
`;
  });

const doc = `# Placeholders

Every screenshot placeholder on the site, ${entries.length} in all. This file is generated from
\`src/content/shots.ts\` by \`pnpm --filter brick-bin-site placeholders\`. Edit that file, not this
one, then run the command.

## Adding a real screenshot

1. Capture it as described below: desktop shots at 1440 wide, phone shots at 390 wide, both at 2x.
   No browser chrome. Use made-up household data, never real names or email addresses.
2. Save it as \`site/public/screenshots/<file>\`, using the file name listed. \`.light.png\` is the
   light theme and \`.dark.png\` the dark one.
3. Rebuild. The placeholder (baseplate, label and shot notes) is replaced by the image, inside the
   same fixed-ratio frame, with the caption below it.

One theme is enough. If only one file exists, the site shows it in both themes, and in the other
theme the caption adds "Shown in the light theme." (or dark). If you can only take one, take the
"first choice" theme. Keep the caption and alt text in \`shots.ts\` true to what the image shows.

## The placeholders

${entries.join('\n')}`;

fs.writeFileSync(path.join(root, 'PLACEHOLDERS.md'), doc);
console.log(`Wrote PLACEHOLDERS.md with ${entries.length} placeholders.`);
