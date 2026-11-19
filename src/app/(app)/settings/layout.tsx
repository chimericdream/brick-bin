import { eq } from 'drizzle-orm';
import { notFound } from 'next/navigation';

import { requireContext } from '@/server/auth/current';
import { households } from '@/server/db/schema';

import { SettingsFrame } from './SettingsFrame';

export const dynamic = 'force-dynamic';

export default async function SettingsLayout({ children }: { children: React.ReactNode }) {
  const { ctx } = await requireContext();
  // Kid profiles have no settings at all.
  if (ctx.viewer.role === 'restricted') notFound();
  // The household name is one row keyed by the session's own household, as in the app layout.
  const [household] = await ctx.db
    .select({ name: households.name })
    .from(households)
    .where(eq(households.id, ctx.householdId));
  return (
    <SettingsFrame admin={ctx.viewer.role === 'admin'} householdName={household?.name ?? ''}>
      {children}
    </SettingsFrame>
  );
}
