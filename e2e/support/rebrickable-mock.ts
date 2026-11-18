// A stand-in for rebrickable.com and cdn.rebrickable.com, served from the test worker on loopback.
// The app is started with REBRICKABLE_ALLOWED_ORIGINS and REBRICKABLE_DOWNLOADS_PAGE pointing here,
// so no test ever contacts the real site.
import http from 'node:http';

import { SVG, buildArchive, buildLdrawZip } from '../../src/server/catalog/archive-fixture';
import { TINY_PNG } from '../../src/server/catalog/test-zip';
import {
  buildDownloadsPage,
  fixtureColors,
  type FixtureOptions,
} from '../../src/server/catalog/fixtures';
import { MOCK_PORT, MOCK_URL } from './env';

export interface RequestLog {
  method: string;
  path: string;
  userAgent: string | undefined;
}

export class RebrickableMock {
  requests: RequestLog[] = [];
  /** Answer every colour ZIP with this status instead of the ZIP. */
  ldrawStatus: number | null = null;
  /** Answer set cover requests with this status instead of an image. */
  coverStatus: number | null = null;
  /** Milliseconds to wait before each colour ZIP, so a test can watch progress. */
  ldrawDelayMs = 0;
  /** Screenshot runs only: draws the image for a set cover path instead of the tiny PNG. */
  coverImage: ((path: string) => Buffer) | null = null;
  archive: Promise<Buffer> = buildArchive({}, MOCK_URL);
  private server: http.Server | null = null;
  private ldraw = buildLdrawZip();

  reset() {
    this.requests = [];
    this.ldrawStatus = null;
    this.coverStatus = null;
    this.ldrawDelayMs = 0;
    this.coverImage = null;
    this.archive = buildArchive({}, MOCK_URL);
  }

  /** The downloads page, pointing at this mock. Pass `colors` to change how many colours it lists. */
  page(opts: FixtureOptions = {}) {
    return buildDownloadsPage({
      origin: MOCK_URL,
      cdn: MOCK_URL,
      colors: fixtureColors(120),
      ...opts,
    });
  }

  count(match: string) {
    return this.requests.filter((r) => r.path.includes(match)).length;
  }

  async start() {
    this.server = http.createServer(async (req, res) => {
      const url = new URL(req.url ?? '/', MOCK_URL);
      this.requests.push({
        method: req.method ?? 'GET',
        path: url.pathname,
        userAgent: req.headers['user-agent'],
      });
      const send = (status: number, body: string | Buffer, type = 'text/plain') => {
        res.writeHead(status, { 'Content-Type': type, 'Content-Length': Buffer.byteLength(body) });
        res.end(body);
      };
      try {
        if (url.pathname === '/__health') return send(200, 'ok');
        if (url.pathname === '/downloads/') return send(200, this.page(), 'text/html');
        if (url.pathname === '/media/downloads/all_downloads.zip') {
          return send(200, await this.archive, 'application/zip');
        }
        if (url.pathname.startsWith('/media/downloads/ldraw/')) {
          if (this.ldrawDelayMs) await new Promise((r) => setTimeout(r, this.ldrawDelayMs));
          if (this.ldrawStatus) return send(this.ldrawStatus, 'try later');
          return send(200, await this.ldraw, 'application/zip');
        }
        if (url.pathname.includes('downloads_schema_v')) return send(200, SVG, 'image/svg+xml');
        // Set covers: one tiny PNG for every set, so a saved set gets a real stored image.
        if (url.pathname.startsWith('/media/sets/')) {
          if (this.coverStatus) return send(this.coverStatus, 'no cover');
          return send(200, this.coverImage?.(url.pathname) ?? TINY_PNG, 'image/png');
        }
        // UPCitemdb: one known barcode for the Titanic box.
        if (url.pathname === '/upc/lookup') {
          const known = url.searchParams.get('upc') === '5702017189000';
          const items = known ? [{ title: 'LEGO Icons Titanic 10294 Building Kit' }] : [];
          return send(200, JSON.stringify({ items }), 'application/json');
        }
        return send(404, 'not found');
      } catch (e) {
        return send(500, String(e));
      }
    });
    await new Promise<void>((resolve) => this.server!.listen(MOCK_PORT, '127.0.0.1', resolve));
  }

  async stop() {
    await new Promise<void>((resolve) =>
      this.server ? this.server.close(() => resolve()) : resolve(),
    );
  }
}
