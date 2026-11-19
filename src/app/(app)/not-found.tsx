import { NotFoundContent } from '@/components/NotFoundContent';
import { getSessionUser } from '@/server/auth/current';

/** Inside the app shell, so it must not add a second `<main>`. */
export default async function AppNotFound() {
  const user = await getSessionUser();
  return <NotFoundContent inShell kid={user?.role === 'restricted'} />;
}
