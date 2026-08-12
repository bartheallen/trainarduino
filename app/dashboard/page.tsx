import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { getUserProfile, getUserProgress, getModules, getLevelThresholds, ensureFirstModuleProgress } from '@/lib/db';
import { DashboardExperience } from '@/components/dashboard/DashboardExperience';
import { Card } from '@/components/ui/Card';
import * as adaptiveEngine from '@/lib/services/adaptiveEngineService';
import { getUserModuleProgressSummary } from '@/lib/services/learningProgressService';

export default async function DashboardPage() {
  const user = await getCurrentUser('dashboard');
  if (!user) {
    redirect('/login');
  }

  try {
    const profile = await getUserProfile(user.id);
    const modules = await getModules();
    await ensureFirstModuleProgress(user.id, modules);
    const allProgress = await getUserProgress(user.id);

    const { completedCount, progressPercentage } = await getUserModuleProgressSummary(user.id, modules.length);

    const completedModuleIds = new Set(allProgress.filter((p) => p.statut === 'completed').map((p) => p.module_id));
    const inProgressModuleIds = new Set(allProgress.filter((p) => p.statut === 'in_progress').map((p) => p.module_id));

    const moduleStatus = modules
      .map((module, index) => {
        const userProgress = allProgress.find((p) => p.module_id === module.id);

        if (userProgress?.statut === 'completed') {
          return {
            ...module,
            status: 'completed' as const,
            score: userProgress.score || 0,
            completed_exercises: userProgress.exercices_completes || 0,
          };
        }

        if (userProgress?.statut === 'in_progress') {
          return {
            ...module,
            status: 'in_progress' as const,
            score: userProgress.score || 0,
            completed_exercises: userProgress.exercices_completes || 0,
          };
        }

        const previousModule = modules[index - 1];
        const previousProgress = previousModule ? allProgress.find((p) => p.module_id === previousModule.id) : undefined;
        const isFirstModule = index === 0;
        const isUnlocked = isFirstModule || previousProgress?.statut === 'completed';

        return {
          ...module,
          status: isUnlocked ? (isFirstModule ? 'in_progress' : 'available') : 'locked',
          score: userProgress?.score || 0,
          completed_exercises: userProgress?.exercices_completes || 0,
        };
      })
      .filter((module) => completedModuleIds.has(module.id) || inProgressModuleIds.has(module.id) || module.status === 'available');

    if (profile.niveau_actuel == null) {
      redirect('/onboarding/positioning-test');
    }

    const { currentLevel, currentThreshold, nextThreshold } = getLevelThresholds(profile.xp_total ?? 0);
    const profileForDashboard = {
      ...profile,
      niveau_actuel: currentLevel,
      streak: profile.streak ?? 0,
    };

    const adaptiveRecommendation = await adaptiveEngine.recommendAdaptiveActions(user.id).catch(() => null);

    return (
      <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(34,211,238,0.12),_transparent_30%),linear-gradient(135deg,_#071016_0%,_#0d1b23_100%)] px-4 py-8 text-slate-100 sm:px-6 lg:px-8">
        <DashboardExperience
          profile={profileForDashboard}
          progressPercentage={progressPercentage}
          completedCount={completedCount}
          totalModules={modules.length}
          currentThreshold={currentThreshold}
          nextThreshold={nextThreshold}
          moduleStatus={moduleStatus}
          adaptiveRecommendation={adaptiveRecommendation ?? undefined}
        />
      </div>
    );
  } catch (error) {
    console.error('Dashboard error:', error);
    return (
      <div className="flex min-h-screen items-center justify-center bg-pcb-dark px-4">
        <Card className="max-w-lg border-red-500/20 bg-red-500/10 text-red-200">
          <h2 className="text-2xl font-semibold">Le tableau de bord n’a pas pu se charger</h2>
          <p className="mt-3 text-sm text-red-200/80">Actualisez la page ou vérifiez votre connexion.</p>
        </Card>
      </div>
    );
  }
}
