import { lookup as dnsLookup } from 'node:dns/promises';
import { request as httpsRequest } from 'node:https';
import type { IncomingHttpHeaders } from 'node:http';
import { isIP } from 'node:net';

/**
 * Downloads a file from an address someone typed in, without letting that address reach into our own
 * network (SSRF). The rules (docs/PLAN.md section 6.3):
 *
 * - https only, on port 443, with no credentials in the address;
 * - the name is resolved here and EVERY answer must be a public address (no loopback, private,
 *   link-local, CGNAT such as the tailnet's 100.64.0.0/10, or the IPv6 equivalents);
 * - the connection goes to the address that was checked, so a DNS change between the check and the
 *   connect cannot send it somewhere else;
 * - at most 5 redirects, and every hop is checked again;
 * - the size is capped and an idle connection is cut after 60 seconds.
 */

// ---------------------------------------------------------------------------
// Which addresses count as public
// ---------------------------------------------------------------------------

function parseIPv4(ip: string): number[] | null {
  const parts = ip.split('.');
  if (parts.length !== 4) return null;
  const nums = parts.map((p) => (/^\d{1,3}$/.test(p) ? Number(p) : NaN));
  return nums.every((n) => n >= 0 && n <= 255) ? nums : null;
}

/** Eight 16-bit groups, or null. Understands `::` and a trailing dotted IPv4 (`::ffff:1.2.3.4`). */
function parseIPv6(ip: string): number[] | null {
  let text = ip.replace(/^\[|\]$/g, '').split('%')[0]!; // drop brackets and a zone id
  if (isIP(text) !== 6) return null;
  const v4 = /(\d+\.\d+\.\d+\.\d+)$/.exec(text);
  if (v4) {
    const b = parseIPv4(v4[1]!);
    if (!b) return null;
    text =
      text.slice(0, -v4[1]!.length) +
      (b[0]! * 256 + b[1]!).toString(16) +
      ':' +
      (b[2]! * 256 + b[3]!).toString(16);
  }
  const [head, tail] = text.split('::');
  const left = head ? head.split(':') : [];
  const right = tail !== undefined && tail ? tail.split(':') : [];
  const fill = tail === undefined ? 0 : 8 - left.length - right.length;
  if (fill < 0) return null;
  const groups = [...left, ...Array(fill).fill('0'), ...right].map((g) => parseInt(g, 16));
  return groups.length === 8 && groups.every((g) => g >= 0 && g <= 0xffff) ? groups : null;
}

function blockedV4([a, b, c]: number[]): boolean {
  return (
    a === 0 || // "this network"
    a === 10 ||
    (a === 100 && b! >= 64 && b! <= 127) || // CGNAT, which includes the tailnet
    a === 127 ||
    (a === 169 && b === 254) || // link-local, including cloud metadata
    (a === 172 && b! >= 16 && b! <= 31) ||
    (a === 192 && b === 0 && (c === 0 || c === 2)) || // IETF protocol assignments, TEST-NET-1
    (a === 192 && b === 168) ||
    (a === 198 && (b === 18 || b === 19)) || // benchmarking
    (a === 198 && b === 51 && c === 100) || // TEST-NET-2
    (a === 203 && b === 0 && c === 113) || // TEST-NET-3
    a! >= 224 // multicast, reserved, broadcast
  );
}

/** True for anything that is not an ordinary public internet address. Unparseable input counts as blocked. */
export function isBlockedAddress(ip: string): boolean {
  const v4 = parseIPv4(ip);
  if (v4) return blockedV4(v4);
  const g = parseIPv6(ip);
  if (!g) return true;
  if (g.every((x) => x === 0)) return true; // ::
  if (g.slice(0, 7).every((x) => x === 0) && g[7] === 1) return true; // ::1
  // IPv4-mapped (::ffff:a.b.c.d) and IPv4-compatible (::a.b.c.d): judged by the IPv4 address inside.
  const embedded = [g[6]! >> 8, g[6]! & 255, g[7]! >> 8, g[7]! & 255];
  if (g.slice(0, 5).every((x) => x === 0) && (g[5] === 0xffff || g[5] === 0))
    return blockedV4(embedded);
  // NAT64 (64:ff9b::/96): the IPv4 address is in the last 32 bits.
  if (g[0] === 0x64 && g[1] === 0xff9b && g.slice(2, 6).every((x) => x === 0))
    return blockedV4(embedded);
  if ((g[0]! & 0xffc0) === 0xfe80) return true; // fe80::/10 link-local
  if ((g[0]! & 0xfe00) === 0xfc00) return true; // fc00::/7 unique local
  if ((g[0]! & 0xff00) === 0xff00) return true; // multicast
  if (g[0] === 0x2001 && g[1] === 0x0db8) return true; // documentation
  if (g[0] === 0x2002) return blockedV4([g[1]! >> 8, g[1]! & 255, g[2]! >> 8]); // 6to4 wraps an IPv4 address
  if (g[0] === 0x100 && g.slice(1, 4).every((x) => x === 0)) return true; // discard prefix
  return false;
}

// ---------------------------------------------------------------------------
// The fetch
// ---------------------------------------------------------------------------

export class SafeFetchError extends Error {
  constructor(
    message: string,
    public code:
      | 'bad_url'
      | 'blocked_address'
      | 'dns'
      | 'redirects'
      | 'status'
      | 'too_large'
      | 'timeout'
      | 'network',
  ) {
    super(message);
    this.name = 'SafeFetchError';
  }
}

export interface RawResponse {
  status: number;
  headers: IncomingHttpHeaders;
  body: AsyncIterable<Uint8Array>;
  destroy: () => void;
}

