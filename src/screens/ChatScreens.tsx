import { useEffect, useState } from 'react';
import type { Chat, DatingProfile, Match, Message } from '../types';
import { useI18n } from '../i18n';
import { useApp } from '../state/AppProvider';
import { Avatar, Button, inputClass } from '../components/ui';
import { ReportDialog } from '../components/ReportDialog';

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

export function ChatListScreen() {
  const { t } = useI18n();
  const { repo, go } = useApp();
  const [rows, setRows] = useState<Array<{ chat: Chat; profile: DatingProfile | null }>>([]);
  useEffect(() => {
    void repo.getChats().then(setRows);
  }, [repo]);
  if (rows.length === 0) return <p className="px-4 py-10 text-white/60">{t('chat.empty')}</p>;
  return (
    <ul className="divide-y divide-white/10">
      {rows.map(({ chat, profile }) => (
        <li key={chat.id}>
          <button type="button" className="w-full px-4 py-4 text-left" onClick={() => go({ name: 'chat', chatId: chat.id })}>
            <span className="block font-semibold">{profile?.displayName}</span>
            <span className="line-clamp-1 text-sm text-white/50">{chat.lastMessageText}</span>
          </button>
        </li>
      ))}
    </ul>
  );
}

export function ChatThreadScreen({ chatId }: { chatId: string }) {
  const { t } = useI18n();
  const { repo, me } = useApp();
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [reporting, setReporting] = useState(false);
  const [otherId, setOtherId] = useState<string | null>(null);

  const load = () => {
    void repo.getMessages(chatId).then(setMessages);
    void repo.getChats().then((chats) => {
      const chat = chats.find((item) => item.chat.id === chatId);
      if (!chat || !me) return;
      const other = chat.chat.participantIds.find((id) => id !== me.uid) ?? null;
      setOtherId(other);
    });
  };

  useEffect(load, [repo, chatId, me]);

  return (
    <div className="flex min-h-[70vh] flex-col">
      <p className="px-4 pt-3 text-sm text-white/50">{t('chat.free')}</p>
      <div className="flex-1 space-y-2 px-4 py-4">
        {messages.map((message) => {
          const mine = message.senderId === me?.uid;
          return (
            <p key={message.id} className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${mine ? 'ml-auto bg-white text-black' : 'bg-white/10'}`}>
              {message.text}
            </p>
          );
        })}
      </div>
      {error ? <p className="px-4 text-sm text-red-300">{error}</p> : null}
      <form
        className="flex gap-2 px-4 pb-4"
        onSubmit={(event) => {
          event.preventDefault();
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
        }}
      >
        <input className={inputClass} value={text} placeholder={t('chat.placeholder')} onChange={(event) => setText(event.target.value)} />
        <Button type="submit">{t('chat.send')}</Button>
      </form>
      {otherId ? (
        <div className="flex gap-4 px-4 pb-6 text-sm text-white/60">
          <button type="button" onClick={() => setReporting(true)}>
            {t('common.report')}
          </button>
          <button type="button" onClick={() => void repo.blockUser(otherId).then(() => setError(t('chat.blocked')))}>
            {t('common.block')}
          </button>
        </div>
      ) : null}
      {reporting && otherId ? (
        <ReportDialog
          target={{ targetUserId: otherId, targetType: 'message', targetId: messages.at(-1)?.id ?? otherId }}
          onClose={() => setReporting(false)}
          onSubmit={(input) => repo.fileReport(input).then(() => undefined)}
        />
      ) : null}
    </div>
  );
}
