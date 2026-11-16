import { notFound } from 'next/navigation';

import { requireContext } from '@/server/auth/current';

import { saveSetAction } from '../actions';
import { loadFormOptions } from '../form-options';
import { SetForm } from '../SetForm';

export const dynamic = 'force-dynamic';

export default async function NewSetPage() {
  const { ctx } = await requireContext();
  if (ctx.viewer.role === 'restricted') notFound();
  const options = await loadFormOptions(ctx);
  return (
    <>
      <h1>Add a set</h1>
      <SetForm action={saveSetAction.bind(null, null)} setId={null} {...options} />
    </>
  );
}