export interface SafeFetchDeps {
  /** All addresses a name resolves to. Default: the system resolver. */
  resolve?: (host: string) => Promise<{ address: string; family: number }[]>;
  /** One HTTPS request to a pre-checked address. Default: Node's `https`. */
  request?: (
    url: URL,
    target: { address: string; family: number },
    init: { headers: Record<string, string>; idleTimeoutMs: number },
  ) => Promise<RawResponse>;
}

export interface SafeFetchOptions {
  maxBytes: number;
  userAgent: string;
  maxRedirects?: number;
  idleTimeoutMs?: number;
}

export interface SafeFetchResult {
  body: AsyncIterable<Uint8Array>;
  finalUrl: string;
  contentLength: number | null;
}

const defaultResolve: NonNullable<SafeFetchDeps['resolve']> = (host) =>
  dnsLookup(host, { all: true, verbatim: true });

const defaultRequest: NonNullable<SafeFetchDeps['request']> = (url, target, init) =>
  new Promise((resolve, reject) => {
    const req = httpsRequest(
      {
        hostname: url.hostname.replace(/^\[|\]$/g, ''),
        port: 443,
        path: `${url.pathname}${url.search}`,
        method: 'GET',
        headers: init.headers,
        timeout: init.idleTimeoutMs,
        // Connect to the address that was already checked: no second lookup can change the answer.
        lookup: (_host, options, callback) => {
          if (options && (options as { all?: boolean }).all) {
            (callback as unknown as (e: null, a: { address: string; family: number }[]) => void)(
              null,
              [target],
            );
          } else {
            callback(null, target.address, target.family);
          }
        },
      },
      (res) =>
        resolve({
          status: res.statusCode ?? 0,
          headers: res.headers,
          body: res,
          destroy: () => res.destroy(),
        }),
    );
    req.on('timeout', () =>
      req.destroy(new SafeFetchError('The server stopped responding.', 'timeout')),
    );
    req.on('error', reject);
    req.end();
  });

/** The checks that apply to an address before anything is sent to it. Throws a SafeFetchError. */
async function checkTarget(
  raw: string,
  resolve: NonNullable<SafeFetchDeps['resolve']>,
): Promise<{ url: URL; target: { address: string; family: number } }> {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    throw new SafeFetchError('That is not a valid web address.', 'bad_url');
  }
  if (url.protocol !== 'https:')
    throw new SafeFetchError('Only https addresses are allowed.', 'bad_url');
  if (url.port && url.port !== '443')
    throw new SafeFetchError('Only the standard https port is allowed.', 'bad_url');
  if (url.username || url.password)
    throw new SafeFetchError('Addresses with a login are not allowed.', 'bad_url');

  const host = url.hostname.replace(/^\[|\]$/g, '');
  const kind = isIP(host);
  if (kind !== 0) {
    if (isBlockedAddress(host)) {
      throw new SafeFetchError(
        'That address points inside a private network, so it is not allowed.',
        'blocked_address',
      );
    }
    return { url, target: { address: host, family: kind } };
  }
  let answers: { address: string; family: number }[];
  try {
    answers = await resolve(host);
  } catch {
    throw new SafeFetchError('That address could not be found.', 'dns');
  }
  if (answers.length === 0) throw new SafeFetchError('That address could not be found.', 'dns');
  // Any private answer rejects the whole name: a mixed answer is how rebinding tricks start.
  if (answers.some((a) => isBlockedAddress(a.address))) {
    throw new SafeFetchError(
      'That address points inside a private network, so it is not allowed.',
      'blocked_address',
    );
  }
  return { url, target: answers[0]! };
}

/**
 * Starts a download and returns the body once the headers have passed every check. The caller
 * streams the body somewhere (and must still check the bytes: `Content-Type` proves nothing).
 */
export async function safeFetch(
  startUrl: string,
  opts: SafeFetchOptions,
  deps: SafeFetchDeps = {},
): Promise<SafeFetchResult> {
  const resolve = deps.resolve ?? defaultResolve;
  const request = deps.request ?? defaultRequest;
  const maxRedirects = opts.maxRedirects ?? 5;
  const idleTimeoutMs = opts.idleTimeoutMs ?? 60_000;
  let current = startUrl;

  for (let hop = 0; ; hop++) {
    const { url, target } = await checkTarget(current, resolve);
    let res: RawResponse;
    try {
      res = await request(url, target, {
        headers: {
          'User-Agent': opts.userAgent,
          Accept: 'application/pdf,*/*;q=0.5',
          Host: url.host,
        },
        idleTimeoutMs,
      });
    } catch (e) {
      if (e instanceof SafeFetchError) throw e;
      throw new SafeFetchError('The download failed.', 'network');
    }

    if ([301, 302, 303, 307, 308].includes(res.status)) {
      res.destroy();
      const location = res.headers.location;
      if (!location || hop >= maxRedirects) {
        throw new SafeFetchError('The address redirects too many times.', 'redirects');
      }
      current = new URL(location, url).toString(); // checked again at the top of the loop
      continue;
    }
    if (res.status !== 200) {
      res.destroy();
      throw new SafeFetchError(`The site answered ${res.status}.`, 'status');
    }
    const declared = Number(res.headers['content-length'] ?? NaN);
    if (Number.isFinite(declared) && declared > opts.maxBytes) {
      res.destroy();
      throw new SafeFetchError('That file is larger than the limit.', 'too_large');
    }
    return {
      body: res.body,
      finalUrl: url.toString(),
      contentLength: Number.isFinite(declared) ? declared : null,
    };
  }
}
