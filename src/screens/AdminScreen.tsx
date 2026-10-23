import { useEffect, useState } from 'react';
import type { CreatorPost, Report, ReportStatus } from '../types';
import { useI18n } from '../i18n';
import { useApp } from '../state/AppProvider';
import { Button, inputClass } from '../components/ui';

export function AdminScreen() {
  const { t } = useI18n();
  const { repo, me } = useApp();
  const [reports, setReports] = useState<Report[]>([]);
  const [posts, setPosts] = useState<CreatorPost[]>([]);
  const [note, setNote] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = () => {
    if (me?.role !== 'admin') return;
    void repo.listReportsForAdmin().then(setReports).catch((caught: unknown) => setError(caught instanceof Error ? caught.message : t('common.error')));
    void repo.listPendingPostsForAdmin().then(setPosts);
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
    <div className="space-y-6 px-4 py-4">
      <input className={inputClass} value={note} placeholder={t('admin.note')} onChange={(event) => setNote(event.target.value)} />
      <section>
        <h2 className="mb-2 font-semibold">{t('admin.reports')}</h2>
        {reports.length === 0 ? <p className="text-sm text-white/50">{t('admin.emptyReports')}</p> : null}
        <ul className="space-y-3">
          {reports.map((report) => (
            <li key={report.id} className="rounded-2xl border border-white/10 p-3 text-sm">
              <p className="font-semibold">
                {report.reason} · {report.status}
              </p>
              <p className="text-white/60">{report.details}</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {(['reviewing', 'resolved', 'dismissed'] as ReportStatus[]).map((status) => (
                  <Button key={status} type="button" kind="ghost" onClick={() => void run(() => repo.reviewReport(report.id, status, note))}>
                    {t(status === 'reviewing' ? 'admin.reviewing' : status === 'resolved' ? 'admin.resolve' : 'admin.dismiss')}
                  </Button>
                ))}
              </div>
            </li>
          ))}
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
