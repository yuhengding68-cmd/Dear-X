import { useEffect, useState } from 'react';
import {
  BadgeCheck,
  BellRing,
  Camera,
  Check,
  ChevronDown,
  ChevronRight,
  Clock,
  EyeOff,
  Flame,
  Gift as GiftIcon,
  HelpCircle,
  Info,
  LogOut,
  Mail,
  MapPin,
  PenTool,
  Phone,
  Settings,
  Share2,
  ShieldCheck,
  Sparkles,
  Trash2,
  X,
  Smartphone as PhoneIcon,
} from 'lucide-react';
import type { Creator, DatingProfile, KycStatus, MyReportStatus } from '../types';
import { downloadJson } from '../lib/download';
import { useI18n } from '../i18n';
import { useApp } from '../state/AppProvider';
import { normalizeAppPreferences } from '../domain/activity';
import { profileSharePayload } from '../domain/profileEdit';
import { publishedSupportEmail } from '../domain/safetyQueue';
import { OriginalButton, comingSoon } from '../components/ui';
import { EditProfileModal } from './EditProfileModal';

/** Original DearX ProfileView (source-code/App.tsx). Real profile fields come from the repository. */
type ModalName = 'settings' | 'verification' | 'help' | 'edit' | null;
type StepStatus = 'completed' | 'pending';

function maskPhone(phone: string | null): string {
  if (!phone) return '';
  const digits = phone.replace(/\D/g, '');
  const last4 = digits.slice(-4);
  const cc = phone.startsWith('+61') ? '+61' : phone.startsWith('+') ? phone.slice(0, 3) : '';
  const national = digits.slice(cc.replace(/\D/g, '').length);
  const head = national.slice(0, Math.min(3, Math.max(0, national.length - 4)));
  return head ? `${cc} ${head} ••• ${last4}` : `${cc || phone} ••• ${last4}`;
}

function interestLabel(tag: string, t: (key: string) => string): string {
  const key = `interests.${tag}`;
  const label = t(key);
  return label === key ? tag : label;
}

