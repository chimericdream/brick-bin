import path from 'node:path';

/** `INSTRUCTIONS_MAX_MB` (default 200): the biggest PDF the app will store. */
export function instructionsMaxBytes(
  env: Record<string, string | undefined> = process.env,
): number {
  const mb = Number(env.INSTRUCTIONS_MAX_MB);
  return (Number.isFinite(mb) && mb > 0 ? mb : 200) * 1_048_576;
}

export const instructionsDataDir = () =>
  path.resolve(/* turbopackIgnore: true */ process.env.DATA_DIR ?? './data');

/** A download name for the Content-Disposition header: ASCII letters, digits and dashes only. */
export function pdfFileName(label: string): string {
  const slug = label
    .normalize('NFKD')
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .slice(0, 80);
  return `${slug || 'instructions'}.pdf`;
}
