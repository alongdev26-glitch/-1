import type { ReactNode } from 'react';

/** One thin-line icon set (24px grid), drawn with currentColor so the palette decides the colour. */
const PATHS = {
  home: <><path d="M3.5 11 12 3.5 20.5 11" /><path d="M5.5 9.5V20h13V9.5" /><path d="M10 20v-5.5h4V20" /></>,
  receipt: <><path d="M6 3.5h12V21l-3-2-3 2-3-2-3 2z" /><path d="M9.5 8.5h5M9.5 12.5h5" /></>,
  users: <><circle cx="9" cy="8" r="3.2" /><path d="M3 20c0-3.4 2.7-5.6 6-5.6s6 2.2 6 5.6" /><circle cx="17.2" cy="9" r="2.4" /><path d="M16.6 14.6c2.5.3 4.4 2.1 4.4 5" /></>,
  passport: <><rect x="5" y="3" width="14" height="18" rx="2" /><circle cx="12" cy="10.5" r="3" /><path d="M9.5 10.5h5M12 7.5c-1.2 1.6-1.2 4.4 0 6M9 17h6" /></>,
  plus: <path d="M12 5v14M5 12h14" />,
  food: <><path d="M3.5 11.5h17a8.5 8.5 0 0 1-17 0z" /><path d="M8 4.5c0 1.6 1.5 1.6 1.5 3.2M12.5 3.5c0 1.6 1.5 1.6 1.5 3.2" /></>,
  car: <><path d="M3.5 16h17v-3.4a2 2 0 0 0-.4-1.2L18 7.5H6l-2.1 3.9a2 2 0 0 0-.4 1.2z" /><path d="M3.5 11.5h17" /><circle cx="7.5" cy="16.5" r="2" /><circle cx="16.5" cy="16.5" r="2" /></>,
  backspace: <><path d="M9 5.5h11.5v13H9L3.5 12z" /><path d="m12.5 9.5 5 5M17.5 9.5l-5 5" /></>,
  bed: <><path d="M3 18.5V6M3 14.5h18v4M21 14.5v-3a3 3 0 0 0-3-3h-7.5v6" /><circle cx="7" cy="11" r="1.7" /></>,
  mountain: <path d="M2.5 19.5 9 8.5l4 6.5 2.3-3.5 6.2 8z" />,
  bag: <><path d="M5 8.5h14l-1 12H6z" /><path d="M9 8.5V7a3 3 0 0 1 6 0v1.5" /></>,
  dots: <><circle cx="6" cy="12" r="1.2" fill="currentColor" /><circle cx="12" cy="12" r="1.2" fill="currentColor" /><circle cx="18" cy="12" r="1.2" fill="currentColor" /></>,
  search: <><circle cx="11" cy="11" r="6.5" /><path d="m16 16 4.5 4.5" /></>,
  bell: <><path d="M6 16v-5a6 6 0 0 1 12 0v5l1.5 2h-15z" /><path d="M10 20.5a2 2 0 0 0 4 0" /></>,
  check: <path d="m5 12.5 4.5 4.5L19 7.5" />,
  back: <path d="M14.5 6 8.5 12l6 6" />,
  forward: <path d="m9.5 6 6 6-6 6" />,
  down: <path d="m6 9.5 6 6 6-6" />,
  close: <path d="M6 6l12 12M18 6 6 18" />,
  upload: <path d="M12 15V4.5M7.5 8.5 12 4l4.5 4.5M5 14.5v5h14v-5" />,
  pencil: <path d="m4 20 1-4.2L16.3 4.5a2 2 0 0 1 2.9 2.9L7.9 18.8z" />,
  wallet: <><rect x="3" y="6" width="18" height="13" rx="2.5" /><path d="M16.5 12.5H21v3h-4.5a1.5 1.5 0 0 1 0-3zM6 6l9-2.5v2.5" /></>,
  globe: <><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18" /></>,
  alert: <><path d="M12 4 21.5 20h-19z" /><path d="M12 10v4.5M12 17.2h.01" /></>,
  trash: <path d="M4.5 7h15M9.5 7V4.5h5V7M6.5 7l1 13h9l1-13" />,
  message: <path d="M4 5.5h16v11H9.5L5 20.5v-4H4z" />,
  compass: <><circle cx="12" cy="12" r="9" /><path d="m15.5 8.5-2 5-5 2 2-5z" /></>,
  coins: <><ellipse cx="9" cy="8" rx="5.5" ry="2.8" /><path d="M3.5 8v4c0 1.5 2.5 2.8 5.5 2.8M3.5 12v4c0 1.5 2.5 2.8 5.5 2.8" /><path d="M14.5 10.5c2.8.2 5 1.3 5 2.7v4c0 1.5-2.5 2.8-5.5 2.8-1.7 0-3.2-.4-4.2-1" /></>,
} satisfies Record<string, ReactNode>;

export type IconName = keyof typeof PATHS;

export function Icon({ name, size = 22, className }: { name: IconName; size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      {PATHS[name]}
    </svg>
  );
}

/** A round badge holding an icon; the quiet building block of every list row. */
export function IconBadge({ name, size = 44, active }: { name: IconName; size?: number; active?: boolean }) {
  return (
    <span
      className={`grid shrink-0 place-items-center rounded-2xl border ${active ? 'border-mint/60 bg-mint/15 text-mint' : 'border-line bg-white/5 text-[#c5d0ca]'}`}
      style={{ width: size, height: size }}
    >
      <Icon name={name} size={Math.round(size * 0.5)} />
    </span>
  );
}
