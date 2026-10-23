import { LanguageButton, Logo, ModePill, TopBar } from '../components/ui';
import { useI18n } from '../i18n';
import { useApp, type Tab } from '../state/AppProvider';
import { AdminScreen } from './AdminScreen';
import { AuthScreen } from './AuthScreen';
import { ChatListScreen, ChatThreadScreen, MatchesScreen } from './ChatScreens';
import { CreatorListScreen, CreatorProfileScreen, StudioScreen } from './CreatorsScreen';
import { DiscoverScreen } from './DiscoverScreen';
import { LandingScreen } from './LandingScreen';
import { LegalScreen } from './LegalScreen';
import { OnboardingScreen } from './OnboardingScreen';
import { PolicyScreen } from './PolicyScreen';
import { SafetyScreen } from './SafetyScreen';
import { SettingsScreen } from './SettingsScreen';

const TABS: Tab[] = ['discover', 'matches', 'chats', 'creators', 'safety'];

export function Root() {
  const { t } = useI18n();
  const app = useApp();
  if (app.booting) {
    return <p className="px-6 py-16 text-white/60">{t('common.loading')}</p>;
  }
  if (app.route.name === 'landing') return <LandingScreen />;
  if (app.route.name === 'legal') return <LegalScreen doc={app.route.doc} />;
  if (app.route.name === 'auth') return <AuthScreen />;
  if (app.route.name === 'onboarding') return <OnboardingScreen />;
  if (app.route.name === 'age-blocked') {
    return (
      <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-4 px-6">
        <h1 className="font-display text-3xl font-semibold">{t('onboarding.blockedTitle')}</h1>
        <p className="text-white/70">{t('onboarding.blockedBody')}</p>
        <button type="button" className="text-left text-white/70" onClick={() => void app.signOut()}>
          {t('onboarding.leave')}
        </button>
      </div>
    );
  }
  if (app.route.name === 'policy') return <PolicyScreen />;

  const signedOut = !app.session;
  const publicSafety = app.route.name === 'main' && app.route.tab === 'safety' && signedOut;
  if (signedOut && !publicSafety) {
    return <AuthScreen />;
  }

  const title = (() => {
    if (app.route.name === 'chat') return t('chat.title');
    if (app.route.name === 'creator') return t('creators.title');
    if (app.route.name === 'studio') return t('creators.studio');
    if (app.route.name === 'admin') return t('admin.title');
    if (app.route.name === 'settings') return t('settings.title');
    if (app.route.name === 'main') return t(`nav.${app.route.tab === 'chats' ? 'chat' : app.route.tab}`);
    return 'DearX';
  })();

  const showBack = app.route.name !== 'main';

  return (
    <div className="mx-auto min-h-screen max-w-md pb-24">
      <TopBar
        title={title}
        onBack={showBack ? app.back : undefined}
        extra={
          <>
            <ModePill mode={app.repo.mode} />
            <LanguageButton />
            {app.session ? (
              <button type="button" className="text-sm text-white/70" onClick={() => app.go({ name: 'settings' })}>
                {t('settings.title')}
              </button>
            ) : (
              <Logo compact />
            )}
          </>
        }
      />
      {app.notice ? <p className="px-4 pt-3 text-sm text-emerald-200">{app.notice}</p> : null}
      {app.error ? <p className="px-4 pt-3 text-sm text-red-300">{app.error}</p> : null}
      {app.route.name === 'main' && app.route.tab === 'discover' ? <DiscoverScreen /> : null}
      {app.route.name === 'main' && app.route.tab === 'matches' ? <MatchesScreen /> : null}
      {app.route.name === 'main' && app.route.tab === 'chats' ? <ChatListScreen /> : null}
      {app.route.name === 'main' && app.route.tab === 'creators' ? <CreatorListScreen /> : null}
      {app.route.name === 'main' && app.route.tab === 'safety' ? <SafetyScreen /> : null}
      {app.route.name === 'chat' ? <ChatThreadScreen chatId={app.route.chatId} /> : null}
      {app.route.name === 'creator' ? <CreatorProfileScreen creatorId={app.route.creatorId} /> : null}
      {app.route.name === 'studio' ? <StudioScreen /> : null}
      {app.route.name === 'admin' ? <AdminScreen /> : null}
      {app.route.name === 'settings' ? <SettingsScreen /> : null}
      <nav className="fixed inset-x-0 bottom-0 border-t border-white/10 bg-[#050505]/95">
        <div className="mx-auto grid max-w-md grid-cols-5">
          {TABS.map((tab) => (
            <button
              key={tab}
              type="button"
              className={`px-1 py-3 text-xs ${app.route.name === 'main' && app.route.tab === tab ? 'text-white' : 'text-white/45'}`}
              onClick={() => {
                if (!app.session && tab !== 'safety') {
                  app.go({ name: 'auth' });
                  return;
                }
                app.go({ name: 'main', tab });
              }}
            >
              {t(`nav.${tab === 'chats' ? 'chat' : tab}`)}
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}
