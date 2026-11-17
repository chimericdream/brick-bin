import { eq } from 'drizzle-orm';

import type { Db } from '../db/client';
import { setInstructions } from '../db/schema';

/** True if any instruction row, live or trashed, points at this stored file. */
export async function instructionFileInUse(db: Db, relPath: string): Promise<boolean> {
  const [row] = await db
    .select({ id: setInstructions.id })
    .from(setInstructions)
    .where(eq(setInstructions.filePath, relPath))
    .limit(1);
  return row !== undefined;
}
