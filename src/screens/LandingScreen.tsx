import { Heart, Shield, Sparkles } from 'lucide-react';
import { LanguageButton, Logo } from '../components/ui';
import { useI18n } from '../i18n';
import { useApp } from '../state/AppProvider';

export function LandingScreen() {
  const { t } = useI18n();
  const { go, notice } = useApp();
  const features = [
    { icon: Heart, title: t('landing.featureMutualTitle'), body: t('landing.featureMutualBody') },
    { icon: Shield, title: t('landing.featureSafetyTitle'), body: t('landing.featureSafetyBody') },
    { icon: Sparkles, title: t('landing.featureCreatorTitle'), body: t('landing.featureCreatorBody') },
  ];
  return (
    <div className="min-h-screen bg-[#050505] text-white">
      <header className="mx-auto flex max-w-5xl items-center justify-between px-6 py-6">
        <Logo compact />
        <LanguageButton />
      </header>
      <main className="mx-auto max-w-5xl px-6 pb-20">
        {notice ? <p className="mb-4 text-sm text-emerald-200">{notice}</p> : null}
        <p className="mb-4 text-sm text-brand-light-purple">{t('landing.eyebrow')}</p>
        <h1 className="max-w-3xl font-display text-5xl font-bold leading-tight md:text-7xl">
          {t('landing.titleA')} <span className="text-gradient">{t('landing.titleB')}</span>
          <br />
          {t('landing.titleC')}
        </h1>
        <p className="mt-6 max-w-2xl text-lg text-white/70">{t('landing.subtitle')}</p>
        <div className="mt-8 flex flex-wrap gap-3">
          <button type="button" onClick={() => go({ name: 'auth' })} className="rounded-full bg-white px-6 py-3 font-semibold text-black">
            {t('landing.open')}
          </button>
          <button type="button" onClick={() => go({ name: 'main', tab: 'safety' })} className="rounded-full border border-white/15 px-6 py-3">
            {t('landing.safety')}
          </button>
        </div>
        <div className="mt-16 grid gap-4 md:grid-cols-3">
          {features.map((feature) => (
            <article key={feature.title} className="glass-panel rounded-3xl p-6">
              <feature.icon className="mb-4 h-6 w-6 text-brand-light-purple" />
              <h2 className="mb-2 text-xl font-semibold">{feature.title}</h2>
              <p className="text-sm leading-relaxed text-white/65">{feature.body}</p>
            </article>
          ))}
        </div>
        <section className="mt-8 glass-panel rounded-3xl p-8">
          <h2 className="font-display text-3xl font-semibold">{t('landing.splitTitle')}</h2>
          <p className="mt-3 max-w-2xl text-white/70">{t('landing.splitBody')}</p>
        </section>
      </main>
      <footer className="border-t border-white/10 px-6 py-8 text-sm text-white/50">
        <div className="mx-auto flex max-w-5xl flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <p>{t('landing.footer')}</p>
          <div className="flex gap-4">
            <button type="button" onClick={() => go({ name: 'legal', doc: 'privacy' })}>
              {t('landing.privacy')}
            </button>
            <button type="button" onClick={() => go({ name: 'legal', doc: 'terms' })}>
              {t('landing.terms')}
            </button>
            <a href="mailto:safety@dearx.app">{t('landing.contact')}</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
