import pkg from '../../../package.json';

export const dynamic = 'force-dynamic';

// The `/healthz` convention: 200 with `{ status, version }`.
export function GET() {
  return Response.json({ status: 'ok', version: pkg.version });
}
