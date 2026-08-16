import Link from 'next/link';
import { getCurrentUser } from '@/lib/auth';
import { getCourseContent } from '@/lib/repositories/learningRepository';
import { createModulePageErrorState } from '@/lib/modulePageState';
import { EngineeringLabWorkspace } from '@/components/lab/EngineeringLabWorkspace';
import { getModuleProgress } from '@/lib/db';

export default async function ModulePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getCurrentUser('module');
  const { id } = await params;
  const moduleId = Number(id);

  const errorState = createModulePageErrorState({
    user,
    id,
    moduleId: Number.isNaN(moduleId) ? undefined : moduleId,
  });

  if (errorState) {
    console.error('[module-page] error state', {
      userId: user?.id ?? null,
      requestedId: id,
      moduleId,
      errorState,
    });

    return (
      <div className="min-h-screen min-w-0 bg-[radial-gradient(circle_at_top_left,_rgba(34,211,238,0.12),_transparent_30%),linear-gradient(135deg,_#071016_0%,_#0d1b23_100%)] px-4 py-8 text-slate-100 sm:px-6 lg:px-8">
        <div className="mx-auto flex min-w-0 max-w-3xl flex-col gap-4 rounded-[1.6rem] border border-white/10 bg-slate-900/75 p-6 shadow-2xl shadow-cyan-950/30">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-cyan-300">Module</p>
          <h1 className="break-words text-2xl font-semibold text-white">{errorState.title}</h1>
          <p className="break-words text-sm leading-6 text-slate-300">{errorState.detail}</p>
          <div className="flex flex-wrap gap-3">
            <Link href="/dashboard" className="rounded-full border border-white/10 bg-white/10 px-4 py-2 text-sm text-slate-100 transition hover:border-cyan-400/30 hover:text-cyan-100">
              Retour au dashboard
            </Link>
            <Link href="/" className="rounded-full border border-white/10 px-4 py-2 text-sm text-slate-200 transition hover:border-white/20 hover:text-white">
              Revenir à l’accueil
            </Link>
          </div>
        </div>
      </div>
    );
  }

  let content;
  try {
    content = await getCourseContent(moduleId);
    console.info('[module-page] loaded content', {
      userId: user?.id ?? null,
      requestedId: id,
      moduleId,
      moduleTitle: content.module?.titre ?? null,
    });
  } catch (error) {
    const loadError = error instanceof Error ? error : new Error('Unknown module loading failure');
    console.error('[module-page] content load failed', {
      userId: user?.id ?? null,
      requestedId: id,
      moduleId,
      error: loadError.message,
    });

    return (
      <div className="min-h-screen min-w-0 bg-[radial-gradient(circle_at_top_left,_rgba(34,211,238,0.12),_transparent_30%),linear-gradient(135deg,_#071016_0%,_#0d1b23_100%)] px-4 py-8 text-slate-100 sm:px-6 lg:px-8">
        <div className="mx-auto flex min-w-0 max-w-3xl flex-col gap-4 rounded-[1.6rem] border border-white/10 bg-slate-900/75 p-6 shadow-2xl shadow-cyan-950/30">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-cyan-300">Module</p>
          <h1 className="break-words text-2xl font-semibold text-white">Impossible d’ouvrir ce module</h1>
          <p className="break-words text-sm leading-6 text-slate-300">
            Le contenu du module {moduleId} n’a pas pu être chargé. {loadError.message}
          </p>
          <div className="flex flex-wrap gap-3">
            <Link href="/dashboard" className="rounded-full border border-white/10 bg-white/10 px-4 py-2 text-sm text-slate-100 transition hover:border-cyan-400/30 hover:text-cyan-100">
              Retour au dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const moduleProgress = user?.id ? await getModuleProgress(user.id, moduleId).catch(() => null) : null;
  const moduleStatus = moduleProgress?.statut ?? 'locked';

  return (
    <div className="min-h-screen w-full min-w-0 overflow-hidden bg-[radial-gradient(circle_at_top_left,_rgba(34,211,238,0.12),_transparent_30%),linear-gradient(135deg,_#071016_0%,_#0d1b23_100%)] px-3 py-6 text-slate-100 sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-7xl min-w-0 flex-col gap-4 overflow-hidden">
        <div className="flex min-w-0 flex-wrap items-center justify-between gap-3 rounded-[1.4rem] border border-white/10 bg-slate-900/70 p-4">
          <div className="min-w-0">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-cyan-300">Module</p>
            <h1 className="break-words text-2xl font-semibold text-white">{content.module.titre}</h1>
          </div>
          <Link href="/dashboard" className="rounded-full border border-white/10 bg-white/8 px-3 py-2 text-sm text-slate-200 transition hover:border-cyan-400/25 hover:text-cyan-100">Retour au dashboard</Link>
        </div>
        <EngineeringLabWorkspace
          module={content.module}
          lessons={content.lessons}
          exercises={content.exercises}
          socraticQuestions={content.socraticQuestions}
          currentUserId={user?.id ?? ''}
          moduleStatus={moduleStatus}
          nextModuleId={content.nextModuleId}
        />
      </div>
    </div>
  );
}
