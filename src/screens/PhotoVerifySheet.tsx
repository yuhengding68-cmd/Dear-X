import { useEffect, useRef, useState } from 'react';
import { Camera, X } from 'lucide-react';
import { isPhotoPose } from '../domain/photoVerification';
import { OriginalButton } from '../components/ui';
import { useI18n } from '../i18n';
import { useApp } from '../state/AppProvider';

async function captureFrame(video: HTMLVideoElement): Promise<Blob> {
  const canvas = document.createElement('canvas');
  const width = Math.min(video.videoWidth || 720, 720);
  const height = Math.round(((video.videoHeight || 960) / (video.videoWidth || 720)) * width);
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('camera');
  context.drawImage(video, 0, 0, width, height);
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.85));
  if (!blob) throw new Error('camera');
  return blob;
}

export function PhotoVerifySheet({ onClose, onDone }: { onClose: () => void; onDone: () => void }) {
  const { t } = useI18n();
  const { repo } = useApp();
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [pose, setPose] = useState('');
  const [shot, setShot] = useState<string | null>(null);
  const [bytes, setBytes] = useState<Uint8Array | null>(null);
  const [attempt, setAttempt] = useState<{ attemptId: string; storagePath: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<'approved' | 'rejected' | 'pending_review' | null>(null);

  useEffect(() => {
    let cancelled = false;
    const video = videoRef.current;
    void (async () => {
      try {
        const started = await repo.startPhotoVerification();
        if (cancelled) return;
        setAttempt({ attemptId: started.attemptId, storagePath: started.storagePath });
        setPose(started.pose);
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' }, audio: false });
        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }
        streamRef.current = stream;
        if (video) {
          video.srcObject = stream;
          await video.play();
        }
      } catch (caught) {
        if (!cancelled) setError(caught instanceof Error && caught.message === 'photo-verify-limited' ? t('profile.photoLimited') : t('profile.cameraError'));
      }
    })();
    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, [repo, t]);

  const take = () => {
    const video = videoRef.current;
    if (!video) return;
    void captureFrame(video)
      .then(async (blob) => {
        const next = new Uint8Array(await blob.arrayBuffer());
        setBytes(next);
        setShot(URL.createObjectURL(blob));
      })
      .catch(() => setError(t('profile.cameraError')));
  };

  const submit = () => {
    if (!attempt || !bytes || busy) return;
    setBusy(true);
    setError(null);
    void repo
      .submitPhotoVerification({ attemptId: attempt.attemptId, storagePath: attempt.storagePath, bytes, contentType: 'image/jpeg' })
      .then((outcome) => {
        setResult(outcome.status);
        streamRef.current?.getTracks().forEach((track) => track.stop());
        onDone();
      })
      .catch((caught: unknown) => {
        const message = caught instanceof Error ? caught.message : '';
        setError(message === 'photo-verify-limited' ? t('profile.photoLimited') : t('profile.cameraError'));
        setBusy(false);
      });
  };

  const poseText = isPhotoPose(pose) ? t(`profile.pose.${pose}`) : '';

  return (
    <div data-testid="photo-verify" className="fixed inset-0 z-[110] flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-md p-4">
      <div className="w-full max-w-md glass-card rounded-3xl p-6 border border-white/20 shadow-2xl relative">
        <button type="button" onClick={onClose} className="absolute top-4 right-4 text-white/50 hover:text-white">
          <X className="w-6 h-6" />
        </button>
        <div className="text-center mb-4">
          <div className="w-12 h-12 bg-green-500/20 text-green-400 rounded-full flex items-center justify-center mx-auto mb-3">
            <Camera className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-white">{t('profile.photoVerified')}</h2>
          <p data-testid="photo-pose" className="text-brand-subtext text-sm mt-2">{poseText}</p>
        </div>
        <div className="overflow-hidden rounded-2xl bg-black mb-4 aspect-[3/4]">
          {shot ? <img src={shot} alt="" className="h-full w-full object-cover" /> : <video ref={videoRef} playsInline muted className="h-full w-full object-cover" />}
        </div>
        {error ? <p className="mb-3 text-center text-xs text-red-300">{error}</p> : null}
        {result ? <p data-testid="photo-result" className="mb-3 text-center text-sm text-white">{t(`profile.photoResult.${result}`)}</p> : null}
        {result ? null : shot ? (
          <div className="flex gap-3">
            <OriginalButton variant="glass" onClick={() => { setShot(null); setBytes(null); }}>{t('profile.retake')}</OriginalButton>
            <OriginalButton data-testid="photo-submit" onClick={submit} disabled={busy}>{t('profile.usePhoto')}</OriginalButton>
          </div>
        ) : (
          <OriginalButton data-testid="photo-capture" onClick={take} disabled={!attempt}>{t('profile.capture')}</OriginalButton>
        )}
      </div>
    </div>
  );
}
