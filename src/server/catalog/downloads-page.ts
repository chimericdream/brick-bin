import { parse, type HTMLElement, type Node } from 'node-html-parser';

/**
 * Reads Rebrickable's downloads page (HTML in, file list out). The page is parsed only: never
 * rendered, never stored as HTML. Every URL it names must be https and on an allowed origin, so a
 * pasted or tampered page cannot make the server download from anywhere else.
 */

export interface LdrawLink {
  url: string;
  colorId: number;
  colorName: string;
  /** The date shown next to the link, when there is one. */
  date: Date | null;
  /** Size text from the link ("14.8 MB"), for the run preview only. */
  sizeText: string | null;
}

export interface DownloadsListing {
  csvArchive: { url: string; updated: Date | null } | null;
  schemaSvg: { url: string } | null;
  ldraw: LdrawLink[];
  /** URLs dropped because they are not https or not on an allowed origin. */
  dropped: string[];
  /** Other ZIPs the page lists that this version does not know how to use. */
  unknownZips: string[];
  /** Things that fail the run before any download: the page looks cut off or changed. */
  problems: string[];
}

export const MIN_LDRAW_LINKS = 100;
export const MAX_PAGE_BYTES = 2 * 1024 * 1024;

export interface ParseOptions {
  /** The page's own address, for resolving relative links. */
  pageUrl: string;
  allowedOrigins: string[];
}

const clean = (s: string) => s.replace(/\s+/g, ' ').trim();

function safeUrl(raw: string, opts: ParseOptions): { url: string } | { dropped: string } {
  let u: URL;
  try {
    u = new URL(raw.trim(), opts.pageUrl);
  } catch {
    return { dropped: raw.slice(0, 200) };
  }
  if (u.protocol !== 'https:' || !opts.allowedOrigins.includes(u.origin)) {
    return { dropped: u.toString().slice(0, 200) };
  }
  // Credentials in a URL are never legitimate here.
  if (u.username || u.password) return { dropped: u.origin };
  return { url: u.toString() };
}

function parseDate(value: string | undefined): Date | null {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** The `<time>` that goes with a link: inside it, in the nearest ancestor that has one, or after it. */
function dateNear(link: HTMLElement): Date | null {
  const inside = link.querySelector('time');
  if (inside) return parseDate(inside.getAttribute('datetime'));
  let scope: HTMLElement | null = link.parentNode;
  // Stop below the page body: a time far away belongs to some other row.
  for (let depth = 0; scope && depth < 3; depth++, scope = scope.parentNode) {
    const times = scope.querySelectorAll('time');
    if (times.length === 1) return parseDate(times[0]!.getAttribute('datetime'));
    if (times.length > 1) {
      // Several rows share this ancestor: take the first time that follows the link.
      let next = link.nextElementSibling as HTMLElement | null;
      while (next) {
        const t = next.tagName === 'TIME' ? next : next.querySelector('time');
        if (t) return parseDate(t.getAttribute('datetime'));
        next = next.nextElementSibling as HTMLElement | null;
      }
      return null;
    }
  }
  return null;
}

const SIZE = /\d+(?:\.\d+)?\s*(?:KB|MB|GB)\b/i;
/** A name followed by a size in one run of text: "Modulex White 1.4 MB · ZIP". */
const NAME_THEN_SIZE = /^(.*?)\s+(\d+(?:\.\d+)?\s*(?:KB|MB|GB)\b.*)$/i;

/** Every non-empty piece of text under a node, in order (inline spans and block elements alike). */
function textPieces(node: HTMLElement | Node, out: string[] = []): string[] {
  for (const child of node.childNodes) {
    if (child.nodeType === 3) {
      const t = clean(child.text);
      if (t) out.push(t);
    } else if (child.nodeType === 1) {
      textPieces(child as HTMLElement, out);
    }
  }
  return out;
}

/**
 * Name and size from the link's text: the first piece is the colour, a later one is "1.4 MB · ZIP".
 * Falls back to the aria-label ("Download LDraw images in Modulex White as ZIP").
 */
function ldrawText(link: HTMLElement): { name: string | null; size: string | null } {
  const pieces = textPieces(link);
  let name: string | null = pieces[0] ?? null;
  let size: string | null = pieces.slice(1).find((p) => SIZE.test(p)) ?? null;
  // One run of text like "Modulex White 1.4 MB · ZIP": split the size off the end.
  if (name && !size) {
    const m = NAME_THEN_SIZE.exec(name);
    if (m) {
      name = m[1]!;
      size = m[2]!;
    }
  }
  if (!name) {
    const m = /LDraw images in (.+?) as ZIP/i.exec(link.getAttribute('aria-label') ?? '');
    name = m ? clean(m[1]!) : null;
  }
  return { name, size };
}

export function parseDownloadsPage(html: string, opts: ParseOptions): DownloadsListing {
  const root = parse(html, { blockTextElements: { script: false, style: false, noscript: false } });
  const listing: DownloadsListing = {
    csvArchive: null,
    schemaSvg: null,
    ldraw: [],
    dropped: [],
    unknownZips: [],
    problems: [],
  };

  const keep = (raw: string | undefined): string | null => {
    if (!raw) return null;
    const r = safeUrl(raw, opts);
    if ('url' in r) return r.url;
    listing.dropped.push(r.dropped);
    return null;
  };

  const seenLdraw = new Set<number>();
  let badLdraw = 0;

  for (const a of root.querySelectorAll('a')) {
    const href = a.getAttribute('href');
    if (!href) continue;

    if (href.includes('/media/downloads/all_downloads.zip')) {
      const url = keep(href);
      if (url && !listing.csvArchive) {
        // The "Last updated" date sits in the same block as the link.
        listing.csvArchive = { url, updated: dateNear(a) };
      }
    } else if (href.includes('/media/downloads/ldraw/parts_')) {
      const url = keep(href);
      if (!url) continue;
      const id = /parts_(-?\d+)\.zip(?:$|\?)/.exec(new URL(url).pathname + new URL(url).search);
      if (!id) {
        badLdraw++;
        continue;
      }
      const colorId = Number(id[1]);
      if (seenLdraw.has(colorId)) continue;
      seenLdraw.add(colorId);
      const { name, size } = ldrawText(a);
      listing.ldraw.push({
        url,
        colorId,
        colorName: name ?? `Colour ${colorId}`,
        date: dateNear(a),
        sizeText: size,
      });
    } else if (/\.zip(\?|$)/i.test(href)) {
      // Another ZIP (a new section, say): noted in the run summary, never downloaded.
      const url = keep(href);
      if (url) listing.unknownZips.push(url);
    }
  }

  for (const el of root.querySelectorAll('img, a')) {
    const ref = el.getAttribute('src') ?? el.getAttribute('href');
    if (ref && /downloads_schema_v\d+\.svg(\?|$)/.test(ref) && !listing.schemaSvg) {
      const url = keep(ref);
      if (url) listing.schemaSvg = { url };
    }
  }

  if (!listing.csvArchive) {
    listing.problems.push('No link to the complete catalog (all_downloads.zip) was found.');
  }
  if (listing.ldraw.length < MIN_LDRAW_LINKS) {
    listing.problems.push(
      `Only ${listing.ldraw.length} LDraw image links were found (expected at least ${MIN_LDRAW_LINKS}). Did the whole page get copied?`,
    );
  }
  if (badLdraw > 0) {
    listing.problems.push(`${badLdraw} LDraw links have no colour number in their address.`);
  }
  return listing;
}
