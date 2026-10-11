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
        <div className="fingerprint">☝️</div>
        <b>{t.holdReveal}</b>
        <span>{t.releaseHide}</span>
      </div>
      <div className="face back">{children}</div>
    </div>
  );
}
