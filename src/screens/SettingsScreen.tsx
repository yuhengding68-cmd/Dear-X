import { useState } from 'react';
import { downloadJson } from '../lib/download';
import { useI18n } from '../i18n';
import { useApp } from '../state/AppProvider';
import { Banner, Button, Field, inputClass } from '../components/ui';

export function SettingsScreen() {
  const { t, locale, setLocale } = useI18n();
  const { repo, me, go, signOut, setNotice } = useApp();
  const [phrase, setPhrase] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);

  return (
    <div className="space-y-4 px-4 py-4">
      <Field label={t('settings.language')}>
        <select className={inputClass} value={locale} onChange={(event) => setLocale(event.target.value as 'en' | 'zh-CN')}>
          <option value="en">English</option>
          <option value="zh-CN">简体中文</option>
        </select>
      </Field>
      <Button
        type="button"
        kind="ghost"
        onClick={() =>
          void repo.exportData().then((data) => {
            downloadJson(`dearx-${me?.uid ?? 'export'}.json`, data);
            setDone(t('settings.exportDone'));
          })
        }
      >
        {t('settings.export')}
      </Button>
      <div className="flex gap-3 text-sm">
        <button type="button" onClick={() => go({ name: 'legal', doc: 'privacy' })}>
          {t('settings.privacy')}
        </button>
        <button type="button" onClick={() => go({ name: 'legal', doc: 'terms' })}>
          {t('settings.terms')}
        </button>
        <button type="button" onClick={() => go({ name: 'policy' })}>
          {t('creators.policy')}
        </button>
      </div>
      {me?.role === 'admin' ? (
        <Button type="button" kind="soft" onClick={() => go({ name: 'admin' })}>
          {t('settings.admin')}
        </Button>
      ) : null}
      <Button type="button" kind="ghost" onClick={() => go({ name: 'studio' })}>
        {t('creators.studio')}
      </Button>
      <section className="space-y-3 rounded-3xl border border-red-400/20 p-4">
        <h2 className="font-semibold">{t('settings.delete')}</h2>
        <p className="text-sm text-white/65">{t('settings.deleteHint')}</p>
        <input className={inputClass} value={phrase} onChange={(event) => setPhrase(event.target.value)} placeholder={t('settings.deleteWord')} />
        <Button
          type="button"
          kind="danger"
          disabled={phrase !== t('settings.deleteWord')}
          onClick={() =>
            void repo
              .deleteAccount()
              .then(() => {
                setNotice(t('settings.deleted'));
                return signOut();
              })
              .catch((caught: unknown) => setError(caught instanceof Error ? caught.message : t('common.error')))
          }
        >
          {t('settings.confirmDelete')}
        </Button>
      </section>
      {repo.mode === 'demo' ? (
        <Button
          type="button"
          kind="ghost"
          onClick={() => void repo.resetDemo().then(() => signOut())}
        >
          {t('settings.reset')}
        </Button>
      ) : null}
      <Button type="button" kind="ghost" onClick={() => void signOut()}>
        {t('common.signOut')}
      </Button>
      {done ? <Banner tone="good">{done}</Banner> : null}
      {error ? <p className="text-sm text-red-300">{error}</p> : null}
    </div>
  );
}
