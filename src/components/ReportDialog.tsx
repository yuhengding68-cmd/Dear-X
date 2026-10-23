import { useState } from 'react';
import { REPORT_REASONS, type ReportInput, type ReportReason } from '../types';
import { useI18n } from '../i18n';
import { Button, Field, inputClass } from './ui';

export function ReportDialog({
  target,
  onClose,
  onSubmit,
}: {
  target: Omit<ReportInput, 'reason' | 'details'>;
  onClose: () => void;
  onSubmit: (input: ReportInput) => Promise<void>;
}) {
  const { t } = useI18n();
  const [reason, setReason] = useState<ReportReason>('harassment');
  const [details, setDetails] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-4 sm:items-center">
      <form
        className="w-full max-w-md space-y-4 rounded-3xl border border-white/10 bg-[#0c0c12] p-5"
        onSubmit={async (event) => {
          event.preventDefault();
          setBusy(true);
          setError(null);
          try {
            await onSubmit({ ...target, reason, details });
            onClose();
          } catch (caught) {
            setError(caught instanceof Error ? caught.message : t('common.error'));
          } finally {
            setBusy(false);
          }
        }}
      >
        <h2 className="font-display text-xl font-semibold">{t('report.title')}</h2>
        <Field label={t('report.reason')}>
          <select className={inputClass} value={reason} onChange={(event) => setReason(event.target.value as ReportReason)}>
            {REPORT_REASONS.map((item) => (
              <option key={item} value={item}>
                {t(`report.${item}`)}
              </option>
            ))}
          </select>
        </Field>
        <Field label={t('report.details')}>
          <textarea className={inputClass} rows={4} value={details} onChange={(event) => setDetails(event.target.value)} />
        </Field>
        {error ? <p className="text-sm text-red-300">{error}</p> : null}
        <div className="flex gap-2">
          <Button type="button" kind="ghost" onClick={onClose}>
            {t('common.cancel')}
          </Button>
          <Button type="submit" disabled={busy}>
            {t('report.submit')}
          </Button>
        </div>
      </form>
    </div>
  );
}
