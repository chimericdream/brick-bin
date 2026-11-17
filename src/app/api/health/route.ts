// Legacy path, still used by the Dockerfile HEALTHCHECK and e2e. Same response as `/healthz`.
export { GET, dynamic } from '../../healthz/route';
