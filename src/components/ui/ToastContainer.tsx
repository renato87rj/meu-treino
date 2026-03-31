'use client';

import { useToast, Toast } from '@/contexts/ToastContext';
import { CheckCircle2, XCircle, AlertCircle, Info, X } from 'lucide-react';

const ToastIcon = ({ type }: { type: Toast['type'] }) => {
  const iconProps = { size: 20, strokeWidth: 2.5 };
  
  switch (type) {
    case 'success':
      return <CheckCircle2 {...iconProps} className="text-green-400" />;
    case 'error':
      return <XCircle {...iconProps} className="text-red-400" />;
    case 'warning':
      return <AlertCircle {...iconProps} className="text-yellow-400" />;
    case 'info':
      return <Info {...iconProps} className="text-blue-400" />;
  }
};

const ToastItem = ({ toast }: { toast: Toast }) => {
  const { removeToast } = useToast();

  return (
    <div
      className="flex items-center gap-3 w-full max-w-[calc(100vw-32px)] sm:max-w-md bg-gray-800/95 backdrop-blur-md border border-gray-700/50 rounded-2xl px-4 py-3.5 shadow-2xl animate-slide-up"
      role="alert"
    >
      <div className="flex-shrink-0">
        <ToastIcon type={toast.type} />
      </div>
      
      <p className="flex-1 text-[15px] text-gray-100 font-medium leading-snug">
        {toast.message}
      </p>
      
      <button
        onClick={() => removeToast(toast.id)}
        className="flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-full hover:bg-gray-700/50 active:scale-95 transition-all"
        aria-label="Fechar notificação"
      >
        <X size={16} className="text-gray-400" />
      </button>
    </div>
  );
};

export default function ToastContainer() {
  const { toasts } = useToast();

  if (toasts.length === 0) return null;

  return (
    <div
      className="fixed top-0 left-0 right-0 z-[9999] pointer-events-none"
      aria-live="polite"
      aria-atomic="true"
    >
      <div className="flex flex-col items-center gap-2 p-4 pt-safe pointer-events-auto">
        {toasts.map(toast => (
          <ToastItem key={toast.id} toast={toast} />
        ))}
      </div>
    </div>
  );
}
