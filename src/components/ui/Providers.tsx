'use client';

import { ReactNode } from 'react';
import { AuthContextProvider } from '../../contexts/AuthContext';
import { ConfirmProvider } from '../../contexts/ConfirmContext';
import { ToastProvider } from '../../contexts/ToastContext';
import ConfirmDialog from './ConfirmDialog';
import ToastContainer from './ToastContainer';

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <AuthContextProvider>
      <ToastProvider>
        <ConfirmProvider>
          {children}
          <ToastContainer />
          <ConfirmDialog />
        </ConfirmProvider>
      </ToastProvider>
    </AuthContextProvider>
  );
}

