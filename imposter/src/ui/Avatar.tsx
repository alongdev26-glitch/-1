import type { Role } from '../engine/game';

export type AvatarKind = Role | 'unknown';

const SKIN = ['#f3c9a5', '#e0a97c', '#c68a5c', '#8d5a3a', '#f6d7bd', '#b97a52'];
const HAIR = ['#3a2418', '#c9822b', '#161616', '#7a4a21', '#a33b2b', '#d8b45a'];
const SUIT = ['#1c1c22', '#26262e', '#2b2d42', '#22303a', '#2e2420', '#1f2a24'];
const LOOKS = ['short', 'ponytail', 'bob', 'cap', 'santa', 'bun', 'spiky', 'headband', 'long', 'beanie', 'alien', 'side'] as const;
type Look = (typeof LOOKS)[number];

const STROKE = { stroke: '#050507', strokeWidth: 3.4, strokeLinejoin: 'round' as const };

function Hair({ look, color }: { look: Look; color: string }) {
  const cap = <path d="M24 38 C22 10 78 10 76 38 C70 26 58 24 50 24 C42 24 30 26 24 38 Z" fill={color} {...STROKE} />;
  switch (look) {
    case 'ponytail':
      return (
        <>
          <path d="M72 30 C92 28 92 56 80 62 C84 50 80 42 72 40 Z" fill={color} {...STROKE} />
          {cap}
        </>
      );
    case 'bob':
      return <path d="M22 56 C16 8 84 8 78 56 L70 56 C70 36 62 26 50 26 C38 26 30 36 30 56 Z" fill={color} {...STROKE} />;
    case 'long':
      return <path d="M20 70 C14 6 86 6 80 70 L70 66 C70 38 62 26 50 26 C38 26 30 38 30 66 Z" fill={color} {...STROKE} />;
    case 'cap':
      return (
        <>
          <path d="M26 34 C26 8 74 8 74 34 Z" fill="#3b4a5c" {...STROKE} />
          <path d="M24 34 L82 34 L82 40 L24 40 Z" fill="#2a3644" {...STROKE} />
        </>
      );
    case 'santa':
      return (
        <>
          <path d="M24 34 C26 6 62 0 78 22 C84 28 80 34 78 34 Z" fill="#c1121f" {...STROKE} />
          <rect x="22" y="30" width="56" height="10" rx="5" fill="#f4f4f4" {...STROKE} />
          <circle cx="79" cy="20" r="6" fill="#f4f4f4" {...STROKE} />
        </>
      );
    case 'bun':
      return (
        <>
          <circle cx="50" cy="9" r="9" fill={color} {...STROKE} />
          {cap}
        </>
      );
    case 'spiky':
      return <path d="M24 38 L24 22 L34 28 L38 12 L48 24 L58 10 L62 26 L74 16 L76 38 C70 28 58 26 50 26 C42 26 30 28 24 38 Z" fill={color} {...STROKE} />;
    case 'headband':
      return (
        <>
          {cap}
          <rect x="25" y="29" width="50" height="6" fill="#e5242b" {...STROKE} strokeWidth={2} />
        </>
      );
    case 'beanie':
      return (
        <>
          <path d="M25 36 C24 6 76 6 75 36 Z" fill="#6b6b76" {...STROKE} />
          <rect x="23" y="31" width="54" height="9" rx="4" fill="#4a4a54" {...STROKE} />
        </>
      );
    case 'side':
      return <path d="M24 38 C20 10 80 6 76 38 C72 30 62 22 40 28 C32 30 28 32 24 38 Z" fill={color} {...STROKE} />;
    case 'alien':
      return null;
    default:
      return cap;
  }
}

const Ground = () => <ellipse cx="50" cy="97" rx="30" ry="3.5" fill="#000" fillOpacity=".35" />;

