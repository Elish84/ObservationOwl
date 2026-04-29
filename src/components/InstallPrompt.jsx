import React, { useState, useEffect } from 'react';
import { Download, Share, PlusSquare, X } from 'lucide-react';
import theme from '../theme';

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showIOSPrompt, setShowIOSPrompt] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Check if app is already installed
    if (window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true) {
      setDismissed(true);
      return;
    }

    // iOS detection
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    if (isIOS) {
      setShowIOSPrompt(true);
    }

    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
      }
    }
  };

  if (dismissed || (!deferredPrompt && !showIOSPrompt)) return null;

  return (
    <div className="bg-card border-b border-border p-4 shadow-sm relative">
      <button onClick={() => setDismissed(true)} className="absolute top-2 left-2 text-muted-foreground p-1 z-10">
        <X size={16} />
      </button>
      
      {showIOSPrompt && !deferredPrompt ? (
        <div className="text-sm flex flex-col gap-2">
          <p className="font-bold text-secondary">להתקנת האפליקציה באייפון (iOS):</p>
          <p className="flex items-center gap-1">1. לחץ על כפתור השיתוף בתחתית המסך <Share size={16} className="inline mx-1"/></p>
          <p className="flex items-center gap-1">2. בחר "הוסף למסך הבית" <PlusSquare size={16} className="inline mx-1"/></p>
        </div>
      ) : (
        <div className="flex items-center justify-between">
          <div className="text-sm">
            <p className="font-bold text-secondary">הורד את האפליקציה</p>
            <p className="text-xs text-muted-foreground">התקן על מכשירך לחוויה נוחה יותר</p>
          </div>
          <button onClick={handleInstallClick} className={`${theme.button.save} px-4 py-2 text-sm h-auto`}>
            <Download size={16} />
            התקן
          </button>
        </div>
      )}
    </div>
  );
}
