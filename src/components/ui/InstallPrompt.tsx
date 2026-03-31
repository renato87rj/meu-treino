'use client'

import { useState, useEffect } from 'react';
import { Download, X } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => void;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);

  useEffect(() => {
    // Detectar se já está instalado
    if (window.matchMedia('(display-mode: standalone)').matches) {
      return; // Já está instalado, não mostrar
    }

    // Listener para o evento de instalação
    const handler = (e: BeforeInstallPromptEvent) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handler as EventListener);

    return () => window.removeEventListener('beforeinstallprompt', handler as EventListener);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      setDeferredPrompt(null);
      setShowInstallPrompt(false);
    }
  };

  const handleDismiss = () => {
    setShowInstallPrompt(false);
    // Salvar que o usuário dispensou (opcional)
    localStorage.setItem('installPromptDismissed', 'true');
  };

  if (!showInstallPrompt) return null;

  return (
    <div className="fixed bottom-[80px] left-4 right-4 z-50 animate-slide-up">
      <div className="max-w-md mx-auto rounded-[20px] p-4"
           style={{
             background: 'rgba(15, 10, 30, 0.96)',
             border: '0.5px solid rgba(139, 92, 246, 0.3)',
             backdropFilter: 'blur(20px)',
           }}>
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-[12px] flex items-center justify-center flex-shrink-0
                          bg-purple-500/20 border border-purple-500/25">
            <Download className="text-purple-400" size={18} />
          </div>
          
          <div className="flex-1">
            <h3 className="text-[14px] font-bold text-white mb-0.5">
              Instalar App
            </h3>
            <p className="text-[12px] text-[#7c6f9e] mb-3">
              Adicione à tela inicial para acesso rápido e uso offline!
            </p>
            
            <div className="flex gap-2">
              <button
                onClick={handleInstall}
                className="flex-1 bg-purple-600 text-white font-semibold text-[13px]
                           py-2.5 rounded-[12px] active:scale-[0.98] transition-transform"
              >
                Instalar
              </button>
              <button
                onClick={handleDismiss}
                className="w-10 h-10 rounded-[12px] flex items-center justify-center
                           bg-white/[0.05] border border-purple-500/15 active:scale-95 transition-transform"
              >
                <X size={15} className="text-[#7c6f9e]" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}