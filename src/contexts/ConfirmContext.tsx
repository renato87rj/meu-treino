'use client';

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';

export type ConfirmVariant = 'danger' | 'default';

export interface ConfirmOptions {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: ConfirmVariant;
}

interface ConfirmState extends Required<Omit<ConfirmOptions, 'variant'>> {
  variant: ConfirmVariant;
  resolve: (value: boolean) => void;
}

interface ConfirmContextType {
  confirm: (options: ConfirmOptions) => Promise<boolean>;
  currentConfirm: ConfirmState | null;
  confirmChoice: (value: boolean) => void;
  dismissConfirm: () => void;
}

const ConfirmContext = createContext<ConfirmContextType | undefined>(undefined);

export const useConfirm = () => {
  const context = useContext(ConfirmContext);

  if (!context) {
    throw new Error('useConfirm must be used within a ConfirmProvider');
  }

  return context;
};

export const ConfirmProvider = ({ children }: { children: ReactNode }) => {
  const [currentConfirm, setCurrentConfirm] = useState<ConfirmState | null>(null);

  const confirm = useCallback((options: ConfirmOptions) => {
    return new Promise<boolean>((resolve) => {
      setCurrentConfirm({
        title: options.title,
        message: options.message,
        confirmLabel: options.confirmLabel ?? 'Confirmar',
        cancelLabel: options.cancelLabel ?? 'Cancelar',
        variant: options.variant ?? 'danger',
        resolve,
      });
    });
  }, []);

  const confirmChoice = useCallback((value: boolean) => {
    setCurrentConfirm((current) => {
      if (!current) return null;
      current.resolve(value);
      return null;
    });
  }, []);

  const dismissConfirm = useCallback(() => {
    confirmChoice(false);
  }, [confirmChoice]);

  const value = useMemo(
    () => ({ confirm, currentConfirm, confirmChoice, dismissConfirm }),
    [confirm, currentConfirm, confirmChoice, dismissConfirm]
  );

  return <ConfirmContext.Provider value={value}>{children}</ConfirmContext.Provider>;
};
