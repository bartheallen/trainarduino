import { getCurrentUser } from '@/lib/auth';
import { getProfileForUser } from '@/lib/services/profileService';

export default async function ProfileEditPage() {
  const user = await getCurrentUser();
  if (!user) {
    return <div className="p-6">Connectez-vous pour modifier le profil.</div>;
  }

  const profile = await getProfileForUser(user.id);

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-semibold mb-4">Modifier le profil</h1>
      <div className="rounded-xl border border-slate-700 bg-slate-900/80 p-6">
        <p className="text-sm text-slate-400">Page de modification du profil temporairement désactivée pendant la migration architecturale.</p>
        <div className="mt-4 text-slate-200">
          Username : {profile.username ?? 'Non défini'}
        </div>
        <div className="mt-2 text-slate-200">
          XP Total : {profile.xp_total ?? 0}
        </div>
      </div>
    </div>
  );
}
