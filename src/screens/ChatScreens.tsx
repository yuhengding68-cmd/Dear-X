import { useEffect, useRef, useState } from 'react';
import { BadgeCheck, Check, ChevronLeft, Flag, Gift as GiftIcon, Mic, Phone, Plus, Send, ShieldAlert, Sticker, Video, X } from 'lucide-react';
import type { Chat, DatingProfile, Match, Message, PresenceView, ReportReason } from '../types';
import { useI18n } from '../i18n';
import { useApp } from '../state/AppProvider';
import { Avatar, OriginalButton, comingSoon } from '../components/ui';

export function MatchesScreen() {
  const { t } = useI18n();
  const { repo, go } = useApp();
  const [rows, setRows] = useState<Array<{ match: Match; profile: DatingProfile | null }>>([]);
  useEffect(() => {
    void repo.getMatches().then(setRows);
  }, [repo]);
  if (rows.length === 0) return <p className="px-4 py-10 text-white/60">{t('matches.empty')}</p>;
  return (
    <ul className="divide-y divide-white/10">
      {rows.map(({ match, profile }) => (
        <li key={match.id}>
          <button type="button" className="flex w-full items-center gap-3 px-4 py-4 text-left" onClick={() => go({ name: 'chat', chatId: match.chatId })}>
            <div className="h-12 w-12 overflow-hidden rounded-full">
              <Avatar name={profile?.displayName ?? '?'} src={profile?.photoUrl ?? null} />
            </div>
            <span>
              <span className="block font-semibold">{profile?.displayName ?? t('matches.title')}</span>
              <span className="text-sm text-white/50">{t('chat.free')}</span>
            </span>
          </button>
        </li>
      ))}
    </ul>
  );
}

function formatAgo(iso: string | null, t: (key: string, vars?: Record<string, string | number>) => string): string {
  if (!iso) return t('connect.justNow');
  const minutes = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  if (minutes < 1) return t('connect.justNow');
  if (minutes < 60) return t('connect.minutesAgo', { n: minutes });
  const hours = Math.round(minutes / 60);
  if (hours < 24) return t('connect.hoursAgo', { n: hours });
  return t('connect.daysAgo', { n: Math.round(hours / 24) });
}

function formatStamp(iso: string, locale: string, t: (key: string, vars?: Record<string, string | number>) => string): string {
  const date = new Date(iso);
  const tag = locale === 'zh-CN' ? 'zh-CN' : 'en-US';
  const time = date.toLocaleTimeString(tag, { hour: 'numeric', minute: '2-digit' });
  if (date.toDateString() === new Date().toDateString()) return t('connect.today', { time });
  const day = date.toLocaleDateString(tag, { month: 'short', day: 'numeric' });
  return `${day} ${time}`;
}

function otherId(ids: string[], mine: string | undefined): string | null {
  if (!mine) return null;
  return ids.find((id) => id !== mine) ?? null;
}

function presenceLine(view: PresenceView | undefined, t: (key: string, vars?: Record<string, string | number>) => string): string | null {
  if (!view) return null;
  if (view.online) return t('connect.online');
  if (view.minutesAgo == null || view.minutesAgo <= 0) return null;
  if (view.minutesAgo < 60) return t('connect.onlineMinutes', { n: view.minutesAgo });
  const hours = Math.floor(view.minutesAgo / 60);
  if (hours < 1 || hours >= 24) return null;
  return t('connect.onlineHours', { n: hours });
}

function Face({ src, name, className }: { src: string | null | undefined; name: string; className: string }) {
  if (!src) {
    return <div className={`${className} bg-vibe-gradient flex items-center justify-center font-black text-white`}>{name.slice(0, 1) || '?'}</div>;
  }
  return <img src={src} className={className} alt="" />;
}

