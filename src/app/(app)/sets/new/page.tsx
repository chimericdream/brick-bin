import { notFound } from 'next/navigation';

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
      <h1>Add a set</h1>
      <SetForm action={saveSetAction.bind(null, null)} setId={null} {...options} lookup={lookup} />
    </>
  );
}
