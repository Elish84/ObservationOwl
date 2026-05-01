import React from 'react';
import theme from '../theme';
import { Bird, LogOut, User as UserIcon, Share2 } from 'lucide-react';
import { auth } from '../firebase';
import { signOut } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';

export default function Header({ user, isAdmin }) {
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/');
  };

  const handleShare = () => {
    const text = 'הצטרפו לינשוף לתצפיות:\n' + window.location.origin;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  return (
    <header className={theme.header.wrapper}>
      <Bird className={theme.header.icon} />
      <div>
        <h1 className={theme.header.title}>ינשוף לתצפיות</h1>
        <p className={theme.header.subtitle}>מערכת תרגול וניהול</p>
      </div>
      
      <div className="mr-auto flex items-center gap-2">
        <button onClick={handleShare} className="flex items-center gap-1 text-xs bg-background/20 px-2 py-1.5 rounded-lg hover:bg-background/40 text-primary-foreground transition-colors">
          <Share2 size={14} />
          שיתוף
        </button>
        {user ? (
          <div className="flex items-center gap-2">
            <div className="flex flex-col items-end">
              <span className="text-xs font-bold text-secondary">מחובר</span>
              {isAdmin && <span className="text-[10px] text-accent">מנהל מערכת</span>}
            </div>
            <button onClick={handleLogout} className="p-1.5 bg-background/20 rounded-full hover:bg-background/40 text-primary-foreground">
              <LogOut size={16} />
            </button>
          </div>
        ) : (
          <button onClick={() => navigate('/admin')} className="flex items-center gap-1 text-xs bg-background/20 px-2 py-1.5 rounded-lg hover:bg-background/40 text-primary-foreground">
            <UserIcon size={14} />
            התחברות
          </button>
        )}
      </div>
    </header>
  );
}
