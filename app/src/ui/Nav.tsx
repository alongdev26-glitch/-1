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
      className={`flex flex-1 flex-col items-center gap-1 rounded-2xl py-2 text-[11px] ${tab === i.id ? 'text-mint' : 'text-mute'}`}
    >
      <Icon name={i.icon} size={24} />
      {i.label}
    </button>
  );
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 mx-auto max-w-md px-4" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + .75rem)' }}>
      <nav className="pointer-events-auto relative flex items-center rounded-[2rem] border border-white/[.07] bg-[#101412]/90 px-2 py-1.5 shadow-[0_10px_40px_rgba(0,0,0,.55)] backdrop-blur-xl">
        {btn(ITEMS[0])}
        {btn(ITEMS[1])}
        <div className="flex flex-1 justify-center">
          <button
            onClick={onAdd}
            aria-label="הוסף הוצאה"
            className="-mt-9 grid h-[4.5rem] w-[4.5rem] place-items-center rounded-full bg-gradient-to-b from-[#3bd183] to-[#22a15b] text-[#04170d] shadow-[0_0_0_6px_rgba(16,20,18,.9),0_10px_34px_rgba(47,191,113,.45)]"
          >
            <Icon name="plus" size={32} stroke={2.4} />
          </button>
        </div>
        {btn(ITEMS[2])}
        {btn(ITEMS[3])}
      </nav>
    </div>
  );
}
