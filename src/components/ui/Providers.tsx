'use client';

import { ReactNode } from 'react';
import { AuthContextProvider } from '../../contexts/AuthContext';

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <AuthContextProvider>
      {children}
    </AuthContextProvider>
  );
}

