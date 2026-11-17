import { describe, expect, it } from 'vitest';

import {
  SafeFetchError,
  isBlockedAddress,
  safeFetch,
  type RawResponse,
  type SafeFetchDeps,
} from './safe-fetch';

describe('isBlockedAddress', () => {
  it.each([
    '0.0.0.0',
    '10.0.0.1',
    '10.255.255.255',
    '100.64.0.1', // the tailnet
    '100.127.255.254',
    '127.0.0.1',
    '127.255.255.255',
    '169.254.169.254', // cloud metadata
    '172.16.0.1',
    '172.31.255.255',
    '192.168.1.1',
    '192.0.2.5',
    '198.18.0.1',
    '203.0.113.9',
    '224.0.0.1',
    '255.255.255.255',
    '::',
    '::1',
    'fe80::1',
    'febf::1',
    'fc00::1',
    'fd12:3456::1',
    'ff02::1',
    '::ffff:127.0.0.1',
    '::ffff:10.1.2.3',
    '::ffff:7f00:1',
    '::127.0.0.1',
    '64:ff9b::a00:1', // NAT64 wrapping 10.0.0.1
    '2001:db8::1',
    '2002:7f00:1::1', // 6to4 wrapping 127.0.0.1
    'not an ip',
    '',
    '1.2.3',
    '999.1.1.1',
  ])('blocks %s', (ip) => {
    expect(isBlockedAddress(ip)).toBe(true);
  });

  it.each([
    '8.8.8.8',
    '1.1.1.1',
    '93.184.216.34',
    '100.63.255.255', // just below CGNAT
    '100.128.0.1', // just above CGNAT
    '172.15.255.255',
    '172.32.0.1',
    '169.253.1.1',
    '192.169.0.1',
    '198.17.0.1',
    '198.20.0.1',
    '2606:4700:4700::1111',
    '2a00:1450:4001:81b::200e',
    '::ffff:8.8.8.8',
    '64:ff9b::808:808', // NAT64 wrapping 8.8.8.8
  ])('allows %s', (ip) => {
    expect(isBlockedAddress(ip)).toBe(false);
  });
});

const PUBLIC = [{ address: '93.184.216.34', family: 4 }];

function response(
  status: number,
  headers: Record<string, string> = {},
  body = '%PDF-1.4',
): RawResponse {
  let destroyed = false;
  return {
    status,
    headers,
    body: (async function* () {
      yield new TextEncoder().encode(body);
    })(),
    destroy: () => {
      destroyed = true;
      void destroyed;
    },
  };
}

interface Seen {
  urls: string[];
  targets: { address: string; family: number }[];
  headers: Record<string, string>[];
}

function deps(
  routes: Record<string, RawResponse | ((url: URL) => RawResponse)>,
  dns: Record<string, { address: string; family: number }[]> = {},
): { deps: SafeFetchDeps; seen: Seen } {
  const seen: Seen = { urls: [], targets: [], headers: [] };
  return {
    seen,
    deps: {
      resolve: async (host) => {
        if (host in dns) return dns[host]!;
        if (host === 'nxdomain.example') throw new Error('ENOTFOUND');
        return PUBLIC;
      },
      request: async (url, target, init) => {
        seen.urls.push(url.toString());
        seen.targets.push(target);
        seen.headers.push(init.headers);
        const r = routes[url.toString()];
        if (!r) return response(404, {}, 'nope');
        return typeof r === 'function' ? r(url) : r;
      },
    },
  };
}

const opts = { maxBytes: 1000, userAgent: 'BrickBin/test' };
const read = async (body: AsyncIterable<Uint8Array>) => {
  let out = '';
  for await (const c of body) out += new TextDecoder().decode(c);
  return out;
};
const fails = (p: Promise<unknown>, code: SafeFetchError['code']) =>
  expect(p).rejects.toMatchObject({ name: 'SafeFetchError', code });

