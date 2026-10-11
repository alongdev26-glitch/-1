import { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { play, vibrate } from './fx';

interface Props {
  /** Bumps when the card should reset (a new player is up). */
  resetKey: number;
  imposter: boolean;
  onSeen: () => void;
  children: ReactNode;
}

/** A card that shows its content only while pressed. Releasing hides it again. */
export default function HoldCard({ resetKey, imposter, onSeen, children }: Props) {
  const [open, setOpen] = useState(false);
  const seen = useRef(false);

  useEffect(() => {
    setOpen(false);
    seen.current = false;
  }, [resetKey]);

  const show = () => {
    if (open) return;
    setOpen(true);
    if (imposter) {
      play('imposter');
      vibrate([60, 40, 60, 40, 160]);
    } else {
      play('reveal');
      vibrate(40);
    }
    if (!seen.current) {
      seen.current = true;
      onSeen();
    }
  };
  const hide = () => setOpen(false);

  return (
    <div
      className={'holdcard' + (open ? ' open' : '') + (imposter ? ' imposter' : '')}
      onPointerDown={show}
      onPointerUp={hide}
      onPointerLeave={hide}
      onPointerCancel={hide}
      onContextMenu={(e) => e.preventDefault()}
    >
      <div className="face front">
        <div className="fingerprint">☝️</div>
        <b>החזק לחוץ כדי לחשוף</b>
        <span>עזוב כדי להסתיר</span>
      </div>
      <div className="face back">{children}</div>
    </div>
  );
}
