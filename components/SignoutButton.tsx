'use client';

import { signout } from '@/lib/auth';
import { useTransition } from 'react';

export function SignoutButton() {
  const [isPending, startTransition] = useTransition();

  const handleSignout = () => {
    startTransition(() => {
      signout();
    });
  };

  return (
    <button
      onClick={handleSignout}
      disabled={isPending}
      className="text-red-600 hover:text-red-700 disabled:opacity-50"
    >
      {isPending ? 'Logging out...' : 'Logout'}
    </button>
  );
}
