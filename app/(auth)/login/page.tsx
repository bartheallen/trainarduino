'use client';

import { signin } from '@/lib/auth';
import { CircuitAuthForm } from '@/components/auth/CircuitAuthForm';
import { useLocale } from '@/components/i18n/LocaleProvider';

export default function LoginPage() {
  const { locale } = useLocale();
  return <CircuitAuthForm mode="login" action={(formData) => signin(formData, locale)} />;
}
