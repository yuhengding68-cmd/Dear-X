import { ALLOWED_CREATOR_TOPICS, FORBIDDEN_CREATOR_TOPICS } from '../domain/contentPolicy';
import { useI18n } from '../i18n';
import { useApp } from '../state/AppProvider';
import { Banner, TopBar } from '../components/ui';

export function PolicyScreen() {
  const { t, locale } = useI18n();
  const { back } = useApp();
  const text = (item: { en: string; zh: string }) => (locale === 'zh-CN' ? item.zh : item.en);
  return (
    <div className="mx-auto min-h-screen max-w-2xl">
      <TopBar title={t('policy.title')} onBack={back} />
      <div className="space-y-6 px-5 py-6">
        <Banner tone="warn">{t('policy.draft')}</Banner>
        <section>
          <h2 className="mb-2 font-semibold">{t('policy.allowed')}</h2>
          <ul className="list-disc space-y-1 pl-5 text-sm text-white/75">
            {ALLOWED_CREATOR_TOPICS.map((item) => (
              <li key={item.id}>{text(item)}</li>
            ))}
          </ul>
        </section>
        <section>
          <h2 className="mb-2 font-semibold">{t('policy.forbidden')}</h2>
          <ul className="list-disc space-y-1 pl-5 text-sm text-white/75">
            {FORBIDDEN_CREATOR_TOPICS.map((item) => (
              <li key={item.id}>{text(item)}</li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
