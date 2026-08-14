'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { PrimitiveCard } from '@/components/design/PrimitiveCard';
import { CircuitChipIcon } from '@/components/ui/ElectronicsIcons';

export default function VerifyEmailPage() {
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);
  const [hasSession, setHasSession] = useState(false);

  useEffect(() => {
    async function checkSession() {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (user) {
          // Session active = utilisateur vient de confirmer son email
          setHasSession(true);
          
          // Redirection après 1.5 secondes avec message
          const timer = setTimeout(() => {
            router.push('/dashboard');
          }, 1500);

          return () => clearTimeout(timer);
        } else {
          // Pas de session = utilisateur attend confirmation
          setHasSession(false);
        }
      } catch (error) {
        console.error('Error checking session:', error);
        setHasSession(false);
      } finally {
        setIsChecking(false);
      }
    }

    checkSession();
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-8 text-slate-100">
      <PrimitiveCard tone="floating" className="w-full max-w-lg p-8">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-[1rem] border border-cyan-400/20 bg-cyan-400/10 text-cyan-200">
            <CircuitChipIcon className="h-6 w-6" />
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-cyan-300">
              {isChecking ? 'Vérification' : hasSession ? 'Confirmation' : 'Vérification'}
            </p>
            <h1 className="mt-1 text-2xl font-semibold text-white">
              {isChecking
                ? 'Vérification en cours...'
                : hasSession
                ? 'Email confirmé ! 🎉'
                : 'Vérifiez votre boîte mail'}
            </h1>
          </div>
        </div>

        <p className="mt-6 text-sm leading-7 text-slate-300">
          {isChecking
            ? 'Nous vérifions votre session...'
            : hasSession
            ? 'Votre email a été confirmé avec succès. Redirection vers votre tableau de bord...'
            : 'Un email de confirmation a été envoyé à votre adresse. Ouvrez-le et cliquez sur le lien pour valider votre compte, puis revenez ici pour vous connecter.'}
        </p>
      </PrimitiveCard>
    </div>
  );
}
