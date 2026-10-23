import { useEffect, useState } from 'react';
import type { CreatorPost, Report } from '../types';
import { reportSla, type ReportAction } from '../domain/safetyQueue';
import { useI18n } from '../i18n';
import { useApp } from '../state/AppProvider';
import { Button, inputClass } from '../components/ui';

const ACTIONS: ReportAction[] = ['dismiss', 'warn', 'remove', 'suspend', 'ban', 'restore'];

function slaText(report: Report, now: number, t: (key: string, vars?: Record<string, string | number>) => string): string {
  if (report.status !== 'open' && report.status !== 'reviewing') return t('admin.closed');
  const sla = reportSla(report.createdAt, report.status, now);
  if (sla.overdue) return t('admin.overdue');
  const hours = Math.max(1, Math.ceil(sla.remainingMs / 3_600_000));
  return t('admin.remaining', { hours });
}

export function AdminScreen() {
  const { t } = useI18n();
  const { repo, me } = useApp();
  const [reports, setReports] = useState<Report[]>([]);
  const [posts, setPosts] = useState<CreatorPost[]>([]);
  const [note, setNote] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [now, setNow] = useState(() => Date.now());

  const load = () => {
    if (me?.role !== 'admin') return;
    setNow(Date.now());
    void repo
      .ensureAdminClaim()
      .then(() => repo.listReportsForAdmin())
      .then(setReports)
      .catch((caught: unknown) => setError(caught instanceof Error ? caught.message : t('common.error')));
    void repo.listPendingPostsForAdmin().then(setPosts).catch(() => setPosts([]));
  };
  useEffect(load, [repo, me, t]);

  if (me?.role !== 'admin') return <p className="px-4 py-10 text-white/70">{t('admin.denied')}</p>;

  const run = async (work: () => Promise<void>) => {
    setError(null);
    try {
      await work();
      setMessage(t('admin.saved'));
      load();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : t('common.error'));
    }
  };

  return (
    <div className="space-y-6 px-4 py-4" data-testid="admin-queue">
      <input className={inputClass} value={note} placeholder={t('admin.note')} onChange={(event) => setNote(event.target.value)} />
      <section>
        <h2 className="mb-2 font-semibold">{t('admin.reports')}</h2>
        {reports.length === 0 ? <p className="text-sm text-white/50">{t('admin.emptyReports')}</p> : null}
        <ul className="space-y-3">
          {reports.map((report) => {
            const sla = reportSla(report.createdAt, report.status, now);
            const snap = report.snapshot;
            return (
              <li key={report.id} className="rounded-2xl border border-white/10 p-3 text-sm">
                <p className="font-semibold">
                  {report.reason} · {t(`admin.status.${report.status}`)}
                </p>
                <p
                  data-testid="admin-sla"
                  data-overdue={sla.overdue ? 'true' : 'false'}
                  className={sla.overdue ? 'text-red-300' : 'text-white/60'}
                >
                  {slaText(report, now, t)}
                </p>
                <p className="text-white/60">{report.details}</p>
                {snap ? (
                  <div data-testid="admin-snapshot" className="mt-2 rounded-xl bg-white/5 p-2 text-white/80">
                    <p className="text-xs uppercase tracking-wide text-white/40">{t('admin.snapshot')}</p>
                    <p className="font-semibold">
                      {snap.displayName}
                      {snap.city ? ` · ${snap.city}` : ''}
                    </p>
                    {snap.bio ? <p>{snap.bio}</p> : null}
                    {snap.messageText ? (
                      <p>
                        {t('admin.message')}: {snap.messageText}
                      </p>
                    ) : null}
                  </div>
                ) : null}
                <p className="mt-1 text-xs text-white/40">{report.updatedAt ?? report.createdAt}</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {ACTIONS.map((action) => (
                    <Button key={action} type="button" kind={action === 'ban' ? 'danger' : 'ghost'} onClick={() => void run(() => repo.resolveReport(report.id, action, note))}>
                      {t(`admin.${action}`)}
                    </Button>
                  ))}
                </div>
              </li>
            );
          })}
        </ul>
      </section>
      <section>
        <h2 className="mb-2 font-semibold">{t('admin.posts')}</h2>
        {posts.length === 0 ? <p className="text-sm text-white/50">{t('admin.emptyPosts')}</p> : null}
        <ul className="space-y-3">
          {posts.map((post) => (
            <li key={post.id} className="rounded-2xl border border-white/10 p-3 text-sm">
              <p className="font-semibold">{post.title}</p>
              <p className="text-white/70">{post.body}</p>
              <div className="mt-2 flex gap-2">
                <Button type="button" onClick={() => void run(() => repo.reviewPost(post.id, 'approved', note))}>
                  {t('admin.approve')}
                </Button>
                <Button type="button" kind="danger" onClick={() => void run(() => repo.reviewPost(post.id, 'rejected', note))}>
                  {t('admin.reject')}
                </Button>
              </div>
            </li>
          ))}
        </ul>
      </section>
      {message ? <p className="text-sm text-emerald-200">{message}</p> : null}
      {error ? <p className="text-sm text-red-300">{error}</p> : null}
    </div>
  );
}
