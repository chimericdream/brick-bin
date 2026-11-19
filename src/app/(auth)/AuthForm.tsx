'use client';

import { useActionState, useState } from 'react';
import { Button, PasswordInput, TextInput } from '@mantine/core';

import { Note } from '@/components/Note';
import ui from '@/components/ui/ui.module.css';

import type { FormState } from './actions';

interface Props {
  action: (prev: FormState, formData: FormData) => Promise<FormState>;
  mode: 'login' | 'setup';
}

export function AuthForm({ action, mode }: Props) {
  const [state, formAction, pending] = useActionState(action, {});
  // The email stays filled in after a failed attempt; the password is cleared with the form.
  const [email, setEmail] = useState('');
  return (
    <form action={formAction} className={ui.stack}>
      {state.error && <Note variant="error">{state.error}</Note>}
      {mode === 'setup' && (
        <>
          <TextInput
            name="householdName"
            label="Household name"
            placeholder="The Marlowes"
            required
          />
          <TextInput name="name" label="Your name" required />
        </>
      )}
      <TextInput
        name="email"
        type="email"
        label="Email"
        autoComplete="email"
        required
        value={email}
        onChange={(e) => setEmail(e.currentTarget.value)}
      />
      <PasswordInput
        name="password"
        label="Password"
        description={mode === 'setup' ? 'At least 8 characters' : undefined}
        autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
        required
      />
      <Button type="submit" loading={pending} fullWidth>
        {mode === 'login' ? 'Sign in' : 'Create household'}
      </Button>
    </form>
  );
}
