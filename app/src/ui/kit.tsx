import { useEffect, type ReactNode } from 'react';

export function Sheet({ onClose, title, children }: { onClose: () => void; title?: string; children: ReactNode }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60" onClick={onClose}>
      <div
        className="rise safe-b max-h-[88dvh] w-full max-w-md overflow-y-auto rounded-t-3xl border border-line bg-panel p-5"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label={title}
      >
        {title && <h2 className="mb-4 text-lg font-bold">{title}</h2>}
        {children}
      </div>
    </div>
  );
}

export function Bar({ value, color = 'var(--color-mint)', className = '' }: { value: number; color?: string; className?: string }) {
  return (
    <div className={`h-2.5 overflow-hidden rounded-full bg-white/10 ${className}`}>
      <div className="h-full rounded-full transition-all" style={{ width: `${Math.max(0, Math.min(100, value))}%`, background: color }} />
    </div>
  );
}

export function Avatar({ name, color, size = 40 }: { name: string; color: string; size?: number }) {
  return (
    <div
      className="grid shrink-0 place-items-center rounded-full font-bold text-black/70"
      style={{ width: size, height: size, background: color, fontSize: size * 0.42 }}
    >
      {name.trim().charAt(0)}
    </div>
  );
}

export function Chip({ active, onClick, children }: { active?: boolean; onClick?: () => void; children: ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`pill shrink-0 px-4 py-2 text-sm ${active ? 'border-sky! bg-sky/20! text-sky' : 'text-mute'}`}
    >
      {children}
    </button>
  );
}

export function Empty({ icon, text }: { icon: string; text: string }) {
  return (
    <div className="glass p-8 text-center text-mute">
      <div className="mb-2 text-4xl">{icon}</div>
      {text}
    </div>
  );
}

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs text-mute">{label}</span>
      {children}
    </label>
  );
}
