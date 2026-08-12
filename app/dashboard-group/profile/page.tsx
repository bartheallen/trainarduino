import { getCurrentUser } from '@/lib/auth';
import { getProfileForUser } from '@/lib/services/profileService';
import ProfileCard from '@/components/ProfileCard';

export default async function ProfilePage() {
  const user = await getCurrentUser();
  if (!user) {
    // redirect handled by middleware; show fallback
    return <div className="p-6">Connectez-vous pour voir ce profil.</div>;
  }

  const profile = await getProfileForUser(user.id);

  return (
    <div className="container mx-auto p-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div>
          <ProfileCard profile={profile} />
        </div>
        <div className="md:col-span-2">
          <h2 className="text-2xl font-semibold mb-4">Statistiques</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-lg bg-gradient-to-br from-slate-800/60 to-slate-900/60">
              <div className="text-sm text-slate-400">Niveau actuel</div>
              <div className="text-3xl font-bold">{profile.niveau_actuel ?? '—'}</div>
            </div>
            <div className="p-4 rounded-lg bg-gradient-to-br from-slate-800/60 to-slate-900/60">
              <div className="text-sm text-slate-400">XP</div>
              <div className="text-3xl font-bold">{profile.xp_total}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