/** Ears behind the head, a soft blush and a highlight on top of it. */
const Ears = ({ skin }: { skin: string }) => (
  <>
    <circle cx="26" cy="46" r="5" fill={skin} {...STROKE} strokeWidth={2.5} />
    <circle cx="74" cy="46" r="5" fill={skin} {...STROKE} strokeWidth={2.5} />
  </>
);
const Blush = () => (
  <>
    <ellipse cx="34" cy="53" rx="4.5" ry="2.8" fill="#ff7a7a" fillOpacity=".45" />
    <ellipse cx="66" cy="53" rx="4.5" ry="2.8" fill="#ff7a7a" fillOpacity=".45" />
  </>
);
const Shine = () => <path d="M32 24 Q40 17 50 17" fill="none" stroke="#fff" strokeOpacity=".45" strokeWidth="3" strokeLinecap="round" />;
const BodyShade = () => <path d="M50 62 C66 62 82 70 82 100 L62 100 C64 80 60 68 50 62 Z" fill="#000" fillOpacity=".22" />;

/** The shared agent body. Colour of the suit follows the role. */
function Body({ suit, tie = '#c1121f', gun = false }: { suit: string; tie?: string; gun?: boolean }) {
  return (
    <>
      <path d="M18 100 C18 70 34 62 50 62 C66 62 82 70 82 100 Z" fill={suit} {...STROKE} />
      <BodyShade />
      <path d="M43 62 L50 80 L57 62 Z" fill="#f4f4f4" {...STROKE} strokeWidth={2} />
      <path d="M48 66 L50 84 L52 66 Z" fill={tie} />
      {gun && (
        <g>
          <rect x="72" y="76" width="22" height="7" rx="2" fill="#2d2d33" {...STROKE} strokeWidth={2} />
          <rect x="72" y="80" width="8" height="12" rx="2" fill="#2d2d33" {...STROKE} strokeWidth={2} />
          <circle cx="76" cy="84" r="5" fill="#f3c9a5" {...STROKE} strokeWidth={2} />
        </g>
      )}
    </>
  );
}

const Sunglasses = () => (
  <>
    <rect x="31" y="37" width="17" height="11" rx="4" fill="#111" />
    <rect x="52" y="37" width="17" height="11" rx="4" fill="#111" />
    <line x1="48" y1="41" x2="52" y2="41" stroke="#111" strokeWidth="2.5" />
    <line x1="44" y1="57" x2="56" y2="57" stroke="#000" strokeWidth="2.5" strokeLinecap="round" />
  </>
);

/**
 * A small chibi agent. `seed` (the player's seat) picks skin, hair and hairstyle, so every player in a
 * group looks different; `kind` adds the role's outfit and props.
 */
