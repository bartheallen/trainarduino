'use client';

import { startTransition, useActionState } from 'react';
import { useDictionary } from '@/components/i18n/LocaleProvider';
import { saveSettingsAction, type SettingsActionState } from './actions';

interface SettingsFormProps {
  profile: {
    username: string;
    display_name?: string | null;
  };
}

const initialState: SettingsActionState = { ok: false, message: '' };

export function SettingsForm({ profile }: SettingsFormProps) {
  const dict = useDictionary();
  const [state, formAction, isPending] = useActionState(saveSettingsAction, initialState);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    formData.set('username', String(formData.get('username') || '').trim());
    formData.set('display_name', String(formData.get('display_name') || '').trim());
    startTransition(() => formAction(formData));
  }

  return (
    <form onSubmit={handleSubmit} className="mt-6 space-y-5">
      <label className="block text-sm">
        {dict.settings.username}
        <input
          required
          minLength={3}
          maxLength={30}
          name="username"
          defaultValue={profile.username}
          aria-invalid={Boolean(state.fieldErrors?.username)}
          aria-describedby={state.fieldErrors?.username ? 'settings-username-error' : undefined}
          className="mt-2 w-full rounded-xl border border-white/10 bg-slate-950/70 px-3 py-3 outline-none focus:border-cyan-300"
        />
        {state.fieldErrors?.username && (
          <span id="settings-username-error" className="mt-1 block text-sm text-rose-300">
            {state.fieldErrors.username}
          </span>
        )}
      </label>

      <label className="block text-sm">
        {dict.settings.displayName}
        <input
          name="display_name"
          defaultValue={profile.display_name ?? ''}
          aria-invalid={Boolean(state.fieldErrors?.display_name)}
          aria-describedby={state.fieldErrors?.display_name ? 'settings-display-name-error' : undefined}
          className="mt-2 w-full rounded-xl border border-white/10 bg-slate-950/70 px-3 py-3 outline-none focus:border-cyan-300"
        />
        {state.fieldErrors?.display_name && (
          <span id="settings-display-name-error" className="mt-1 block text-sm text-rose-300">
            {state.fieldErrors.display_name}
          </span>
        )}
      </label>

      {state.message && (
        <div role="status" aria-live="polite" className={state.ok ? 'text-sm text-emerald-300' : 'text-sm text-rose-300'}>
          {state.message}
        </div>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="w-full rounded-xl bg-gradient-to-r from-cyan-300 to-blue-500 py-3 font-semibold text-slate-950 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isPending ? dict.settings.saving : dict.settings.save}
      </button>
    </form>
  );
}