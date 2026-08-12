import { PrimitiveCard } from '@/components/design/PrimitiveCard';
import { CircuitChipIcon } from '@/components/ui/ElectronicsIcons';

export default function VerifyEmailPage() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-8 text-slate-100">
      <PrimitiveCard tone="floating" className="w-full max-w-lg p-8">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-[1rem] border border-cyan-400/20 bg-cyan-400/10 text-cyan-200">
            <CircuitChipIcon className="h-6 w-6" />
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-cyan-300">Vérification</p>
            <h1 className="mt-1 text-2xl font-semibold text-white">Vérifiez votre boîte mail</h1>
          </div>
        </div>

        <p className="mt-6 text-sm leading-7 text-slate-300">
          Un email de confirmation a été envoyé à votre adresse. Ouvrez-le et cliquez sur le lien pour valider votre compte, puis revenez ici pour vous connecter.
        </p>
      </PrimitiveCard>
    </div>
  );
}
