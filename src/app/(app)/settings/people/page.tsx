import { notFound } from 'next/navigation';
import { Text } from '@mantine/core';

import { requireContext } from '@/server/auth/current';
import { listMembers } from '@/server/data/members';

import { PeopleForm } from './PeopleForm';
import classes from '../Settings.module.css';

export const dynamic = 'force-dynamic';

const ROLE: Record<string, string> = {
  admin: 'Admin',
  member: 'Member',
  restricted: 'Kid profile (read-only)',
};

export default async function PeoplePage() {
  const { ctx } = await requireContext();
  if (ctx.viewer.role === 'restricted') notFound();
  const people = await listMembers(ctx);
  const isAdmin = ctx.viewer.role === 'admin';
  return (
    <>
      <ul className={classes.list}>
        {people.map((p) => (
          <li key={p.id}>
            <strong>{p.name}</strong>
            <span className={classes.muted}>{ROLE[p.role]}</span>
          </li>
        ))}
      </ul>
      {isAdmin ? (
        <section className={classes.section}>
          <PeopleForm />
        </section>
      ) : (
        <Text c="dimmed" mt="md" size="sm">
          Only admins can add people.
        </Text>
      )}
    </>
  );
}
