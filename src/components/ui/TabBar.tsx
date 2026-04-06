'use client';
import { LayoutGrid, Dumbbell, CalendarDays } from 'lucide-react';

const tabs = [
  { id: 'plans',   label: 'Fichas',    Icon: LayoutGrid   },
  { id: 'workout', label: 'Treinar',   Icon: Dumbbell      },
  { id: 'history', label: 'Histórico', Icon: CalendarDays  },
];

interface Props {
  view: string;
  onChangeView: (view: string) => void;
}

export default function TabBar({ view, onChangeView }: Props) {
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 grid grid-cols-3 border-t border-purple-500/10"
      style={{
        background: 'rgba(8, 6, 15, 0.96)',
        backdropFilter: 'blur(16px)',
        paddingBottom: 'env(safe-area-inset-bottom, 12px)',
      }}>
      {tabs.map(({ id, label, Icon }) => {
        const active = view === id;
        return (
          <button
            key={id}
            onClick={() => onChangeView(id)}
            className="flex flex-col items-center gap-1 py-2.5 transition-all active:scale-95">
            <Icon
              size={22}
              strokeWidth={active ? 2.2 : 1.8}
              className={active ? 'text-purple-400' : 'text-[#3a3060]'}
            />
            <span className={`text-[10px] font-medium tracking-wide ${
              active ? 'text-purple-400' : 'text-[#3a3060]'
            }`}>
              {label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
