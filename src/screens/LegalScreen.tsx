import { legalSections } from '../content/legal';
import { useI18n } from '../i18n';
import { useApp } from '../state/AppProvider';
import { Banner, TopBar } from '../components/ui';

export function LegalScreen({ doc }: { doc: 'privacy' | 'terms' }) {
  const { t, locale } = useI18n();
  const { back } = useApp();
  const sections = legalSections(doc, locale);
  return (
    <div className="mx-auto min-h-screen max-w-2xl">
      <TopBar title={doc === 'privacy' ? t('legal.privacy') : t('legal.terms')} onBack={back} />
      <article className="space-y-6 px-5 py-6">
        <Banner tone="warn">{t('legal.draft')}</Banner>
        <p className="text-xs text-white/40">{t('legal.updated')}</p>
        {sections.map((section) => (
          <section key={section.heading}>
            <h2 className="mb-2 font-semibold">{section.heading}</h2>
            {section.paragraphs.map((paragraph) => (
              <p key={paragraph} className="mb-2 text-sm leading-relaxed text-white/70">
                {paragraph}
              </p>
            ))}
          </section>
        ))}
      </article>
    </div>
  );
}
