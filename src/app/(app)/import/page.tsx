import { Text, Title } from '@mantine/core';
import { notFound } from 'next/navigation';

import { requireContext } from '@/server/auth/current';

import { ImportForm } from './ImportForm';

export const dynamic = 'force-dynamic';

export default async function ImportPage() {
  const { ctx } = await requireContext();
  if (ctx.viewer.role === 'restricted') notFound();
  return (
    <>
      <Title order={1}>Import</Title>
      <Text c="dimmed" mb="md" maw={760}>
        Bring in a collection from a CSV file: a Rebrickable set list, a Brickset collection export,
        or any spreadsheet with a column of set numbers. You see exactly what will happen before
        anything is saved. LEGO sets are matched against the catalog, so import it first in
        Settings. Cover images are not downloaded during an import; open a set to add one.
      </Text>
      <ImportForm />
    </>
  );
}
