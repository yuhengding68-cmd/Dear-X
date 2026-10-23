import { useEffect, useState } from 'react';
import { formatAud } from '../domain/commerce';
import { CREATOR_PROHIBITION } from '../domain/contentPolicy';
import type { Balance, Creator, CreatorPost, Entitlement } from '../types';
import { useI18n } from '../i18n';
import { useApp } from '../state/AppProvider';
import { Avatar, Banner, Button, Field, inputClass } from '../components/ui';

export function CreatorListScreen() {
  const { t, locale } = useI18n();
  const { repo, go } = useApp();
  const [creators, setCreators] = useState<Creator[]>([]);
  useEffect(() => {
    void repo.listCreators().then(setCreators);
  }, [repo]);
  return (
    <div className="space-y-4 px-4 py-4">
      <Banner>{t('creators.noLocation')}</Banner>
      <Button type="button" kind="soft" onClick={() => go({ name: 'studio' })}>
        {t('creators.become')}
      </Button>
      {creators.length === 0 ? <p className="text-white/60">{t('creators.empty')}</p> : null}
      <div className="grid gap-3">
        {creators.map((creator) => (
          <button key={creator.uid} type="button" className="flex items-center gap-3 rounded-3xl border border-white/10 p-3 text-left" onClick={() => go({ name: 'creator', creatorId: creator.uid })}>
            <div className="h-16 w-16 overflow-hidden rounded-2xl">
              <Avatar name={creator.displayName} src={creator.photoUrl} />
            </div>
            <span>
              <span className="block font-semibold">{creator.displayName}</span>
              <span className="text-xs text-brand-light-purple">{t('creators.sfw')}</span>
              <span className="mt-1 block text-sm text-white/60">{t('creators.perMonth', { price: formatAud(creator.subscriptionPriceCents, locale) })}</span>
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

export function CreatorProfileScreen({ creatorId }: { creatorId: string }) {
  const { t, locale } = useI18n();
  const { repo, go } = useApp();
  const [creator, setCreator] = useState<Creator | null>(null);
  const [posts, setPosts] = useState<CreatorPost[]>([]);
  const [owned, setOwned] = useState<Entitlement[]>([]);
  const [error, setError] = useState<string | null>(null);

  const load = () => {
    void repo.getCreatorPage(creatorId).then((page) => {
      setCreator(page?.creator ?? null);
      setPosts(page?.posts ?? []);
    });
    void repo.myEntitlements().then(setOwned);
  };
  useEffect(load, [repo, creatorId]);

  if (!creator) return <p className="px-4 py-10 text-white/60">{t('creators.empty')}</p>;
  const subscribed = owned.some((item) => item.kind === 'subscription' && item.productId === creator.uid);
  const owns = (post: CreatorPost) => !post.isPaid || subscribed || owned.some((item) => item.kind === 'post' && item.productId === post.id);

  return (
    <div className="space-y-4 px-4 py-4">
      <Banner>{t('creators.noLocation')}</Banner>
      <Banner>{t('creators.noDm')}</Banner>
      <div className="flex items-center gap-3">
        <div className="h-16 w-16 overflow-hidden rounded-2xl">
          <Avatar name={creator.displayName} src={creator.photoUrl} />
        </div>
        <div>
          <h2 className="text-xl font-semibold">{creator.displayName}</h2>
          <p className="text-sm text-white/60">{creator.bio}</p>
        </div>
      </div>
      <Button
        type="button"
        disabled={subscribed}
        onClick={() =>
          void repo.purchase({ kind: 'subscription', productId: creator.uid, platform: 'apple' }).then(load).catch((caught: unknown) => {
            setError(caught instanceof Error ? caught.message : t('common.error'));
          })
        }
      >
        {subscribed ? t('creators.subscribed') : `${t('creators.subscribe')} · ${formatAud(creator.subscriptionPriceCents, locale)}`}
      </Button>
      <button type="button" className="text-sm text-white/60" onClick={() => go({ name: 'policy' })}>
        {t('creators.policy')}
      </button>
      {error ? <p className="text-sm text-red-300">{error}</p> : null}
      {posts.map((post) => (
        <article key={post.id} className="rounded-3xl border border-white/10 p-4">
          <div className="mb-1 flex items-center justify-between gap-2">
            <h3 className="font-semibold">{post.title}</h3>
            <span className="text-xs text-white/40">{post.isPaid ? t('creators.locked') : t('creators.sfw')}</span>
          </div>
          {owns(post) ? (
            <p className="text-sm text-white/75">{post.body}</p>
          ) : (
            <Button
              type="button"
              kind="ghost"
              onClick={() => void repo.purchase({ kind: 'post', productId: post.id, platform: 'apple' }).then(load)}
            >
              {t('creators.buy')} · {formatAud(post.priceCents, locale)}
            </Button>
          )}
        </article>
      ))}
    </div>
  );
}

export function StudioScreen() {
  const { t, locale } = useI18n();
  const { repo } = useApp();
  const [creator, setCreator] = useState<Creator | null>(null);
  const [posts, setPosts] = useState<CreatorPost[]>([]);
  const [balance, setBalance] = useState<Balance | null>(null);
  const [bio, setBio] = useState('');
  const [price, setPrice] = useState(899);
  const [tos, setTos] = useState(false);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [paid, setPaid] = useState(false);
  const [postPrice, setPostPrice] = useState(499);
  const [payout, setPayout] = useState(1000);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const load = () => {
    void repo.getMyCreator().then((value) => {
      setCreator(value);
      if (value) setBio(value.bio);
    });
    void repo.listMyPosts().then(setPosts);
    void repo.getBalance().then(setBalance);
  };
  useEffect(load, [repo]);

  const run = async (work: () => Promise<void>) => {
    setError(null);
    try {
      await work();
      load();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : t('common.error'));
    }
  };

  return (
    <div className="space-y-4 px-4 py-4">
      <Banner tone="warn">{locale === 'zh-CN' ? CREATOR_PROHIBITION.zh : CREATOR_PROHIBITION.en}</Banner>
      {!creator ? (
        <form
          className="space-y-3"
          onSubmit={(event) => {
            event.preventDefault();
            void run(() => repo.startCreatorProfile({ bio, subscriptionPriceCents: price, tosAccepted: tos, adultConfirmed: tos }).then(() => undefined));
          }}
        >
          <Field label={t('onboarding.bio')}>
            <textarea className={inputClass} required value={bio} onChange={(event) => setBio(event.target.value)} />
          </Field>
          <Field label={t('creators.price')}>
            <input className={inputClass} type="number" min={100} max={20000} value={price} onChange={(event) => setPrice(Number(event.target.value))} />
          </Field>
          <label className="flex gap-2 text-sm text-white/75">
            <input type="checkbox" checked={tos} onChange={(event) => setTos(event.target.checked)} required />
            {t('creators.tos')}
          </label>
          <Button type="submit" disabled={!tos}>{t('creators.start')}</Button>
        </form>
      ) : (
        <>
          <p className="text-sm text-white/70">
            {creator.kycStatus === 'verified'
              ? t('creators.kycVerified')
              : creator.kycStatus === 'pending'
                ? t('creators.kycPending', { provider: creator.kycProvider ?? 'didit' })
                : creator.kycStatus === 'rejected'
                  ? t('creators.kycRejected')
                  : t('creators.kycNone')}
          </p>
          <div className="flex flex-wrap gap-2">
            <Button type="button" kind="ghost" onClick={() => void run(() => repo.startKyc().then(() => undefined))}>
              {t('creators.verify')}
            </Button>
            <Button type="button" kind="soft" onClick={() => void run(() => repo.completeStubKyc('verified').then(() => undefined))}>
              {t('creators.simulatePass')}
            </Button>
            <Button type="button" kind="danger" onClick={() => void run(() => repo.completeStubKyc('rejected').then(() => undefined))}>
              {t('creators.simulateFail')}
            </Button>
          </div>
          <Banner>{t('creators.studioGate')}</Banner>
          <form
            className="space-y-3"
            onSubmit={(event) => {
              event.preventDefault();
              void run(async () => {
                const post = await repo.createPost({ title, body, isPaid: paid, priceCents: paid ? postPrice : 0 });
                setNotice(post.reviewStatus === 'pending' ? t('creators.pendingNote') : post.reviewNote);
                setTitle('');
                setBody('');
              });
            }}
          >
            <Field label={t('creators.postTitle')}>
              <input className={inputClass} value={title} onChange={(event) => setTitle(event.target.value)} required />
            </Field>
            <Field label={t('creators.postBody')}>
              <textarea className={inputClass} value={body} onChange={(event) => setBody(event.target.value)} required />
            </Field>
            <label className="flex gap-2 text-sm">
              <input type="checkbox" checked={paid} onChange={(event) => setPaid(event.target.checked)} />
              {t('creators.paid')}
            </label>
            {paid ? (
              <input className={inputClass} type="number" min={100} max={20000} value={postPrice} onChange={(event) => setPostPrice(Number(event.target.value))} />
            ) : null}
            <Button type="submit">{t('creators.submitPost')}</Button>
          </form>
          <ul className="space-y-2 text-sm">
            {posts.map((post) => (
              <li key={post.id} className="rounded-2xl border border-white/10 p-3">
                <span className="font-semibold">{post.title}</span>
                <span className="ml-2 text-white/50">{post.reviewStatus}</span>
                {post.reviewNote ? <p className="text-white/50">{post.reviewNote}</p> : null}
              </li>
            ))}
          </ul>
          <section className="rounded-3xl border border-white/10 p-4">
            <p className="text-sm text-white/50">{t('creators.balance')}</p>
            <p className="font-display text-3xl">{formatAud(balance?.availableCents ?? 0, locale)}</p>
            <p className="mb-3 text-xs text-white/45">{t('creators.payoutHint')}</p>
            <div className="flex gap-2">
              <input className={inputClass} type="number" min={1000} value={payout} onChange={(event) => setPayout(Number(event.target.value))} />
              <Button type="button" onClick={() => void run(() => repo.requestPayout(payout).then(() => undefined))}>
                {t('creators.payout')}
              </Button>
            </div>
          </section>
        </>
      )}
      {notice ? <Banner tone="good">{notice}</Banner> : null}
      {error ? <p className="text-sm text-red-300">{error}</p> : null}
    </div>
  );
}
