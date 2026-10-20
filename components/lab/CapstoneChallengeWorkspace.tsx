'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CodeEditor } from '@/components/lab/CodeEditor';
import { CodeReviewPanel, type CodeReviewResult } from '@/components/lab/CodeReviewPanel';
import { WokwiEmbed } from '@/components/lab/WokwiEmbed';
import { PrimitiveBadge } from '@/components/design/PrimitiveBadge';
import { PrimitiveCard } from '@/components/design/PrimitiveCard';
import type { Exercise } from '@/lib/types';

export function CapstoneChallengeWorkspace({ challenge }: { challenge: Exercise }) {
  const router = useRouter();
  const [code, setCode] = useState('');
  const [review, setReview] = useState<CodeReviewResult | null>(null);
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState<string | null>(null);

  async function validateChallenge() {
    if (!code.trim() || !review?.correct) {
      setStatus('error');
      setMessage('Faites corriger votre code par l’IA et corrigez les points signalés avant la validation.');
      return;
    }
    setStatus('loading');
    setMessage(null);
    try {
      const response = await fetch('/api/validate-practical', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ exerciseId: challenge.id, code, codeReview: review }),
      });
      const result = await response.json() as { statut?: string; xpAwarded?: number; error?: string };
      if (!response.ok) throw new Error(result.error ?? 'La validation a échoué.');
      if (result.statut !== 'approved') throw new Error('Le défi n’est pas encore validé.');
      setStatus('success');
      setMessage(`Défi validé. +${result.xpAwarded ?? challenge.xp_recompense} XP gagnés. Le prochain module est maintenant disponible.`);
      router.refresh();
    } catch (error) {
      setStatus('error');
      setMessage(error instanceof Error ? error.message : 'La validation a échoué.');
    }
  }

  return (
    <div className="grid min-w-0 gap-4 lg:grid-cols-[0.9fr_1.1fr]">
      <div className="min-w-0 space-y-4">
        <PrimitiveCard tone="glass" className="p-5">
          <div className="flex items-center justify-between gap-3"><p className="text-xs font-semibold uppercase tracking-[0.25em] text-cyan-300">Situation</p><PrimitiveBadge tone="accent">+{challenge.xp_recompense} XP</PrimitiveBadge></div>
          <p className="mt-4 whitespace-pre-line break-words text-sm leading-7 text-slate-200">{challenge.enonce}</p>
          <div className="mt-5 rounded-2xl border border-amber-400/20 bg-amber-400/10 p-4 text-sm text-amber-100"><p className="font-semibold">Contraintes</p><p className="mt-2 leading-6">{challenge.critere_correction}</p></div>
          {challenge.circuit_instructions && <p className="mt-4 text-sm leading-6 text-slate-400"><span className="font-semibold text-slate-200">Montage :</span> {challenge.circuit_instructions}</p>}
        </PrimitiveCard>
        <WokwiEmbed wokwiUrl={challenge.wokwi_project_url} />
      </div>
      <div className="min-w-0 space-y-4">
        <PrimitiveCard tone="raised" className="min-w-0 p-4"><p className="text-xs font-semibold uppercase tracking-[0.25em] text-cyan-300">Éditeur Arduino</p><div className="mt-3 overflow-hidden rounded-2xl border border-white/10 bg-slate-950/80 p-2"><CodeEditor value={code} onChange={setCode} /></div></PrimitiveCard>
        <CodeReviewPanel code={code} exerciseTitre={challenge.titre} exerciseEnonce={`${challenge.enonce}\nContraintes : ${challenge.critere_correction}`} onResult={setReview} />
        <PrimitiveCard tone="glass" className="p-4"><button type="button" onClick={validateChallenge} disabled={status === 'loading'} className="w-full rounded-xl bg-cyan-400 px-4 py-3 text-sm font-semibold text-slate-950 disabled:cursor-not-allowed disabled:opacity-60">{status === 'loading' ? 'Validation en cours…' : 'Valider le défi et gagner mes XP'}</button>{message && <p className={`mt-3 rounded-xl border p-3 text-sm leading-6 ${status === 'success' ? 'border-emerald-400/20 bg-emerald-400/10 text-emerald-100' : 'border-amber-400/20 bg-amber-400/10 text-amber-100'}`}>{message}</p>}</PrimitiveCard>
      </div>
    </div>
  );
}
