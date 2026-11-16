import { copyFile, mkdir, readdir, rm, stat } from 'node:fs/promises';
import path from 'node:path';

import { eq, sql } from 'drizzle-orm';

import type { Db } from '../db/client';
import { catalogFiles, catalogPartImages, catalogRuns, rbColors } from '../db/schema';
import { createdFields, recordAudit } from '../data/audit';
import { catalogPaths, fileKey, type CatalogConfig } from './config';
import { parseCsv } from './csv-stream';
import type { DownloadsListing } from './downloads-page';
import { REQUIRED_FILES, fileSpec } from './files';
import { createStaging, dropStaging, loadFile, swapStaging } from './load';
import { downloadToFile, type FetchLike } from './net';
import { addNote, failRun, finishRun, knownFiles, updateRun } from './runs';
import { fetchedRecently, nextFetchAllowed, planRun } from './rules';
import { extractLdraw, listPartImages, openZip } from './zip';

export interface RunDeps {
  db: Db;
  config: CatalogConfig;
  fetchImpl?: FetchLike;
  now?: () => Date;
}

export interface RunActor {
  householdId: string;
  userId: string;
}

const PART_IMAGE_BATCH = 20_000;

/**
 * Runs one catalog import (docs/PLAN.md section 5.3). It never throws: any failure marks the run
 * `failed` with the reason, drops the staging tables and leaves the old catalog untouched.
 *
 * Requests go one at a time with a descriptive User-Agent. A 429 or a 5xx stops the whole run.
 */