export default function Avatar({ seed, kind = 'innocent', size = 96 }: { seed: number; kind?: AvatarKind; size?: number }) {
  const skin = SKIN[(seed * 5 + 2) % SKIN.length];
  const hair = HAIR[(seed * 3 + 1) % HAIR.length];
  const rawLook = LOOKS[seed % LOOKS.length];
  const suit = SUIT[seed % SUIT.length];
  const alien = rawLook === 'alien' && (kind === 'innocent' || kind === 'unknown');
  const look: Look = rawLook === 'alien' && !alien ? 'short' : rawLook;
  const faceFill = alien ? '#b9bcc4' : skin;

  const head = <rect x="26" y="14" width="48" height="50" rx="22" fill={faceFill} {...STROKE} />;

  let body;
  let face;
  let hat;
  switch (kind) {
    case 'jester':
      body = (
        <>
          <Body suit="#161616" tie="#d4a017" />
          <path d="M28 66 L50 60 L72 66" fill="none" stroke="#d4a017" strokeWidth="2" />
        </>
      );
      return (
        <svg className="avatar" width={size} height={size} viewBox="0 0 100 100" aria-hidden="true">
          <Ground />
          {body}
          {/* hood and Guy Fawkes style mask */}
          <path d="M22 44 C16 6 84 6 78 44 C78 62 66 68 50 68 C34 68 22 62 22 44 Z" fill="#161616" {...STROKE} />
          <ellipse cx="50" cy="42" rx="20" ry="24" fill="#f4f1ea" {...STROKE} strokeWidth={2.5} />
          <path d="M38 34 Q42 31 46 35 M54 35 Q58 31 62 34" stroke="#000" strokeWidth="2.5" fill="none" strokeLinecap="round" />
          <circle cx="42" cy="38" r="2" fill="#000" />
          <circle cx="58" cy="38" r="2" fill="#000" />
          <circle cx="37" cy="47" r="3.5" fill="#e88" />
          <circle cx="63" cy="47" r="3.5" fill="#e88" />
          <path d="M36 52 Q43 49 50 52 Q57 49 64 52 Q57 56 50 53 Q43 56 36 52 Z" fill="#000" />
          <path d="M47 58 L50 66 L53 58 Z" fill="#000" />
        </svg>
      );
    case 'bounty':
      body = (
        <>
          <path d="M16 100 C16 70 34 62 50 62 C66 62 84 70 84 100 Z" fill="#8a5a36" {...STROKE} />
          <path d="M43 62 L50 78 L57 62 Z" fill="#f4f4f4" {...STROKE} strokeWidth={2} />
          <circle cx="78" cy="84" r="8" fill="#cfe8f0" fillOpacity=".55" {...STROKE} strokeWidth={2.5} />
          <line x1="72" y1="90" x2="64" y2="98" stroke="#000" strokeWidth="3" strokeLinecap="round" />
        </>
      );
      face = (
        <>
          <circle cx="42" cy="44" r="2.6" fill="#000" />
          <circle cx="58" cy="44" r="2.6" fill="#000" />
          <line x1="45" y1="56" x2="55" y2="56" stroke="#000" strokeWidth="2.5" strokeLinecap="round" />
        </>
      );
      hat = (
        <>
          <ellipse cx="50" cy="30" rx="32" ry="8" fill="#9a6a3c" {...STROKE} />
          <path d="M28 30 C28 8 72 8 72 30 Z" fill="#a8763f" {...STROKE} />
          <path d="M36 14 L44 30 M46 12 L52 30 M58 14 L58 30 M66 18 L64 30" stroke="#6b4423" strokeWidth="2" />
        </>
      );
      return (
        <svg className="avatar" width={size} height={size} viewBox="0 0 100 100" aria-hidden="true">
          <Ground />
          {body}
          <Ears skin={skin} />
          {head}
          <Blush />
          {face}
          {hat}
        </svg>
      );
    case 'imposter':
      body = <Body suit={suit} />;
      face = (
        <>
          <circle cx="40" cy="42" r="7" fill="#fff" {...STROKE} strokeWidth={2.5} />
          <circle cx="60" cy="42" r="7" fill="#fff" {...STROKE} strokeWidth={2.5} />
          <line x1="47" y1="42" x2="53" y2="42" stroke="#000" strokeWidth="2.5" />
          <circle cx="40" cy="42" r="2" fill="#000" />
          <circle cx="60" cy="42" r="2" fill="#000" />
          <ellipse cx="50" cy="51" rx="6" ry="5" fill="#f08a8a" {...STROKE} strokeWidth={2} />
          <path d="M38 57 C44 53 56 53 62 57 C56 61 44 61 38 57 Z" fill="#161616" />
        </>
      );
      break;
    case 'bodyguard':
      body = (
        <>
          <Body suit="#2f2a6b" tie="#8f86ff" />
          <path d="M26 70 L40 66 M74 70 L60 66" stroke="#8f86ff" strokeWidth="2" />
        </>
      );
      face = (
        <>
          <Sunglasses />
          <path d="M26 46 C20 46 20 56 26 58" fill="none" stroke="#8f86ff" strokeWidth="2.5" />
        </>
      );
      break;
    case 'unknown':
      body = <Body suit={suit} />;
      face = <text x="50" y="52" textAnchor="middle" fontSize="26" fontWeight="800" fill="#000">?</text>;
      break;
    default:
      body = <Body suit={suit} gun />;
      face = <Sunglasses />;
  }

  return (
    <svg className="avatar" width={size} height={size} viewBox="0 0 100 100" aria-hidden="true">
      <Ground />
      {body}
      {!alien && <Ears skin={faceFill} />}
      {head}
      {!alien && kind !== 'imposter' && <Blush />}
      <Shine />
      {alien && (
        <>
          <ellipse cx="38" cy="42" rx="8" ry="5" transform="rotate(20 38 42)" fill="#0c0c10" />
          <ellipse cx="62" cy="42" rx="8" ry="5" transform="rotate(-20 62 42)" fill="#0c0c10" />
        </>
      )}
      {!alien && face}
      {kind === 'unknown' && alien && face}
      <Hair look={look} color={hair} />
    </svg>
  );
}
