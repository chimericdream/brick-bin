import { NotFoundContent } from '@/components/NotFoundContent';
import { getSessionUser } from '@/server/auth/current';

export default async function NotFound() {
  const user = await getSessionUser();
  return <NotFoundContent kid={user?.role === 'restricted'} />;
}
