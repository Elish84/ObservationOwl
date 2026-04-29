import React from 'react';
import { NavLink } from 'react-router-dom';
import { FileText, BarChart2, List, MessageSquare, Settings } from 'lucide-react';
import theme from '../theme';

export default function BottomNav({ isAdmin }) {
  const navItems = [
    { to: '/', icon: FileText, label: 'מילוי טופס' },
    { to: '/dashboard', icon: BarChart2, label: 'דשבורד', authRequired: true },
    { to: '/records', icon: List, label: 'רשומות', authRequired: true },
    { to: '/ask-owl', icon: MessageSquare, label: 'שאל את הינשוף', authRequired: true },
    { to: '/admin', icon: Settings, label: 'מנהל' },
  ];

  return (
    <nav className={theme.bottomNav.wrapper}>
      <div className={theme.bottomNav.inner}>
        {navItems.map((item) => {
          if (item.authRequired && !isAdmin) return null;
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `${theme.bottomNav.tabBase} ${isActive ? theme.bottomNav.tabActive : theme.bottomNav.tabInactive} relative`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon className={isActive ? theme.bottomNav.iconActive : theme.bottomNav.iconInactive} />
                  <span className={theme.bottomNav.label}>{item.label}</span>
                  {isActive && <div className={theme.bottomNav.indicator} />}
                </>
              )}
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}
