import { getCurrentUser } from '@/lib/auth';
import { getProfileForUser } from '@/lib/services/profileService';
import { getServerDictionary } from '@/lib/i18n/server';

export default async function ProfileEditPage() {
  const dict = await getServerDictionary();
  const user = await getCurrentUser();
  if (!user) {
    return <div className="p-6">{dict.profile.loginToEdit}</div>;
  }

  const profile = await getProfileForUser(user.id);

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-semibold mb-4">{dict.profile.editTitle}</h1>
      <div className="rounded-xl border border-slate-700 bg-slate-900/80 p-6">
        <p className="text-sm text-slate-400">{dict.profile.editDisabled}</p>
        <div className="mt-4 text-slate-200">
          {dict.profile.username} : {profile.username ?? dict.profile.undefined}
        </div>
        <div className="mt-2 text-slate-200">
          {dict.profile.totalXp} : {profile.xp_total ?? 0}
        </div>
      </div>
    </div>
  );
}
