import { useEffect, useState } from 'react';
import { Camera, ChevronLeft, ChevronRight, Trash2, X } from 'lucide-react';
import { AU_CITIES } from '../types';
import {
  MAX_PROFILE_PHOTOS,
  PROFILE_INTERESTS,
  isProfilePhotoId,
  textFromProfile,
  type ProfileEditor,
  type ProfilePhotoRecord,
  type ProfileTextInput,
} from '../domain/profileEdit';
import { RepoError } from '../data/errors';
import { useI18n } from '../i18n';
import { useApp } from '../state/AppProvider';
import { OriginalButton } from '../components/ui';

function interestLabel(tag: string, t: (key: string) => string): string {
  const key = `interests.${tag}`;
  const label = t(key);
  return label === key ? tag : label;
}

function fieldMessage(message: string, t: (key: string) => string): { text: string; unchanged: boolean } {
  const code = message.trim();
  const fields: Record<string, string> = {
    name: 'profile.fieldName',
    bio: 'profile.fieldBio',
    city: 'profile.fieldCity',
    job: 'profile.fieldJob',
    interests: 'profile.fieldInterests',
    photos: 'profile.fieldPhotos',
    type: 'profile.fieldType',
    size: 'profile.fieldSize',
  };
  if (fields[code]) return { text: t(fields[code]), unchanged: false };
  if (code === 'storage' || code.includes('storage')) return { text: t('profile.storageMissing'), unchanged: true };
  if (code.includes('moderation-unavailable')) return { text: t('profile.moderationDown'), unchanged: true };
  return { text: code || t('common.error'), unchanged: true };
}

function moderationMessage(categories: string[], reason: string, t: (key: string) => string): string {
  if (categories.includes('sexual_content') || categories.includes('nudity')) return t('profile.modSexual');
  if (categories.includes('minor_safety')) return t('profile.modMinor');
  if (categories.includes('sexual_services')) return t('profile.modServices');
  if (categories.includes('paid_meetup')) return t('profile.modPaid');
  if (categories.includes('empty')) return t('profile.modEmpty');
  if (categories.includes('length')) return t('profile.modLength');
  return reason || t('profile.modSexual');
}

function photoSrc(photo: ProfilePhotoRecord, local: Record<string, string>): string | null {
  return local[photo.id] || photo.ownerUrl || (photo.status === 'approved' ? photo.publicUrl : null);
}

