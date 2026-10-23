import { useState } from 'react';
import { isAtLeast18 } from '../domain/age';
import { AU_CITIES, type Gender } from '../types';
import { useI18n } from '../i18n';
import { useApp } from '../state/AppProvider';
import { Banner, Button, Field, TopBar, inputClass } from '../components/ui';

const INTERESTS = ['study', 'food', 'film', 'tea', 'photography', 'badminton', 'music', 'language', 'hiking', 'art', 'sport'];

export function OnboardingScreen() {
  const { t, locale } = useI18n();
  const { repo, finishOnboarding, blockForAge, signOut } = useApp();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [dob, setDob] = useState('');
  const [name, setName] = useState('');
  const [gender, setGender] = useState<Gender>('unspecified');
  const [city, setCity] = useState<string>(AU_CITIES[0]);
  const [bio, setBio] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [interests, setInterests] = useState<string[]>(['study']);
  const [accepted, setAccepted] = useState(false);
  const [blocked, setBlocked] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (blocked) {
    return (
      <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-4 px-6">
        <h1 className="font-display text-3xl font-semibold">{t('onboarding.blockedTitle')}</h1>
        <p className="text-white/70">{t('onboarding.blockedBody')}</p>
        <Button type="button" onClick={() => void signOut()}>
          {t('onboarding.leave')}
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto min-h-screen max-w-md">
      <TopBar title={t('onboarding.title')} />
      <form
        className="space-y-4 px-4 py-6"
        onSubmit={async (event) => {
          event.preventDefault();
          setError(null);
          if (step === 1) {
            if (!isAtLeast18(dob)) {
              setBlocked(true);
              try {
                await blockForAge(dob);
              } catch (caught) {
                setError(caught instanceof Error ? caught.message : t('common.error'));
              }
              return;
            }
            setStep(2);
            return;
          }
          if (step === 2) {
            if (name.trim().length < 2 || bio.trim().length < 2) {
              setError(t('common.error'));
              return;
            }
            setStep(3);
            return;
          }
          setBusy(true);
          try {
            await repo.completeOnboarding({
              dateOfBirth: dob,
              displayName: name,
              gender,
              bio,
              city,
              interests,
              photoUrl: photoUrl.trim() || null,
              acceptedTerms: accepted,
              locale,
            });
            await finishOnboarding();
          } catch (caught) {
            setError(caught instanceof Error ? caught.message : t('common.error'));
          } finally {
            setBusy(false);
          }
        }}
      >
        {step === 1 ? (
          <>
            <Field label={t('onboarding.dob')}>
              <input className={inputClass} type="date" required value={dob} onChange={(event) => setDob(event.target.value)} />
            </Field>
            <Banner tone="warn">{t('onboarding.dobHint')}</Banner>
          </>
        ) : null}
        {step === 2 ? (
          <>
            <Field label={t('onboarding.name')}>
              <input className={inputClass} required value={name} onChange={(event) => setName(event.target.value)} />
            </Field>
            <Field label={t('onboarding.gender')}>
              <select className={inputClass} value={gender} onChange={(event) => setGender(event.target.value as Gender)}>
                {(['woman', 'man', 'nonbinary', 'unspecified'] as const).map((item) => (
                  <option key={item} value={item}>
                    {t(`onboarding.${item}`)}
                  </option>
                ))}
              </select>
            </Field>
            <Field label={t('onboarding.city')}>
              <select className={inputClass} value={city} onChange={(event) => setCity(event.target.value)}>
                {AU_CITIES.map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </select>
            </Field>
            <Field label={t('onboarding.bio')}>
              <textarea className={inputClass} required rows={3} value={bio} onChange={(event) => setBio(event.target.value)} />
            </Field>
            <Field label={t('onboarding.interests')}>
              <div className="flex flex-wrap gap-2">
                {INTERESTS.map((item) => {
                  const on = interests.includes(item);
                  return (
                    <button
                      key={item}
                      type="button"
                      onClick={() => setInterests((current) => (on ? current.filter((id) => id !== item) : [...current, item]))}
                      className={`rounded-full px-3 py-1 text-xs ${on ? 'bg-white text-black' : 'bg-white/10'}`}
                    >
                      {t(`interests.${item}`)}
                    </button>
                  );
                })}
              </div>
            </Field>
            <Field label={t('onboarding.photo')}>
              <input className={inputClass} value={photoUrl} onChange={(event) => setPhotoUrl(event.target.value)} />
            </Field>
          </>
        ) : null}
        {step === 3 ? (
          <label className="flex items-start gap-3 text-sm text-white/80">
            <input type="checkbox" className="mt-1" checked={accepted} onChange={(event) => setAccepted(event.target.checked)} required />
            <span>{t('onboarding.terms')}</span>
          </label>
        ) : null}
        {error ? <p className="text-sm text-red-300">{error}</p> : null}
        <Button type="submit" className="w-full" disabled={busy || (step === 3 && !accepted)}>
          {step === 3 ? t('onboarding.finish') : t('onboarding.next')}
        </Button>
      </form>
    </div>
  );
}
