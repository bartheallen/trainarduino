'use client';

import { Profile } from '@/lib/types';
import Avatar from './Avatar';
import { useDictionary } from '@/components/i18n/LocaleProvider';

export default function ProfileCard({ profile }: { profile: Profile }) {
  const dict = useDictionary();
  return (
    <div className="p-6 rounded-xl bg-gradient-to-br from-slate-900/60 to-slate-800/60">
      <div className="flex items-center gap-4">
        <Avatar src={profile.avatar_url || undefined} alt={profile.display_name || profile.username} size={96} />
        <div>
          <div className="text-lg font-semibold">{profile.display_name || profile.username}</div>
          <div className="text-sm text-slate-400">@{profile.username}</div>
        </div>
      </div>

      <div className="mt-4">
        <div className="text-sm text-slate-400">{dict.profile.badges}</div>
        <div className="mt-2 text-slate-300">{dict.profile.badgesPlaceholder}</div>
      </div>
    </div>
  );
}