/** Original ChatListView (source-code/App.tsx). Chats and friends come from real matches and messages. */
export function ChatListScreen() {
  const { t } = useI18n();
  const { repo, go, me } = useApp();
  const [tab, setTab] = useState<'chats' | 'friends'>('chats');
  const [chats, setChats] = useState<Array<{ chat: Chat; profile: DatingProfile | null }>>([]);
  const [friends, setFriends] = useState<Array<{ match: Match; profile: DatingProfile | null }>>([]);
  const [mePhoto, setMePhoto] = useState<string | null>(null);
  const [meName, setMeName] = useState('');
  const [presence, setPresence] = useState<Record<string, PresenceView>>({});

  useEffect(() => {
    void repo.getChats().then(setChats);
    void repo.getMatches().then(setFriends);
    void repo.getMyProfile().then((profile) => {
      setMePhoto(profile?.photoUrl ?? null);
      setMeName(profile?.displayName ?? '');
    });
  }, [repo]);

  useEffect(() => {
    const mine = me?.uid;
    const ids = [
      ...chats.map((row) => otherId(row.chat.participantIds, mine)),
      ...friends.map((row) => otherId(row.match.userIds, mine)),
    ].filter((id): id is string => Boolean(id));
    const unique = [...new Set(ids)];
    if (unique.length === 0) return;
    void repo.getChatPresence(unique).then((rows) => {
      const next: Record<string, PresenceView> = {};
      for (const row of rows) next[row.uid] = row;
      setPresence(next);
    });
  }, [repo, me?.uid, chats, friends]);

  const openChat = (chatId: string) => go({ name: 'chat', chatId });

  return (
    <div className="flex flex-col h-full">
      <div className="px-6 py-4 pb-2">
        <h2 className="text-3xl font-bold text-white mb-4">{t('connect.title')}</h2>

        <div className="flex gap-4 overflow-x-auto no-scrollbar mb-6 -mx-6 px-6 pb-2 min-h-[90px] items-start">
          <button type="button" onClick={comingSoon} className="flex flex-col items-center gap-2 min-w-[72px] cursor-pointer group">
            <div className="relative">
              <Face src={mePhoto} name={meName} className="w-16 h-16 rounded-full object-cover border-2 border-white/10 opacity-60" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="bg-white/10 p-2 rounded-full backdrop-blur-sm group-hover:bg-white/20 transition-colors">
                  <Plus className="w-5 h-5 text-white" />
                </div>
              </div>
            </div>
            <span className="text-xs text-brand-subtext font-medium">{t('connect.myStory')}</span>
          </button>

          {chats.map(({ chat, profile }) => (
            <button key={chat.id} type="button" onClick={() => openChat(chat.id)} className="flex flex-col items-center gap-2 min-w-[72px] cursor-pointer group">
              <div className="relative p-[3px] rounded-full transition-all bg-transparent border-2 border-white/5 hover:border-white/20">
                <div className="bg-[#12122A] p-[2px] rounded-full">
                  <Face src={profile?.photoUrl} name={profile?.displayName ?? ''} className="w-14 h-14 rounded-full object-cover" />
                </div>
              </div>
              <span className="text-xs font-medium truncate w-16 text-center text-brand-subtext">{profile?.displayName}</span>
            </button>
          ))}
        </div>

        <div className="flex p-1 glass-card rounded-2xl border border-white/5">
          <button
            type="button"
            onClick={() => setTab('chats')}
            className={`flex-1 py-2.5 text-sm font-bold rounded-xl transition-all ${tab === 'chats' ? 'bg-vibe-gradient text-white shadow-lg' : 'text-brand-subtext hover:text-white'}`}
          >
            {t('connect.chats')}
          </button>
          <button
            type="button"
            onClick={() => setTab('friends')}
            className={`flex-1 py-2.5 text-sm font-bold rounded-xl transition-all ${tab === 'friends' ? 'bg-vibe-gradient text-white shadow-lg' : 'text-brand-subtext hover:text-white'}`}
          >
            {t('connect.friends')}
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-6 no-scrollbar space-y-2 mt-2">
        {tab === 'chats' ? (
          chats.length > 0 ? (
            chats.map(({ chat, profile }) => {
              const partner = otherId(chat.participantIds, me?.uid);
              const online = partner ? presence[partner]?.online === true : false;
              return (
              <div
                key={chat.id}
                onClick={() => openChat(chat.id)}
                className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 transition-all cursor-pointer group"
              >
                <div className="relative">
                  <Face src={profile?.photoUrl} name={profile?.displayName ?? ''} className="w-14 h-14 rounded-full object-cover group-hover:scale-105 transition-transform" />
                  {online ? <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 border-2 border-[#1C1C33] rounded-full"></div> : null}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center mb-1">
                    <h3 className="font-bold text-white truncate">{profile?.displayName}</h3>
                    <span className="text-xs text-brand-subtext">{formatAgo(chat.lastMessageAt, t)}</span>
                  </div>
                  <p className="text-brand-subtext text-sm truncate">{chat.lastMessageText}</p>
                </div>
              </div>
              );
            })
          ) : (
            <div className="text-center text-brand-subtext mt-10">{t('connect.noChats')}</div>
          )
        ) : friends.length > 0 ? (
          <div className="grid grid-cols-2 gap-3">
            {friends.map(({ match, profile }) => {
              const partner = otherId(match.userIds, me?.uid);
              const line = presenceLine(partner ? presence[partner] : undefined, t);
              return (
              <div
                key={match.id}
                onClick={() => openChat(match.chatId)}
                className="glass-card p-4 rounded-3xl flex flex-col items-center gap-3 cursor-pointer hover:bg-white/5 transition-colors relative group"
              >
                <div className="relative">
                  <Face src={profile?.photoUrl} name={profile?.displayName ?? ''} className="w-20 h-20 rounded-full object-cover group-hover:scale-105 transition-transform border-2 border-white/5" />
                  {profile?.verified ? (
                    <div className="absolute bottom-0 right-0 bg-brand-blue p-1 rounded-full border-2 border-[#1C1C33]">
                      <BadgeCheck className="w-3 h-3 text-white" />
                    </div>
                  ) : null}
                </div>
                <div className="text-center">
                  <h3 className="font-bold text-white">{profile?.displayName}</h3>
                  {line ? <p className="text-xs text-brand-subtext">{line}</p> : null}
                </div>
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    openChat(match.chatId);
                  }}
                  className="w-full py-2 rounded-xl bg-white/5 text-brand-blue text-xs font-bold hover:bg-brand-blue hover:text-white transition-colors"
                >
                  {t('connect.sayHi')}
                </button>
              </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center text-brand-subtext mt-10">{t('connect.noFriends')}</div>
        )}
      </div>
    </div>
  );
}

const REPORT_CHOICES: { id: string; label: string; reason: ReportReason }[] = [
  { id: 'inappropriate_content', label: 'connect.reasonInappropriate', reason: 'other' },
  { id: 'harassment', label: 'connect.reasonHarassment', reason: 'harassment' },
  { id: 'fake_profile', label: 'connect.reasonFake', reason: 'other' },
  { id: 'spam', label: 'connect.reasonSpam', reason: 'spam' },
  { id: 'other', label: 'connect.reasonOther', reason: 'other' },
];

/** Original ChatRoomView. Sending, reporting, and blocking use the existing repository. */
export function ChatThreadScreen({ chatId }: { chatId: string }) {
  const { t, locale } = useI18n();
  const { repo, me, back } = useApp();
  const [messages, setMessages] = useState<Message[]>([]);
  const [partner, setPartner] = useState<DatingProfile | null>(null);
  const [otherId, setOtherId] = useState<string | null>(null);
  const [text, setText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [reportingId, setReportingId] = useState<string | null>(null);
  const [presence, setPresence] = useState<PresenceView | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const load = () => {
    void repo.getMessages(chatId).then(setMessages);
    void repo.getChats().then((rows) => {
      const row = rows.find((item) => item.chat.id === chatId);
      if (!row || !me) return;
      setPartner(row.profile);
      setOtherId(row.chat.participantIds.find((id) => id !== me.uid) ?? null);
    });
  };

  useEffect(load, [repo, chatId, me]);

  useEffect(() => {
    if (!otherId) return;
    void repo.getChatPresence([otherId]).then((rows) => setPresence(rows[0] ?? null));
  }, [repo, otherId]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  const send = () => {
    const body = text.trim();
    if (!body) return;
    void repo
      .sendMessage(chatId, body)
      .then(() => {
        setText('');
        setError(null);
        load();
      })
      .catch((caught: unknown) => setError(caught instanceof Error ? caught.message : t('chat.blocked')));
  };

  const stamp = messages[0] ? formatStamp(messages[0].createdAt, locale, t) : t('connect.today', { time: '' }).trim();
  const name = partner?.displayName ?? '';
  const line = presenceLine(presence ?? undefined, t);

  return (
    <div className="flex flex-col h-full bg-[#12122A]">
      <div className="h-16 shrink-0 glass-nav px-4 flex items-center justify-between z-20">
        <div className="flex items-center gap-3">
          <button type="button" onClick={back} className="p-2 -ml-2 text-white/80 hover:text-white rounded-full hover:bg-white/10">
            <ChevronLeft className="w-6 h-6" />
          </button>
          <div className="relative">
            <Face src={partner?.photoUrl} name={name} className="w-10 h-10 rounded-full object-cover border border-white/10" />
            {presence?.online ? <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border border-[#12122A]"></div> : null}
          </div>
          <div>
            <h3 className="font-bold text-white leading-tight">{name}</h3>
            {line ? (
              <p data-testid="chat-presence" className="text-xs text-brand-subtext flex items-center gap-1">
                {line}
                {presence?.online ? <span className="w-1 h-1 bg-green-500 rounded-full"></span> : null}
              </p>
            ) : null}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button type="button" onClick={comingSoon} className="p-2 text-brand-blue bg-brand-blue/10 rounded-full hover:bg-brand-blue/20 transition-colors">
            <Phone className="w-5 h-5" />
          </button>
          <button type="button" onClick={comingSoon} className="p-2 text-brand-purple bg-brand-purple/10 rounded-full hover:bg-brand-purple/20 transition-colors">
            <Video className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4" ref={scrollRef}>
        <div className="text-center text-xs text-brand-subtext my-4 glass-pill inline-block px-3 py-1 rounded-full mx-auto">{stamp}</div>
        <div className="flex justify-center my-4">
          <div className="glass-card rounded-2xl p-3 flex flex-col items-center gap-1 border border-white/10">
            <div className="bg-brand-yellow/20 p-2 rounded-full mb-1">
              <GiftIcon className="w-4 h-4 text-brand-yellow" />
            </div>
            <p className="text-xs text-brand-subtext">
              {t('connect.sentA')}
              <span className="text-brand-yellow font-bold">{t('connect.coffee')}</span>
            </p>
          </div>
        </div>
        {messages.map((message) => {
          const mine = message.senderId === me?.uid;
          return (
            <div key={message.id} className={`flex ${mine ? 'justify-end' : 'justify-start'} group items-end gap-2`}>
              {!mine ? (
                <button
                  type="button"
                  onClick={() => setReportingId(message.id)}
                  className="mb-2 p-1.5 text-white/40 hover:text-red-400"
                  title={t('connect.reportMessage')}
                >
                  <Flag className="w-3 h-3" />
                </button>
              ) : null}
              <div
                className={`max-w-[75%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                  mine ? 'bg-vibe-gradient text-white rounded-tr-none shadow-glow-vibe' : 'glass-card text-white rounded-tl-none border-white/5'
                }`}
              >
                {message.text}
              </div>
            </div>
          );
        })}
      </div>

      <div className="shrink-0 p-4 pb-8 glass-nav">
        {error ? <p className="mb-2 text-xs text-red-300">{error}</p> : null}
        <div className="flex items-center gap-3">
          <button type="button" onClick={comingSoon} className="text-brand-yellow hover:scale-110 transition-transform">
            <GiftIcon className="w-7 h-7" />
          </button>
          <div className="flex-1 bg-white/5 rounded-full border border-white/10 flex items-center px-2 focus-within:bg-white/10 transition-colors">
            <input
              type="text"
              value={text}
              onChange={(event) => setText(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault();
                  send();
                }
              }}
              placeholder={t('connect.placeholder')}
              className="flex-1 bg-transparent border-none text-white px-3 py-3 focus:outline-none placeholder-white/30"
            />
            <button type="button" onClick={comingSoon} className="p-2 text-white/50 hover:text-white">
              <Sticker className="w-5 h-5" />
            </button>
          </div>
          {text ? (
            <button type="button" onClick={send} className="p-3 bg-brand-blue rounded-full text-white shadow-lg animate-fade-in">
              <Send className="w-5 h-5" />
            </button>
          ) : (
            <button type="button" onClick={comingSoon} className="p-3 text-white/50 hover:text-white">
              <Mic className="w-6 h-6" />
            </button>
          )}
        </div>
      </div>

      {reportingId && otherId ? (
        <ChatReportModal
          userName={name}
          userId={otherId}
          messageId={reportingId}
          onClose={() => setReportingId(null)}
        />
      ) : null}
    </div>
  );
}

function ChatReportModal({
  userName,
  userId,
  messageId,
  onClose,
}: {
  userName: string;
  userId: string;
  messageId: string;
  onClose: () => void;
}) {
  const { t } = useI18n();
  const { repo } = useApp();
  const [selected, setSelected] = useState<string | null>(null);
  const [alsoBlock, setAlsoBlock] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [blocked, setBlocked] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = () => {
    const choice = REPORT_CHOICES.find((item) => item.id === selected);
    if (!choice) return;
    setError(null);
    void repo
      .fileReport({
        targetUserId: userId,
        targetType: 'message',
        targetId: messageId,
        reason: choice.reason,
        details: t(choice.label),
      })
      .then(async () => {
        if (alsoBlock) {
          await repo.blockUser(userId);
          setBlocked(true);
        }
        setSubmitted(true);
        window.setTimeout(onClose, 1500);
      })
      .catch((caught: unknown) => setError(caught instanceof Error ? caught.message : t('common.error')));
  };

  if (submitted) {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fade-in">
        <div className="w-full max-w-sm glass-card rounded-3xl p-8 flex flex-col items-center text-center animate-slide-up">
          <div className="w-16 h-16 bg-green-500/20 text-green-400 rounded-full flex items-center justify-center mb-4">
            <Check className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">{t('connect.reportReceived')}</h3>
          <p className="text-brand-subtext mb-4">
            {t('connect.reportThanks')}
            {blocked ? <span className="block mt-2 text-red-400">{t('connect.userBlocked')}</span> : null}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fade-in">
      <div className="w-full max-w-md glass-card rounded-3xl p-6 border border-white/20 shadow-2xl animate-slide-up relative">
        <button type="button" onClick={onClose} className="absolute top-4 right-4 text-white/50 hover:text-white">
          <X className="w-6 h-6" />
        </button>
        <div className="text-center mb-6">
          <div className="w-12 h-12 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mx-auto mb-3">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-white">{t('connect.reportTitle', { name: userName })}</h2>
          <p className="text-brand-subtext text-sm mt-1">{t('connect.reportingContent')}</p>
        </div>
        <div className="space-y-2 mb-6">
          {REPORT_CHOICES.map((choice) => (
            <button
              key={choice.id}
              type="button"
              onClick={() => setSelected(choice.id)}
              className={`w-full p-4 rounded-xl text-left font-medium transition-all ${
                selected === choice.id ? 'bg-red-500/20 border border-red-500 text-white' : 'bg-white/5 border border-white/5 text-white/70 hover:bg-white/10'
              }`}
            >
              {t(choice.label)}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-3 mb-6 px-2">
          <button
            type="button"
            onClick={() => setAlsoBlock(!alsoBlock)}
            className={`w-6 h-6 rounded-md border flex items-center justify-center transition-colors ${alsoBlock ? 'bg-red-500 border-red-500' : 'border-white/30 bg-transparent'}`}
          >
            {alsoBlock ? <Check className="w-4 h-4 text-white" /> : null}
          </button>
          <span className="text-sm text-white/90">{t('connect.alsoBlock')}</span>
        </div>
        {error ? <p className="mb-3 text-sm text-red-300">{error}</p> : null}
        <OriginalButton
          variant={selected ? 'primary' : 'secondary'}
          className={selected ? 'bg-red-500 shadow-glow-vibe border-red-400' : ''}
          onClick={submit}
          disabled={!selected}
        >
          {t('connect.submitReport')}
        </OriginalButton>
      </div>
    </div>
  );
}