export function EditProfileModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const { t } = useI18n();
  const { repo } = useApp();
  const [editor, setEditor] = useState<ProfileEditor | null>(null);
  const [form, setForm] = useState<ProfileTextInput | null>(null);
  const [localUrls, setLocalUrls] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [unchanged, setUnchanged] = useState(false);
  const [busy, setBusy] = useState(false);
  const [photoBusy, setPhotoBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void repo.getProfileEditor().then((next) => {
      if (cancelled) return;
      setEditor(next);
      const withheld = (next.textStatus === 'rejected' || next.textStatus === 'pending') && next.textDraft ? next.textDraft : null;
      const source = withheld ?? (next.profile ? textFromProfile(next.profile) : null);
      setForm(source);
      if (next.textStatus === 'rejected' && next.textReason) {
        setError(moderationMessage(next.textCategories, next.textReason, t));
        setUnchanged(true);
      } else if (next.textStatus === 'pending') {
        setError(t('profile.pendingReview'));
        setUnchanged(true);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [repo, t]);

  const showError = (caught: unknown, keepPublic: boolean) => {
    if (caught instanceof RepoError) {
      const mapped = fieldMessage(caught.message, t);
      setError(mapped.text);
      setUnchanged(keepPublic || mapped.unchanged);
      return;
    }
    const mapped = fieldMessage(caught instanceof Error ? caught.message : '', t);
    setError(mapped.text);
    setUnchanged(keepPublic || mapped.unchanged);
  };

  const applyEditor = (next: ProfileEditor) => {
    setEditor(next);
    onSaved();
  };

  const save = () => {
    if (!form || busy) return;
    setBusy(true);
    setError(null);
    void repo
      .submitProfileText(form)
      .then((result) => {
        applyEditor(result.editor);
        if (result.status === 'rejected') {
          setError(moderationMessage(result.categories, result.reason, t));
          setUnchanged(true);
          return;
        }
        setUnchanged(false);
        onClose();
      })
      .catch((caught: unknown) => showError(caught, true))
      .finally(() => setBusy(false));
  };

  const upload = (file: File | undefined) => {
    if (!file || photoBusy || !editor) return;
    if (editor.photos.length >= MAX_PROFILE_PHOTOS) {
      setError(t('profile.fieldPhotos'));
      setUnchanged(false);
      return;
    }
    const id = crypto.randomUUID();
    if (!isProfilePhotoId(id)) return;
    const previewUrl = URL.createObjectURL(file);
    setPhotoBusy(true);
    setError(null);
    void file
      .arrayBuffer()
      .then((buffer) =>
        repo.addProfilePhoto({
          id,
          fileName: file.name,
          contentType: file.type || 'image/jpeg',
          byteLength: file.size,
          previewUrl,
          bytes: new Uint8Array(buffer),
        }),
      )
      .then((next) => {
        setLocalUrls((current) => ({ ...current, [id]: previewUrl }));
        applyEditor(next);
        const added = next.photos.find((photo) => photo.id === id);
        if (added?.status === 'rejected') {
          setError(added.reason ? moderationMessage([], added.reason, t) : t('profile.modSexual'));
          setUnchanged(true);
        }
      })
      .catch((caught: unknown) => {
        URL.revokeObjectURL(previewUrl);
        showError(caught, true);
        void repo.getProfileEditor().then(applyEditor).catch(() => undefined);
      })
      .finally(() => setPhotoBusy(false));
  };

  const reorder = (index: number, direction: -1 | 1) => {
    if (!editor || photoBusy) return;
    const target = index + direction;
    if (target < 0 || target >= editor.photos.length) return;
    const ids = editor.photos.map((photo) => photo.id);
    const [moved] = ids.splice(index, 1);
    ids.splice(target, 0, moved);
    setPhotoBusy(true);
    void repo
      .reorderProfilePhotos(ids)
      .then(applyEditor)
      .catch((caught: unknown) => showError(caught, true))
      .finally(() => setPhotoBusy(false));
  };

  const remove = (id: string) => {
    if (photoBusy) return;
    setPhotoBusy(true);
    void repo
      .deleteProfilePhoto(id)
      .then(applyEditor)
      .catch((caught: unknown) => showError(caught, true))
      .finally(() => setPhotoBusy(false));
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fade-in">
      <div data-testid="edit-profile-modal" className="w-full max-w-md glass-card rounded-3xl p-6 border border-white/20 shadow-2xl animate-slide-up relative max-h-[90vh] overflow-y-auto no-scrollbar">
        <button type="button" onClick={onClose} className="absolute top-4 right-4 text-white/50 hover:text-white">
          <X className="w-6 h-6" />
        </button>
        <div className="text-center mb-6">
          <div className="w-12 h-12 bg-blue-500/20 text-blue-400 rounded-full flex items-center justify-center mx-auto mb-3">
            <Camera className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-white">{t('profile.editTitle')}</h2>
        </div>

        <div className="mb-6" data-testid="edit-profile-photos">
          <h3 className="text-sm font-bold text-brand-subtext mb-3 uppercase tracking-wider">{t('profile.photos')}</h3>
          <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1">
            {(editor?.photos ?? []).map((photo, index) => {
              const src = photoSrc(photo, localUrls);
              const statusLabel = photo.status === 'approved' ? t('profile.statusApproved') : photo.status === 'rejected' ? t('profile.statusRejected') : t('profile.statusPending');
              return (
                <div key={photo.id} className="w-24 shrink-0">
                  <div className="relative h-28 rounded-2xl overflow-hidden bg-white/5 border border-white/10">
                    {src ? <img src={src} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full" />}
                    <span className="absolute bottom-1 left-1 right-1 text-center text-[9px] font-bold uppercase tracking-wide bg-black/60 text-white rounded-full py-0.5">
                      {statusLabel}
                    </span>
                  </div>
                  <div className="mt-1 flex items-center justify-between text-white/70">
                    <button type="button" aria-label={t('profile.moveLeft')} onClick={() => reorder(index, -1)} className="p-1">
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button type="button" aria-label={t('profile.removePhoto')} onClick={() => remove(photo.id)} className="p-1 text-red-300">
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <button type="button" aria-label={t('profile.moveRight')} onClick={() => reorder(index, 1)} className="p-1">
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
            <label className="w-24 h-28 shrink-0 rounded-2xl border border-dashed border-white/20 bg-white/5 flex flex-col items-center justify-center text-white/70 cursor-pointer">
              <Camera className="w-5 h-5 mb-1" />
              <span className="text-[10px] font-bold uppercase">{t('profile.addPhoto')}</span>
              <input
                data-testid="edit-profile-file"
                className="hidden"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                disabled={photoBusy || (editor?.photos.length ?? 0) >= MAX_PROFILE_PHOTOS}
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  event.target.value = '';
                  upload(file);
                }}
              />
            </label>
          </div>
          <p className="mt-2 text-xs text-brand-subtext leading-relaxed">{t('profile.photoHint')}</p>
        </div>

        {form ? (
          <div className="space-y-3">
            <label className="block">
              <span className="text-sm font-bold text-brand-subtext uppercase tracking-wider">{t('profile.name')}</span>
              <input
                data-testid="edit-profile-name"
                className="mt-2 w-full glass-card rounded-xl px-4 py-3 text-white focus:outline-none focus:border-brand-blue"
                value={form.displayName}
                onChange={(event) => setForm({ ...form, displayName: event.target.value })}
              />
            </label>
            <label className="block">
              <span className="text-sm font-bold text-brand-subtext uppercase tracking-wider">{t('profile.job')}</span>
              <input
                data-testid="edit-profile-job"
                className="mt-2 w-full glass-card rounded-xl px-4 py-3 text-white focus:outline-none focus:border-brand-blue"
                value={form.job}
                onChange={(event) => setForm({ ...form, job: event.target.value })}
              />
            </label>
            <label className="block">
              <span className="text-sm font-bold text-brand-subtext uppercase tracking-wider">{t('profile.city')}</span>
              <select
                data-testid="edit-profile-city"
                className="mt-2 w-full glass-card rounded-xl px-4 py-3 text-white focus:outline-none focus:border-brand-blue"
                value={form.city}
                onChange={(event) => setForm({ ...form, city: event.target.value })}
              >
                {AU_CITIES.map((city) => (
                  <option key={city} value={city}>
                    {city}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="text-sm font-bold text-brand-subtext uppercase tracking-wider">{t('profile.bio')}</span>
              <textarea
                data-testid="edit-profile-bio"
                rows={3}
                className="mt-2 w-full glass-card rounded-xl px-4 py-3 text-white focus:outline-none focus:border-brand-blue"
                value={form.bio}
                onChange={(event) => setForm({ ...form, bio: event.target.value })}
              />
            </label>
            <div>
              <span className="text-sm font-bold text-brand-subtext uppercase tracking-wider">{t('profile.interests')}</span>
              <div className="mt-2 flex flex-wrap gap-2">
                {PROFILE_INTERESTS.map((tag) => {
                  const on = form.interests.includes(tag);
                  return (
                    <button
                      key={tag}
                      type="button"
                      onClick={() =>
                        setForm({
                          ...form,
                          interests: on ? form.interests.filter((item) => item !== tag) : [...form.interests, tag].slice(0, 8),
                        })
                      }
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold border ${on ? 'bg-white text-black border-white' : 'bg-white/5 text-white/90 border-white/10'}`}
                    >
                      #{interestLabel(tag, t)}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        ) : (
          <p className="text-sm text-brand-subtext">{t('common.loading')}</p>
        )}

        {error ? (
          <div data-testid="edit-profile-error" className="mt-4 rounded-2xl bg-red-500/10 border border-red-500/30 p-3 text-sm text-red-200">
            <p>{error}</p>
            {unchanged ? <p className="mt-1 text-xs text-red-200/80">{t('profile.publicUnchanged')}</p> : null}
          </div>
        ) : null}

        <OriginalButton data-testid="edit-profile-save" variant="primary" className="mt-6 h-12 rounded-xl" disabled={!form || busy || photoBusy} onClick={save}>
          {t('profile.save')}
        </OriginalButton>
      </div>
    </div>
  );
}
