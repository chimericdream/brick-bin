/**
 * Builds a downloads page shaped like the one described in docs/PLAN.md section 5.2, for unit and
 * e2e tests. It is NOT a copy of Rebrickable's page (the app never fetched it while building this):
 * when a real page is pasted for the first time, the parser must be checked against it.
 */

export interface FixtureColor {
  id: number;
  name: string;
  /** ISO date shown next to the link. */
  date: string;
  size?: string;
}

export interface FixtureOptions {
  origin?: string;
  cdn?: string;
  colors?: FixtureColor[];
  csvDate?: string;
  /** Extra markup (tampered links, other sections) inserted before the LDraw list. */
  extra?: string;
  omitCsv?: boolean;
  omitSvg?: boolean;
}

export function fixtureColors(count: number, date = '2026-11-10'): FixtureColor[] {
  const names = ['Black', 'White', 'Lavender', 'Modulex White', 'Light Bluish Gray', 'Dark Red'];
  return Array.from({ length: count }, (_, i) => ({
    id: i === 0 ? 0 : i * 3 + (i % 2),
    name: i < names.length ? names[i]! : `Colour ${i}`,
    date,
    size: `${(i % 9) + 1}.${i % 10} MB · ZIP`,
  }));
}

export function buildDownloadsPage(o: FixtureOptions = {}): string {
  const origin = o.origin ?? 'https://rebrickable.com';
  const cdn = o.cdn ?? 'https://cdn.rebrickable.com';
  const colors = o.colors ?? fixtureColors(120);
  const links = colors
    .map(
      (c) => `
      <li class="ldraw-row">
        <a href="${cdn}/media/downloads/ldraw/parts_${c.id}.zip" aria-label="Download LDraw images in ${c.name} as ZIP">
          <span>${c.name}</span>
          <span>${c.size ?? '1.4 MB · ZIP'}</span>
        </a>
        <time datetime="${c.date}">${c.date}</time>
      </li>`,
    )
    .join('');
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><title>Downloads | Rebrickable</title></head>
<body>
  <h1>Downloads</h1>
  <section id="catalog">
    <p>The catalog of official LEGO sets is available for bulk download below.</p>
    ${
      o.omitCsv
        ? ''
        : `<div class="complete">
      <a href="${cdn}/media/downloads/all_downloads.zip?1731740339">Download the complete catalog</a>
      <span>Last updated <time datetime="${o.csvDate ?? '2026-11-15'}">${o.csvDate ?? '2026-11-15'}</time></span>
    </div>`
    }
    ${
      o.omitSvg
        ? ''
        : `<img alt="Public CSV schema showing the LEGO data files and the identifiers used to join them." src="/static/img/diagrams/downloads_schema_v4.svg">`
    }
  </section>
  <section id="ldraw">
    <h2>LDraw images by color</h2>
    ${o.extra ?? ''}
    <ul>${links}</ul>
  </section>
  <p>Base: ${origin}</p>
</body></html>`;
}
