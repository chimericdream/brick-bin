import { describe, expect, it } from 'vitest';

import { parseCsv } from './csv-stream';

async function* chunked(text: string, size: number): AsyncGenerator<Uint8Array> {
  const bytes = new TextEncoder().encode(text);
  for (let i = 0; i < bytes.length; i += size) yield bytes.subarray(i, i + size);
}

const read = async (text: string, size = 1_000_000) => {
  const out: string[][] = [];
  for await (const row of parseCsv(chunked(text, size))) out.push(row);
  return out;
};

describe('parseCsv', () => {
  it('reads plain rows and keeps empty fields', async () => {
    expect(await read('a,b,c\n1,,3\n')).toEqual([
      ['a', 'b', 'c'],
      ['1', '', '3'],
    ]);
  });

  it('handles quoted commas, doubled quotes and newlines inside quotes', async () => {
    const csv = 'id,name\n1,"Barn, Tractor & Farm"\n2,"He said ""hi"""\n3,"two\nlines"\n';
    expect(await read(csv)).toEqual([
      ['id', 'name'],
      ['1', 'Barn, Tractor & Farm'],
      ['2', 'He said "hi"'],
      ['3', 'two\nlines'],
    ]);
  });

  it('accepts CRLF, a missing final newline and blank lines', async () => {
    expect(await read('a,b\r\n1,2\r\n\r\n3,4')).toEqual([
      ['a', 'b'],
      ['1', '2'],
      ['3', '4'],
    ]);
  });

  it('gives the same rows whatever the chunk size, even when a chunk splits a quote pair or a character', async () => {
    const csv = 'x,y\n1,"a ""q"" b, é"\n2,"日本語",z\n';
    const whole = await read(csv);
    for (const size of [1, 2, 3, 5, 7]) expect(await read(csv, size)).toEqual(whole);
  });

  it('strips a byte order mark and rejects an unterminated quote', async () => {
    expect(await read('﻿a,b\n1,2\n')).toEqual([
      ['a', 'b'],
      ['1', '2'],
    ]);
    await expect(read('a\n"never closed')).rejects.toThrow(/quoted field/);
  });

  it('reads a field that is just an empty quoted string', async () => {
    expect(await read('a,b\n"",x\n')).toEqual([
      ['a', 'b'],
      ['', 'x'],
    ]);
  });
});
