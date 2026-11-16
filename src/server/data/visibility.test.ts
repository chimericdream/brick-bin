import { describe, expect, it } from 'vitest';

import type { DataContext } from './context';
import { assertAdmin, assertCanWrite, assertNotRestricted } from './visibility';

const as = (role: 'admin' | 'member' | 'restricted') =>
  ({
    viewer: { kind: 'user', userId: 'u', role },
  }) as Pick<DataContext, 'viewer'>;

describe('role guards', () => {
  it('lets members and admins write but not restricted profiles', () => {
    expect(() => assertCanWrite(as('admin'))).not.toThrow();
    expect(() => assertCanWrite(as('member'))).not.toThrow();
    expect(() => assertCanWrite(as('restricted'))).toThrow(/cannot make changes/);
  });

  it('only admins pass assertAdmin', () => {
    expect(() => assertAdmin(as('admin'))).not.toThrow();
    expect(() => assertAdmin(as('member'))).toThrow();
    expect(() => assertAdmin(as('restricted'))).toThrow();
  });

  it('assertNotRestricted names what is hidden', () => {
    expect(() => assertNotRestricted(as('restricted'), 'the collection value')).toThrow(
      /collection value/,
    );
    expect(() => assertNotRestricted(as('member'), 'x')).not.toThrow();
  });
});
