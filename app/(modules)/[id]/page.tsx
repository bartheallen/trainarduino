import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { getModule, getLessonsByModule, getExercisesByModule } from '@/lib/db';

export default async function ModulePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) {
    redirect('/login');
  }

  const { id } = await params;
  const moduleId = Number(id);

  if (Number.isNaN(moduleId)) {
    redirect('/');
  }

  let module;
  try {
    module = await getModule(moduleId);
  } catch {
    redirect('/');
  }

  const [lessons, exercises] = await Promise.all([
    getLessonsByModule(moduleId),
    getExercisesByModule(moduleId),
  ]);

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3">
        <Link href="/" className="text-sm font-medium text-blue-600 hover:underline">
          ← Retour au dashboard
        </Link>
      </div>

      <div className="bg-white rounded-3xl shadow-lg p-8">
        <p className="text-sm font-semibold uppercase tracking-wide text-blue-600">
          Module #{module.ordre}
        </p>
        <h1 className="text-3xl font-bold text-gray-800 mt-2">{module.titre}</h1>
        <p className="text-gray-600 mt-3">{module.description}</p>
        <div className="mt-4 inline-flex rounded-full bg-blue-50 px-3 py-1 text-sm font-medium text-blue-700">
          Débloqué à partir du niveau {module.palier_test}
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <section className="bg-white rounded-3xl shadow-lg p-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-800">Leçons</h2>
            <span className="text-sm text-gray-500">{lessons.length} leçon(s)</span>
          </div>

          {lessons.length === 0 ? (
            <p className="text-gray-500">Aucune leçon n’est disponible pour ce module pour le moment.</p>
          ) : (
            <div className="space-y-4">
              {lessons.map((lesson) => (
                <div key={lesson.id} className="rounded-2xl border border-gray-200 p-5">
                  <h3 className="text-lg font-semibold text-gray-800">{lesson.titre}</h3>
                  <p className="text-gray-600 mt-2 whitespace-pre-line">{lesson.contenu}</p>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="bg-white rounded-3xl shadow-lg p-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-800">Exercices</h2>
            <span className="text-sm text-gray-500">{exercises.length} exercice(s)</span>
          </div>

          {exercises.length === 0 ? (
            <p className="text-gray-500">Aucun exercice n’est encore disponible pour ce module.</p>
          ) : (
            <div className="space-y-4">
              {exercises.map((exercise) => (
                <div key={exercise.id} className="rounded-2xl border border-gray-200 p-5">
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="text-lg font-semibold text-gray-800">{exercise.titre}</h3>
                    <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-gray-600">
                      {exercise.difficulte}
                    </span>
                  </div>
                  <p className="text-gray-600 mt-2">{exercise.enonce}</p>
                  <div className="mt-4 flex items-center justify-between text-sm text-gray-500">
                    <span>Récompense : {exercise.xp_recompense} XP</span>
                    <span className="font-medium text-blue-600">À venir</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      <section className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-3xl p-8 text-white shadow-lg">
        <h2 className="text-2xl font-bold">Prêt à coder ?</h2>
        <p className="mt-2 text-blue-100">
          L’éditeur de code et la simulation Wokwi seront bientôt intégrés ici pour chaque exercice.
        </p>
      </section>
    </div>
  );
}
