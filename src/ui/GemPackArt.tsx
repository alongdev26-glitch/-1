import { useId } from 'react';

// Facet colours, lit from the top left: [crown…, pavilion…]
const FACETS: [string, string][] = [
  ['-8,-3 -4,-8 -4,-3', '#9fe6ff'],
  ['-4,-8 0,-3 -4,-3', '#d9f7ff'],
  ['-4,-8 4,-8 0,-3', '#ffffff'],
  ['4,-8 4,-3 0,-3', '#8fdcff'],
  ['4,-8 8,-3 4,-3', '#52b8f2'],
  ['-8,-3 -4,-3 0,9', '#3aaef0'],
  ['-4,-3 0,-3 0,9', '#7fd2ff'],
  ['0,-3 4,-3 0,9', '#1c86dc'],
  ['4,-3 8,-3 0,9', '#0e5fb4'],
];

/** One brilliant-cut diamond, centred on (x, y), with facets, a sheen and a glint. */
function Gem({ id, x, y, s = 1, r = 0, glint = false }: { id: string; x: number; y: number; s?: number; r?: number; glint?: boolean }) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${r}) scale(${s})`}>
      {FACETS.map(([pts, fill]) => (
        <polygon key={pts} points={pts} fill={fill} stroke="#0a4a8c" strokeWidth="0.35" strokeLinejoin="round" />
      ))}
      <polygon points="-8,-3 -4,-8 4,-8 8,-3 0,9" fill={`url(#${id}m)`} />
      <polygon points="-8,-3 -4,-8 4,-8 8,-3 0,9" fill="none" stroke="#06407e" strokeWidth="0.8" strokeLinejoin="round" />
      <path d="M-3 -6.6 L-0.5 -6.6" stroke="#fff" strokeWidth="1" strokeLinecap="round" />
      {glint && <path d="M5 -9 V-3 M2 -6 H8" stroke="#fff" strokeWidth="0.9" strokeLinecap="round" />}
    </g>
  );
}

