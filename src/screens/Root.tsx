import type { ReactNode } from 'react';
import { Bell, Compass, Filter, Gem, MessageCircle, User as UserIcon, Wallet } from 'lucide-react';
import { ComingSoonToast, comingSoon, LanguageButton, Logo, LogoX, ModePill, TopBar } from '../components/ui';
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
import { ProfileScreen } from './ProfileScreen';
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

  if (app.route.name === 'main' && app.session) {
    const tab = app.route.tab;
    // Original DearX shell: same header and 5 bottom tabs, same order. Unbuilt features show "Coming soon".
    const navItems: { key: string; active: boolean; onClick: () => void; color: string; dot: string; icon: ReactNode }[] = [
      { key: 'swipe', active: tab === 'discover', onClick: () => app.go({ name: 'main', tab: 'discover' }), color: 'text-brand-blue bg-brand-blue/10', dot: 'bg-brand-blue', icon: <div className="w-6 h-6 flex items-center justify-center"><LogoX className="w-5 h-5" /></div> },
      { key: 'discover', active: false, onClick: comingSoon, color: 'text-brand-purple bg-brand-purple/10', dot: 'bg-brand-purple', icon: <Compass className="w-6 h-6" /> },
      { key: 'messages', active: tab === 'chats', onClick: () => app.go({ name: 'main', tab: 'chats' }), color: 'text-white bg-white/10', dot: 'bg-white', icon: <MessageCircle className="w-6 h-6" /> },
      { key: 'wallet', active: false, onClick: comingSoon, color: 'text-brand-yellow bg-brand-yellow/10', dot: 'bg-brand-yellow', icon: <Wallet className="w-6 h-6" /> },
      { key: 'profile', active: tab === 'profile', onClick: () => app.go({ name: 'main', tab: 'profile' }), color: 'text-white bg-white/10', dot: 'bg-white', icon: <UserIcon className="w-6 h-6" /> },
    ];
    return (
      <div className="h-screen w-full flex flex-col bg-[#12122A] text-white overflow-hidden relative font-sans">
        <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
          <div className="absolute top-[-20%] left-[-20%] w-[80vw] h-[80vw] bg-brand-blue/30 rounded-full blur-[100px] animate-pulse"></div>
          <div className="absolute bottom-[-20%] right-[-20%] w-[80vw] h-[80vw] bg-brand-purple/30 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '2s' }}></div>
        </div>
        <header className="fixed top-0 left-0 right-0 h-16 glass-nav z-50 flex items-center justify-between px-4">
          <div className="flex flex-col items-center justify-center leading-none select-none cursor-pointer" onClick={() => app.go({ name: 'main', tab: 'discover' })}>
            <span className="text-[10px] font-black tracking-[0.25em] text-white">DEAR</span>
            <span className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-br from-brand-blue to-brand-purple -mt-1">X</span>
          </div>
          <div className="flex items-center gap-3">
            {tab === 'discover' && (
              <button type="button" onClick={comingSoon} className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center border border-white/10 backdrop-blur-sm active:scale-95 transition-transform hover:bg-white/20">
                <Filter className="w-4 h-4 text-white" />
              </button>
            )}
            {/* Diamond balance: display only, no client money logic. Shows 0 until gifts are built. */}
            <button type="button" onClick={comingSoon} className="bg-white/5 px-3 py-1.5 rounded-full flex items-center gap-2 border border-white/5 backdrop-blur-sm">
              <Gem className="w-4 h-4 text-brand-yellow" />
              <span className="text-sm font-bold text-white">0</span>
              {app.repo.mode === 'demo' ? <span className="text-[9px] font-bold text-brand-subtext uppercase">{t('look.demoBalance')}</span> : null}
            </button>
            <button type="button" onClick={comingSoon} className="w-9 h-9 rounded-full bg-white/5 flex items-center justify-center relative">
              <Bell className="w-5 h-5 text-white" />
            </button>
          </div>
        </header>
        <main className="flex-1 flex flex-col relative z-10 overflow-hidden pt-16 pb-24">
          {app.notice ? <p className="px-4 pt-3 text-sm text-emerald-200">{app.notice}</p> : null}
          {app.error ? <p className="px-4 pt-3 text-sm text-red-300">{app.error}</p> : null}
          <div className={tab === 'discover' || tab === 'profile' ? 'flex-1 relative min-h-0' : 'flex-1 overflow-y-auto'}>
            {tab === 'discover' ? <DiscoverScreen /> : null}
            {tab === 'matches' ? <MatchesScreen /> : null}
            {tab === 'chats' ? <ChatListScreen /> : null}
            {tab === 'creators' ? <CreatorListScreen /> : null}
            {tab === 'safety' ? <SafetyScreen /> : null}
            {tab === 'profile' ? <ProfileScreen /> : null}
          </div>
        </main>
        <nav className="fixed bottom-0 left-0 right-0 h-20 glass-nav border-t border-white/5 flex items-center justify-around px-2 z-50 pb-2">
          {navItems.map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={item.onClick}
              className={`p-3 rounded-2xl transition-all ${item.active ? item.color : 'text-brand-subtext hover:text-white'}`}
            >
              <div className="relative">
                {item.icon}
                {item.active && <div className={`absolute -bottom-2 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full ${item.dot}`}></div>}
              </div>
            </button>
          ))}
        </nav>
        <ComingSoonToast />
      </div>
    );
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
