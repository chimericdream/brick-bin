import { notFound } from 'next/navigation';

import { requireContext } from '@/server/auth/current';

import { SettingsTabs } from './SettingsTabs';

export const dynamic = 'force-dynamic';

export default async function SettingsLayout({ children }: { children: React.ReactNode }) {
  const { ctx } = await requireContext();
  // Kid profiles have no settings at all.
  if (ctx.viewer.role === 'restricted') notFound();
  return (
    <>
      <h1>Settings</h1>
      <SettingsTabs />
      {children}
    </>
  );
}
