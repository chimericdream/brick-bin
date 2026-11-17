export { GET } from '../../healthz/route';

// Legacy alias of `/healthz`. Route config can't be re-exported, so it is declared here too.
export const dynamic = 'force-dynamic';