/** Realistic drawings for the diamond packs: a velvet pouch, a leather bag, a wooden crate and a steel vault, each fuller than the last. */
export function GemPackArt({ kind }: { kind: 0 | 1 | 2 | 3 }) {
  const id = useId().replace(/:/g, '');
  const g = (name: string) => `url(#${id}${name})`;
  return (
    <svg viewBox="0 0 64 64" className="gem-art" aria-hidden="true">
      <defs>
        <filter id={`${id}b`} x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="1.6" />
        </filter>
        <linearGradient id={`${id}m`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity="0.65" />
          <stop offset="0.45" stopColor="#fff" stopOpacity="0" />
          <stop offset="1" stopColor="#001a44" stopOpacity="0.35" />
        </linearGradient>
        <radialGradient id={`${id}p`} cx="0.35" cy="0.3" r="0.85">
          <stop offset="0" stopColor="#e2b8ff" />
          <stop offset="0.5" stopColor="#8b46e2" />
          <stop offset="1" stopColor="#3e1688" />
        </radialGradient>
        <linearGradient id={`${id}l`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#c47a3c" />
          <stop offset="0.35" stopColor="#9a5524" />
          <stop offset="1" stopColor="#5a2c0e" />
        </linearGradient>
        <linearGradient id={`${id}w`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#dca66a" />
          <stop offset="1" stopColor="#a8693a" />
        </linearGradient>
        <linearGradient id={`${id}s`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#f1f4f9" />
          <stop offset="0.35" stopColor="#aab4c4" />
          <stop offset="0.7" stopColor="#7d899b" />
          <stop offset="1" stopColor="#566173" />
        </linearGradient>
        <linearGradient id={`${id}o`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#d8dee8" />
          <stop offset="1" stopColor="#6c788a" />
        </linearGradient>
        <linearGradient id={`${id}y`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#fff3a8" />
          <stop offset="0.5" stopColor="#f2b827" />
          <stop offset="1" stopColor="#9c6508" />
        </linearGradient>
        <radialGradient id={`${id}g`}>
          <stop offset="0" stopColor="#ffffff" stopOpacity="0.9" />
          <stop offset="0.35" stopColor="#bfeaff" stopOpacity="0.55" />
          <stop offset="1" stopColor="#6fd0ff" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={`${id}i`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#0a0f1a" />
          <stop offset="1" stopColor="#26324a" />
        </linearGradient>
      </defs>

      {kind === 0 && (
        // a velvet drawstring pouch with diamonds spilling out of the neck
        <g>
          <ellipse cx="32" cy="57.5" rx="17" ry="3" fill="#000" opacity="0.35" filter={g('b')} />
          <Gem id={id} x={26} y={18} s={0.85} r={-14} />
          <Gem id={id} x={38} y={17} s={0.9} r={12} glint />
          <Gem id={id} x={32} y={22} s={0.8} />
          <path d="M20 31 Q10 55 32 57 Q54 55 44 31 Z" fill={g('p')} stroke="#35127a" strokeWidth="1.2" />
          <path d="M26 33 Q22 46 25 55 M32 34 Q32 46 32 56 M38 33 Q42 46 39 55" fill="none" stroke="#2c0e66" strokeOpacity="0.4" strokeWidth="1.2" strokeLinecap="round" />
          <path d="M23 36 Q19 46 24 53" fill="none" stroke="#fff" strokeOpacity="0.4" strokeWidth="2.2" strokeLinecap="round" />
          <path d="M20.5 31 Q22 22 27 26 Q32 20 37 26 Q42 22 43.5 31 Z" fill="#9a5ae8" stroke="#35127a" strokeWidth="1.2" strokeLinejoin="round" />
          <path d="M25 28 Q26 25 27 26 M32 26 Q32 23 33 24 M38 28 Q38 25 37 26" fill="none" stroke="#2c0e66" strokeOpacity="0.4" strokeWidth="1" />
          <path d="M19 29.5 Q32 34 45 29.5 Q45 33 32 35 Q19 33 19 29.5 Z" fill={g('y')} stroke="#7a4c06" strokeWidth="1" strokeLinejoin="round" />
          <path d="M44 32 Q52 33 50 41" fill="none" stroke={g('y')} strokeWidth="2.2" strokeLinecap="round" />
          <path d="M50 40 L47.5 47 M50 40 L50 48 M50 40 L52.5 47" stroke="#e8a914" strokeWidth="1.2" strokeLinecap="round" />
          <Gem id={id} x={32.5} y={46} s={0.6} glint />
        </g>
      )}

      {kind === 1 && (
        // an open leather satchel brimming with diamonds
        <g>
          <ellipse cx="32" cy="58" rx="24" ry="3" fill="#000" opacity="0.35" filter={g('b')} />
          <path d="M21 29 Q20 9 32 9 Q44 9 43 29" fill="none" stroke="#3a1a06" strokeWidth="5" strokeLinecap="round" />
          <path d="M21 29 Q20 9.5 32 9.5 Q44 9.5 43 29" fill="none" stroke="#8a4a1e" strokeWidth="3" strokeLinecap="round" />
          <path d="M23 18 Q25 11.5 30 11" fill="none" stroke="#e0a266" strokeOpacity="0.7" strokeWidth="1" strokeLinecap="round" />
          <Gem id={id} x={20} y={26} s={0.85} r={-16} />
          <Gem id={id} x={44} y={26} s={0.85} r={16} />
          <Gem id={id} x={32} y={21} s={0.95} glint />
          <Gem id={id} x={26} y={28} s={0.8} r={8} />
          <Gem id={id} x={38} y={28} s={0.8} r={-8} />
          <path d="M9 36 Q9 28 17 28 H47 Q55 28 55 36 V50 Q55 57 47 57 H17 Q9 57 9 50 Z" fill={g('l')} stroke="#3a1806" strokeWidth="1.4" />
          <path d="M9 36 H55 V40 Q32 44 9 40 Z" fill="#5a2c0e" fillOpacity="0.55" />
          <path d="M12 33 H52" stroke="#f0c08a" strokeOpacity="0.55" strokeWidth="1.6" strokeLinecap="round" />
          <path d="M12.5 53.5 H51.5" stroke="#e8b27a" strokeOpacity="0.8" strokeWidth="0.8" strokeDasharray="2 1.4" strokeLinecap="round" />
          <path d="M12 45 Q11 52 17 54" stroke="#e8b27a" strokeOpacity="0.8" strokeWidth="0.8" strokeDasharray="2 1.4" fill="none" strokeLinecap="round" />
          <path d="M52 45 Q53 52 47 54" stroke="#e8b27a" strokeOpacity="0.8" strokeWidth="0.8" strokeDasharray="2 1.4" fill="none" strokeLinecap="round" />
          <rect x="26" y="34" width="12" height="10" rx="2.5" fill={g('y')} stroke="#7a4c06" strokeWidth="1.1" />
          <rect x="28" y="36" width="8" height="6" rx="1.5" fill="none" stroke="#fff3a8" strokeOpacity="0.8" strokeWidth="0.6" />
          <circle cx="32" cy="39" r="1.6" fill="#5a3604" />
          <path d="M32 39 V42" stroke="#5a3604" strokeWidth="1" strokeLinecap="round" />
        </g>
      )}

      {kind === 2 && (
        // a nailed wooden crate heaped with diamonds
        <g>
          <ellipse cx="32" cy="59" rx="26" ry="3" fill="#000" opacity="0.35" filter={g('b')} />
          <Gem id={id} x={15} y={25} s={0.85} r={-20} />
          <Gem id={id} x={49} y={24} s={0.85} r={18} />
          <Gem id={id} x={24} y={21} s={0.95} r={-6} />
          <Gem id={id} x={40} y={20} s={0.95} r={8} />
          <Gem id={id} x={32} y={15} s={1.05} glint />
          <Gem id={id} x={19} y={29} s={0.8} />
          <Gem id={id} x={32} y={26} s={0.9} />
          <Gem id={id} x={45} y={29} s={0.8} />
          <rect x="8" y="31" width="48" height="26" rx="1.5" fill={g('w')} stroke="#4a2810" strokeWidth="1.4" />
          <path d="M8 39.5 H56 M8 48.2 H56" stroke="#4a2810" strokeWidth="1.3" />
          <g fill="none" stroke="#6a3a14" strokeOpacity="0.55" strokeWidth="0.5" strokeLinecap="round">
            <path d="M14 34 Q24 33 34 35 T52 34" />
            <path d="M12 37 Q22 36.5 30 37.6 T54 37" />
            <path d="M14 43 Q26 42 36 44 T52 43" />
            <path d="M12 46 Q24 45.4 34 46.4 T54 45.8" />
            <path d="M14 51.5 Q26 50.6 36 52.4 T52 51.6" />
            <path d="M12 54.6 Q24 54 34 55 T54 54.4" />
          </g>
          <path d="M11 33 L53 55 M53 33 L11 55" stroke="#3a1e08" strokeWidth="4.4" strokeOpacity="0.35" strokeLinecap="round" />
          <path d="M11 33 L53 55 M53 33 L11 55" stroke="#a8682e" strokeWidth="3" strokeLinecap="round" />
          <path d="M11 32.2 L53 54.2 M53 32.2 L11 54.2" stroke="#e6b27a" strokeOpacity="0.6" strokeWidth="0.7" strokeLinecap="round" />
          <rect x="8" y="31" width="48" height="2.2" fill="#e8b57a" opacity="0.6" />
          <g fill={g('o')} stroke="#3e4756" strokeWidth="0.8">
            <path d="M7 30 H17 V34 H11 V41 H7 Z" />
            <path d="M57 30 H47 V34 H53 V41 H57 Z" />
            <path d="M7 58 H17 V54 H11 V47 H7 Z" />
            <path d="M57 58 H47 V54 H53 V47 H57 Z" />
          </g>
          <g fill="#fff" fillOpacity="0.85">
            <circle cx="9.2" cy="32.4" r="0.7" />
            <circle cx="54.8" cy="32.4" r="0.7" />
            <circle cx="9.2" cy="55.6" r="0.7" />
            <circle cx="54.8" cy="55.6" r="0.7" />
          </g>
        </g>
      )}

      {kind === 3 && (
        // an open steel vault, its inside glowing with stacked diamonds
        <g>
          <ellipse cx="33" cy="60" rx="28" ry="2.6" fill="#000" opacity="0.35" filter={g('b')} />
          <rect x="6" y="9" width="44" height="47" rx="5" fill={g('s')} stroke="#2f3846" strokeWidth="1.4" />
          <rect x="7.5" y="10.5" width="41" height="44" rx="4" fill="none" stroke="#fff" strokeOpacity="0.6" strokeWidth="0.8" />
          <rect x="11" y="14" width="34" height="37" rx="3" fill={g('i')} stroke="#1a2130" strokeWidth="1.2" />
          <circle cx="28" cy="34" r="21" fill={g('g')} />
          <path d="M11 33 H45" stroke="#7d899b" strokeWidth="1.6" />
          <path d="M11 34.2 H45" stroke="#000" strokeOpacity="0.5" strokeWidth="0.8" />
          <Gem id={id} x={19} y={27} s={0.72} />
          <Gem id={id} x={28} y={26} s={0.85} glint />
          <Gem id={id} x={37} y={27} s={0.72} r={4} />
          <Gem id={id} x={23.5} y={21} s={0.62} />
          <Gem id={id} x={32.5} y={21} s={0.62} r={-6} />
          <Gem id={id} x={18} y={45} s={0.78} r={-5} />
          <Gem id={id} x={28} y={44} s={0.9} glint />
          <Gem id={id} x={38} y={45} s={0.78} r={5} />
          <Gem id={id} x={23} y={38.5} s={0.68} />
          <Gem id={id} x={33} y={38.5} s={0.68} />
          <g fill="#fff" fillOpacity="0.9">
            <circle cx="9.5" cy="12.5" r="0.9" />
            <circle cx="46.5" cy="12.5" r="0.9" />
            <circle cx="9.5" cy="52.5" r="0.9" />
            <circle cx="46.5" cy="52.5" r="0.9" />
          </g>
          <path d="M50 13 L60 8 L60 57 L50 52 Z" fill={g('o')} stroke="#2f3846" strokeWidth="1.4" strokeLinejoin="round" />
          <path d="M52 16 L58 13 M52 24 L58 21" stroke="#fff" strokeOpacity="0.4" strokeWidth="0.8" />
          <circle cx="55" cy="32" r="4.2" fill={g('y')} stroke="#7a4c06" strokeWidth="1.1" />
          <circle cx="55" cy="32" r="2.2" fill="none" stroke="#7a4c06" strokeWidth="0.7" />
          <path d="M55 27.8 V36.2 M50.8 32 H59.2" stroke="#7a4c06" strokeWidth="1" strokeLinecap="round" />
          <rect x="10" y="56" width="8" height="4" rx="1" fill="#3a4352" />
          <rect x="39" y="56" width="8" height="4" rx="1" fill="#3a4352" />
        </g>
      )}
    </svg>
  );
}
