import type { ButtonHTMLAttributes, ComponentType, ReactNode } from 'react';
import { useI18n } from '../i18n';
import type { DataMode } from '../types';

export function Button({
  children,
  kind = 'primary',
  className = '',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { kind?: 'primary' | 'ghost' | 'danger' | 'soft' }) {
  const styles = {
    primary: 'bg-white text-black hover:bg-white/90',
    ghost: 'bg-white/10 text-white hover:bg-white/15 border border-white/10',
    danger: 'bg-red-500/15 text-red-100 hover:bg-red-500/25 border border-red-400/30',
    soft: 'bg-brand-light-purple/20 text-white hover:bg-brand-light-purple/30 border border-brand-light-purple/30',
  }[kind];
  return (
    <button
      {...props}
      className={`inline-flex items-center justify-center gap-2 rounded-full px-4 py-3 text-sm font-semibold disabled:opacity-50 ${styles} ${className}`}
    >
      {children}
    </button>
  );
}

export function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="block text-left">
      <span className="mb-2 block text-sm text-white/70">{label}</span>
      {children}
    </label>
  );
}

export const inputClass =
  'w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none placeholder:text-white/30 focus:border-white/30';

export function Banner({ children, tone = 'info' }: { children: ReactNode; tone?: 'info' | 'warn' | 'good' }) {
  const toneClass = {
    info: 'border-white/10 bg-white/5 text-white/80',
    warn: 'border-amber-300/30 bg-amber-300/10 text-amber-50',
    good: 'border-emerald-300/30 bg-emerald-300/10 text-emerald-50',
  }[tone];
  return <div className={`rounded-2xl border px-4 py-3 text-sm leading-relaxed ${toneClass}`}>{children}</div>;
}

export function Avatar({ name, src }: { name: string; src: string | null }) {
  if (!src) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#1d35a7] to-[#6b2c86] text-2xl font-semibold">
        {name.slice(0, 1)}
      </div>
    );
  }
  return <img src={src} alt="" className="h-full w-full object-cover" onError={(event) => (event.currentTarget.style.display = 'none')} />;
}

export function LanguageButton() {
  const { locale, setLocale } = useI18n();
  const next = locale === 'en' ? 'zh-CN' : 'en';
  return (
    <button
      type="button"
      onClick={() => setLocale(next)}
      className="rounded-full border border-white/10 px-3 py-1 text-xs text-white/80"
    >
      {locale === 'en' ? '中文' : 'English'}
    </button>
  );
}

export function ModePill({ mode }: { mode: DataMode }) {
  const { t } = useI18n();
  return (
    <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-white/60">
      {mode === 'demo' ? t('common.demoMode') : t('common.firebaseMode')}
    </span>
  );
}

export function TopBar({
  title,
  onBack,
  extra,
}: {
  title: string;
  onBack?: () => void;
  extra?: ReactNode;
}) {
  const { t } = useI18n();
  return (
    <header className="sticky top-0 z-20 flex items-center justify-between gap-3 border-b border-white/10 bg-[#050505]/90 px-4 py-3 backdrop-blur">
      <div className="flex items-center gap-3">
        {onBack ? (
          <button type="button" onClick={onBack} className="text-sm text-white/70">
            {t('common.back')}
          </button>
        ) : null}
        <h1 className="font-display text-lg font-semibold">{title}</h1>
      </div>
      <div className="flex items-center gap-2">{extra}</div>
    </header>
  );
}

export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <div className={`font-display font-bold tracking-[0.2em] leading-none ${compact ? 'text-left' : 'text-center'}`}>
      <div className={compact ? 'text-sm' : 'text-2xl'}>DEAR</div>
      <div className={`text-gradient ${compact ? 'text-xl -mt-1' : 'text-4xl -mt-1'}`}>X</div>
    </div>
  );
}

/** Original DearX Button (source-code/App.tsx), same classes and variants. */
export function OriginalButton({
  children,
  variant = 'primary',
  className = '',
  icon: Icon,
  type = 'button',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'glass' | 'cyber' | 'white';
  icon?: ComponentType<{ className?: string }>;
}) {
  const baseStyle = 'w-full py-3.5 rounded-2xl font-bold transition-all duration-300 flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg';
  const variants = {
    primary: 'bg-vibe-gradient text-white shadow-glow-vibe hover:shadow-brand-blue/40 border border-white/10',
    secondary: 'bg-slate-800 text-white hover:bg-slate-700',
    outline: 'border-2 border-brand-blue text-brand-blue hover:bg-brand-blue/10',
    ghost: 'text-brand-subtext hover:text-white hover:bg-white/5 shadow-none',
    glass: 'glass text-white hover:bg-white/10',
    cyber: 'bg-cyber-gradient text-black shadow-glow-cyber hover:brightness-110 border border-yellow-200/50',
    white: 'bg-white text-black hover:bg-gray-100',
  };
  return (
    <button {...props} type={type} className={`${baseStyle} ${variants[variant]} ${className}`}>
      {Icon && <Icon className="w-5 h-5" />}
      {children}
    </button>
  );
}

/** Original brand "X" glyph used in the bottom navigation. */
export function LogoX(props: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" {...props} fill="none" stroke="none">
      <text x="50%" y="55%" dominantBaseline="middle" textAnchor="middle" fontSize="22" fontWeight="900" fill="currentColor" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
        X
      </text>
    </svg>
  );
}
