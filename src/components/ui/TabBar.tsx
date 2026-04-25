'use client';
import { LayoutGrid, Dumbbell, CalendarDays, TrendingUp } from 'lucide-react';

const tabs = [
  { id: 'plans',     label: 'Treinos',   Icon: LayoutGrid,   lockable: false },
  { id: 'workout',   label: 'Treinar',   Icon: Dumbbell,     lockable: true  },
  { id: 'history',   label: 'Histórico', Icon: CalendarDays, lockable: false },
  { id: 'evolution', label: 'Evolução',  Icon: TrendingUp,   lockable: false },
];

interface Props {
  view: string;
  onChangeView: (view: string) => void;
  workoutActive: boolean;
}

export default function TabBar({ view, onChangeView, workoutActive }: Props) {
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 grid grid-cols-4 border-t border-purple-500/10"
      style={{
        background: 'rgba(8, 6, 15, 0.96)',
        backdropFilter: 'blur(16px)',
        paddingBottom: 'env(safe-area-inset-bottom, 12px)',
      }}>
      {tabs.map(({ id, label, Icon, lockable }) => {
        const active = view === id;
        const locked = lockable && !workoutActive;
        return (
          <button
            key={id}
            onClick={() => !locked && onChangeView(id)}
            disabled={locked}
            className={`flex flex-col items-center gap-1 py-2.5 transition-all ${locked ? 'opacity-20 cursor-not-allowed pointer-events-none' : 'active:scale-95'}`}>
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
