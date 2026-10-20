'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { ArduinoLedLoader } from '@/components/ui/ArduinoBoardVisual';
import { useDictionary } from '@/components/i18n/LocaleProvider';
import { GoogleAuthButton } from './GoogleAuthButton';

type Mode = 'login' | 'signup';

export function CircuitAuthForm({ mode, action }: { mode: Mode; action: (data: FormData) => Promise<{ error?: string } | void> }) {
  const dict = useDictionary();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [values, setValues] = useState({ username: '', email: '', password: '' });
  const [dodges, setDodges] = useState(0);
  const valid = useMemo(() => values.email.includes('@') && values.password.length >= 8 && (mode === 'login' || values.username.trim().length >= 3), [values, mode]);
  const isSignup = mode === 'signup';

  async function submit(data: FormData) {
    setLoading(true);
    setError(null);
    const result = await action(data);
    if (result && result.error) {
      setError(result.error);
      setLoading(false);
    }
  }

  function nudge() {
    if (!valid && !loading) {
      setDodges((x) => x + 1);
      setError(dict.auth.invalidCircuit);
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: isSignup ? 34 : -34 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ type: 'spring', damping: 23 }}
      className="relative w-full min-w-0 max-w-md overflow-hidden rounded-[2rem] border border-cyan-300/15 bg-slate-900/90 p-5 shadow-[0_24px_70px_rgba(2,6,23,.45)] backdrop-blur-xl sm:p-7"
    >
      <div className="pointer-events-none absolute -right-12 -top-12 h-32 w-32 rounded-full border-[18px] border-cyan-300/10" />
      <div className="relative">
        <p className="text-xs font-semibold uppercase tracking-[.28em] text-cyan-300">{dict.auth.accessLabel}</p>
        <h1 className="mt-2 text-2xl font-bold text-white">{isSignup ? dict.auth.signupTitle : dict.auth.loginTitle}</h1>
        <p className="mt-2 text-sm text-slate-400">{isSignup ? dict.auth.signupDescription : dict.auth.loginDescription}</p>
      </div>

      {loading ? (
        <div className="mt-6">
          <ArduinoLedLoader label={isSignup ? dict.auth.profileInitializing : dict.auth.connectingCircuit} />
        </div>
      ) : (
        <form action={submit} className="relative mt-6 space-y-4">
          {error && <p role="alert" className="rounded-xl border border-rose-400/20 bg-rose-400/10 p-3 text-xs text-rose-100">{error}</p>}

          {isSignup && (
            <Field
              label={dict.auth.username}
              name="username"
              value={values.username}
              onChange={(username) => setValues((prev) => ({ ...prev, username }))}
              placeholder={dict.auth.usernamePlaceholder}
            />
          )}

          <Field
            label={dict.auth.email}
            name="email"
            type="email"
            value={values.email}
            onChange={(email) => setValues((prev) => ({ ...prev, email }))}
            placeholder={dict.auth.emailPlaceholder}
          />

          <Field
            label={dict.auth.password}
            name="password"
            type="password"
            value={values.password}
            onChange={(password) => setValues((prev) => ({ ...prev, password }))}
            placeholder={dict.auth.passwordPlaceholder}
          />

          <motion.div
            animate={valid || loading ? { x: 0 } : { x: [0, dodges % 3 === 0 ? 14 : -14, 0] }}
            transition={{ duration: 0.25 }}
            onPointerEnter={nudge}
            onTouchStart={nudge}
            className="relative"
          >
            <button
              type="submit"
              disabled={!valid || loading}
              aria-disabled={!valid || loading}
              onClick={(event) => {
                if (!valid) {
                  event.preventDefault();
                  nudge();
                }
              }}
              className={`relative w-full overflow-hidden rounded-xl border border-cyan-300/30 bg-gradient-to-r from-cyan-300 to-blue-500 py-3 font-semibold text-slate-950 shadow-[0_14px_40px_rgba(50,231,255,.2)] transition duration-200 ${
                !valid ? 'cursor-not-allowed opacity-80' : 'hover:brightness-110'
              } disabled:cursor-not-allowed disabled:opacity-80`}
            >
              <span className="relative z-10 inline-flex items-center justify-center gap-2">
                {!valid && !loading && <span className="inline-block h-2.5 w-2.5 rounded-full bg-slate-900/80" />}
                {loading ? dict.auth.loading : isSignup ? dict.auth.createAccount : dict.auth.connect}
              </span>
              {!valid && !loading && (
                <span className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(255,255,255,0.2),_transparent_35%)]" />
              )}
            </button>
          </motion.div>
        </form>
      )}

      {!loading && (
        <>
          <div className="my-5 flex items-center gap-3">
            <i className="h-px flex-1 bg-white/10" />
            <span className="text-xs text-slate-500">{dict.auth.or}</span>
            <i className="h-px flex-1 bg-white/10" />
          </div>
          <GoogleAuthButton mode={isSignup ? 'signup' : 'signin'} />
          <p className="mt-5 text-center text-xs text-slate-300">
            {isSignup ? dict.auth.alreadyAccount : dict.auth.newHere}{' '}
            <Link href={isSignup ? '/login' : '/signup'} className="font-semibold text-cyan-300 hover:underline">
              {isSignup ? dict.auth.connect : dict.auth.signupLink}
            </Link>
          </p>
          {!isSignup && (
            <p className="mt-3 text-center text-xs">
              <Link href="/forgot-password" className="text-slate-400 hover:text-cyan-200">
                {dict.auth.forgotPassword}
              </Link>
            </p>
          )}
        </>
      )}
    </motion.div>
  );
}

function Field({
  label,
  name,
  type = 'text',
  value,
  onChange,
  placeholder,
}: {
  label: string;
  name: string;
  type?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  return (
    <label className="block text-sm font-medium text-slate-200">
      <span className="mb-2 block">{label}</span>
      <input
        required
        name={name}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl border border-white/10 bg-slate-950/70 px-3.5 py-3 text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-cyan-300 focus:ring-2 focus:ring-cyan-300/15"
      />
    </label>
  );
}
