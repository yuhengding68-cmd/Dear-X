import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { BadgeCheck, Gift as GiftIcon, Info, MapPin, Search, RotateCcw, ThumbsUp, X } from 'lucide-react';
import type { DatingProfile } from '../types';
import { useI18n } from '../i18n';
import { useApp } from '../state/AppProvider';
import { OriginalButton, comingSoon } from '../components/ui';
import { ReportDialog } from '../components/ReportDialog';

interface SwipeableCardRef {
  triggerSwipe: (direction: 'left' | 'right') => Promise<void>;
}

/** Original SwipeableCard (source-code/App.tsx). Gift/paid actions removed; report/block added. */
const SwipeableCard = forwardRef<SwipeableCardRef, {
  profile: DatingProfile;
  onSwipe: (direction: 'left' | 'right') => void;
  onSafetyClick: () => void;
}>(({ profile, onSwipe, onSafetyClick }, ref) => {
  const { t } = useI18n();
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [swipeResult, setSwipeResult] = useState<'like' | 'nope' | null>(null);
  const photos = profile.photoUrls?.length ? profile.photoUrls : profile.photoUrl ? [profile.photoUrl] : [];
  const [photoIndex, setPhotoIndex] = useState(0);
  const cardRef = useRef<HTMLDivElement>(null);
  const startPos = useRef({ x: 0, y: 0 });

  const reset = () => {
    setOffset({ x: 0, y: 0 });
    setRotation(0);
    setSwipeResult(null);
  };

  useImperativeHandle(ref, () => ({
    triggerSwipe: async (direction) => {
      setOffset({ x: direction === 'right' ? 1000 : -1000, y: 0 });
      setRotation(direction === 'right' ? 20 : -20);
      setSwipeResult(direction === 'right' ? 'like' : 'nope');
      await new Promise((r) => setTimeout(r, 300));
      onSwipe(direction);
      reset();
    },
  }));

  const point = (e: React.TouchEvent | React.MouseEvent) =>
    'touches' in e ? { x: e.touches[0].clientX, y: e.touches[0].clientY } : { x: (e as React.MouseEvent).clientX, y: (e as React.MouseEvent).clientY };

  const handleTouchStart = (e: React.TouchEvent | React.MouseEvent) => {
    setIsDragging(true);
    startPos.current = point(e);
  };

  const handleTouchMove = (e: React.TouchEvent | React.MouseEvent) => {
    if (!isDragging) return;
    const p = point(e);
    const deltaX = p.x - startPos.current.x;
    setOffset({ x: deltaX, y: p.y - startPos.current.y });
    setRotation(deltaX * 0.05);
    if (deltaX > 100) setSwipeResult('like');
    else if (deltaX < -100) setSwipeResult('nope');
    else setSwipeResult(null);
  };

  const handleTouchEnd = (e: React.TouchEvent | React.MouseEvent) => {
    if (!isDragging) return;
    setIsDragging(false);
    // Tap (no movement): left half = previous photo, right half = next photo (original behaviour).
    if (Math.abs(offset.x) < 5 && Math.abs(offset.y) < 5) {
      const clientX = 'changedTouches' in e ? e.changedTouches[0].clientX : (e as React.MouseEvent).clientX;
      if (cardRef.current) {
        const { left, width } = cardRef.current.getBoundingClientRect();
        if (clientX - left < width / 2) setPhotoIndex((prev) => Math.max(0, prev - 1));
        else setPhotoIndex((prev) => Math.min(photos.length - 1, prev + 1));
      }
      reset();
      return;
    }
    if (Math.abs(offset.x) > 150) {
      const direction = offset.x > 0 ? 'right' : 'left';
      setOffset({ x: offset.x > 0 ? 1000 : -1000, y: 0 });
      setTimeout(() => {
        onSwipe(direction);
        reset();
      }, 300);
    } else {
      reset();
    }
  };

  return (
    <div className="absolute inset-0 w-full h-full flex items-center justify-center p-4 pointer-events-none" style={{ zIndex: 10 }}>
      <div
        ref={cardRef}
        className="w-full h-full relative rounded-3xl overflow-hidden shadow-float pointer-events-auto transition-transform duration-100 ease-out bg-[#1C1C33]"
        style={{
          transform: `translate(${offset.x}px, ${offset.y}px) rotate(${rotation}deg) scale(${isDragging ? 1.05 : 1})`,
          transition: isDragging ? 'none' : 'transform 0.4s cubic-bezier(0.2, 0.8, 0.2, 1)',
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleTouchStart}
        onMouseMove={handleTouchMove}
        onMouseUp={handleTouchEnd}
        onMouseLeave={handleTouchEnd}
      >
        {/* Photo Navigation Indicators */}
        <div className="absolute top-2 left-2 right-2 flex gap-1 z-30">
          {photos.map((_, i) => (
            <div key={i} className={`h-1 flex-1 rounded-full transition-colors ${i === photoIndex ? 'bg-white' : 'bg-white/30'}`} />
          ))}
        </div>

        {photos[photoIndex] ? (
          <img src={photos[photoIndex]} alt={profile.displayName} className="w-full h-full object-cover select-none pointer-events-none" draggable={false} />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-vibe-gradient text-7xl font-black">{profile.displayName.slice(0, 1)}</div>
        )}

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent opacity-100 pointer-events-none" />

        {/* Status Stamps */}
        {swipeResult === 'like' && (
          <div className="absolute top-10 left-10 rotate-[-20deg] border-4 border-brand-blue text-brand-blue px-4 py-2 rounded-xl text-4xl font-black tracking-widest bg-brand-dark/20 backdrop-blur-sm z-20 shadow-[0_0_20px_rgba(46,92,255,0.5)]">
            LIKE
          </div>
        )}
        {swipeResult === 'nope' && (
          <div className="absolute top-10 right-10 rotate-[20deg] border-4 border-red-500 text-red-500 px-4 py-2 rounded-xl text-4xl font-black tracking-widest bg-brand-dark/20 backdrop-blur-sm z-20 shadow-[0_0_20px_rgba(239,68,68,0.5)]">
            NOPE
          </div>
        )}

        {/* Info Content */}
        <div className="absolute bottom-0 left-0 right-0 p-6 pb-6 text-white pointer-events-none">
          <div className="flex items-end justify-between mb-2">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h2 className="text-3xl font-bold drop-shadow-lg">{profile.displayName}, {profile.age}</h2>
                {profile.verified && (
                  <div className="flex items-center gap-1 bg-brand-blue/90 backdrop-blur-sm px-2 py-0.5 rounded-full border border-white/20 shadow-[0_0_15px_rgba(46,92,255,0.5)] ml-1">
                    <BadgeCheck className="w-3.5 h-3.5 text-white" strokeWidth={3} />
                    <span className="text-[10px] font-bold text-white uppercase tracking-wider">Real</span>
                  </div>
                )}
                <button
                  type="button"
                  aria-label={t('look.about')}
                  onMouseDown={(e) => e.stopPropagation()}
                  onTouchStart={(e) => e.stopPropagation()}
                  onClick={(e) => { e.stopPropagation(); onSafetyClick(); }}
                  className="glass-pill p-1.5 rounded-full hover:bg-white/20 transition-colors ml-1 pointer-events-auto"
                >
                  <Info className="w-4 h-4 text-white" />
                </button>
              </div>

              <div className="flex items-center gap-2 text-white/90 mb-3 drop-shadow-md">
                {profile.distanceKm !== null && (
                  <div className="flex items-center gap-1 glass-pill px-2 py-0.5 rounded-lg">
                    <MapPin className="w-3 h-3" />
                    <span className="text-sm font-medium">{profile.distanceKm}km</span>
                  </div>
                )}
                {profile.city && (
                  <div className="flex items-center gap-1 glass-pill px-2 py-0.5 rounded-lg">
                    <span className="text-sm font-medium">{profile.city}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <p className="text-white/80 line-clamp-2 text-sm drop-shadow-md leading-relaxed mt-2 font-medium">{profile.bio}</p>
        </div>
      </div>
    </div>
  );
});
SwipeableCard.displayName = 'SwipeableCard';

/** Original SwipeView layout, wired to repo like/pass, report and block. */
export function DiscoverScreen() {
  const { t } = useI18n();
  const { repo, go } = useApp();
  const [cards, setCards] = useState<DatingProfile[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [matchChat, setMatchChat] = useState<string | null>(null);
  const [safetyMenu, setSafetyMenu] = useState(false);
  const [reporting, setReporting] = useState(false);
  const cardRef = useRef<SwipeableCardRef>(null);

  const load = () => {
    void repo
      .getDiscovery()
      .then((next) => {
        setCards(next);
        setLoaded(true);
      })
      .catch((caught: unknown) => setError(caught instanceof Error ? caught.message : t('common.error')));
  };

  useEffect(load, [repo, t]);

  const currentProfile = cards[0];

  const handleSwipe = (direction: 'left' | 'right') => {
    if (!currentProfile) return;
    if (direction === 'right') {
      void repo.likeUser(currentProfile.uid).then((result) => {
        if (result.matched && result.chatId) setMatchChat(result.chatId);
        load();
      });
    } else {
      void repo.passUser(currentProfile.uid).then(load);
    }
  };

  if (!currentProfile) {
    if (!loaded && !error) return null;
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-8 animate-fade-in">
        <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center mb-6 animate-pulse">
          <Search className="w-10 h-10 text-brand-subtext" />
        </div>
        <h2 className="text-2xl font-bold mb-2">{t('look.everyone')}</h2>
        <p className="text-brand-subtext mb-8">{error ?? t('look.everyoneBody')}</p>
        <OriginalButton onClick={load} variant="outline" icon={RotateCcw}>
          {t('look.startOver')}
        </OriginalButton>
      </div>
    );
  }

  const next = cards[1];

  return (
    <div className="relative h-full w-full flex flex-col">
      {/* Cards Area */}
      <div className="flex-1 relative w-full overflow-hidden">
        {next && (
          <div className="absolute inset-0 w-full h-full flex items-center justify-center p-4">
            <div className="w-full h-full bg-[#1C1C33] rounded-3xl opacity-50 scale-95 border border-white/5">
              {next.photoUrl ? <img src={next.photoUrl} className="w-full h-full object-cover rounded-3xl grayscale opacity-30" alt="" /> : null}
            </div>
          </div>
        )}
        <SwipeableCard key={currentProfile.uid} ref={cardRef} profile={currentProfile} onSwipe={handleSwipe} onSafetyClick={() => setSafetyMenu(true)} />
      </div>

      {/* Static Action Bar Footer */}
      <div className="h-24 px-6 pb-4 flex items-center justify-center gap-6 z-20 shrink-0">
        <button
          type="button"
          aria-label={t('discover.pass')}
          onClick={() => void cardRef.current?.triggerSwipe('left')}
          className="w-14 h-14 rounded-full glass-card border border-white/10 text-red-500 flex items-center justify-center shadow-lg hover:bg-red-500/10 hover:scale-110 transition-all"
        >
          <X className="w-7 h-7" strokeWidth={3} />
        </button>
        {/* Super Gift — kept from the original; gifts are not built yet. */}
        <button
          type="button"
          onClick={comingSoon}
          className="w-20 h-20 rounded-full bg-cyber-gradient text-black flex items-center justify-center shadow-glow-cyber hover:scale-105 transition-all relative group"
        >
          <GiftIcon className="w-10 h-10 group-hover:animate-bounce" />
          <div className="absolute -bottom-8 bg-brand-yellow/10 text-brand-yellow text-[10px] font-bold px-2 py-0.5 rounded-full border border-brand-yellow/20 opacity-0 group-hover:opacity-100 transition-opacity">
            SEND GIFT
          </div>
        </button>
        <button
          type="button"
          aria-label={t('discover.like')}
          onClick={() => void cardRef.current?.triggerSwipe('right')}
          className="w-14 h-14 rounded-full glass-card border border-white/10 text-brand-blue flex items-center justify-center shadow-lg hover:bg-brand-blue/10 hover:scale-110 transition-all"
        >
          <ThumbsUp className="w-7 h-7 fill-current" />
        </button>
      </div>

      {safetyMenu ? (
        <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in" onClick={() => setSafetyMenu(false)}>
          <div className="w-full max-w-md glass-card rounded-3xl p-4 space-y-3 animate-slide-up" onClick={(e) => e.stopPropagation()}>
            <div className="px-2 pt-1 pb-2">
              <h3 className="text-xl font-bold">{currentProfile.displayName}, {currentProfile.age}</h3>
              <p className="text-sm text-brand-subtext">{currentProfile.city}</p>
              <p className="text-sm text-white/80 mt-2 leading-relaxed">{currentProfile.bio}</p>
            </div>
            <OriginalButton variant="glass" onClick={() => { setSafetyMenu(false); setReporting(true); }}>{t('common.report')}</OriginalButton>
            <OriginalButton variant="glass" className="text-red-400" onClick={() => { setSafetyMenu(false); void repo.blockUser(currentProfile.uid).then(load); }}>{t('common.block')}</OriginalButton>
            <OriginalButton variant="ghost" onClick={() => setSafetyMenu(false)}>{t('look.back')}</OriginalButton>
          </div>
        </div>
      ) : null}
      {reporting ? (
        <ReportDialog
          target={{ targetUserId: currentProfile.uid, targetType: 'user', targetId: currentProfile.uid }}
          onClose={() => setReporting(false)}
          onSubmit={(input) => repo.fileReport(input).then(() => undefined)}
        />
      ) : null}
      {matchChat ? (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-6 animate-fade-in">
          <div className="w-full max-w-sm space-y-4 glass-card rounded-3xl p-6 text-center animate-slide-up">
            <h3 className="text-3xl font-black text-gradient">{t('discover.matchTitle')}</h3>
            <p className="text-brand-subtext">{t('discover.matchBody')}</p>
            <OriginalButton variant="primary" onClick={() => go({ name: 'chat', chatId: matchChat })}>{t('discover.sayHello')}</OriginalButton>
            <OriginalButton variant="ghost" onClick={() => setMatchChat(null)}>{t('discover.keep')}</OriginalButton>
          </div>
        </div>
      ) : null}
    </div>
  );
}
