import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { getUserProfile, getUserProgress, getModules, getLevelThresholds, ensureFirstModuleProgress, getPositioningTestResult } from '@/lib/db';
import { DashboardExperience } from '@/components/dashboard/DashboardExperience';
import { Card } from '@/components/ui/Card';
import * as adaptiveEngine from '@/lib/services/adaptiveEngineService';
import { getUserModuleProgressSummary } from '@/lib/services/learningProgressService';
import { getModuleAccessState } from '@/lib/services/moduleAccessService';
import { getEvolutionLevelName, getPlacementLevelName } from '@/lib/services/levelService';
import { getServerDictionary } from '@/lib/i18n/server';

export default async function DashboardPage() {
  const dict = await getServerDictionary();
  const user = await getCurrentUser('dashboard');
  if (!user) {
    redirect('/login');
  }

  try {
    const profile = await getUserProfile(user.id);
    const modules = await getModules();
    await ensureFirstModuleProgress(user.id, modules);
    const [allProgress, placement] = await Promise.all([
      getUserProgress(user.id),
      getPositioningTestResult(user.id),
    ]);

    const { completedCount, progressPercentage } = await getUserModuleProgressSummary(user.id, modules.length);

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

        const accessState = getModuleAccessState(module, index, modules, allProgress, placement);

        return {
          ...module,
          status: accessState,
          score: userProgress?.score || 0,
          completed_exercises: userProgress?.exercices_completes || 0,
        };
      });

    if (profile.niveau_actuel == null) {
      redirect('/positioning-test');
    }

    const { currentLevel, currentThreshold, nextThreshold } = getLevelThresholds(profile.xp_total ?? 0);
    const profileForDashboard = {
      ...profile,
      niveau_actuel: currentLevel,
      evolutionLevelName: getEvolutionLevelName(currentLevel),
      placementLevelName: getPlacementLevelName(placement?.score),
    };

    const adaptiveRecommendation = await adaptiveEngine.recommendAdaptiveActions(user.id).catch(() => null);

    return (
      <div className="min-h-screen min-w-0 bg-[radial-gradient(circle_at_top_left,_rgba(34,211,238,0.12),_transparent_30%),linear-gradient(135deg,_#071016_0%,_#0d1b23_100%)] px-4 py-8 text-slate-100 sm:px-6 lg:px-8">
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
          <h2 className="text-2xl font-semibold">{dict.dashboard.loadErrorTitle}</h2>
          <p className="mt-3 text-sm text-red-200/80">{dict.dashboard.loadErrorDescription}</p>
        </Card>
      </div>
    );
  }
}
