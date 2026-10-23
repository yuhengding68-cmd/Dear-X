import { useEffect, useState } from 'react';
import { MapPin, X } from 'lucide-react';
import { OriginalButton } from '../components/ui';
import { normalizeDiscoverFilters, type DiscoverFilters } from '../domain/discover';
import { useI18n } from '../i18n';
import { useApp } from '../state/AppProvider';

const GENDERS = ['all', 'man', 'woman'] as const;

export function FilterSheet({ onClose }: { onClose: () => void }) {
  const { t } = useI18n();
  const { repo, refreshDiscovery, setError } = useApp();
  const [filters, setFilters] = useState<DiscoverFilters>(normalizeDiscoverFilters(null));
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    void repo.getDiscoverFilters().then((next) => setFilters(normalizeDiscoverFilters(next)));
  }, [repo]);

  const apply = () => {
    if (busy) return;
    setBusy(true);
    const next = normalizeDiscoverFilters(filters);
    void repo
      .saveDiscoverFilters(next)
      .then(() => {
        refreshDiscovery();
        onClose();
      })
      .catch((caught: unknown) => {
        setError(caught instanceof Error ? caught.message : t('common.error'));
        setBusy(false);
      });
  };

  return (
    <div data-testid="filter-sheet" className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fade-in">
      <div className="w-full max-w-md glass-card rounded-3xl p-6 border border-white/20 shadow-2xl animate-slide-up relative">
        <button type="button" onClick={onClose} className="absolute top-4 right-4 text-white/50 hover:text-white">
          <X className="w-6 h-6" />
        </button>

        <div className="text-center mb-6">
          <h2 className="text-xl font-bold text-white">{t('filters.title')}</h2>
          <p className="text-brand-subtext text-sm">{t('filters.subtitle')}</p>
        </div>

        <div className="mb-6">
          <div className="flex justify-between items-center mb-3">
            <span className="text-white font-bold flex items-center gap-2">
              <MapPin className="w-4 h-4 text-brand-blue" /> {t('filters.distance')}
            </span>
            <span className="text-brand-blue font-bold">{filters.maxDistanceKm}km</span>
          </div>
          <input
            data-testid="filter-distance"
            type="range"
            min="1"
            max="100"
            value={filters.maxDistanceKm}
            onChange={(event) => setFilters({ ...filters, maxDistanceKm: Number.parseInt(event.target.value, 10) })}
            className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-brand-blue"
          />
        </div>

        <div className="mb-6">
          <span className="text-white font-bold mb-3 block">{t('filters.showMe')}</span>
          <div className="flex p-1 bg-white/5 rounded-xl border border-white/5">
            {GENDERS.map((id) => (
              <button
                key={id}
                type="button"
                data-testid={id === 'woman' ? 'filter-gender-woman' : undefined}
                onClick={() => setFilters({ ...filters, showGender: id })}
                className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all ${
                  filters.showGender === id ? 'bg-white/10 text-white shadow-lg border border-white/10' : 'text-brand-subtext hover:text-white'
                }`}
              >
                {t(id === 'all' ? 'filters.everyone' : id === 'man' ? 'filters.men' : 'filters.women')}
              </button>
            ))}
          </div>
        </div>

        <div className="mb-8">
          <div className="flex justify-between items-center mb-3">
            <span className="text-white font-bold">{t('filters.age')}</span>
            <span className="text-brand-subtext">
              {filters.minAge} - {filters.maxAge}
            </span>
          </div>
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="text-xs text-brand-subtext mb-1 block">{t('filters.min')}</label>
              <input
                type="number"
                value={filters.minAge}
                min="18"
                max={filters.maxAge}
                onChange={(event) => setFilters({ ...filters, minAge: Number.parseInt(event.target.value, 10) })}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-brand-blue"
              />
            </div>
            <div className="flex-1">
              <label className="text-xs text-brand-subtext mb-1 block">{t('filters.max')}</label>
              <input
                type="number"
                value={filters.maxAge}
                min={filters.minAge}
                max="100"
                onChange={(event) => setFilters({ ...filters, maxAge: Number.parseInt(event.target.value, 10) })}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-brand-blue"
              />
            </div>
          </div>
        </div>

        <OriginalButton data-testid="filter-apply" onClick={apply} disabled={busy}>
          {t('filters.apply')}
        </OriginalButton>
      </div>
    </div>
  );
}