describe('safeFetch', () => {
  it('fetches a public https address, sending the user agent and connecting to the checked address', async () => {
    const d = deps({ 'https://files.example/book.pdf': response(200, { 'content-length': '8' }) });
    const result = await safeFetch('https://files.example/book.pdf', opts, d.deps);
    expect(await read(result.body)).toBe('%PDF-1.4');
    expect(result).toMatchObject({ finalUrl: 'https://files.example/book.pdf', contentLength: 8 });
    expect(d.seen.targets).toEqual(PUBLIC);
    expect(d.seen.headers[0]).toMatchObject({ 'User-Agent': 'BrickBin/test' });
  });

  it.each([
    ['http://files.example/a.pdf', 'bad_url'],
    ['ftp://files.example/a.pdf', 'bad_url'],
    ['file:///etc/passwd', 'bad_url'],
    ['https://files.example:8443/a.pdf', 'bad_url'],
    ['https://user:pw@files.example/a.pdf', 'bad_url'],
    ['not a url', 'bad_url'],
    ['https://127.0.0.1/a.pdf', 'blocked_address'],
    ['https://[::1]/a.pdf', 'blocked_address'],
    ['https://100.64.1.1/a.pdf', 'blocked_address'],
    ['https://169.254.169.254/latest/meta-data', 'blocked_address'],
    ['https://[::ffff:10.0.0.5]/a.pdf', 'blocked_address'],
    ['https://nxdomain.example/a.pdf', 'dns'],
  ] as const)('refuses %s before sending anything', async (url, code) => {
    const d = deps({});
    await fails(safeFetch(url, opts, d.deps), code);
    expect(d.seen.urls).toEqual([]);
  });

  it('refuses a name that resolves to a private address, and a mixed answer', async () => {
    const d = deps(
      {},
      {
        'internal.example': [{ address: '10.0.0.7', family: 4 }],
        'mixed.example': [
          { address: '93.184.216.34', family: 4 },
          { address: '192.168.0.9', family: 4 },
        ],
        'tailnet.example': [{ address: '100.88.55.50', family: 4 }],
        'six.example': [{ address: 'fd00::1', family: 6 }],
      },
    );
    for (const host of ['internal', 'mixed', 'tailnet', 'six']) {
      await fails(safeFetch(`https://${host}.example/a.pdf`, opts, d.deps), 'blocked_address');
    }
    expect(d.seen.urls).toEqual([]);
  });

  it('follows redirects, checking every hop', async () => {
    const d = deps({
      'https://a.example/start': response(302, { location: 'https://b.example/next' }),
      'https://b.example/next': response(301, { location: '/final.pdf' }),
      'https://b.example/final.pdf': response(200),
    });
    const r = await safeFetch('https://a.example/start', opts, d.deps);
    expect(r.finalUrl).toBe('https://b.example/final.pdf');
    expect(d.seen.urls).toHaveLength(3);
  });

  it('refuses a redirect to a private address, to http, and to a name that resolves privately', async () => {
    for (const location of [
      'https://127.0.0.1/x',
      'http://files.example/x',
      'https://internal.example/x',
    ]) {
      const d = deps(
        { 'https://a.example/start': response(302, { location }) },
        { 'internal.example': [{ address: '10.1.1.1', family: 4 }] },
      );
      await expect(safeFetch('https://a.example/start', opts, d.deps)).rejects.toBeInstanceOf(
        SafeFetchError,
      );
      expect(d.seen.urls).toEqual(['https://a.example/start']);
    }
  });

  it('stops after 5 redirects, and when a redirect has no location', async () => {
    const loop = deps({
      'https://a.example/loop': response(302, { location: 'https://a.example/loop' }),
    });
    await fails(safeFetch('https://a.example/loop', opts, loop.deps), 'redirects');
    expect(loop.seen.urls).toHaveLength(6); // the first request plus 5 redirects
    const none = deps({ 'https://a.example/x': response(302) });
    await fails(safeFetch('https://a.example/x', opts, none.deps), 'redirects');
  });

  it('rejects other statuses and an oversize declared length', async () => {
    const d = deps({
      'https://a.example/missing': response(404),
      'https://a.example/err': response(500),
      'https://a.example/big': response(200, { 'content-length': '5000' }),
    });
    await fails(safeFetch('https://a.example/missing', opts, d.deps), 'status');
    await fails(safeFetch('https://a.example/err', opts, d.deps), 'status');
    await fails(safeFetch('https://a.example/big', opts, d.deps), 'too_large');
  });

  it('turns a failed request into a friendly error', async () => {
    const d: SafeFetchDeps = {
      resolve: async () => PUBLIC,
      request: async () => {
        throw new Error('ECONNRESET');
      },
    };
    await fails(safeFetch('https://a.example/x', opts, d), 'network');
  });
});
