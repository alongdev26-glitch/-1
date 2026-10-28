import { useState } from 'react';
import { useLang } from '../i18n';
import Icon from './icons';
import { isSoundOn, play, setSoundOn } from './fx';

export function SoundToggle() {
  const { t } = useLang();
  const [on, setOn] = useState(isSoundOn());
  return (
    <button
      className="icon sound"
      aria-label={t.soundAria}
      onClick={() => {
        setSoundOn(!on);
        setOn(!on);
        if (!on) play('tap');
      }}
    >
      <Icon name={on ? 'sound' : 'mute'} size={20} />
    </button>
  );
}

export function Confetti() {
  const colors = ['#e5242b', '#2ecc71', '#f1c40f', '#3498db', '#bdbdc6'];
  return (
    <div className="confetti" aria-hidden="true">
      {Array.from({ length: 36 }, (_, i) => (
        <i
          key={i}
          style={{
            left: `${(i * 97) % 100}%`,
            background: colors[i % colors.length],
            animationDelay: `${(i % 9) * 0.12}s`,
            animationDuration: `${2 + (i % 5) * 0.4}s`,
          }}
        />
      ))}
    </div>
  );
}
