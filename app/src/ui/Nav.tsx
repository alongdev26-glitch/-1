import { Icon, type IconName } from './icons';

export type Tab = 'home' | 'expenses' | 'group' | 'visa';

const ITEMS: { id: Tab; label: string; icon: IconName }[] = [
  { id: 'home', label: 'בית', icon: 'home' },
  { id: 'expenses', label: 'הוצאות', icon: 'receipt' },
  { id: 'group', label: 'קבוצה', icon: 'users' },
  { id: 'visa', label: 'ויזה', icon: 'passport' },
];

export function BottomNav({ tab, onTab, onAdd }: { tab: Tab; onTab: (t: Tab) => void; onAdd: () => void }) {
  const btn = (i: (typeof ITEMS)[number]) => (
    <button
      key={i.id}
      onClick={() => onTab(i.id)}
      aria-label={i.label}
      aria-current={tab === i.id}
      className={`flex flex-1 flex-col items-center gap-1 py-1 text-[11px] ${tab === i.id ? 'text-mint' : 'text-mute'}`}
    >
      <Icon name={i.icon} size={24} />
      {i.label}
    </button>
  );
  return (
    <nav className="safe-b fixed inset-x-0 bottom-0 z-40 mx-auto flex max-w-md items-center border-t border-line bg-bg/92 px-2 pt-2 backdrop-blur-xl">
      {btn(ITEMS[0])}
      {btn(ITEMS[1])}
      <div className="flex flex-1 justify-center">
        <button
          onClick={onAdd}
          aria-label="הוסף הוצאה"
          className="-mt-8 grid h-16 w-16 place-items-center rounded-full bg-mint text-bg shadow-[0_6px_24px_rgba(47,191,113,.35)] ring-4 ring-bg"
        >
          <Icon name="plus" size={30} />
        </button>
      </div>
      {btn(ITEMS[2])}
      {btn(ITEMS[3])}
    </nav>
  );
}
