import { useState } from 'react';
import { useLang } from '../i18n';
import { getConsent, setConsent } from '../storage';
import { play } from './fx';

/** A plain notice at the top of the page until the player chooses. */
export function ConsentBar({ onPrivacy }: { onPrivacy: () => void }) {
  const { t } = useLang();
  const [choice, setChoice] = useState(getConsent());
  if (choice) return null;
  const pick = (v: 'yes' | 'no') => {
    play('tap');
    setConsent(v);
    setChoice(v);
  };
  return (
    <div className="consent" role="region" aria-label={t.legal.privacy}>
      <p>
        {t.legal.notice}{' '}
        <button className="link" onClick={onPrivacy}>{t.legal.privacy}</button>
      </p>
      <div>
        <button className="ghost" onClick={() => pick('no')}>{t.legal.decline}</button>
        <button className="primary" onClick={() => pick('yes')}>{t.legal.accept}</button>
      </div>
    </div>
  );
}

export function PrivacyScreen({ onClose }: { onClose: () => void }) {
  const { t } = useLang();
  return (
    <main className="screen quiz legal">
      <h1>{t.legal.title}</h1>
      <ul>
        {t.legal.points.map((p) => (
          <li key={p}>{p}</li>
        ))}
      </ul>
      <div className="nav">
        <button className="primary" onClick={onClose}>{t.legal.close}</button>
      </div>
    </main>
  );
}
