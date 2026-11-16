// Regenerates the reference screenshots in screenshots/ (gitignored): `pnpm shots`.
// Sets the env var in a way that works on every OS, then runs the screenshots project.
import { spawnSync } from 'node:child_process';
import path from 'node:path';

const playwright = path.resolve('node_modules/@playwright/test/cli.js');
const result = spawnSync(
  process.execPath,
  [playwright, 'test', '--project=screenshots', ...process.argv.slice(2)],
  { stdio: 'inherit', env: { ...process.env, E2E_SCREENSHOTS: '1' } },
);
process.exit(result.status ?? 1);
