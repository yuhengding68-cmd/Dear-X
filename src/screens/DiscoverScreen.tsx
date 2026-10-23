import { useEffect, useState } from 'react';
import type { DatingProfile } from '../types';
import { useI18n } from '../i18n';
import { useApp } from '../state/AppProvider';
import { Avatar, Button } from '../components/ui';
import { ReportDialog } from '../components/ReportDialog';

export function DiscoverScreen() {
  const { t } = useI18n();
  const { repo, go } = useApp();
  const [cards, setCards] = useState<DatingProfile[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [matchChat, setMatchChat] = useState<string | null>(null);
  const [reporting, setReporting] = useState(false);

  const load = () => {
    void repo.getDiscovery().then(setCards).catch((caught: unknown) => {
      setError(caught instanceof Error ? caught.message : t('common.error'));
    });
  };

  useEffect(load, [repo, t]);

  const card = cards[0];
  if (!card) {
    return <p className="px-4 py-10 text-white/60">{error ?? t('discover.empty')}</p>;
  }

  return (
    <div className="px-4 py-4">
      <article className="overflow-hidden rounded-3xl border border-white/10 bg-white/5">
        <div className="relative h-80 bg-black">
          <Avatar name={card.displayName} src={card.photoUrl} />
        </div>
        <div className="space-y-3 p-5">
          <h2 className="font-display text-2xl font-semibold">
            {card.displayName}, {card.age}
          </h2>
          <p className="text-sm text-white/60">
            {card.city}
            {card.distanceKm != null ? ` · ${t('discover.km', { n: card.distanceKm })}` : ''}
          </p>
          <p className="text-white/80">{card.bio}</p>
          <div className="flex flex-wrap gap-2">
            {card.interests.map((interest) => (
              <span key={interest} className="rounded-full bg-white/10 px-3 py-1 text-xs">
                {t(`interests.${interest}`)}
              </span>
            ))}
          </div>
        </div>
      </article>
      {error ? <p className="mt-3 text-sm text-red-300">{error}</p> : null}
      <div className="mt-4 grid grid-cols-2 gap-3">
        <Button
          type="button"
          kind="ghost"
          onClick={() => void repo.passUser(card.uid).then(load)}
        >
          {t('discover.pass')}
        </Button>
        <Button
          type="button"
          onClick={() =>
            void repo.likeUser(card.uid).then((result) => {
              if (result.matched && result.chatId) setMatchChat(result.chatId);
              load();
            })
          }
        >
          {t('discover.like')}
        </Button>
      </div>
      <div className="mt-3 flex gap-3 text-sm text-white/60">
        <button type="button" onClick={() => setReporting(true)}>
          {t('common.report')}
        </button>
        <button
          type="button"
          onClick={() => void repo.blockUser(card.uid).then(load)}
        >
          {t('common.block')}
        </button>
      </div>
      {reporting ? (
        <ReportDialog
          target={{ targetUserId: card.uid, targetType: 'user', targetId: card.uid }}
          onClose={() => setReporting(false)}
          onSubmit={(input) => repo.fileReport(input).then(() => undefined)}
        />
      ) : null}
      {matchChat ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/75 p-6">
          <div className="w-full max-w-sm space-y-4 rounded-3xl bg-[#14141c] p-6 text-center">
            <h3 className="font-display text-3xl font-semibold">{t('discover.matchTitle')}</h3>
            <p className="text-white/70">{t('discover.matchBody')}</p>
            <Button type="button" className="w-full" onClick={() => go({ name: 'chat', chatId: matchChat })}>
              {t('discover.sayHello')}
            </Button>
            <Button type="button" kind="ghost" className="w-full" onClick={() => setMatchChat(null)}>
              {t('discover.keep')}
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
