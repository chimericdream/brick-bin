'use client';

import { useActionState, useState, useTransition } from 'react';
import { Button, Select, TextInput } from '@mantine/core';

import { ConfirmDelete } from '@/components/ConfirmDelete';
import { Note } from '@/components/Note';

import type { FormState } from './actions';
import classes from './Settings.module.css';

type Action = (prev: FormState, fd: FormData) => Promise<FormState>;
interface Option {
  value: string;
  label: string;
}

/** A name field with an optional parent picker and a submit button; clears itself after saving. */
export function NameForm({
  action,
  label,
  placeholder,
  submit,
  parents,
  parentLabel = 'Inside',
  defaults,
  extra,
}: {
  action: Action;
  label: string;
  placeholder?: string;
  submit: string;
  parents?: Option[];
  parentLabel?: string;
  defaults?: { name?: string; parentId?: string | null };
  /** Extra text fields, as [name, label] pairs. */
  extra?: [string, string, string?][];
}) {
  const [nonce, setNonce] = useState(0);
  const [state, formAction, pending] = useActionState(async (prev: FormState, fd: FormData) => {
    const result = await action(prev, fd);
    if (result.ok && !defaults) setNonce((n) => n + 1);
    return result;
  }, {});
  return (
    <form action={formAction} key={nonce} className={classes.form}>
      {state.error && <Note variant="error">{state.error}</Note>}
      <div className={classes.addRow}>
        <TextInput
          name="name"
          label={label}
          placeholder={placeholder}
          defaultValue={defaults?.name ?? ''}
          required
        />
        {extra?.map(([name, text, value]) => (
          <TextInput key={name} name={name} label={text} defaultValue={value ?? ''} />
        ))}
        {parents && (
          <Select
            name="parentId"
            label={parentLabel}
            placeholder="Top level"
            data={parents}
            defaultValue={defaults?.parentId ?? null}
            searchable
            clearable
          />
        )}
        <Button type="submit" loading={pending} variant={defaults ? 'default' : undefined}>
          {submit}
        </Button>
      </div>
    </form>
  );
}

/** A delete button that asks first and shows why a delete was refused. */
export function DeleteWithGuard({
  title,
  triggerLabel,
  action,
  children,
  confirmLabel,
  name,
}: {
  title: string;
  triggerLabel: string;
  /** What is deleted, so the button's name says it ("Delete Shelf 2"). */
  name?: string;
  action: () => Promise<FormState>;
  children: React.ReactNode;
  confirmLabel?: string;
}) {
  return (
    <ConfirmDelete
      title={title}
      triggerLabel={name ? `${triggerLabel} ${name}` : triggerLabel}
      triggerText={name ? triggerLabel : undefined}
      compact
      confirmLabel={confirmLabel}
      action={async () => {
        const r = await action();
        return r.error ? { error: r.error } : undefined;
      }}
    >
      {children}
    </ConfirmDelete>
  );
}

/** One-shot action button (restore and similar) that reports an error inline. */
export function ActionButton({
  action,
  children,
  variant = 'default',
  color,
}: {
  action: () => Promise<FormState>;
  children: React.ReactNode;
  variant?: 'default' | 'subtle' | 'filled';
  color?: string;
}) {
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  return (
    <>
      <Button
        size="compact-md"
        variant={variant}
        color={color}
        loading={pending}
        onClick={() =>
          start(async () => {
            const r = await action();
            setError(r.error ?? null);
          })
        }
      >
        {children}
      </Button>
      {error && <Note variant="error">{error}</Note>}
    </>
  );
}

/** Moves every set from one theme into another, then removes the first. */
export function MergeThemesForm({ action, themes }: { action: Action; themes: Option[] }) {
  const [state, formAction, pending] = useActionState(action, {});
  return (
    <form action={formAction} className={classes.form}>
      {state.error && <Note variant="error">{state.error}</Note>}
      {state.ok && (
        <p role="status" className={classes.ok}>
          Merged.
        </p>
      )}
      <div className={classes.addRow}>
        <Select name="fromId" label="Merge this theme" data={themes} searchable required />
        <Select name="intoId" label="Into" data={themes} searchable required />
        <Button type="submit" loading={pending} variant="default">
          Merge
        </Button>
      </div>
    </form>
  );
}