function SettingsModal({
  phone,
  onClose,
  onSignOut,
}: {
  phone: string | null;
  onClose: () => void;
  onSignOut: () => void;
}) {
  const { t, locale, setLocale } = useI18n();
  const { repo, me, go, setNotice, reloadMe } = useApp();
  const [pushEnabled, setPushEnabled] = useState(true);
  const [emailEnabled, setEmailEnabled] = useState(false);
  const [ghostMode, setGhostMode] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [phrase, setPhrase] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const prefs = normalizeAppPreferences(me);
    setPushEnabled(prefs.pushEnabled);
    setEmailEnabled(prefs.emailUpdates);
    setGhostMode(prefs.ghostMode);
  }, [me]);

  const persistPrefs = (next: { pushEnabled: boolean; emailUpdates: boolean; ghostMode: boolean }) => {
    setPushEnabled(next.pushEnabled);
    setEmailEnabled(next.emailUpdates);
    setGhostMode(next.ghostMode);
    void repo
      .saveAppPreferences(next)
      .then(() => reloadMe())
      .catch((caught: unknown) => setError(caught instanceof Error ? caught.message : t('common.error')));
  };

  const Toggle = ({ checked, onChange }: { checked: boolean; onChange: (value: boolean) => void }) => (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`w-12 h-7 rounded-full transition-colors relative ${checked ? 'bg-brand-blue' : 'bg-white/10'}`}
    >
      <div className={`absolute top-1 w-5 h-5 rounded-full bg-white transition-transform shadow-sm ${checked ? 'left-6' : 'left-1'}`} />
    </button>
  );

  const runDelete = () => {
    if (phrase !== t('settings.deleteWord') || busy) return;
    setBusy(true);
    setError(null);
    void repo
      .deleteAccount()
      .then(() => {
        setNotice(t('settings.deleted'));
        return onSignOut();
      })
      .catch((caught: unknown) => {
        setError(caught instanceof Error ? caught.message : t('common.error'));
        setBusy(false);
      });
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fade-in">
      <div className="w-full max-w-md glass-card rounded-3xl p-6 border border-white/20 shadow-2xl animate-slide-up relative max-h-[90vh] overflow-y-auto no-scrollbar">
        <button type="button" onClick={onClose} className="absolute top-4 right-4 text-white/50 hover:text-white">
          <X className="w-6 h-6" />
        </button>

        <div className="text-center mb-6">
          <div className="w-12 h-12 bg-blue-500/20 text-blue-400 rounded-full flex items-center justify-center mx-auto mb-3">
            <Settings className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-white">{t('profile.settings')}</h2>
        </div>

        <div className="mb-6">
          <h3 className="text-sm font-bold text-brand-subtext mb-3 uppercase tracking-wider">{t('profile.account')}</h3>
          <div className="space-y-2">
            <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl">
              <div className="flex items-center gap-3">
                <PhoneIcon className="w-5 h-5 text-white/70" />
                <span className="text-white font-medium">{phone ? maskPhone(phone) : t('profile.noPhone')}</span>
              </div>
              <button type="button" onClick={comingSoon} className="text-xs text-brand-blue font-bold hover:underline">
                {t('profile.change')}
              </button>
            </div>
            <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl">
              <div className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-white/70" />
                <span className="text-white font-medium">{t('profile.linkEmail')}</span>
              </div>
              <button type="button" onClick={comingSoon} className="text-xs text-brand-blue font-bold hover:underline">
                {t('profile.add')}
              </button>
            </div>
          </div>
        </div>

        <div className="mb-6">
          <h3 className="text-sm font-bold text-brand-subtext mb-3 uppercase tracking-wider">{t('profile.notifications')}</h3>
          <div className="bg-white/5 rounded-2xl overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-white/5">
              <div className="flex items-center gap-3">
                <BellRing className="w-5 h-5 text-white/70" />
                <span className="text-white font-medium">{t('profile.push')}</span>
              </div>
              <Toggle checked={pushEnabled} onChange={(value) => persistPrefs({ pushEnabled: value, emailUpdates: emailEnabled, ghostMode })} />
            </div>
            <div className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-white/70" />
                <span className="text-white font-medium">{t('profile.emailUpdates')}</span>
              </div>
              <Toggle checked={emailEnabled} onChange={(value) => persistPrefs({ pushEnabled, emailUpdates: value, ghostMode })} />
            </div>
          </div>
        </div>

        <div className="mb-8">
          <h3 className="text-sm font-bold text-brand-subtext mb-3 uppercase tracking-wider">{t('profile.privacy')}</h3>
          <div className="bg-white/5 rounded-2xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <EyeOff className="w-5 h-5 text-white/70" />
              <div>
                <p className="text-white font-medium">{t('profile.ghost')}</p>
                <p className="text-xs text-brand-subtext">{t('profile.ghostHint')}</p>
              </div>
            </div>
            <Toggle checked={ghostMode} onChange={(value) => persistPrefs({ pushEnabled, emailUpdates: emailEnabled, ghostMode: value })} />
          </div>
        </div>

        <div className="space-y-3">
          <button type="button" onClick={onSignOut} className="w-full py-4 rounded-xl bg-white/5 text-white font-bold hover:bg-white/10 transition-colors flex items-center justify-center gap-2">
            <LogOut className="w-5 h-5" /> {t('profile.signOut')}
          </button>
          <button
            type="button"
            onClick={() => setConfirmingDelete(true)}
            className="w-full py-4 rounded-xl text-red-500/80 font-bold hover:text-red-500 hover:bg-red-500/5 transition-colors flex items-center justify-center gap-2"
          >
            <Trash2 className="w-5 h-5" /> {t('profile.delete')}
          </button>
          {confirmingDelete ? (
            <div className="space-y-2 rounded-2xl bg-white/5 p-4">
              <p className="text-xs text-brand-subtext leading-relaxed">{t('settings.deleteHint')}</p>
              <input
                className="w-full glass-card rounded-xl px-4 py-3 text-white focus:outline-none focus:border-brand-blue"
                value={phrase}
                onChange={(event) => setPhrase(event.target.value)}
                placeholder={t('settings.deleteWord')}
              />
              <button
                type="button"
                disabled={phrase !== t('settings.deleteWord') || busy}
                onClick={runDelete}
                className="w-full py-3 rounded-xl bg-red-500/15 text-red-200 font-bold disabled:opacity-40"
              >
                {t('settings.confirmDelete')}
              </button>
            </div>
          ) : null}
          {error ? <p className="text-sm text-red-300">{error}</p> : null}
        </div>

        <div className="mt-6 text-center text-xs text-brand-subtext">{t('profile.version')}</div>
        <div className="mt-4 flex flex-wrap justify-center gap-x-3 gap-y-2 text-xs text-brand-subtext">
          <button
            type="button"
            className="underline"
            onClick={() =>
              void repo.exportData().then((data) => {
                downloadJson(`dearx-${me?.uid ?? 'export'}.json`, data);
                setNotice(t('settings.exportDone'));
              })
            }
          >
            {t('settings.export')}
          </button>
          <button type="button" className="underline" onClick={() => go({ name: 'legal', doc: 'privacy' })}>
            {t('settings.privacy')}
          </button>
          <button type="button" className="underline" onClick={() => go({ name: 'legal', doc: 'terms' })}>
            {t('settings.terms')}
          </button>
          <button type="button" className="underline" onClick={() => go({ name: 'policy' })}>
            {t('creators.policy')}
          </button>
          <button type="button" className="underline" onClick={() => setLocale(locale === 'en' ? 'zh-CN' : 'en')}>
            {locale === 'en' ? '中文' : 'English'}
          </button>
          {me?.role === 'admin' ? (
            <button type="button" className="underline" onClick={() => go({ name: 'admin' })}>
              {t('settings.admin')}
            </button>
          ) : null}
          <button type="button" className="underline" onClick={() => go({ name: 'studio' })}>
            {t('creators.studio')}
          </button>
          {repo.mode === 'demo' ? (
            <button type="button" className="underline" onClick={() => void repo.resetDemo().then(() => onSignOut())}>
              {t('settings.reset')}
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function VerificationModal({
  onClose,
  phone,
  photo,
  kyc,
}: {
  onClose: () => void;
  phone: StepStatus;
  photo: StepStatus;
  kyc: StepStatus;
}) {
  const { t } = useI18n();
  const steps: { id: number; title: string; icon: typeof Phone; status: StepStatus }[] = [
    { id: 1, title: t('profile.phoneVerified'), icon: Phone, status: phone },
    { id: 2, title: t('profile.photoVerified'), icon: Camera, status: photo },
    { id: 3, title: t('profile.kyc'), icon: ShieldCheck, status: kyc },
  ];
  const statusText = (status: StepStatus) => (status === 'completed' ? t('profile.verified') : t('profile.requiredWithdraw'));

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fade-in">
      <div className="w-full max-w-md glass-card rounded-3xl p-6 border border-white/20 shadow-2xl animate-slide-up relative">
        <button type="button" onClick={onClose} className="absolute top-4 right-4 text-white/50 hover:text-white">
          <X className="w-6 h-6" />
        </button>

        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-green-500/20 text-green-400 rounded-full flex items-center justify-center mx-auto mb-4 border border-green-500/30 shadow-[0_0_20px_rgba(74,222,128,0.2)]">
            <BadgeCheck className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">{t('profile.verifyTitle')}</h2>
          <p className="text-brand-subtext">{t('profile.verifyBody')}</p>
        </div>

        <div className="space-y-4 mb-8">
          {steps.map((step, index) => (
            <div key={step.id} className="relative">
              {index !== steps.length - 1 && (
                <div className={`absolute top-10 left-6 w-0.5 h-6 ${step.status === 'completed' ? 'bg-green-500' : 'bg-white/10'}`}></div>
              )}
              <div
                className={`flex items-center gap-4 p-4 rounded-2xl border transition-all ${
                  step.status === 'completed' ? 'bg-green-500/10 border-green-500/30' : 'bg-white/5 border-white/10'
                }`}
              >
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${
                    step.status === 'completed' ? 'bg-green-500 text-black' : 'bg-white/10 text-white'
                  }`}
                >
                  {step.status === 'completed' ? <Check className="w-6 h-6" /> : <step.icon className="w-5 h-5" />}
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-white">{step.title}</h3>
                  <p className="text-xs text-brand-subtext">{statusText(step.status)}</p>
                </div>
                {step.status === 'pending' ? (
                  <button type="button" onClick={comingSoon} className="px-3 py-1.5 bg-brand-blue text-white text-xs font-bold rounded-lg hover:bg-brand-blue/80">
                    {t('profile.start')}
                  </button>
                ) : null}
              </div>
            </div>
          ))}
        </div>

        <div className="p-4 bg-brand-blue/10 rounded-xl border border-brand-blue/20">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-brand-blue shrink-0 mt-0.5" />
            <p className="text-xs text-brand-blue/90 leading-relaxed">{t('profile.kycNote')}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function HelpModal({ onClose }: { onClose: () => void }) {
  const { t } = useI18n();
  const { repo } = useApp();
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [sent, setSent] = useState<{ id: string; email: string } | null>(null);
  const [reports, setReports] = useState<MyReportStatus[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const email = publishedSupportEmail(import.meta.env.VITE_SUPPORT_EMAIL);
  const faqs = [
    { q: t('profile.faq1q'), a: t('profile.faq1a') },
    { q: t('profile.faq2q'), a: t('profile.faq2a') },
    { q: t('profile.faq3q'), a: t('profile.faq3a') },
    { q: t('profile.faq4q'), a: t('profile.faq4a') },
  ];

  useEffect(() => {
    let cancelled = false;
    void repo.listMyReports().then((rows) => {
      if (!cancelled) setReports(rows);
    }).catch(() => {
      if (!cancelled) setReports([]);
    });
    return () => {
      cancelled = true;
    };
  }, [repo, sent]);

  const submitTicket = () => {
    setError(null);
    setBusy(true);
    void repo
      .createSupportTicket(subject, message)
      .then((ticket) => {
        setSent({ id: ticket.id, email: ticket.supportEmail });
        setSubject('');
        setMessage('');
      })
      .catch(() => setError(t('profile.supportInvalid')))
      .finally(() => setBusy(false));
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fade-in">
      <div data-testid="help-modal" className="w-full max-w-md glass-card rounded-3xl p-6 border border-white/20 shadow-2xl animate-slide-up relative max-h-[90vh] overflow-y-auto no-scrollbar">
        <button type="button" onClick={onClose} className="absolute top-4 right-4 text-white/50 hover:text-white">
          <X className="w-6 h-6" />
        </button>

        <div className="text-center mb-6">
          <div className="w-12 h-12 bg-purple-500/20 text-purple-400 rounded-full flex items-center justify-center mx-auto mb-3">
            <HelpCircle className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-white">{t('profile.helpTitle')}</h2>
        </div>

        <div className="space-y-3 mb-6">
          {faqs.map((faq) => (
            <details key={faq.q} className="group bg-white/5 rounded-2xl overflow-hidden border border-white/5 open:bg-white/10 transition-all">
              <summary className="flex items-center justify-between p-4 cursor-pointer list-none font-bold text-white text-sm">
                {faq.q}
                <ChevronDown className="w-4 h-4 transition-transform group-open:rotate-180 text-brand-subtext" />
              </summary>
              <div className="px-4 pb-4 text-sm text-brand-subtext leading-relaxed">{faq.a}</div>
            </details>
          ))}
        </div>

        <div className="p-4 rounded-2xl bg-gradient-to-br from-brand-blue/20 to-brand-purple/20 border border-white/10 mb-4">
          <h3 className="font-bold text-white mb-1">{t('profile.stillHelp')}</h3>
          <p className="text-xs text-brand-subtext mb-3">{t('profile.supportBody')}</p>
          <p className="mb-3 text-xs text-white/70" data-testid="support-email">
            {email}
          </p>
          <form
            data-testid="support-form"
            className="space-y-2"
            onSubmit={(event) => {
              event.preventDefault();
              submitTicket();
            }}
          >
            <input
              className="w-full glass-card rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-brand-blue"
              value={subject}
              placeholder={t('profile.supportSubject')}
              onChange={(event) => setSubject(event.target.value)}
            />
            <textarea
              className="w-full glass-card rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-brand-blue"
              value={message}
              rows={3}
              placeholder={t('profile.supportMessage')}
              onChange={(event) => setMessage(event.target.value)}
            />
            <OriginalButton type="submit" variant="primary" className="h-10 text-sm" disabled={busy}>
              {t('profile.contact')}
            </OriginalButton>
          </form>
          {sent ? (
            <p data-testid="support-sent" className="mt-3 text-xs text-emerald-200">
              {t('profile.supportSent', { id: sent.id, email: sent.email })}
            </p>
          ) : null}
          {error ? <p className="mt-2 text-xs text-red-300">{error}</p> : null}
        </div>

        <div data-testid="my-reports" className="space-y-2">
          <h3 className="text-sm font-bold text-white">{t('profile.myReports')}</h3>
          {reports.length === 0 ? <p className="text-xs text-brand-subtext">{t('profile.noReports')}</p> : null}
          {reports.map((report) => (
            <p key={report.id} className="text-xs text-brand-subtext">
              {report.reason} · {t(`admin.status.${report.status}`)}
              {report.overdue ? (
                <span data-testid="my-report-sla" className="text-red-300">
                  {` · ${t('profile.reportOverdue')}`}
                </span>
              ) : null}
            </p>
          ))}
        </div>
      </div>
    </div>
  );
}

function kycStep(status: KycStatus | undefined): StepStatus {
  return status === 'verified' ? 'completed' : 'pending';
}

export function ProfileScreen() {
  const { t } = useI18n();
  const { repo, me, session, signOut, setNotice } = useApp();
  const [profile, setProfile] = useState<DatingProfile | null>(null);
  const [creator, setCreator] = useState<Creator | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [modal, setModal] = useState<ModalName>(null);
  const [revision, setRevision] = useState(0);

  useEffect(() => {
    let cancelled = false;
    void Promise.all([repo.getMyProfile(), repo.getMyCreator().catch(() => null)])
      .then(([nextProfile, nextCreator]) => {
        if (cancelled) return;
        setProfile(nextProfile);
        setCreator(nextCreator);
        setLoaded(true);
      })
      .catch(() => {
        if (!cancelled) setLoaded(true);
      });
    return () => {
      cancelled = true;
    };
  }, [repo, revision]);

  const shareProfile = () => {
    if (!profile) return;
    const payload = profileSharePayload(profile, window.location.origin);
    const copy = () => {
      void navigator.clipboard.writeText(payload.url).then(
        () => setNotice(t('profile.linkCopied')),
        () => setNotice(payload.url),
      );
    };
    if (typeof navigator.share !== 'function') {
      copy();
      return;
    }
    void navigator.share(payload).catch((error: unknown) => {
      if (error instanceof DOMException && error.name === 'AbortError') return;
      copy();
    });
  };

  if (!loaded) return null;

  const name = profile?.displayName || me?.displayName || '';
  const place = profile?.city ? `${profile.city}, AU` : '';
  const recentActivity = [
    { id: 1, text: t('profile.actGift'), time: t('profile.time2h'), icon: GiftIcon, color: 'text-brand-yellow' },
    { id: 2, text: t('profile.actLikes'), time: t('profile.time1d'), icon: Flame, color: 'text-red-500' },
    { id: 3, text: t('profile.actVisit'), time: t('profile.time2d'), icon: MapPin, color: 'text-green-500' },
  ];
  const menuItems = [
    { icon: Settings, label: t('profile.settings'), color: 'bg-blue-500/10 text-blue-400', action: () => setModal('settings') },
    { icon: ShieldCheck, label: t('profile.verification'), color: 'bg-green-500/10 text-green-400', action: () => setModal('verification') },
    { icon: HelpCircle, label: t('profile.help'), color: 'bg-purple-500/10 text-purple-400', action: () => setModal('help') },
    { icon: LogOut, label: t('profile.signOut'), color: 'bg-red-500/10 text-red-400', action: () => void signOut() },
  ];
  const stats = [
    { label: t('profile.followers'), val: '1.2k' },
    { label: t('profile.following'), val: '450' },
    { label: t('profile.likes'), val: '8.5k' },
  ];

  return (
    <div className="flex flex-col h-full overflow-y-auto no-scrollbar relative">
      <div className="absolute top-0 left-0 right-0 h-48 bg-gradient-to-b from-brand-blue/20 to-transparent z-0"></div>

      <div className="p-6 flex flex-col items-center relative z-10">
        <div className="relative mb-4 mt-4">
          <div className="w-32 h-32 rounded-full p-1 bg-vibe-gradient shadow-[0_0_30px_rgba(46,92,255,0.4)]">
            {profile?.photoUrl ? (
              <img src={profile.photoUrl} className="w-full h-full rounded-full border-4 border-[#12122A] object-cover" alt="" />
            ) : (
              <div className="w-full h-full rounded-full border-4 border-[#12122A] bg-[#1C1C33] flex items-center justify-center text-4xl font-black">
                {name.slice(0, 1) || '?'}
              </div>
            )}
          </div>
          {profile?.verified ? (
            <div className="absolute bottom-1 right-1 bg-brand-blue text-white p-1.5 rounded-full border-4 border-[#12122A] shadow-lg">
              <BadgeCheck className="w-4 h-4" strokeWidth={3} />
            </div>
          ) : null}
        </div>

        <h2 className="text-3xl font-black text-white mb-1 drop-shadow-lg">
          {name}
          {profile ? `, ${profile.age}` : ''}
        </h2>
        <div className="flex items-center gap-2 text-brand-subtext mb-6 bg-white/5 px-3 py-1 rounded-full backdrop-blur-sm border border-white/5">
          <span className="font-mono">@{profile?.uid || me?.uid || ''}</span>
          <span>•</span>
          <MapPin className="w-3 h-3" />
          <span>{place}</span>
        </div>
        {me?.warning?.message ? (
          <p data-testid="account-warning" className="mb-6 max-w-sm text-center text-xs text-amber-200">
            {t('profile.warningBanner')}: {me.warning.message}
          </p>
        ) : null}

        <div className="flex gap-3 w-full mb-8">
          <OriginalButton data-testid="edit-profile" variant="glass" className="flex-1 h-12 rounded-xl font-bold border-white/10 bg-white/5" onClick={() => setModal('edit')}>
            <PenTool className="w-4 h-4" /> {t('profile.edit')}
          </OriginalButton>
          <OriginalButton data-testid="share-profile" variant="primary" className="flex-1 h-12 rounded-xl font-bold shadow-glow-vibe" onClick={shareProfile}>
            <Share2 className="w-4 h-4" /> {t('profile.share')}
          </OriginalButton>
        </div>

        <div className="flex gap-4 w-full justify-between px-4 mb-8">
          {stats.map((stat) => (
            <button key={stat.label} type="button" onClick={comingSoon} className="text-center flex-1 p-3 rounded-2xl hover:bg-white/5 transition-colors cursor-pointer">
              <p className="text-2xl font-black text-white mb-1">{stat.val}</p>
              <p className="text-[10px] text-brand-subtext uppercase tracking-wider font-bold">{stat.label}</p>
            </button>
          ))}
        </div>

        <div className="w-full mb-6 text-left">
          <h3 className="text-white font-bold mb-3 flex items-center gap-2">
            <Info className="w-4 h-4 text-brand-blue" /> {t('profile.about')}
          </h3>
          <div className="glass-card p-4 rounded-2xl text-white/80 text-sm leading-relaxed">{profile?.bio}</div>
        </div>

        <div className="w-full mb-8 text-left">
          <h3 className="text-white font-bold mb-3 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-brand-yellow" /> {t('profile.interests')}
          </h3>
          <div className="flex flex-wrap gap-2">
            {(profile?.interests ?? []).map((tag) => (
              <div key={tag} className="px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-xs font-bold text-white/90 hover:bg-white/10 transition-colors cursor-default">
                #{interestLabel(tag, t)}
              </div>
            ))}
          </div>
        </div>

        <div className="w-full mb-8 text-left">
          <h3 className="text-white font-bold mb-3 flex items-center gap-2">
            <Clock className="w-4 h-4 text-brand-purple" /> {t('profile.activity')}
          </h3>
          <div className="space-y-3">
            {recentActivity.map((act) => (
              <div key={act.id} className="flex items-center gap-4 p-3 rounded-2xl hover:bg-white/5 transition-colors">
                <div className={`w-10 h-10 rounded-full bg-white/5 flex items-center justify-center border border-white/5 ${act.color}`}>
                  <act.icon className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold text-white">{act.text}</p>
                  <p className="text-xs text-brand-subtext">{act.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="w-full space-y-3 pb-6">
          {menuItems.map((item) => (
            <button
              key={item.label}
              type="button"
              onClick={item.action}
              className="w-full flex items-center justify-between p-4 rounded-2xl glass-card hover:bg-white/10 transition-all group"
            >
              <div className="flex items-center gap-4">
                <div className={`p-2 rounded-xl ${item.color} group-hover:scale-110 transition-transform`}>
                  <item.icon className="w-5 h-5" />
                </div>
                <span className="font-bold text-white">{item.label}</span>
              </div>
              <ChevronRight className="w-5 h-5 text-brand-subtext" />
            </button>
          ))}
        </div>
      </div>

      {modal === 'edit' ? (
        <EditProfileModal
          onClose={() => setModal(null)}
          onSaved={() => setRevision((value) => value + 1)}
        />
      ) : null}
      {modal === 'settings' ? <SettingsModal phone={session?.phone ?? me?.phone ?? null} onClose={() => setModal(null)} onSignOut={() => void signOut()} /> : null}
      {modal === 'verification' ? (
        <VerificationModal
          onClose={() => setModal(null)}
          phone={session?.phone || me?.phone ? 'completed' : 'pending'}
          photo={profile?.verified ? 'completed' : 'pending'}
          kyc={kycStep(creator?.kycStatus)}
        />
      ) : null}
      {modal === 'help' ? <HelpModal onClose={() => setModal(null)} /> : null}
    </div>
  );
}
