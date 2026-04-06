'use client';

import { useEffect } from 'react';
import { AlertTriangle, Trash2, X } from 'lucide-react';
import { useConfirm } from '../../contexts/ConfirmContext';

const variantStyles = {
  danger: {
    icon: Trash2,
    confirmButton: 'bg-red-500 hover:bg-red-600 active:bg-red-700 text-white',
    accent: 'text-red-300',
    badge: 'bg-red-500/15 border-red-500/25',
  },
  default: {
    icon: AlertTriangle,
    confirmButton: 'bg-purple-600 hover:bg-purple-700 active:bg-purple-800 text-white',
    accent: 'text-purple-300',
    badge: 'bg-purple-500/15 border-purple-500/25',
  },
} as const;

export default function ConfirmDialog() {
  const { currentConfirm, confirmChoice, dismissConfirm } = useConfirm();

  useEffect(() => {
    if (!currentConfirm) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        dismissConfirm();
      }
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [currentConfirm, dismissConfirm]);

  if (!currentConfirm) return null;

  const styles = variantStyles[currentConfirm.variant];
  const Icon = styles.icon;

  return (
    <div
      className="fixed inset-0 z-[10000] flex items-end sm:items-center justify-center bg-black/60 px-3 pb-[max(16px,env(safe-area-inset-bottom))] pt-4 backdrop-blur-sm"
      onClick={dismissConfirm}
      role="presentation"
    >
      <div
        className="w-full max-w-md rounded-[28px] border border-white/10 bg-[#100d17] shadow-2xl animate-slide-up overflow-hidden"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        aria-describedby="confirm-dialog-description"
      >
        <div className="px-5 pt-4 pb-3 flex justify-center">
          <div className={`w-12 h-1.5 rounded-full bg-white/15`} />
        </div>

        <div className="px-5 pb-5">
          <div className="flex items-start gap-4">
            <div className={`w-12 h-12 rounded-2xl border ${styles.badge} flex items-center justify-center flex-shrink-0`}>
              <Icon size={22} className={styles.accent} />
            </div>

            <div className="flex-1 min-w-0">
              <h2 id="confirm-dialog-title" className="text-[17px] font-semibold text-white leading-tight">
                {currentConfirm.title}
              </h2>
              <p id="confirm-dialog-description" className="mt-2 text-[14px] leading-relaxed text-white/70">
                {currentConfirm.message}
              </p>
            </div>

            <button
              type="button"
              onClick={dismissConfirm}
              className="w-8 h-8 rounded-full flex items-center justify-center text-white/60 hover:bg-white/10 active:scale-95 transition-all"
              aria-label="Fechar"
            >
              <X size={18} />
            </button>
          </div>

          <div className="mt-6 flex flex-col-reverse sm:flex-row gap-3">
            <button
              type="button"
              onClick={() => confirmChoice(false)}
              className="w-full sm:flex-1 h-12 rounded-2xl border border-white/10 bg-white/5 text-white font-semibold text-[15px] active:scale-[0.99] transition-all"
            >
              {currentConfirm.cancelLabel}
            </button>

            <button
              type="button"
              onClick={() => confirmChoice(true)}
              className={`w-full sm:flex-1 h-12 rounded-2xl font-semibold text-[15px] active:scale-[0.99] transition-all ${styles.confirmButton}`}
            >
              {currentConfirm.confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
