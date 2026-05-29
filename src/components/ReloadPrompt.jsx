import React from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { RefreshCw, X } from 'lucide-react';

export default function ReloadPrompt() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r) {
      console.log('SW Registered: ', r);
    },
    onRegisterError(error) {
      console.log('SW registration error', error);
    },
  });

  const close = () => {
    setNeedRefresh(false);
  };

  if (!needRefresh) return null;

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[100] w-[90%] max-w-sm animate-in slide-in-from-bottom-5">
      <div className="bg-primary text-primary-foreground p-4 rounded-2xl shadow-2xl border-2 border-accent/20 flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <div className="bg-background/20 p-2 rounded-full animate-pulse">
            <RefreshCw size={20} />
          </div>
          <div className="flex-1">
            <h3 className="font-bold">גרסה חדשה זמינה! 🚀</h3>
            <p className="text-sm opacity-90">האפליקציה עודכנה, כדאי לרענן.</p>
          </div>
          <button 
            onClick={close} 
            className="p-1 hover:bg-background/20 rounded-full transition-colors self-start"
            aria-label="סגור"
          >
            <X size={18} />
          </button>
        </div>
        
        <button 
          onClick={() => updateServiceWorker(true)}
          className="bg-background text-foreground font-bold py-2 px-4 rounded-xl shadow-sm hover:bg-muted transition-colors w-full"
        >
          רענן עכשיו
        </button>
      </div>
    </div>
  );
}
