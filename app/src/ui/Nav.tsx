export type Tab = 'home' | 'expenses' | 'group' | 'visa';

const ITEMS: { id: Tab; label: string; icon: string }[] = [
  { id: 'home', label: 'בית', icon: '🏠' },
  { id: 'expenses', label: 'הוצאות', icon: '🧾' },
  { id: 'group', label: 'קבוצה', icon: '👥' },
  { id: 'visa', label: 'ויזה', icon: '🛂' },
];

export function BottomNav({ tab, onTab, onAdd }: { tab: Tab; onTab: (t: Tab) => void; onAdd: () => void }) {
  const btn = (i: (typeof ITEMS)[number]) => (
    <button
      key={i.id}
      onClick={() => onTab(i.id)}
      aria-label={i.label}
      aria-current={tab === i.id}
      className={`flex flex-1 flex-col items-center gap-0.5 py-1 text-xs ${tab === i.id ? 'text-sky' : 'text-mute'}`}
    >
      <span className="text-xl">{i.icon}</span>
      {i.label}
    </button>
  );
  return (
    <nav className="safe-b fixed inset-x-0 bottom-0 z-40 mx-auto flex max-w-md items-center border-t border-line bg-bg/90 px-2 pt-2 backdrop-blur-xl">
      {btn(ITEMS[0])}
      {btn(ITEMS[1])}
      <div className="flex flex-1 justify-center">
        <button
          onClick={onAdd}
          aria-label="הוסף הוצאה"
          className="-mt-8 grid h-16 w-16 place-items-center rounded-full bg-mint text-4xl font-light text-bg shadow-[0_8px_30px_rgba(16,185,129,.5)] ring-4 ring-bg"
        >
          +
        </button>
      </div>
      {btn(ITEMS[2])}
      {btn(ITEMS[3])}
    </nav>
  );
}
