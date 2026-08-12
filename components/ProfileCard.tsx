import React from 'react';
import { Profile } from '@/lib/types';
import Avatar from './Avatar';

export default function ProfileCard({ profile }: { profile: Profile }) {
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
        <div className="text-sm text-slate-400">Streak</div>
        <div className="text-xl font-bold">{profile.streak ?? 0}</div>
      </div>

      <div className="mt-4">
        <div className="text-sm text-slate-400">Badges</div>
        <div className="mt-2 text-slate-300">(badges placeholder)</div>
      </div>
    </div>
  );
}
