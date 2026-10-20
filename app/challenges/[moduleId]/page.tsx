import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { getModules, getUserProgress, getPositioningTestResult, getExercisesByModule } from '@/lib/db';
import { getModuleAccessState } from '@/lib/services/moduleAccessService';
import { CapstoneChallengeWorkspace } from '@/components/lab/CapstoneChallengeWorkspace';

export default async function CapstoneChallengePage({
  params,
}: {
  params: Promise<{ moduleId: string }>;
}) {
  const user = await getCurrentUser('capstone-challenge');
  if (!user) redirect('/login');

  const { moduleId: rawModuleId } = await params;
  const moduleId = Number(rawModuleId);
  const [modules, progress, placement] = await Promise.all([
    getModules(),
    getUserProgress(user.id),
    getPositioningTestResult(user.id),
  ]);
  const index = modules.findIndex((courseModule) => courseModule.id === moduleId);
  const courseModule = modules[index];

  if (!courseModule || !courseModule.is_capstone || getModuleAccessState(courseModule, index, modules, progress, placement) === 'locked') {
    redirect('/modules');
  }

  const exercises = await getExercisesByModule(courseModule.id);
  const challenge = exercises.find((exercise) => exercise.titre.startsWith('Défi synthèse')) ?? exercises[0];
  if (!challenge) {
    return <main className="min-h-screen bg-[#071016] p-5 text-slate-100"><p>Ce défi n’est pas encore configuré.</p></main>;
  }

  return (
    <main className="min-h-screen overflow-x-hidden bg-[radial-gradient(circle_at_top_left,_rgba(34,211,238,0.14),_transparent_30%),linear-gradient(135deg,_#071016_0%,_#0d1b23_100%)] px-3 py-5 text-slate-100 sm:px-5 lg:px-8">
      <div className="mx-auto flex w-full max-w-6xl min-w-0 flex-col gap-4">
        <div className="flex min-w-0 flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-cyan-300">Défi de synthèse · Module {courseModule.ordre}</p>
            <h1 className="mt-2 break-words text-2xl font-semibold text-white sm:text-3xl">{challenge.titre}</h1>
          </div>
          <Link href="/modules" className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-200">Retour aux modules</Link>
        </div>
        <CapstoneChallengeWorkspace challenge={challenge} />
      </div>
    </main>
  );
}
