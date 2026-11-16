import { describe, expect, it } from 'vitest';

import { MIN_LDRAW_LINKS, parseDownloadsPage } from './downloads-page';
import { buildDownloadsPage, fixtureColors } from './fixtures';

const opts = {
  pageUrl: 'https://rebrickable.com/downloads/',
  allowedOrigins: ['https://rebrickable.com', 'https://cdn.rebrickable.com'],
};

describe('parseDownloadsPage', () => {
  it('finds the archive (keeping its query string), the schema SVG and every colour', () => {
    const listing = parseDownloadsPage(buildDownloadsPage(), opts);
    expect(listing.problems).toEqual([]);
    expect(listing.csvArchive).toEqual({
      url: 'https://cdn.rebrickable.com/media/downloads/all_downloads.zip?1731740339',
      updated: new Date('2026-11-15'),
    });
    expect(listing.schemaSvg).toEqual({
      url: 'https://rebrickable.com/static/img/diagrams/downloads_schema_v4.svg',
    });
    expect(listing.ldraw).toHaveLength(120);
    expect(listing.dropped).toEqual([]);
  });

  it('takes the colour id from the address, the name from the first text line, and the date from the row', () => {
    const colors = [
      { id: 1013, name: 'Modulex White', date: '2026-10-01', size: '1.4 MB · ZIP' },
      { id: 31, name: 'Lavender', date: '2026-11-02' },
      ...fixtureColors(MIN_LDRAW_LINKS)
        .slice(2)
        .map((c) => ({ ...c, id: c.id + 5000 })),
    ];
    const listing = parseDownloadsPage(buildDownloadsPage({ colors }), opts);
    const mod = listing.ldraw.find((l) => l.colorId === 1013)!;
    expect(mod).toMatchObject({ colorName: 'Modulex White', sizeText: '1.4 MB · ZIP' });
    expect(mod.date).toEqual(new Date('2026-10-01'));
    expect(listing.ldraw.find((l) => l.colorId === 31)!.date).toEqual(new Date('2026-11-02'));
  });

  it('does not hard-code the schema version', () => {
    const html = buildDownloadsPage().replace('downloads_schema_v4', 'downloads_schema_v7');
    expect(parseDownloadsPage(html, opts).schemaSvg?.url).toContain('downloads_schema_v7.svg');
  });

  it('drops links to other hosts, plain http and credentials, and lists them', () => {
    const extra = `
      <a href="https://evil.example/media/downloads/ldraw/parts_9999.zip">x</a>
      <a href="http://cdn.rebrickable.com/media/downloads/ldraw/parts_9998.zip">y</a>
      <a href="https://user:pw@cdn.rebrickable.com/media/downloads/ldraw/parts_9997.zip">z</a>
      <a href="https://cdn.rebrickable.com.evil.example/media/downloads/all_downloads.zip">w</a>`;
    const listing = parseDownloadsPage(buildDownloadsPage({ extra }), opts);
    expect(listing.ldraw.map((l) => l.colorId)).not.toContain(9999);
    expect(listing.ldraw.map((l) => l.colorId)).not.toContain(9998);
    expect(listing.ldraw.map((l) => l.colorId)).not.toContain(9997);
    expect(listing.dropped).toHaveLength(4);
    expect(listing.csvArchive?.url).toContain(
      'cdn.rebrickable.com/media/downloads/all_downloads.zip?',
    );
  });

  it('notes ZIPs it does not know instead of downloading them', () => {
    const extra = '<a href="https://cdn.rebrickable.com/media/downloads/moc/new_thing.zip">New</a>';
    const listing = parseDownloadsPage(buildDownloadsPage({ extra }), opts);
    expect(listing.unknownZips).toEqual([
      'https://cdn.rebrickable.com/media/downloads/moc/new_thing.zip',
    ]);
  });

  it('fails the sanity checks for a cut-off page, a missing archive and an unparsable colour link', () => {
    const cut = parseDownloadsPage(buildDownloadsPage({ colors: fixtureColors(40) }), opts);
    expect(cut.problems.join(' ')).toMatch(/Only 40 LDraw image links/);
    const noCsv = parseDownloadsPage(buildDownloadsPage({ omitCsv: true }), opts);
    expect(noCsv.problems.join(' ')).toMatch(/all_downloads\.zip/);
    const bad = parseDownloadsPage(
      buildDownloadsPage({
        extra: '<a href="https://cdn.rebrickable.com/media/downloads/ldraw/parts_abc.zip">Odd</a>',
      }),
      opts,
    );
    expect(bad.problems.join(' ')).toMatch(/no colour number/);
  });

  it('treats an unrelated page as nothing found, without throwing', () => {
    const listing = parseDownloadsPage(
      '<html><body><h1>Hello</h1><script>alert(1)</script></body></html>',
      opts,
    );
    expect(listing.csvArchive).toBeNull();
    expect(listing.ldraw).toEqual([]);
    expect(listing.problems.length).toBeGreaterThan(0);
    expect(parseDownloadsPage('', opts).problems.length).toBeGreaterThan(0);
  });

  it('ignores scripts and duplicate colour links', () => {
    const extra = `<script>var a = '<a href="https://cdn.rebrickable.com/media/downloads/ldraw/parts_7777.zip">';</script>
      <a href="https://cdn.rebrickable.com/media/downloads/ldraw/parts_0.zip">Dup</a>`;
    const listing = parseDownloadsPage(buildDownloadsPage({ extra }), opts);
    expect(listing.ldraw.map((l) => l.colorId)).not.toContain(7777);
    expect(listing.ldraw.filter((l) => l.colorId === 0)).toHaveLength(1);
  });
});
