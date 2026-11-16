import { eq } from 'drizzle-orm';

import { requireContext } from '@/server/auth/current';
import { households } from '@/server/db/schema';

import { Shell } from './Shell';

export const dynamic = 'force-dynamic';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { ctx, user } = await requireContext();
  // The household name is one row keyed by the session's own household, so it is read directly.
  const [household] = await ctx.db
    .select({ name: households.name })
    .from(households)
    .where(eq(households.id, ctx.householdId));
  return (
    <Shell user={{ name: user.name, role: user.role }} householdName={household?.name ?? ''}>
      {children}
    </Shell>
  );
}
