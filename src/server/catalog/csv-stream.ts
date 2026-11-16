/**
 * A streaming CSV reader (RFC 4180): quoted fields, `""` for a literal quote, commas and newlines
 * inside quotes, LF or CRLF line ends. It reads chunks as they arrive, so a 135 MB file never sits
 * in memory. Blank lines are skipped.
 */
export async function* parseCsv(
  chunks: AsyncIterable<Uint8Array | string>,
): AsyncGenerator<string[]> {
  const decoder = new TextDecoder('utf-8');
  let row: string[] = [];
  let field = '';
  let inQuotes = false;
  // A quote seen inside a quoted field might be the first half of `""`, so its meaning waits for
  // the next character, which may be in the next chunk.
  let pendingQuote = false;
  let sawAny = false;
  let first = true;

  const endField = () => {
    row.push(field);
    field = '';
  };

  async function* feed(text: string): AsyncGenerator<string[]> {
    for (let i = 0; i < text.length; i++) {
      const c = text[i]!;
      if (first) {
        first = false;
        if (c === '﻿') continue; // a byte order mark, if some future file has one
      }
      if (pendingQuote) {
        pendingQuote = false;
        if (c === '"') {
          field += '"';
          continue;
        }
        inQuotes = false; // the quote closed the field; fall through to handle `c`
      }
      if (inQuotes) {
        if (c === '"') pendingQuote = true;
        else field += c;
        continue;
      }
      if (c === '"' && field === '') {
        inQuotes = true;
        sawAny = true;
      } else if (c === ',') {
        endField();
        sawAny = true;
      } else if (c === '\n' || c === '\r') {
        if (c === '\r' && text[i + 1] === '\n') i++;
        if (sawAny || field !== '' || row.length > 0) {
          endField();
          yield row;
        }
        row = [];
        sawAny = false;
      } else {
        field += c;
        sawAny = true;
      }
    }
  }

  for await (const chunk of chunks) {
    const text = typeof chunk === 'string' ? chunk : decoder.decode(chunk, { stream: true });
    yield* feed(text);
  }
  yield* feed(decoder.decode());
  if (pendingQuote) {
    pendingQuote = false;
    inQuotes = false;
  }
  if (inQuotes) throw new Error('The file ends inside a quoted field');
  if (sawAny || field !== '' || row.length > 0) {
    endField();
    yield row;
  }
}
