export type AvatarKind = 'crew' | 'imposter' | 'unknown';

const SUITS = ['#2b2d42', '#5a3e2b', '#1f4e5f', '#4a2c5e', '#6b2737', '#3b5d3a'];
const HAIR = ['#3a2418', '#c9822b', '#161616', '#7a4a21', '#a33b2b', '#d8b45a'];
const SKIN = ['#f3c9a5', '#e0a97c', '#c68a5c', '#8d5a3a'];

/** A small chibi agent. Colours are derived from the player's seat so each player looks different. */
export default function Avatar({ seed, kind = 'crew', size = 96 }: { seed: number; kind?: AvatarKind; size?: number }) {
  const suit = SUITS[seed % SUITS.length];
  const hair = HAIR[(seed * 3 + 1) % HAIR.length];
  const skin = SKIN[(seed * 5 + 2) % SKIN.length];
  const disguised = kind === 'imposter';
  return (
    <svg className="avatar" width={size} height={size} viewBox="0 0 100 100" role="img" aria-hidden="true">
      {/* body */}
      <path d="M20 100 C20 70 34 62 50 62 C66 62 80 70 80 100 Z" fill={suit} stroke="#000" strokeWidth="3" />
      <path d="M44 62 L50 80 L56 62 Z" fill="#fff" stroke="#000" strokeWidth="2" />
      <path d="M48 66 L50 82 L52 66 Z" fill="#c1121f" />
      {/* head */}
      <rect x="26" y="14" width="48" height="50" rx="22" fill={skin} stroke="#000" strokeWidth="3" />
      {/* hair */}
      <path d="M24 38 C22 10 78 10 76 38 C70 26 58 24 50 24 C42 24 30 26 24 38 Z" fill={hair} stroke="#000" strokeWidth="3" />
      {kind === 'unknown' ? (
        <text x="50" y="52" textAnchor="middle" fontSize="26" fontWeight="800" fill="#000">?</text>
      ) : disguised ? (
        <>
          {/* round glasses, big nose and moustache */}
          <circle cx="40" cy="42" r="7" fill="#fff" stroke="#000" strokeWidth="2.5" />
          <circle cx="60" cy="42" r="7" fill="#fff" stroke="#000" strokeWidth="2.5" />
          <line x1="47" y1="42" x2="53" y2="42" stroke="#000" strokeWidth="2.5" />
          <circle cx="40" cy="42" r="2" fill="#000" />
          <circle cx="60" cy="42" r="2" fill="#000" />
          <ellipse cx="50" cy="51" rx="6" ry="5" fill="#f08a8a" stroke="#000" strokeWidth="2" />
          <path d="M38 57 C44 53 56 53 62 57 C56 61 44 61 38 57 Z" fill="#161616" />
        </>
      ) : (
        <>
          {/* sunglasses */}
          <rect x="31" y="37" width="17" height="11" rx="4" fill="#111" />
          <rect x="52" y="37" width="17" height="11" rx="4" fill="#111" />
          <line x1="48" y1="41" x2="52" y2="41" stroke="#111" strokeWidth="2.5" />
          <line x1="44" y1="57" x2="56" y2="57" stroke="#000" strokeWidth="2.5" strokeLinecap="round" />
        </>
      )}
    </svg>
  );
}
