import { useState } from 'react';
import { DEFAULT_COUNTRY_CODE, normalizePhone } from '../domain/phone';
import { DEMO_PHONES } from '../data/demo/seed';
import { RepoError } from '../data/errors';
import { useI18n } from '../i18n';
import { useApp } from '../state/AppProvider';
import { Banner, Button, Field, LanguageButton, TopBar, inputClass } from '../components/ui';

export function AuthScreen() {
  const { t } = useI18n();
  const { repo, back, enterSession } = useApp();
  const [country, setCountry] = useState(DEFAULT_COUNTRY_CODE);
  const [national, setNational] = useState('');
  const [code, setCode] = useState('');
  const [needsCode, setNeedsCode] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = async (work: () => Promise<void>) => {
    setBusy(true);
    setError(null);
    try {
      await work();
    } catch (caught) {
      if (caught instanceof RepoError && caught.code === 'underage') setError(t('onboarding.blockedBody'));
      else setError(caught instanceof Error ? caught.message : t('common.error'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto min-h-screen max-w-md">
      <TopBar title={t('auth.title')} onBack={back} extra={<LanguageButton />} />
      <div id="dearx-recaptcha" />
      <form
        className="space-y-4 px-4 py-6"
        onSubmit={(event) => {
          event.preventDefault();
          if (needsCode) {
            void run(async () => {
              const session = await repo.confirmPhoneCode(code.trim());
              await enterSession(session);
            });
            return;
          }
          const e164 = normalizePhone(country, national);
          if (!e164) {
            setError(t('auth.invalidPhone'));
            return;
          }
          void run(async () => {
            const started = await repo.beginPhoneSignIn(e164);
            if (started.status === 'code-sent') setNeedsCode(true);
            else if (started.session) await enterSession(started.session);
          });
        }}
      >
        <Field label={t('auth.country')}>
          <input className={inputClass} value={country} onChange={(event) => setCountry(event.target.value)} />
        </Field>
        <Field label={t('auth.phone')}>
          <input
            className={inputClass}
            inputMode="tel"
            autoComplete="tel-national"
            placeholder="400 000 000"
            value={national}
            onChange={(event) => setNational(event.target.value)}
          />
        </Field>
        <p className="text-sm text-white/50">{t('auth.phoneHint')}</p>
        {repo.mode === 'demo' ? <Banner>{t('auth.demoSms')}</Banner> : null}
        {needsCode ? (
          <Field label={t('auth.code')}>
            <input className={inputClass} value={code} onChange={(event) => setCode(event.target.value)} />
          </Field>
        ) : null}
        {error ? <p className="text-sm text-red-300">{error}</p> : null}
        <Button type="submit" className="w-full" disabled={busy}>
          {needsCode ? t('auth.confirmCode') : t('auth.continue')}
        </Button>
      </form>
      <div className="space-y-3 px-4 pb-10">
        <Button
          type="button"
          kind="ghost"
          className="w-full"
          disabled={busy}
          onClick={() => void run(async () => enterSession(await repo.signInWithProvider('apple')))}
        >
          {t('auth.apple')}
        </Button>
        <Button
          type="button"
          kind="ghost"
          className="w-full"
          disabled={busy}
          onClick={() => void run(async () => enterSession(await repo.signInWithProvider('google')))}
        >
          {t('auth.google')}
        </Button>
        <p className="text-xs leading-relaxed text-white/45">{t('auth.providerNote')}</p>
        {repo.mode === 'demo' ? (
          <div className="space-y-2 pt-2">
            <p className="text-xs text-white/45">{t('auth.demoHint')}</p>
            <div className="grid grid-cols-3 gap-2">
              {[
                [t('auth.demoMember'), DEMO_PHONES.member],
                [t('auth.demoAdmin'), DEMO_PHONES.admin],
                [t('auth.demoCreator'), DEMO_PHONES.creator],
              ].map(([label, phone]) => (
                <Button
                  key={phone}
                  type="button"
                  kind="soft"
                  className="px-2 text-xs"
                  disabled={busy}
                  onClick={() => void run(async () => {
                    const started = await repo.beginPhoneSignIn(phone);
                    if (started.session) await enterSession(started.session);
                  })}
                >
                  {label}
                </Button>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
