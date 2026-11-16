/**
 * Which URLs the catalog import may touch. Everything must be https and on the allowed list. The one
 * exception is plain http to a loopback address (`127.0.0.1`, `localhost`) that is itself named in
 * `REBRICKABLE_ALLOWED_ORIGINS`: the end-to-end tests point the app at a mock server that way. The
 * default list is two https origins, and the list can only be changed through the environment.
 */
const LOOPBACK = new Set(['127.0.0.1', 'localhost', '[::1]']);

export function isAllowedUrl(u: URL, allowedOrigins: string[]): boolean {
  if (!allowedOrigins.includes(u.origin)) return false;
  if (u.protocol === 'https:') return true;
  return u.protocol === 'http:' && LOOPBACK.has(u.hostname);
}
