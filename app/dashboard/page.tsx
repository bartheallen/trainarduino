import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { getUserProfile, getUserProgress, getModules } from '@/lib/db';
import { XpBar } from '@/components/gamification/XpBar';
import { StreakFlame } from '@/components/gamification/StreakFlame';
import { ModulePath } from '@/components/dashboard/ModulePath';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect('/login');
  }

  try {
    const profile = await getUserProfile(user.id);
    const allProgress = await getUserProgress(user.id);
    const modules = await getModules();

    const completedCount = allProgress.filter((p) => p.statut === 'completed').length;
    const progressPercentage = modules.length > 0 ? Math.round((completedCount / modules.length) * 100) : 0;

    const moduleStatus = modules.map((module) => {
      const userProgress = allProgress.find((p) => p.module_id === module.id);
      return {
        ...module,
        status: userProgress?.statut || 'locked',
        score: userProgress?.score || 0,
        completed_exercises: userProgress?.exercices_completes || 0,
      };
    });

    const xpThresholds = [0, 200, 600, 1200, 2000, 3000, 4500, 6000, 8000, 10000];
    const currentThreshold = xpThresholds[profile.niveau_actuel - 1] || 0;
    const nextThreshold = xpThresholds[profile.niveau_actuel] || 10000;

    return (
      <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(198,121,63,0.2),_transparent_30%),linear-gradient(135deg,_#0A1410_0%,_#111c18_100%)] px-4 py-8 text-slate-100 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-6">
          <header className="rounded-[2rem] border border-copper-500/20 bg-white/10 p-6 shadow-pcb backdrop-blur-xl dark:bg-slate-900/50">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-2xl">
                <p className="text-sm font-semibold uppercase tracking-[0.3em] text-copper-400">Atelier de progression</p>
                <h1 className="mt-2 text-4xl font-semibold sm:text-5xl">
                  Bonjour, <span className="text-copper-300">{profile.pseudo}</span>
                </h1>
                <p className="mt-3 text-lg text-slate-300">
                  Votre parcours Arduino se dessine comme un circuit imprimé : une succession de composants à maîtriser, un par un.
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <StreakFlame streak={7} />
                <Button variant="secondary">Paramètres</Button>
              </div>
            </div>

            <div className="mt-8 grid gap-4 lg:grid-cols-[1.3fr_0.7fr]">
              <XpBar currentXp={profile.xp_total} nextLevelXp={nextThreshold - currentThreshold || 1000} currentLevel={profile.niveau_actuel} />
              <Card hoverable={false} className="border-copper-500/20">
                <p className="text-sm font-semibold uppercase tracking-[0.25em] text-copper-400">Progression globale</p>
                <div className="mt-4 flex items-end justify-between">
                  <div>
                    <p className="text-5xl font-semibold">{progressPercentage}%</p>
                    <p className="mt-2 text-sm text-slate-400">{completedCount}/{modules.length} modules terminés</p>
                  </div>
                  <div className="rounded-2xl bg-emerald-500/15 px-4 py-3 text-sm font-semibold text-emerald-300">
                    +{profile.xp_total} XP
                  </div>
                </div>
              </Card>
            </div>
          </header>

          <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
            <Card hoverable={false} className="border-copper-500/20 p-0 overflow-hidden">
              <div className="border-b border-slate-800/70 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.25em] text-copper-400">Chemin de progression</p>
                    <h2 className="mt-2 text-2xl font-semibold">Parcours en zigzag</h2>
                  </div>
                  <div className="rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-sm font-semibold text-emerald-300">
                    Module actuel
                  </div>
                </div>
              </div>
              <div className="p-6">
                <ModulePath modules={moduleStatus} />
              </div>
            </Card>

            <div className="space-y-6">
              <Card hoverable={false} className="border-copper-500/20">
                <p className="text-sm font-semibold uppercase tracking-[0.25em] text-copper-400">Prochain objectif</p>
                <h3 className="mt-3 text-2xl font-semibold">Maîtriser les bases du câblage</h3>
                <p className="mt-3 text-sm text-slate-400">
                  Continuez votre séquence pour débloquer le prochain composant et gagner un nouveau badge.
                </p>
                <Button className="mt-5">Continuer</Button>
              </Card>

              <Card hoverable={false} className="border-copper-500/20">
                <p className="text-sm font-semibold uppercase tracking-[0.25em] text-copper-400">Badges</p>
                <div className="mt-4 space-y-3">
                  <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-3 text-sm text-emerald-200">🏅 Premier Blink</div>
                  <div className="rounded-2xl border border-copper-500/20 bg-copper-500/10 p-3 text-sm text-copper-200">⚡ 5 exercices d’affilée</div>
                </div>
              </Card>
            </div>
          </section>
        </div>
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
