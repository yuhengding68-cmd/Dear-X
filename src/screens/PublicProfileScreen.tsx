import { useEffect, useState } from 'react';
import { Briefcase, MapPin } from 'lucide-react';
import type { DatingProfile } from '../types';
import { useI18n } from '../i18n';
import { useApp } from '../state/AppProvider';

function interestLabel(tag: string, t: (key: string) => string): string {
  const key = `interests.${tag}`;
  const label = t(key);
  return label === key ? tag : label;
}

/** Deep-link target. Reads the public profile document only. */
export function PublicProfileScreen({ uid }: { uid: string }) {
  const { t } = useI18n();
  const { repo, back } = useApp();
  const [profile, setProfile] = useState<DatingProfile | null | undefined>(undefined);

  useEffect(() => {
    let cancelled = false;
    void repo.getPublicProfile(uid).then((next) => {
      if (!cancelled) setProfile(next);
    });
    return () => {
      cancelled = true;
    };
  }, [repo, uid]);

  if (profile === undefined) return null;
  if (!profile) {
    return (
      <div className="p-6">
        <button type="button" onClick={back} className="text-sm text-brand-blue font-bold mb-4">
          {t('profile.back')}
        </button>
        <p className="text-white/70">{t('profile.notFound')}</p>
      </div>
    );
  }

  const photos = profile.photoUrls?.length ? profile.photoUrls : profile.photoUrl ? [profile.photoUrl] : [];

  return (
    <div className="h-full overflow-y-auto no-scrollbar p-6">
      <button type="button" onClick={back} className="text-sm text-brand-blue font-bold mb-4">
        {t('profile.back')}
      </button>
      <div className="glass-card rounded-3xl overflow-hidden border border-white/10">
        {photos[0] ? <img src={photos[0]} alt="" className="w-full h-72 object-cover" /> : <div className="h-40 bg-vibe-gradient" />}
        <div className="p-5">
          <h2 className="text-3xl font-black text-white">
            {profile.displayName}, {profile.age}
          </h2>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-white/80">
            {profile.city ? (
              <span className="glass-pill px-2 py-0.5 rounded-lg inline-flex items-center gap-1 text-sm">
                <MapPin className="w-3 h-3" />
                {profile.city}
              </span>
            ) : null}
            {profile.job ? (
              <span className="glass-pill px-2 py-0.5 rounded-lg inline-flex items-center gap-1 text-sm">
                <Briefcase className="w-3 h-3" />
                {profile.job}
              </span>
            ) : null}
          </div>
          <p className="mt-4 text-sm text-white/80 leading-relaxed">{profile.bio}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {profile.interests.map((tag) => (
              <span key={tag} className="px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-xs font-bold text-white/90">
                #{interestLabel(tag, t)}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
