import { notFound } from 'next/navigation';

import { Tag } from '@/components/sets/Badges';
import { requireContext } from '@/server/auth/current';
import { listMembers } from '@/server/data/members';

import { PeopleForm } from './PeopleForm';
import classes from '../Settings.module.css';

export const dynamic = 'force-dynamic';

const ROLE: Record<string, { tag: string; line: string }> = {
  admin: { tag: 'Admin', line: 'Adds and edits everything, and manages people and the trash.' },
  member: { tag: 'Member', line: 'Adds and edits sets, copies and wishes.' },
  restricted: {
    tag: 'Kid profile (read-only)',
    line: 'Sees the library and keeps their own wishlist. No prices, no hidden sets.',
  },
};

export default async function PeoplePage() {
  const { ctx } = await requireContext();
  if (ctx.viewer.role === 'restricted') notFound();
  const people = await listMembers(ctx);
  const isAdmin = ctx.viewer.role === 'admin';
  return (
    <div className={classes.stack}>
      <ul className={classes.list}>
        {people.map((p) => (
          <li key={p.id}>
            <span className={classes.who} aria-hidden>
              {p.name.slice(0, 1).toUpperCase()}
            </span>
            <div className={classes.main}>
              <strong>{p.name}</strong>
              <p className={classes.muted}>{ROLE[p.role]?.line}</p>
            </div>
            <Tag variant="quiet">{ROLE[p.role]?.tag}</Tag>
          </li>
        ))}
      </ul>
      {isAdmin ? (
        <section className={classes.section}>
          <PeopleForm />
        </section>
      ) : (
        <p className={classes.muted}>Only admins can add people.</p>
      )}
    </div>
  );
}
