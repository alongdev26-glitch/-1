import { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import type { Role } from '../engine/game';
import { useLang } from '../i18n';
import { play, vibrate } from './fx';

interface Props {
  /** Bumps when the card should reset (a new player is up). */
  resetKey: number;
  role: Role;
  onSeen: () => void;
  children: ReactNode;
}

const RIDGES = [
  { r: 4, a: 4, b: 6, dash: '' },
  { r: 9, a: 9, b: 12, dash: '' },
  { r: 14, a: 14, b: 8, dash: '22 4' },
  { r: 19, a: 17, b: 16, dash: '' },
  { r: 24, a: 20, b: 11, dash: '30 5' },
  { r: 29, a: 18, b: 17, dash: '' },
];

/** A fingerprint drawn as nested ridges, with a scanner line sweeping over it. */
function Fingerprint() {
  const cx = 36;
  const cy = 30;
  return (
    <svg className="fp" viewBox="0 0 72 76" width="120" height="126" aria-hidden="true">
      <g fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
        {RIDGES.map(({ r, a, b, dash }) => (
          <path
            key={r}
            d={`M${cx - r} ${cy + a} V${cy} A${r} ${r} 0 0 1 ${cx + r} ${cy} V${cy + b}`}
            strokeDasharray={dash || undefined}
          />
        ))}
      </g>
      <rect className="scan" x="2" y="0" width="68" height="3" rx="1.5" />
    </svg>
  );
}

/** A card that shows its content only while pressed. Releasing hides it again. */
export default function HoldCard({ resetKey, role, onSeen, children }: Props) {
  const { t } = useLang();
  const [open, setOpen] = useState(false);
  const seen = useRef(false);

  useEffect(() => {
    setOpen(false);
    seen.current = false;
  }, [resetKey]);

  const show = () => {
    if (open) return;
    setOpen(true);
    // Same sound and vibration for every role, so nobody can tell who the imposter is.
    play('reveal');
    vibrate(40);
    if (!seen.current) {
      seen.current = true;
      onSeen();
    }
  };
  const hide = () => setOpen(false);

  return (
    <div
      className={'holdcard' + (open ? ' open' : '') + ' ' + role}
      onPointerDown={show}
      onPointerUp={hide}
      onPointerLeave={hide}
      onPointerCancel={hide}
      onContextMenu={(e) => e.preventDefault()}
    >
      <div className="face front">
        <Fingerprint />
        <b>{t.holdReveal}</b>
        <span>{t.releaseHide}</span>
      </div>
      <div className="face back">{children}</div>
    </div>
  );
}
