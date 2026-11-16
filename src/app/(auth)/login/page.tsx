import { redirect } from 'next/navigation';

import { needsSetup } from '@/server/auth/accounts';
import { getDb } from '@/server/db/client';

import { loginAction } from '../actions';
import { AuthForm } from '../AuthForm';
import { AuthShell } from '../AuthShell';

export const dynamic = 'force-dynamic';

export default async function LoginPage() {
  if (await needsSetup(getDb())) redirect('/setup');
  return (
    <AuthShell
      title="Welcome back"
      lead="Sign in to your household’s bin."
      footnote="Forgot your password? Ask an admin to set a new one."
    >
      <AuthForm action={loginAction} mode="login" />
    </AuthShell>
  );
}
