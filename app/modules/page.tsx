import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { getModules, getUserProgress, getPositioningTestResult } from '@/lib/db';
import { PlanetCarousel } from '@/components/modules/PlanetCarousel';
import { getModuleAccessState } from '@/lib/services/moduleAccessService';

export default async function ModulesPage() {
  const user = await getCurrentUser('modules');
  if (!user) redirect('/login');

  const [modules, progress, placement] = await Promise.all([
    getModules(),
    getUserProgress(user.id),
    getPositioningTestResult(user.id),
  ]);

  const cards = modules.map((module, index) => {
    const state = getModuleAccessState(module, index, modules, progress, placement);
    const href = module.is_capstone ? `/challenges/${module.id}` : `/modules/${module.id}`;

    return {
      id: module.id,
      ordre: module.ordre,
      titre: module.titre,
      description: module.description,
      state,
      href,
      isCapstone: Boolean(module.is_capstone),
    };
  });

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col justify-center">
      <header className="text-center">
        <p className="text-xs font-semibold uppercase tracking-[.3em] text-cyan-300">Parcours Arduino</p>
        <h1 className="mt-2 text-2xl font-semibold text-white sm:text-3xl">Vos modules</h1>
        <p className="mt-2 text-sm leading-6 text-slate-400">Chaque dossier révèle une nouvelle étape de votre parcours.</p>
      </header>

      <section className="mt-5 min-h-0">
        <PlanetCarousel cards={cards} />
      </section>
    </div>
  );
}
