import type { AppConfig } from '../config';
import { useI18n } from '../i18n';
import { Logo } from '../components/ui';

export function SetupScreen({ reason }: { reason: Extract<AppConfig, { ok: false }>['reason'] }) {
  const { t } = useI18n();
  return (
    <main className="mx-auto flex min-h-screen max-w-xl flex-col justify-center gap-6 px-6">
      <Logo />
      <h1 className="font-display text-3xl font-semibold">{t('setup.title')}</h1>
      <p className="text-white/70">{t('setup.body')}</p>
      <p className="text-white/70">{reason === 'invalid-mode' ? t('setup.invalid') : t('setup.demo')}</p>
      <p className="text-white/70">{t('setup.firebase')}</p>
    </main>
  );
}
