import { useState } from 'react';
import { Smartphone } from 'lucide-react';
import { DEFAULT_COUNTRY_CODE, normalizePhone } from '../domain/phone';
import { DEMO_PHONES } from '../data/demo/seed';
import { RepoError } from '../data/errors';
import { useI18n } from '../i18n';
import { useApp } from '../state/AppProvider';
import { LanguageButton, OriginalButton } from '../components/ui';

type AuthStep = 'login' | 'phone-input' | 'otp-input';

/** Parse "+61 400 000 000" or "0400 000 000" into E.164. Defaults to Australia. */
function toE164(raw: string): string | null {
  const trimmed = raw.trim();
  const match = /^(\+\d{1,4})[\s-]+(.+)$/.exec(trimmed);
  if (match) return normalizePhone(match[1], match[2]);
  if (trimmed.startsWith('+61')) return normalizePhone('+61', trimmed.slice(3));
  return normalizePhone(DEFAULT_COUNTRY_CODE, trimmed);
}

/** Original DearX LoginView (source-code/App.tsx), wired to the real sign-in flow. */
export function AuthScreen() {
  const { t } = useI18n();
  const { repo, go, enterSession } = useApp();
  const [step, setStep] = useState<AuthStep>('login');
  const [phone, setPhone] = useState('');
  const [sentTo, setSentTo] = useState('');
  const [code, setCode] = useState('');
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

  const startPhone = (e164: string) =>
    run(async () => {
      const started = await repo.beginPhoneSignIn(e164);
      if (started.status === 'code-sent') {
        setSentTo(e164);
        setStep('otp-input');
      } else if (started.session) await enterSession(started.session);
    });

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6 relative overflow-hidden">
      <div className="absolute top-4 right-4 z-20">
        <LanguageButton />
      </div>
      <div id="dearx-recaptcha" />
      <div className="z-10 w-full max-w-md flex flex-col items-center">
        {/* LOGO */}
        <div className="flex flex-col items-center mb-12 animate-fade-in">
          <h1 className="text-5xl font-black text-white tracking-[0.3em] leading-none drop-shadow-2xl">DEAR</h1>
          <h1 className="text-8xl font-black text-transparent bg-clip-text bg-gradient-to-br from-brand-blue to-brand-purple leading-none -mt-4 drop-shadow-2xl filter">X</h1>
        </div>

        <p className="text-brand-subtext text-center mb-10 text-lg font-medium">{t('look.tagline')}</p>

        {error ? <p className="w-full mb-4 text-sm text-center text-red-300">{error}</p> : null}

        {step === 'login' && (
          <div className="w-full space-y-4 animate-slide-up">
            <OriginalButton onClick={() => setStep('phone-input')} variant="primary" icon={Smartphone} className="shadow-glow-vibe" disabled={busy}>
              {t('look.continuePhone')}
            </OriginalButton>
            <div className="relative py-2">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/10"></div></div>
              <div className="relative flex justify-center text-xs uppercase"><span className="glass-pill px-2 text-brand-subtext">{t('look.or')}</span></div>
            </div>
            <OriginalButton
              onClick={() => void run(async () => enterSession(await repo.signInWithProvider('apple')))}
              variant="white"
              className="border-none"
              disabled={busy}
            >
              <span className="font-bold"></span> {t('look.apple')}
            </OriginalButton>
            <OriginalButton
              onClick={() => void run(async () => enterSession(await repo.signInWithProvider('google')))}
              variant="secondary"
              className="bg-slate-800 border border-slate-700"
              disabled={busy}
            >
              <span className="font-bold text-blue-400">G</span> {t('look.google')}
            </OriginalButton>

            {/* EULA & Safety Disclaimer */}
            <p className="text-[10px] text-center text-white/30 mt-8 max-w-xs mx-auto leading-relaxed">
              {t('look.agreeA')}{' '}
              <button type="button" className="underline" onClick={() => go({ name: 'legal', doc: 'terms' })}>{t('look.terms')}</button>{' '}
              {t('look.agreeAnd')}{' '}
              <button type="button" className="underline" onClick={() => go({ name: 'legal', doc: 'privacy' })}>{t('look.privacy')}</button>.
              <br /><br />
              <strong>{t('look.zeroTolerance')}</strong> {t('look.zeroToleranceRest')}
              <br />
              {t('look.ageNote')}
            </p>
          </div>
        )}

        {step === 'phone-input' && (
          <form
            className="w-full space-y-4 animate-slide-up"
            onSubmit={(event) => {
              event.preventDefault();
              const e164 = toE164(phone);
              if (!e164) {
                setError(t('auth.invalidPhone'));
                return;
              }
              void startPhone(e164);
            }}
          >
            <h2 className="text-xl font-bold text-center mb-4">{t('look.numberTitle')}</h2>
            <input
              type="tel"
              autoComplete="tel"
              placeholder="+61 400 000 000"
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              className="w-full glass-card rounded-xl px-4 py-3 text-white text-lg focus:outline-none focus:border-brand-blue focus:ring-1 focus:ring-brand-blue transition-all placeholder-white/20"
            />
            <p className="text-xs text-brand-subtext text-center">{t('look.numberHint')}</p>
            <div className="grid grid-cols-2 gap-3 pt-2">
              <OriginalButton type="button" onClick={() => setStep('login')} variant="ghost">{t('look.back')}</OriginalButton>
              <OriginalButton type="submit" variant="primary" disabled={busy}>{t('look.next')}</OriginalButton>
            </div>
            {repo.mode === 'demo' ? (
              <div className="pt-4 space-y-2">
                <p className="text-xs text-brand-subtext text-center">{t('look.demoQuick')}</p>
                <div className="flex gap-2 justify-center">
                  {[
                    [t('auth.demoMember'), DEMO_PHONES.member],
                    [t('auth.demoAdmin'), DEMO_PHONES.admin],
                    [t('auth.demoCreator'), DEMO_PHONES.creator],
                  ].map(([label, demoPhone]) => (
                    <button key={demoPhone} type="button" disabled={busy} className="glass-pill px-3 py-1.5 rounded-full text-xs text-white" onClick={() => void startPhone(demoPhone)}>
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}
          </form>
        )}

        {step === 'otp-input' && (
          <form
            className="w-full space-y-4 animate-slide-up"
            onSubmit={(event) => {
              event.preventDefault();
              void run(async () => enterSession(await repo.confirmPhoneCode(code.trim())));
            }}
          >
            <h2 className="text-xl font-bold text-center mb-2">{t('look.codeTitle')}</h2>
            <p className="text-brand-subtext text-center text-sm mb-4">{t('look.sentTo', { phone: sentTo })}</p>
            <label className="relative flex gap-2 justify-center mb-4">
              {[0, 1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="w-12 h-14 glass-card rounded-xl flex items-center justify-center text-2xl font-bold border-white/20">
                  {code[i] ?? ''}
                </div>
              ))}
              <input
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                value={code}
                onChange={(event) => setCode(event.target.value.replace(/\D/g, ''))}
                className="absolute inset-0 opacity-0"
                aria-label={t('auth.code')}
              />
            </label>
            <OriginalButton type="submit" variant="primary" disabled={busy || code.length < 6}>{t('look.verify')}</OriginalButton>
            <OriginalButton type="button" onClick={() => setStep('phone-input')} variant="ghost" className="text-sm">{t('look.wrongNumber')}</OriginalButton>
          </form>
        )}
      </div>
    </div>
  );
}
