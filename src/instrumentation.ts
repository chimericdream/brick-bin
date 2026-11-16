export async function register() {
  if (process.env.NEXT_RUNTIME !== 'nodejs') return;
  const url = process.env.DATABASE_URL;
  if (!url) return;
  if (process.env.AUTO_MIGRATE !== 'false') {
    const { runMigrations } = await import('./server/db/migrate');
    await runMigrations(url, process.env.MIGRATIONS_DIR ?? './drizzle');
  }
  // An import still marked running was cut off by a restart: it failed.
  const { markInterruptedRuns } = await import('./server/catalog/runs');
  const { getDb } = await import('./server/db/client');
  await markInterruptedRuns(getDb()).catch((e) =>
    console.error('Could not mark interrupted imports', e),
  );
  const { startTrashPurge } = await import('./server/trash-schedule');
  startTrashPurge();
}
