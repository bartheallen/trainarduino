'use client';

import { signup } from '@/lib/auth';
import { CircuitAuthForm } from '@/components/auth/CircuitAuthForm';
import { useLocale } from '@/components/i18n/LocaleProvider';

export default function SignupPage() {
  const { locale } = useLocale();
  return <CircuitAuthForm mode="signup" action={(formData) => signup(formData, locale)} />;
}
