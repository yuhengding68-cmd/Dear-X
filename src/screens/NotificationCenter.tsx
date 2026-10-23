import { X } from 'lucide-react';
import type { InboxItem } from '../types';
import { useI18n } from '../i18n';

export function NotificationCenter({
  items,
  onClose,
  onOpen,
}: {
  items: InboxItem[];
  onClose: () => void;
  onOpen: (item: InboxItem) => void;
}) {
  const { t } = useI18n();
  return (
    <div data-testid="notification-center" className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fade-in">
      <div className="w-full max-w-md glass-card rounded-3xl p-6 border border-white/20 shadow-2xl animate-slide-up relative max-h-[80vh] overflow-y-auto no-scrollbar">
        <button type="button" onClick={onClose} className="absolute top-4 right-4 text-white/50 hover:text-white">
          <X className="w-6 h-6" />
        </button>
        <div className="text-center mb-6">
          <h2 className="text-xl font-bold text-white">{t('inbox.title')}</h2>
        </div>
        {items.length === 0 ? <p className="text-center text-brand-subtext text-sm">{t('inbox.empty')}</p> : null}
        <ul className="space-y-2">
          {items.map((item) => (
            <li key={item.id}>
              <button
                type="button"
                data-testid="notification-item"
                onClick={() => onOpen(item)}
                className="w-full text-left p-4 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10"
              >
                <span className={`block text-sm ${item.readAt ? 'text-white/70' : 'text-white font-bold'}`}>{t(`inbox.${item.kind}`)}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