export async function executeRun(
  deps: RunDeps,
  runId: string,
  listing: DownloadsListing,
  actor: RunActor,
): Promise<void> {
  const { db, config } = deps;
  const now = () => (deps.now ?? (() => new Date()))();
  const paths = catalogPaths(config.dataDir);
  let bytesTotal = 0;
  let downloaded = 0;
  let skipped = 0;
  let rowsLoaded = 0;

  const step = (text: string) => updateRun(db, runId, { step: text });
  const progress = (done: number) =>
    updateRun(db, runId, { filesDone: done, bytesDownloaded: bytesTotal });
  const dl = (
    url: string,
    dest: string,
    extra: Parameters<typeof downloadToFile>[2] extends infer T ? Partial<T> : never = {},
  ) =>
    downloadToFile(url, dest, {
      fetchImpl: deps.fetchImpl,
      userAgent: config.userAgent,
      allowedOrigins: config.allowedOrigins,
      onBytes: (n) => (bytesTotal += n),
      ...extra,
    });

  try {
    const known = await knownFiles(db);
    const plan = planRun(listing, known);
    const total = (plan.csvArchive ? 1 : 0) + (plan.schemaSvg ? 1 : 0) + plan.ldrawToFetch.length;
    await updateRun(db, runId, { filesTotal: total, filesSkipped: plan.ldrawUnchanged });
    skipped += plan.ldrawUnchanged;
    if (!plan.csvArchive) throw new Error('The page lists no catalog archive.');

    // Record the listing first, keeping what we already know (validators, fetch times).
    const upsert = async (
      url: string,
      kind: typeof catalogFiles.$inferInsert.kind,
      extra: Partial<typeof catalogFiles.$inferInsert> = {},
    ) => {
      const key = fileKey(url);
      await db
        .insert(catalogFiles)
        .values({ url: key, kind, ...extra })
        .onConflictDoUpdate({ target: catalogFiles.url, set: { kind, ...extra } });
      return key;
    };
    await upsert(plan.csvArchive.url, 'csv_archive', {
      remoteDate: listing.csvArchive?.updated ?? null,
    });
    if (plan.schemaSvg) await upsert(plan.schemaSvg.url, 'schema_svg');
    for (const l of listing.ldraw) {
      await upsert(l.url, 'ldraw_zip', { colorId: l.colorId, colorName: l.colorName });
    }

    await mkdir(paths.tmp, { recursive: true });
    let done = 0;

    // 4. The archive and the diagram. Each URL is fetched at most once a day; a retry reuses a file
    //    the failed run already downloaded.
    const archivePath = path.join(paths.tmp, 'all_downloads.zip');
    const archiveKey = fileKey(plan.csvArchive.url);
    await fetchOnceADay(
      archiveKey,
      plan.csvArchive.url,
      archivePath,
      'Downloading the catalog archive',
    );
    await progress(++done);
    downloaded++;

    let svgTemp: string | null = null;
    if (plan.schemaSvg) {
      svgTemp = path.join(paths.tmp, 'downloads_schema.svg');
      await fetchOnceADay(
        fileKey(plan.schemaSvg.url),
        plan.schemaSvg.url,
        svgTemp,
        'Downloading the schema diagram',
        5_000_000,
      );
      await progress(++done);
      downloaded++;
    }

    // 5. CSVs into staging tables, then one transaction swaps them in.
    await step('Reading the catalog archive');
    await createStaging(db);
    try {
      const zip = await openZip(archivePath);
      const loaded = new Set<string>();
      try {
        for await (const entry of zip.entries()) {
          const spec = fileSpec(entry.name);
          if (!spec) continue;
          await step(`Loading ${entry.name}`);
          const n = await loadFile(db, spec, parseCsv(await entry.open()), (c) =>
            updateRun(db, runId, { rowsLoaded: rowsLoaded + c }),
          );
          rowsLoaded += n;
          loaded.add(entry.name);
        }
      } finally {
        zip.close();
      }
      const missing = REQUIRED_FILES.filter((f) => !loaded.has(f));
      if (missing.length > 0) {
        throw new Error(
          `The catalog archive is missing: ${missing.join(', ')}. The catalog was not changed.`,
        );
      }
      await step('Replacing the catalog');
      await swapStaging(db);
    } catch (e) {
      await dropStaging(db);
      throw e;
    }
    await updateRun(db, runId, { rowsLoaded });

    // 6. LDraw images: only the colours whose date moved.
    let ldrawIndex = 0;
    for (const link of plan.ldrawToFetch) {
      ldrawIndex++;
      await step(`Colour images ${ldrawIndex} of ${plan.ldrawToFetch.length}: ${link.colorName}`);
      const key = fileKey(link.url);
      const file = (await knownFiles(db)).get(key);
      const zipPath = path.join(paths.tmp, `parts_${link.colorId}.zip`);
      const reuse = fetchedRecently(file, now()) ? await exists(zipPath) : false;

      if (fetchedRecently(file, now()) && !reuse) {
        // Fetched less than a day ago but never extracted (an earlier run failed): wait, don't re-fetch.
        const again = nextFetchAllowed(file, now())!;
        await addNote(
          db,
          runId,
          `${link.colorName}: skipped, fetched recently. Try again after ${again.toISOString()}.`,
        );
        skipped++;
        await progress(++done);
        continue;
      }

      if (!reuse) {
        const result = await dl(link.url, zipPath, {
          ifModifiedSince: file?.extractedAt ? file.lastModified : null,
          ifNoneMatch: file?.extractedAt ? file.etag : null,
        });
        await db
          .update(catalogFiles)
          .set(
            result.status === 'ok'
              ? {
                  fetchedAt: now(),
                  etag: result.etag,
                  lastModified: result.lastModified,
                  bytes: result.bytes,
                }
              : { fetchedAt: now() },
          )
          .where(eq(catalogFiles.url, key));
        if (result.status === 'not-modified') {
          await db
            .update(catalogFiles)
            .set({ remoteDate: link.date })
            .where(eq(catalogFiles.url, key));
          skipped++;
          await progress(++done);
          continue;
        }
        downloaded++;
      }

      const out = await extractLdraw(
        zipPath,
        path.join(paths.ldraw, String(link.colorId)).replace(/\\/g, '/'),
      );
      await rm(zipPath, { force: true }); // do not keep 5.9 GB of ZIPs next to the extracted images
      if (out.rejected.length > 0) {
        await addNote(
          db,
          runId,
          `${link.colorName}: skipped ${out.rejected.length} unsafe or invalid entries.`,
        );
      }
      await db
        .update(catalogFiles)
        .set({ extractedAt: now(), remoteDate: link.date })
        .where(eq(catalogFiles.url, key));
      await progress(++done);
    }

    // Which colours each part has an image in (for fallback images), rebuilt every run.
    await step('Indexing part images');
    await rebuildPartImages(db, paths.ldraw);
    const [unmatched] = await db
      .select({ n: sql<number>`count(distinct ${catalogPartImages.partNum})::int` })
      .from(catalogPartImages)
      .where(
        sql`not exists (select 1 from rb_parts p where p.part_num = ${catalogPartImages.partNum})`,
      );
    if ((unmatched?.n ?? 0) > 0) {
      await addNote(
        db,
        runId,
        `${unmatched!.n} image names do not match a part number. They are kept but never shown.`,
      );
    }

    // Names on the page against the catalog's own colour names: a mismatch is a warning, not a failure.
    const colors = new Map(
      (await db.select({ id: rbColors.id, name: rbColors.name }).from(rbColors)).map((c) => [
        c.id,
        c.name,
      ]),
    );
    const odd = listing.ldraw.filter(
      (l) => colors.has(l.colorId) && colors.get(l.colorId) !== l.colorName,
    );
    if (odd.length > 0) {
      await addNote(
        db,
        runId,
        `Colour names differ from the catalog for ${odd.length} colours (for example ${odd[0]!.colorName} is ${colors.get(odd[0]!.colorId)}).`,
      );
    }
    if (listing.unknownZips.length > 0) {
      await addNote(
        db,
        runId,
        `The page lists ${listing.unknownZips.length} other ZIP files that were not downloaded.`,
      );
    }
    if (listing.dropped.length > 0) {
      await addNote(db, runId, `${listing.dropped.length} links to other sites were ignored.`);
    }

    // 8. The diagram, then done.
    if (svgTemp) {
      await mkdir(path.dirname(paths.schema), { recursive: true });
      await copyFile(svgTemp, paths.schema);
      await rm(svgTemp, { force: true });
    }
    await rm(archivePath, { force: true });
    await updateRun(db, runId, {
      filesDownloaded: downloaded,
      filesSkipped: skipped,
      bytesDownloaded: bytesTotal,
    });
    await finishRun(db, runId, now());
    await audit('succeeded');
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    await updateRun(db, runId, {
      filesDownloaded: downloaded,
      filesSkipped: skipped,
      bytesDownloaded: bytesTotal,
    }).catch(() => undefined);
    await failRun(db, runId, message, now()).catch(() => undefined);
    await audit('failed', message).catch(() => undefined);
  }

  async function audit(status: string, error?: string) {
    const [run] = await db.select().from(catalogRuns).where(eq(catalogRuns.id, runId));
    await recordAudit(
      db,
      { householdId: actor.householdId, viewer: { userId: actor.userId } },
      {
        entityType: 'catalog_run',
        entityId: runId,
        action: 'create',
        changes: createdFields({
          status,
          error: error ?? null,
          filesDownloaded: run?.filesDownloaded,
          filesSkipped: run?.filesSkipped,
          rowsLoaded: run?.rowsLoaded,
        }),
      },
    );
  }

  /** Downloads `url` unless it was fetched less than a day ago: then the saved copy is reused, or the run stops. */
  async function fetchOnceADay(
    key: string,
    url: string,
    dest: string,
    label: string,
    maxBytes?: number,
  ) {
    await step(label);
    const file = (await knownFiles(db)).get(key);
    if (fetchedRecently(file, now())) {
      if (await exists(dest)) return;
      const again = nextFetchAllowed(file, now())!;
      throw new Error(
        `${key.split('/').pop()} was already downloaded at ${file!.fetchedAt!.toISOString()}, and Rebrickable allows one download a day. Try again after ${again.toISOString()}.`,
      );
    }
    const result = await dl(url, dest, { maxBytes });
    if (result.status === 'ok') {
      await db
        .update(catalogFiles)
        .set({
          fetchedAt: now(),
          etag: result.etag,
          lastModified: result.lastModified,
          bytes: result.bytes,
        })
        .where(eq(catalogFiles.url, key));
    }
  }
}

async function exists(file: string): Promise<boolean> {
  try {
    await stat(file);
    return true;
  } catch {
    return false;
  }
}

/** Replaces `catalog_part_images` with what is on disk. Folders are named by colour id. */
export async function rebuildPartImages(db: Db, ldrawDir: string): Promise<number> {
  let colors: string[] = [];
  try {
    colors = (await readdir(ldrawDir)).filter((n) => /^-?\d+$/.test(n));
  } catch {
    // No images yet.
  }
  const rows: { partNum: string; colorId: number }[] = [];
  for (const c of colors) {
    for (const partNum of await listPartImages(path.join(ldrawDir, c))) {
      rows.push({ partNum, colorId: Number(c) });
    }
  }
  await db.transaction(async (tx) => {
    await tx.delete(catalogPartImages);
    for (let i = 0; i < rows.length; i += PART_IMAGE_BATCH) {
      await tx
        .insert(catalogPartImages)
        .values(rows.slice(i, i + PART_IMAGE_BATCH))
        .onConflictDoNothing();
    }
  });
  return rows.length;
}
