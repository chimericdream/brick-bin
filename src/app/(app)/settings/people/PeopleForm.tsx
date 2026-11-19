'use client';

import { useActionState, useState } from 'react';
import { Button, PasswordInput, Select, TextInput } from '@mantine/core';

import { Note } from '@/components/Note';
import ui from '@/components/ui/ui.module.css';

import { createUserAction, type FormState } from '../actions';

export function PeopleForm() {
  const [nonce, setNonce] = useState(0);
  const [state, formAction, pending] = useActionState(async (prev: FormState, fd: FormData) => {
    const result = await createUserAction(prev, fd);
    if (result.ok) setNonce((n) => n + 1);
    return result;
  }, {});
  return (
    <form action={formAction} key={nonce} className={`${ui.panel} ${ui.pad}`}>
      <div className={ui.panelHead}>
        <h2>Add a person</h2>
      </div>
      {state.error && <Note variant="error">{state.error}</Note>}
      {state.ok && (
        <div role="status">
          <Note>Added. Give them the password you set; they can sign in right away.</Note>
        </div>
      )}
      <div className={ui.row2}>
        <TextInput name="name" label="Name" required />
        <TextInput name="email" type="email" label="Email" required />
        <PasswordInput
          name="password"
          label="Password"
          description="At least 8 characters"
          required
          autoComplete="new-password"
        />
        <Select
          name="role"
          label="Role"
          allowDeselect={false}
          defaultValue="member"
          data={[
            { value: 'member', label: 'Member: can add and edit' },
            { value: 'restricted', label: 'Kid profile: read-only, own wishlist' },
            { value: 'admin', label: 'Admin: also manages people and trash' },
          ]}
        />
      </div>
      <div>
        <Button type="submit" loading={pending}>
          Add person
        </Button>
      </div>
    </form>
  );
}
