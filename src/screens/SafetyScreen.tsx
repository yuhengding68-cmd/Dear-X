import { useEffect, useState } from 'react';
import type { Block, DatingProfile } from '../types';
import { useI18n } from '../i18n';
import { useApp } from '../state/AppProvider';
import { Button } from '../components/ui';

export function SafetyScreen() {
  const { t } = useI18n();
  const { repo, session } = useApp();
  const [blocks, setBlocks] = useState<Array<{ block: Block; profile: DatingProfile | null }>>([]);
  const load = () => {
    if (!session) return;
    void repo.listBlocks().then(setBlocks);
  };
  useEffect(load, [repo, session]);
  const tips = [t('safety.tip1'), t('safety.tip2'), t('safety.tip3'), t('safety.tip4'), t('safety.tip5')];
  return (
    <div className="space-y-6 px-4 py-4">
      <section>
        <h2 className="mb-2 font-semibold">{t('safety.tipsTitle')}</h2>
        <ul className="space-y-2 text-sm leading-relaxed text-white/75">
          {tips.map((tip) => (
            <li key={tip} className="rounded-2xl border border-white/10 p-3">
              {tip}
            </li>
          ))}
        </ul>
      </section>
      {session ? (
        <section>
          <h2 className="mb-2 font-semibold">{t('safety.blockedTitle')}</h2>
          {blocks.length === 0 ? <p className="text-sm text-white/50">{t('safety.noneBlocked')}</p> : null}
          <ul className="space-y-2">
            {blocks.map(({ block, profile }) => (
              <li key={block.id} className="flex items-center justify-between rounded-2xl border border-white/10 px-3 py-2">
                <span>{profile?.displayName ?? block.blockedId}</span>
                <Button type="button" kind="ghost" onClick={() => void repo.unblockUser(block.blockedId).then(load)}>
                  {t('common.unblock')}
                </Button>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
