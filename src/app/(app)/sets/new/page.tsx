import { notFound } from 'next/navigation';

import { PageHead } from '@/components/layout/PageHead';
import { requireContext } from '@/server/auth/current';

import { saveSetAction } from '../actions';
import { loadFormOptions, loadLookup } from '../form-options';
import { SetForm } from '../SetForm';

export const dynamic = 'force-dynamic';

export default async function NewSetPage() {
  const { ctx } = await requireContext();
  if (ctx.viewer.role === 'restricted') notFound();
  const [options, lookup] = await Promise.all([loadFormOptions(ctx), loadLookup(ctx)]);
  return (
    <>
      <PageHead
        crumbs={[{ label: 'Library', href: '/sets' }]}
        title="Add a set"
        sub="Look it up, or type it in. One form covers the design and the box."
      />
      <SetForm action={saveSetAction.bind(null, null)} setId={null} {...options} lookup={lookup} />
    </>
  );
}
