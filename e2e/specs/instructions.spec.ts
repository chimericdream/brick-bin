import { existsSync, readdirSync } from 'node:fs';
import path from 'node:path';

import { DATA_DIR } from '../support/env';
import { expect, test } from '../fixtures';

/** A small but real-looking PDF: the magic bytes, then padding to the size asked for. */
const pdf = (extra = 200, seed = 'a') =>
  Buffer.concat([
    Buffer.from('%PDF-1.4\n'),
    Buffer.from(seed.repeat(extra)),
    Buffer.from('\n%%EOF\n'),
  ]);

const storedFiles = () => {
  const dir = path.join(DATA_DIR, 'instructions');
  if (!existsSync(dir)) return [];
  return readdirSync(dir, { recursive: true })
    .map(String)
    .filter((f) => f.endsWith('.pdf') || f.endsWith('.part'));
};

const openUpload = async (page: import('@playwright/test').Page) => {
  await page.getByRole('button', { name: 'Upload PDF' }).click();
  return page.getByRole('dialog');
};

test.describe('instructions', () => {
  test('INS-01 uploads a PDF, lists it, and serves it inline @smoke', async ({ page, db }) => {
    const id = await db.seedSet({ name: 'Lighthouse', setNumber: '60460' });
    await page.goto(`/sets/${id}`);
    await expect(page.getByText('No instructions saved for this set yet.')).toBeVisible();
    const dialog = await openUpload(page);
    await dialog.locator('input[type=file]').setInputFiles({
      name: 'Harbour_Lighthouse-book-1.pdf',
      mimeType: 'application/pdf',
      buffer: pdf(),
    });
    await expect(dialog.getByLabel('Name')).toHaveValue('Harbour Lighthouse book 1'); // from the file name
    await dialog.getByLabel('Name').fill('Building book 1');
    await dialog.getByRole('button', { name: 'Upload' }).click();

    const row = page.getByRole('listitem').filter({ hasText: 'Building book 1' });
    await expect(row).toBeVisible();
    await expect(row).toContainText('PDF');
    await expect(row).toContainText('KB');
    const [ins] =
      await db.sql`select id, file_path, file_bytes, sha256, kind from set_instructions`;
    expect(ins!.kind).toBe('file');
    expect(Number(ins!.file_bytes)).toBe(pdf().length);
    expect(ins!.sha256).toHaveLength(64);
    expect(existsSync(path.join(DATA_DIR, ins!.file_path as string))).toBe(true);

    const res = await page.request.get(`/api/instructions/${ins!.id}`);
    expect(res.status()).toBe(200);
    expect(res.headers()['content-type']).toBe('application/pdf');
    expect(res.headers()['content-disposition']).toBe('inline; filename="Building-book-1.pdf"');
    expect(res.headers()['accept-ranges']).toBe('bytes');
    expect((await res.body()).subarray(0, 5).toString()).toBe('%PDF-');
    await expect(row.getByRole('link', { name: 'Open' })).toHaveAttribute('target', '_blank');
    expect(await db.count('audit_log', "entity_type = 'instruction'")).toBe(1);
  });

  test('INS-02 refuses a file that is not a PDF, whatever its name or type, and stores nothing', async ({
    page,
    db,
  }) => {
    const id = await db.seedSet({ name: 'Set' });
    await page.goto(`/sets/${id}`);
    const dialog = await openUpload(page);
    await dialog.locator('input[type=file]').setInputFiles({
      name: 'book.pdf',
      mimeType: 'application/pdf',
      buffer: Buffer.from('<html>definitely not a pdf</html>'),
    });
    await dialog.getByLabel('Name').fill('Fake');
    await dialog.getByRole('button', { name: 'Upload' }).click();
    await expect(dialog.getByRole('alert')).toContainText('not a PDF');
    expect(await db.count('set_instructions')).toBe(0);
    expect(storedFiles()).toEqual([]);

    // The same through the API, claiming to be a PDF.
    const res = await page.request.post('/api/instructions/upload', {
      headers: { 'x-set-id': id, 'x-label': 'Fake', 'content-type': 'application/pdf' },
      data: Buffer.from('MZ\x90\x00 an executable'),
    });
    expect(res.status()).toBe(415);
    expect(storedFiles()).toEqual([]);
  });

  test('INS-03 enforces the size limit in the form and on the server', async ({ page, db }) => {
    const id = await db.seedSet({ name: 'Set' });
    await page.goto(`/sets/${id}`);
    const dialog = await openUpload(page);
    await dialog
      .locator('input[type=file]')
      .setInputFiles({ name: 'big.pdf', mimeType: 'application/pdf', buffer: pdf(1_200_000) });
    await dialog.getByLabel('Name').fill('Big');
    await dialog.getByRole('button', { name: 'Upload' }).click();
    await expect(dialog.getByRole('alert')).toContainText('larger than 1 MB');
    expect(await db.count('set_instructions')).toBe(0);

    const res = await page.request.post('/api/instructions/upload', {
      headers: { 'x-set-id': id, 'x-label': 'Big', 'content-type': 'application/pdf' },
      data: pdf(1_200_000),
    });
    expect(res.status()).toBe(413);
    expect(storedFiles()).toEqual([]);
  });

  test('INS-04 the same PDF twice for a set is refused and the first copy keeps working', async ({
    page,
    db,
  }) => {
    const id = await db.seedSet({ name: 'Set' });
    const send = (label: string) =>
      page.request.post('/api/instructions/upload', {
        headers: { 'x-set-id': id, 'x-label': label, 'content-type': 'application/pdf' },
        data: pdf(300, 'z'),
      });
    const first = await send('One');
    expect(first.status()).toBe(201);
    const second = await send('Two');
    expect(second.status()).toBe(409);
    expect((await second.json()).error).toContain('already stored');
    expect(storedFiles()).toHaveLength(1);
    const { id: insId } = await first.json();
    expect((await page.request.get(`/api/instructions/${insId}`)).status()).toBe(200);
    expect(await db.count('set_instructions')).toBe(1);
  });

  test('INS-05 supports byte ranges, so phones can jump to a page', async ({ page, db }) => {
    const id = await db.seedSet({ name: 'Set' });
    const body = pdf(500);
    const created = await page.request.post('/api/instructions/upload', {
      headers: { 'x-set-id': id, 'x-label': 'Book', 'content-type': 'application/pdf' },
      data: body,
    });
    const { id: insId } = await created.json();
    const url = `/api/instructions/${insId}`;

    const part = await page.request.get(url, { headers: { range: 'bytes=0-9' } });
    expect(part.status()).toBe(206);
    expect(part.headers()['content-range']).toBe(`bytes 0-9/${body.length}`);
    expect((await part.body()).toString()).toBe(body.subarray(0, 10).toString());

    const tail = await page.request.get(url, { headers: { range: 'bytes=-7' } });
    expect(tail.status()).toBe(206);
    expect((await tail.body()).toString()).toBe(body.subarray(-7).toString());

    const open = await page.request.get(url, { headers: { range: `bytes=${body.length - 3}-` } });
    expect((await open.body()).length).toBe(3);

    const bad = await page.request.get(url, { headers: { range: `bytes=${body.length + 5}-` } });
    expect(bad.status()).toBe(416);
    expect(bad.headers()['content-range']).toBe(`bytes */${body.length}`);
    const head = await page.request.head(url);
    expect(head.status()).toBe(200);
    expect(head.headers()['accept-ranges']).toBe('bytes');
  });

  test('INS-06 keeps a plain link, and refuses addresses that are not web links', async ({
    page,
    db,
  }) => {
    const id = await db.seedSet({ name: 'Set', brand: 'CaDA' });
    await page.goto(`/sets/${id}`);
    await page.getByRole('button', { name: 'Add link' }).click();
    const dialog = page.getByRole('dialog');
    await dialog.getByLabel('Web address').fill('javascript:alert(1)');
    await dialog.getByLabel('Name').fill('Evil');
    await dialog.getByRole('button', { name: 'Add link' }).click();
    await expect(dialog.getByRole('alert')).toContainText('https://');
    expect(await db.count('set_instructions')).toBe(0);

    await dialog.getByLabel('Web address').fill('https://maker.example/sets/42');
    await dialog.getByLabel('Name').fill("Maker's page");
    await dialog.getByRole('button', { name: 'Add link' }).click();
    const row = page.getByRole('listitem').filter({ hasText: "Maker's page" });
    await expect(row).toContainText('maker.example');
    const visit = row.getByRole('link', { name: 'Visit' });
    await expect(visit).toHaveAttribute('href', 'https://maker.example/sets/42');
    await expect(visit).toHaveAttribute('rel', /noopener/);
    // A link has nothing to serve.
    const [ins] = await db.sql`select id from set_instructions`;
    expect((await page.request.get(`/api/instructions/${ins!.id}`)).status()).toBe(404);
  });

  test('INS-07 saving from a link refuses private, loopback, tailnet and plain-http addresses', async ({
    page,
    db,
  }) => {
    const id = await db.seedSet({ name: 'Set' });
    for (const url of [
      'http://example.com/book.pdf',
      'https://127.0.0.1/book.pdf',
      'https://[::1]/book.pdf',
      'https://10.0.0.5/book.pdf',
      'https://100.88.55.50/book.pdf',
      'https://169.254.169.254/latest/meta-data/',
      'https://localhost/book.pdf',
      'https://example.com:8443/book.pdf',
      'ftp://example.com/book.pdf',
    ]) {
      const res = await page.request.post('/api/instructions/save-link', {
        data: { setId: id, label: 'Book', url },
      });
      expect(res.status(), url).toBe(400);
    }
    expect(await db.count('set_instructions')).toBe(0);
    expect(storedFiles()).toEqual([]);

    // And in the form: the reason is shown.
    await page.goto(`/sets/${id}`);
    await page.getByRole('button', { name: 'Save PDF from a link' }).click();
    const dialog = page.getByRole('dialog');
    await dialog.getByLabel('Address of the PDF').fill('https://100.88.55.50/book.pdf');
    await dialog.getByLabel('Name').fill('Book');
    await dialog.getByRole('button', { name: 'Download and save' }).click();
    await expect(dialog.getByRole('alert')).toContainText('private network');
  });

  test('INS-08 find-on-the-maker links: LEGO.com for LEGO sets, the brand site otherwise', async ({
    page,
    db,
  }) => {
    const lego = await db.seedSet({ name: 'Titanic', setNumber: '10294' });
    await page.goto(`/sets/${lego}`);
    const find = page.getByRole('link', { name: 'Find on LEGO.com' });
    await expect(find).toHaveAttribute(
      'href',
      'https://www.lego.com/service/buildinginstructions/10294',
    );
    await expect(find).toHaveAttribute('target', '_blank');

    const brandId = await db.brandId('Mould King');
    await db.sql`update brands set website_url = 'https://www.mouldking.example' where id = ${brandId}`;
    const other = await db.seedSet({ name: 'Crane', brand: 'Mould King' });
    await page.goto(`/sets/${other}`);
    await expect(page.getByRole('link', { name: 'Find on Mould King site' })).toHaveAttribute(
      'href',
      'https://www.mouldking.example',
    );
    const none = await db.seedSet({ name: 'Plain', brand: 'NoSite' });
    await page.goto(`/sets/${none}`);
    await expect(page.getByRole('link', { name: /^Find on/ })).toHaveCount(0);
  });

  test('INS-09 kids can open instructions to build, but not add, change or see hidden sets’ files', async ({
    kidPage,
    anonPage,
    page,
    db,
  }) => {
    const shown = await db.seedSet({ name: 'Shown' });
    const hidden = await db.seedSet({ name: 'Present', hiddenFromRestricted: true });
    const upload = async (setId: string) =>
      (await (
        await page.request.post('/api/instructions/upload', {
          headers: { 'x-set-id': setId, 'x-label': 'Book', 'content-type': 'application/pdf' },
          data: pdf(100, setId.slice(0, 1)),
        })
      ).json()) as { id: string };
    const a = await upload(shown);
    const b = await upload(hidden);

    await kidPage.goto(`/sets/${shown}`);
    await expect(kidPage.getByRole('link', { name: 'Open' })).toBeVisible();
    for (const name of ['Upload PDF', 'Add link', 'Save PDF from a link', 'Remove']) {
      await expect(kidPage.getByRole('button', { name })).toHaveCount(0);
    }
    expect((await kidPage.request.get(`/api/instructions/${a.id}`)).status()).toBe(200);
    expect((await kidPage.request.get(`/api/instructions/${b.id}`)).status()).toBe(404);
    expect(
      (
        await kidPage.request.post('/api/instructions/upload', {
          headers: { 'x-set-id': shown, 'x-label': 'x' },
          data: pdf(),
        })
      ).status(),
    ).toBe(403);
    expect(
      (
        await kidPage.request.post('/api/instructions/save-link', {
          data: { setId: shown, label: 'x', url: 'https://example.com/a.pdf' },
        })
      ).status(),
    ).toBe(403);
    expect((await anonPage.request.get(`/api/instructions/${a.id}`)).status()).toBe(401);
    expect(
      (
        await anonPage.request.post('/api/instructions/upload', {
          headers: { 'x-set-id': shown, 'x-label': 'x' },
          data: pdf(),
        })
      ).status(),
    ).toBe(401);
  });

  test('INS-10 removing sends it to the trash; restoring brings it back; deleting for good removes the file', async ({
    page,
    db,
  }) => {
    const id = await db.seedSet({ name: 'Booked' });
    await page.request.post('/api/instructions/upload', {
      headers: { 'x-set-id': id, 'x-label': 'Book', 'content-type': 'application/pdf' },
      data: pdf(),
    });
    expect(storedFiles()).toHaveLength(1);
    await page.goto(`/sets/${id}`);
    await page.getByRole('button', { name: 'Remove', exact: true }).click();
    await page.getByRole('button', { name: 'Move to trash' }).click();
    await expect(page.getByText('No instructions saved for this set yet.')).toBeVisible();
    expect(storedFiles()).toHaveLength(1); // still on disk, in the trash

    await page.goto('/settings/trash');
    const row = page.getByRole('listitem').filter({ hasText: 'Instructions · Booked' });
    await row.getByRole('button', { name: 'Restore' }).click();
    await expect(row).toHaveCount(0);
    await page.goto(`/sets/${id}`);
    await expect(
      page
        .getByRole('region', { name: /Instructions/ })
        .getByRole('listitem')
        .filter({ hasText: 'Book' }),
    ).toBeVisible();

    await page.getByRole('button', { name: 'Remove', exact: true }).click();
    await page.getByRole('button', { name: 'Move to trash' }).click();
    await expect(page.getByText('No instructions saved for this set yet.')).toBeVisible();
    await page.goto('/settings/trash');
    const gone = page.getByRole('listitem').filter({ hasText: 'Instructions · Booked' });
    await gone.getByRole('button', { name: 'Delete for good' }).click();
    await page.getByRole('dialog').getByRole('button', { name: 'Delete for good' }).click();
    await expect(gone).toHaveCount(0);
    await expect.poll(storedFiles).toEqual([]);
    expect(await db.count('set_instructions')).toBe(0);
  });

  test('INS-11 deleting a set for good removes its stored PDFs', async ({ page, db }) => {
    const id = await db.seedSet({ name: 'Doomed', copies: [] });
    await page.request.post('/api/instructions/upload', {
      headers: { 'x-set-id': id, 'x-label': 'Book', 'content-type': 'application/pdf' },
      data: pdf(),
    });
    expect(storedFiles()).toHaveLength(1);
    await page.goto(`/sets/${id}`);
    await page.getByRole('button', { name: 'Delete set' }).click();
    await page.getByRole('button', { name: 'Move to trash' }).click();
    await expect(page).toHaveURL(/\/sets$/);
    await page.goto('/settings/trash');
    const row = page.getByRole('listitem').filter({ hasText: 'Doomed' });
    await row.getByRole('button', { name: 'Delete for good' }).click();
    await page.getByRole('dialog').getByRole('button', { name: 'Delete for good' }).click();
    await expect(row).toHaveCount(0);
    await expect.poll(storedFiles).toEqual([]);
  });

  test('INS-12 reorders instructions, and the library can filter to sets that have them', async ({
    page,
    db,
  }) => {
    const withBooks = await db.seedSet({ name: 'With books' });
    await db.seedSet({ name: 'No books' });
    for (const label of ['First', 'Second']) {
      await page.request.post('/api/instructions/upload', {
        headers: { 'x-set-id': withBooks, 'x-label': label, 'content-type': 'application/pdf' },
        data: pdf(100, label),
      });
    }
    await page.goto(`/sets/${withBooks}`);
    const labels = () =>
      page
        .locator('ul > li')
        .filter({ has: page.getByRole('link', { name: 'Open' }) })
        .locator('p')
        .filter({ hasText: /^(First|Second)$/ })
        .allTextContents();
    await expect.poll(labels).toEqual(['First', 'Second']);
    await page.getByRole('button', { name: 'Move Second up' }).click();
    await expect.poll(labels).toEqual(['Second', 'First']);
    await expect(page.getByRole('button', { name: 'Move Second up' })).toBeDisabled();

    await page.goto('/sets');
    const panel = page.getByRole('complementary', { name: 'Filters' });
    await expect(panel.getByRole('link', { name: /^Has instructions\s*1$/ })).toBeVisible();
    await panel.getByRole('link', { name: /^Has instructions/ }).click();
    await expect(page).toHaveURL(/ins=1/);
    await expect(page.getByText('With books')).toBeVisible();
    await expect(page.getByText('No books')).toHaveCount(0);
  });
});
