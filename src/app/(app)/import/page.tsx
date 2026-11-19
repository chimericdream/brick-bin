import { notFound } from 'next/navigation';

import { PageHead } from '@/components/layout/PageHead';
import { requireContext } from '@/server/auth/current';

import { ImportForm } from './ImportForm';

export const dynamic = 'force-dynamic';

export default async function ImportPage() {
  const { ctx } = await requireContext();
  if (ctx.viewer.role === 'restricted') notFound();
  return (
    <>
      <PageHead title="Import" sub="Sets from a CSV file" />
      <ImportForm />
    </>
  );
}
