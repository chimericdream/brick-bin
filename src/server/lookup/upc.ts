import { decodeHTML } from 'entities';

// UPC_BASE_URL exists so end-to-end tests can point at a mock server.
const BASE = process.env.UPC_BASE_URL ?? 'https://api.upcitemdb.com/prod/trial';

/** Looks up a product title for a barcode via UPCitemdb's free trial endpoint (rate limited). */
export async function lookupUpc(code: string): Promise<string | null> {
  const digits = code.replace(/\D/g, '');
  if (digits.length < 8 || digits.length > 14) return null;
  const res = await fetch(`${BASE}/lookup?upc=${digits}`, {
    headers: { Accept: 'application/json' },
    signal: AbortSignal.timeout(8_000),
  });
  if (!res.ok) return null;
  const data = (await res.json()) as { items?: { title?: string }[] };
  // UPCitemdb titles can carry HTML entities (`Children&#39;s`).
  const title = decodeHTML(data.items?.[0]?.title ?? '').trim();
  return title || null;
}

/**
 * Candidate set numbers in a product title, in order: "LEGO Icons Titanic 10294 Building Kit"
 * gives ["10294"]. Numbers of 4 to 7 digits count; a bare year (1950 to 2039) comes last, because
 * "2024" in a title is more likely a year than a set. The caller checks each against the catalog.
 */
export function extractSetNumbers(title: string): string[] {
  const found = [...title.matchAll(/(?<![\d.,-])(\d{4,7})(?:-\d{1,2})?(?![\d.,])/g)].map(
    (m) => m[1]!,
  );
  const unique = [...new Set(found)];
  const isYear = (n: string) => /^(19[5-9]\d|20[0-3]\d)$/.test(n);
  return [...unique.filter((n) => !isYear(n)), ...unique.filter(isYear)];
}
