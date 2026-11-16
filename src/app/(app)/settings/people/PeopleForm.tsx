'use client';

import { useActionState, useState } from 'react';
import {
  Alert,
  Button,
  PasswordInput,
  Select,
  SimpleGrid,
  Stack,
  TextInput,
  Title,
} from '@mantine/core';

import { createUserAction, type FormState } from '../actions';

export function PeopleForm() {
  const [nonce, setNonce] = useState(0);
  const [state, formAction, pending] = useActionState(async (prev: FormState, fd: FormData) => {
    const result = await createUserAction(prev, fd);
    if (result.ok) setNonce((n) => n + 1);
    return result;
  }, {});
  return (
    <form action={formAction} key={nonce}>
      <Stack gap="sm" maw={560}>
        <Title order={2} size="h3">
          Add a person
        </Title>
        {state.error && (
          <Alert color="red" variant="light" role="alert">
            {state.error}
          </Alert>
        )}
        {state.ok && (
          <Alert color="green" variant="light">
            Added. Give them the password you set; they can sign in right away.
          </Alert>
        )}
        <SimpleGrid cols={{ base: 1, sm: 2 }}>
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
        </SimpleGrid>
        <Button type="submit" loading={pending} w="fit-content">
          Add person
        </Button>
      </Stack>
    </form>
  );
}
