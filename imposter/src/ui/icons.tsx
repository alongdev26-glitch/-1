const PATHS: Record<string, React.ReactNode> = {
  animals: (
    <>
      <circle cx="7" cy="9" r="1.8" />
      <circle cx="12" cy="6.5" r="1.8" />
      <circle cx="17" cy="9" r="1.8" />
      <path d="M12 12c-3 0-5 2.5-5 4.5 0 1.6 1.4 2.5 3 2.5 1 0 1.4-.4 2-.4s1 .4 2 .4c1.6 0 3-.9 3-2.5 0-2-2-4.5-5-4.5z" />
    </>
  ),
  food: <path d="M7 3v7a2 2 0 0 0 2 2v9M11 3v7a2 2 0 0 1-2 2M15 21V3c2.5 1 4 4 4 8h-4" />,
  places: <path d="M5 21V8l6-3v16M11 21V4l8 4v13M3 21h18M8 10h1M8 13h1M8 16h1M15 11h1M15 14h1M15 17h1" />,
  jobs: (
    <>
      <rect x="3" y="8" width="18" height="12" rx="2" />
      <path d="M9 8V6a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2M3 13h18" />
    </>
  ),
  objects: (
    <>
      <rect x="6" y="3" width="13" height="18" rx="1.5" />
      <path d="M6 7H4M6 12H4M6 17H4M10 8h5M10 12h5" />
    </>
  ),
  sports: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 8l3.5 2.5-1.3 4h-4.4l-1.3-4zM12 8V3M15.5 10.5l5-1.5M14.2 14.5l3 4M9.8 14.5l-3 4M8.5 10.5l-5-1.5" />
    </>
  ),
  countries: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18" />
    </>
  ),
  movies: <path d="M3 9h18v11a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1zM3 9l2-5 16 3-1 2M8 5.8L6.5 9M13 6.8L11.5 10M18 7.8L16.5 11" />,
  music: (
    <>
      <path d="M9 18V5l11-2v13" />
      <circle cx="6.5" cy="18" r="2.5" />
      <circle cx="17.5" cy="16" r="2.5" />
    </>
  ),
  tech: (
    <>
      <rect x="7" y="7" width="10" height="10" rx="1.5" />
      <path d="M10 3v4M14 3v4M10 17v4M14 17v4M3 10h4M3 14h4M17 10h4M17 14h4" />
    </>
  ),
  sound: <path d="M4 9v6h4l5 4V5L8 9zM16 9a4 4 0 0 1 0 6M18.5 6.5a8 8 0 0 1 0 11" />,
  mute: <path d="M4 9v6h4l5 4V5L8 9zM17 9l5 6M22 9l-5 6" />,
};

/** Monochrome line icons that follow the surrounding text colour. */
export default function Icon({ name, size = 28 }: { name: string; size?: number }) {
  return (
    <svg
      className="icon-svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {PATHS[name]}
    </svg>
  );
}
