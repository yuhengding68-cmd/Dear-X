import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  ArrowDown,
  ArrowUp,
  Crown,
  Flame,
  Gem,
  Gift as GiftIcon,
  Heart,
  Image as ImageIcon,
  MapPin,
  MessageCircle,
  Minus,
  MoreHorizontal,
  Send,
  X,
} from 'lucide-react';
import { comingSoon } from '../components/ui';
import { useI18n } from '../i18n';
import { useApp } from '../state/AppProvider';

type Trend = 'up' | 'down' | 'same';

type BoardEntry = {
  id: string;
  rank: number;
  name: string;
  avatar: string;
  value: string;
  trend: Trend;
};

type MomentPost = {
  id: string;
  authorName: string;
  authorAvatar: string;
  contentKey: 'compass.post1' | 'compass.post2' | 'compass.post3';
  image?: string;
  likes: number;
  comments: number;
  showComments: boolean;
  isLiked: boolean;
};

type LiveCard = {
  id: string;
  streamerName: string;
  streamerAvatar: string;
  titleKey: 'compass.live1' | 'compass.live2' | 'compass.live3';
  thumbnail: string;
  viewers: number;
};

/** Design-draft leaderboard, moments, and livestream cards. No payout or live backend. */
const POPULAR: BoardEntry[] = [
  { id: 'lb3', rank: 1, name: 'Sarah Kim', avatar: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=200&h=200&fit=crop', value: '125k 🔥', trend: 'up' },
  { id: 'lb1', rank: 2, name: 'Jessica Li', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop', value: '98k 🔥', trend: 'up' },
  { id: 'lb4', rank: 3, name: 'Emily Davis', avatar: 'https://images.unsplash.com/photo-1517365830460-955ce3ccd263?w=200&h=200&fit=crop', value: '85k 🔥', trend: 'down' },
  { id: 'lb2', rank: 4, name: 'Grace', avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&h=200&fit=crop', value: '72k 🔥', trend: 'same' },
  { id: 'lb5', rank: 5, name: 'Lily', avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&h=200&fit=crop', value: '64k 🔥', trend: 'up' },
  { id: 'lb6', rank: 6, name: 'Zoe', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=200&fit=crop', value: '55k 🔥', trend: 'down' },
];

const INCOME: BoardEntry[] = [
  { id: 'lb1', rank: 1, name: 'Jessica Li', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop', value: '$2,450', trend: 'up' },
  { id: 'lb2', rank: 2, name: 'Grace', avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&h=200&fit=crop', value: '$1,920', trend: 'same' },
  { id: 'lb3', rank: 3, name: 'Sarah Kim', avatar: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=200&h=200&fit=crop', value: '$1,850', trend: 'down' },
  { id: 'lb4', rank: 4, name: 'Emily Davis', avatar: 'https://images.unsplash.com/photo-1517365830460-955ce3ccd263?w=200&h=200&fit=crop', value: '$1,200', trend: 'up' },
  { id: 'lb5', rank: 5, name: 'Lily', avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&h=200&fit=crop', value: '$980', trend: 'up' },
  { id: 'lb6', rank: 6, name: 'Zoe', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=200&fit=crop', value: '$850', trend: 'down' },
  { id: 'lb7', rank: 7, name: 'Anna', avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200&h=200&fit=crop', value: '$720', trend: 'same' },
];

const POSTS: MomentPost[] = [
  {
    id: 'p1',
    authorName: 'Sarah Kim',
    authorAvatar: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=200&h=200&fit=crop',
    contentKey: 'compass.post1',
    image: 'https://images.unsplash.com/photo-1544531586-fde5298cdd40?w=800&h=500&fit=crop',
    likes: 124,
    comments: 2,
    showComments: true,
    isLiked: false,
  },
  {
    id: 'p2',
    authorName: 'Emily Davis',
    authorAvatar: 'https://images.unsplash.com/photo-1517365830460-955ce3ccd263?w=200&h=200&fit=crop',
    contentKey: 'compass.post2',
    likes: 45,
    comments: 32,
    showComments: false,
    isLiked: true,
  },
  {
    id: 'p3',
    authorName: 'Jessica Li',
    authorAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop',
    contentKey: 'compass.post3',
    likes: 210,
    comments: 56,
    showComments: false,
    isLiked: false,
  },
];

const STREAMS: LiveCard[] = [
  {
    id: 'l1',
    streamerName: 'Sarah Kim',
    streamerAvatar: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=200&h=200&fit=crop',
    titleKey: 'compass.live1',
    thumbnail: 'https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?w=800&fit=crop',
    viewers: 1205,
  },
  {
    id: 'l2',
    streamerName: 'Grace',
    streamerAvatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&h=200&fit=crop',
    titleKey: 'compass.live2',
    thumbnail: 'https://images.unsplash.com/photo-1512413314640-c3185b58afaa?w=800&fit=crop',
    viewers: 850,
  },
  {
    id: 'l3',
    streamerName: 'Jessica Li',
    streamerAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop',
    titleKey: 'compass.live3',
    thumbnail: 'https://images.unsplash.com/photo-1555126634-323283e090fa?w=800&fit=crop',
    viewers: 2300,
  },
];

const GIFTS: { id: string; nameKey: string; price: number; icon: string }[] = [
  { id: 'g8', nameKey: 'compass.giftCastle', price: 500, icon: '🏰' },
  { id: 'g5', nameKey: 'compass.giftCar', price: 100, icon: '🏎️' },
  { id: 'g7', nameKey: 'compass.giftBag', price: 75, icon: '👜' },
  { id: 'g4', nameKey: 'compass.giftDiamond', price: 50, icon: '💎' },
  { id: 'g3', nameKey: 'compass.giftPerfume', price: 25, icon: '🧴' },
  { id: 'g6', nameKey: 'compass.giftBear', price: 15, icon: '🧸' },
  { id: 'g2', nameKey: 'compass.giftCoffee', price: 10, icon: '☕' },
  { id: 'g1', nameKey: 'compass.giftRose', price: 5, icon: '🌹' },
];

function GiftSheet({ onClose }: { onClose: () => void }) {
  const { t } = useI18n();
  return (
    <div className="fixed inset-0 z-[65] flex items-end justify-center bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="absolute inset-0" onClick={onClose} />
      <div className="w-full max-w-md bg-[#1C1C33] rounded-t-3xl p-6 border-t border-white/20 shadow-2xl animate-slide-up relative z-10">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-white font-bold text-lg flex items-center gap-2">
            {t('compass.sendGift')} <Gem className="w-4 h-4 text-brand-yellow" />
          </h3>
          <button type="button" onClick={onClose} className="p-1 text-white/50 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="grid grid-cols-4 gap-4 mb-6">
          {GIFTS.map((gift) => (
            <button
              key={gift.id}
              type="button"
              onClick={() => {
                onClose();
                comingSoon();
              }}
              className="flex flex-col items-center gap-2 p-2 rounded-xl hover:bg-white/5 transition-colors group"
            >
              <div className="w-12 h-12 flex items-center justify-center text-3xl bg-white/5 rounded-full group-hover:scale-110 transition-transform">
                {gift.icon}
              </div>
              <div className="text-center">
                <p className="text-xs font-bold text-white">{t(gift.nameKey)}</p>
                <p className="text-[10px] text-brand-yellow flex items-center justify-center gap-0.5">
                  <Gem className="w-3 h-3" /> {gift.price}
                </p>
              </div>
            </button>
          ))}
        </div>
        <div className="flex justify-between items-center p-3 bg-white/5 rounded-xl">
          <div className="flex items-center gap-2">
            <Gem className="w-5 h-5 text-brand-yellow" />
            <span className="text-white font-bold">{t('compass.gems')}</span>
          </div>
          <button
            type="button"
            onClick={() => {
              onClose();
              comingSoon();
            }}
            className="text-brand-blue text-sm font-bold hover:underline"
          >
            {t('compass.topUp')}
          </button>
        </div>
      </div>
    </div>
  );
}

function LiveRoom({ stream, onClose }: { stream: LiveCard; onClose: () => void }) {
  const { t } = useI18n();
  const [giftsOpen, setGiftsOpen] = useState(false);
  const comments = [
    { id: 'c1', authorName: 'Alex', text: t('compass.commentAlex') },
    { id: 'c2', authorName: 'Sam', text: t('compass.commentSam') },
  ];
  const room = (
    <div className="fixed inset-0 z-[60] bg-black flex flex-col h-full w-full">
      <img src={stream.thumbnail} className="absolute inset-0 w-full h-full object-cover opacity-60" alt="" />
      <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/60" />
      <div className="relative flex-1 flex flex-col p-4 z-10">
        <div className="flex items-center justify-between mt-2">
          <div className="flex items-center gap-2 bg-black/20 backdrop-blur-md rounded-full p-1 pr-4 border border-white/10">
            <img src={stream.streamerAvatar} className="w-9 h-9 rounded-full border border-white/20" alt="" />
            <div>
              <h3 className="text-sm font-bold text-white leading-none">{stream.streamerName}</h3>
              <div className="flex items-center gap-1 mt-0.5">
                <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
                <span className="text-[10px] text-white/80">{t('compass.watching', { n: stream.viewers })}</span>
              </div>
            </div>
          </div>
          <button type="button" onClick={onClose} className="p-2 bg-black/20 backdrop-blur-md rounded-full text-white hover:bg-white/10 border border-white/10">
            <X className="w-6 h-6" />
          </button>
        </div>
        <div className="flex-1 flex items-center justify-center pointer-events-none" />
        <div className="h-48 overflow-y-auto mask-image-t fade-mask-t space-y-2 mb-4 no-scrollbar">
          {comments.map((c) => (
            <div key={c.id} className="flex items-start gap-2 animate-slide-up">
              <div className="font-bold text-white/60 text-sm whitespace-nowrap">{c.authorName}:</div>
              <div className="text-white text-sm">{c.text}</div>
            </div>
          ))}
        </div>
        <div className="flex items-center gap-3 mb-4">
          <div className="flex-1 bg-black/40 backdrop-blur-md rounded-full h-12 flex items-center px-4 border border-white/10">
            <input
              type="text"
              placeholder={t('compass.say')}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault();
                  comingSoon();
                }
              }}
              className="bg-transparent border-none text-white w-full focus:outline-none placeholder-white/50 text-sm"
            />
          </div>
          <button type="button" onClick={() => setGiftsOpen(true)} className="w-12 h-12 rounded-full bg-brand-yellow text-black flex items-center justify-center shadow-glow-cyber hover:scale-110 transition-transform">
            <GiftIcon className="w-6 h-6" />
          </button>
          <button type="button" onClick={comingSoon} className="w-12 h-12 rounded-full bg-white/10 text-white flex items-center justify-center backdrop-blur-md border border-white/10 hover:bg-white/20">
            <Heart className="w-6 h-6" />
          </button>
        </div>
      </div>
      {giftsOpen ? <GiftSheet onClose={() => setGiftsOpen(false)} /> : null}
    </div>
  );
  return createPortal(room, document.body);
}

function MomentsFeed() {
  const { t } = useI18n();
  const { repo } = useApp();
  const [mePhoto, setMePhoto] = useState<string | null>(null);
  useEffect(() => {
    void repo.getMyProfile().then((profile) => setMePhoto(profile?.photoUrl ?? null));
  }, [repo]);

  return (
    <div className="flex flex-col gap-6 animate-fade-in pb-20">
      <div className="flex items-center gap-3 p-4 glass-card rounded-2xl">
        {mePhoto ? (
          <img src={mePhoto} className="w-10 h-10 rounded-full object-cover border-2 border-brand-blue" alt="" />
        ) : (
          <div className="w-10 h-10 rounded-full border-2 border-brand-blue bg-white/10" />
        )}
        <div
          onClick={comingSoon}
          className="flex-1 bg-white/5 rounded-full h-10 flex items-center px-4 text-brand-subtext text-sm hover:bg-white/10 transition-colors cursor-text"
        >
          {t('compass.share')}
        </div>
        <button type="button" onClick={comingSoon} className="p-2 text-brand-blue hover:bg-white/5 rounded-full transition-colors">
          <ImageIcon className="w-5 h-5" />
        </button>
      </div>

      {POSTS.map((post) => (
        <div key={post.id} className="glass-card rounded-3xl overflow-hidden transition-all hover:border-white/20">
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <img src={post.authorAvatar} className="w-10 h-10 rounded-full object-cover border border-white/10" alt="" />
              <div>
                <h3 className="font-bold text-white text-sm">{post.authorName}</h3>
                <p className="text-xs text-brand-subtext">{t('compass.ago')}</p>
              </div>
            </div>
            <button type="button" onClick={comingSoon} className="text-brand-subtext hover:text-white">
              <MoreHorizontal className="w-5 h-5" />
            </button>
          </div>
          {post.image ? (
            <div className="w-full aspect-square bg-black/50 relative">
              <img src={post.image} className="w-full h-full object-cover" alt="" />
            </div>
          ) : null}
          <div className="flex items-center justify-between px-4 pt-4">
            <div className="flex items-center gap-4">
              <button type="button" onClick={comingSoon} className={`flex items-center gap-1.5 ${post.isLiked ? 'text-brand-blue' : 'text-white/80 hover:text-white'}`}>
                <Heart className={`w-6 h-6 ${post.isLiked ? 'fill-current' : ''}`} />
                <span className="font-bold text-sm">{post.likes}</span>
              </button>
              <button type="button" onClick={comingSoon} className="flex items-center gap-1.5 text-white/80 hover:text-white">
                <MessageCircle className="w-6 h-6" />
                <span className="font-bold text-sm">{post.comments}</span>
              </button>
              <button type="button" onClick={comingSoon} className="text-white/80 hover:text-white">
                <Send className="w-6 h-6" />
              </button>
            </div>
            <button type="button" onClick={comingSoon} className="text-brand-subtext hover:text-brand-yellow transition-colors">
              <GiftIcon className="w-6 h-6" />
            </button>
          </div>
          <div className="p-4">
            <p className="text-sm text-white/90 leading-relaxed">
              <span className="font-bold mr-2">{post.authorName}</span>
              {t(post.contentKey)}
            </p>
            {post.showComments ? (
              <div onClick={comingSoon} className="mt-3 text-xs text-brand-subtext">
                {t('compass.viewComments', { n: post.comments })}
              </div>
            ) : null}
          </div>
        </div>
      ))}
    </div>
  );
}

function Ranking({ board, kind }: { board: BoardEntry[]; kind: 'popular' | 'income' }) {
  const top3 = board.slice(0, 3);
  const rest = board.slice(3);
  const podium = [top3[1], top3[0], top3[2]].filter((entry): entry is BoardEntry => Boolean(entry));
  const valueClass = kind === 'popular' ? 'text-brand-blue' : 'text-brand-yellow';

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex justify-center items-end gap-4 pt-12 pb-4 relative h-64">
        <div className="absolute top-10 left-1/2 -translate-x-1/2 w-full h-40 bg-brand-blue/20 blur-[60px] rounded-full pointer-events-none" />
        {podium.map((user) => {
          const isFirst = user.rank === 1;
          const isSecond = user.rank === 2;
          return (
            <div
              key={user.id}
              className={`flex flex-col items-center z-10 relative transition-all duration-500
                ${isFirst ? 'order-2 mb-10 scale-110' : ''}
                ${isSecond ? 'order-1 mb-4' : ''}
                ${user.rank === 3 ? 'order-3 mb-0 scale-95' : ''}
              `}
            >
              {isFirst ? (
                <div className="absolute -top-10 animate-bounce">
                  <Crown className="w-8 h-8 text-yellow-400 fill-yellow-400 drop-shadow-glow-cyber" />
                </div>
              ) : null}
              <div className="relative mb-2">
                <div
                  className={`rounded-full p-[3px] shadow-2xl ${
                    isFirst
                      ? 'bg-gradient-to-b from-yellow-300 via-yellow-500 to-yellow-700 shadow-yellow-500/50'
                      : isSecond
                        ? 'bg-gradient-to-b from-slate-300 to-slate-500 shadow-slate-400/50'
                        : 'bg-gradient-to-b from-amber-600 to-amber-800 shadow-amber-600/50'
                  }`}
                >
                  <img
                    src={user.avatar}
                    alt={user.name}
                    className={`rounded-full object-cover border-4 border-[#12122A] ${isFirst ? 'w-28 h-28' : 'w-20 h-20'}`}
                  />
                </div>
                <div
                  className={`absolute -bottom-3 left-1/2 -translate-x-1/2 w-7 h-7 rounded-full flex items-center justify-center text-sm font-black border-4 border-[#12122A] ${
                    isFirst ? 'bg-yellow-400 text-black' : isSecond ? 'bg-slate-300 text-black' : 'bg-amber-700 text-white'
                  }`}
                >
                  {user.rank}
                </div>
              </div>
              <h3 className={`font-bold mt-3 ${isFirst ? 'text-xl' : 'text-sm'} text-white`}>{user.name}</h3>
              <div className={`font-black flex items-center gap-1 ${valueClass}`}>
                {kind === 'popular' ? <Flame className="w-3 h-3 fill-current" /> : null}
                {user.value}
              </div>
            </div>
          );
        })}
      </div>
      <div className="space-y-2 pb-20">
        {rest.map((user) => (
          <div key={user.id} className="flex items-center gap-4 p-4 bg-white/5 border border-white/5 rounded-2xl hover:bg-white/10 transition-all">
            <span className="w-6 text-center font-bold text-brand-subtext">{user.rank}</span>
            <img src={user.avatar} className="w-10 h-10 rounded-full object-cover" alt="" />
            <div className="flex-1">
              <h4 className="font-bold text-sm text-white">{user.name}</h4>
            </div>
            <div className={`font-bold text-sm ${valueClass}`}>{user.value}</div>
            {user.trend === 'up' ? <ArrowUp className="w-4 h-4 text-green-400" /> : null}
            {user.trend === 'down' ? <ArrowDown className="w-4 h-4 text-red-400" /> : null}
            {user.trend === 'same' ? <Minus className="w-4 h-4 text-gray-500" /> : null}
          </div>
        ))}
      </div>
    </div>
  );
}

/** Original DiscoverView (compass tab): Moments, Live, and Ranking. */
export function CompassScreen() {
  const { t } = useI18n();
  const [activeTab, setActiveTab] = useState<'moments' | 'live' | 'ranking'>('ranking');
  const [rankingTab, setRankingTab] = useState<'income' | 'popular'>('popular');
  const [stream, setStream] = useState<LiveCard | null>(null);
  const board = rankingTab === 'popular' ? POPULAR : INCOME;
  const tabs = ['moments', 'live', 'ranking'] as const;

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-2 shrink-0">
        <div className="flex p-1 glass-card rounded-2xl border border-white/5">
          {tabs.map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2.5 text-sm font-bold rounded-xl transition-all capitalize ${
                activeTab === tab ? 'bg-vibe-gradient text-white shadow-lg' : 'text-brand-subtext hover:text-white'
              }`}
            >
              {t(`compass.tab.${tab}`)}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto min-h-0 px-4 pb-6 no-scrollbar space-y-4">
        {activeTab === 'ranking' ? (
          <div className="animate-fade-in space-y-6">
            <div className="flex justify-center gap-4">
              <button
                type="button"
                onClick={() => setRankingTab('popular')}
                className={`px-6 py-2 rounded-full text-sm font-bold border transition-all ${
                  rankingTab === 'popular'
                    ? 'bg-brand-blue/20 border-brand-blue text-brand-blue shadow-[0_0_15px_rgba(46,92,255,0.3)] backdrop-blur-sm'
                    : 'bg-transparent border-white/10 text-brand-subtext'
                }`}
              >
                {t('compass.popular')}
              </button>
              <button
                type="button"
                onClick={() => setRankingTab('income')}
                className={`px-6 py-2 rounded-full text-sm font-bold border transition-all ${
                  rankingTab === 'income'
                    ? 'bg-brand-yellow/20 border-brand-yellow text-brand-yellow shadow-[0_0_15px_rgba(255,211,0,0.3)] backdrop-blur-sm'
                    : 'bg-transparent border-white/10 text-brand-subtext'
                }`}
              >
                {t('compass.income')}
              </button>
            </div>
            <div className="flex items-center justify-between px-2">
              <span className="text-sm font-bold text-brand-subtext flex items-center gap-1">
                <MapPin className="w-3 h-3" /> {t('compass.within')}
              </span>
              <span className="text-xs text-brand-subtext">{t('compass.resets')}</span>
            </div>
            <Ranking board={board} kind={rankingTab} />
          </div>
        ) : null}

        {activeTab === 'moments' ? <MomentsFeed /> : null}

        {activeTab === 'live' ? (
          <div className="grid grid-cols-2 gap-3 animate-fade-in">
            {STREAMS.map((item) => (
              <div key={item.id} className="relative aspect-[3/4] rounded-2xl overflow-hidden group cursor-pointer" onClick={() => setStream(item)}>
                <img src={item.thumbnail} className="w-full h-full object-cover transition-transform group-hover:scale-110" alt="" />
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/80" />
                <div className="absolute top-2 right-2 bg-red-600 px-2 py-0.5 rounded text-[10px] font-bold uppercase flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" /> {t('compass.liveBadge')}
                </div>
                <div className="absolute bottom-3 left-3 right-3">
                  <h3 className="text-sm font-bold text-white line-clamp-1">{t(item.titleKey)}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <img src={item.streamerAvatar} className="w-4 h-4 rounded-full" alt="" />
                    <span className="text-xs text-white/80">{item.streamerName}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : null}
      </div>

      {stream ? <LiveRoom stream={stream} onClose={() => setStream(null)} /> : null}
    </div>
  );
}
