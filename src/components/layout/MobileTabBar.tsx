import React, { useState } from 'react';
import { PageId } from './Sidebar';

interface MobileTabBarProps {
  activePage: PageId;
  onNavigate: (page: PageId) => void;
}

export const MobileTabBar: React.FC<MobileTabBarProps> = ({ activePage, onNavigate }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const tabs: { id: PageId | 'menu'; label: string; icon: React.ReactNode }[] = [
    {
      id: 'dashboard',
      label: 'Home',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      )
    },
    {
      id: 'trades',
      label: 'Trades',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
        </svg>
      )
    },
    {
      id: 'new-trade',
      label: 'Add',
      icon: (
        <div className="w-10 h-10 -mt-5 rounded-full bg-emerald-600 flex items-center justify-center text-white shadow-lg border-4 border-slate-100">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </div>
      )
    },
    {
      id: 'daily-journal',
      label: 'Journal',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      )
    },
    {
      id: 'menu',
      label: 'Menu',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 12h16m-7 6h7" />
        </svg>
      )
    }
  ];

  const menuItems: { id: PageId; label: string; icon: string }[] = [
    { id: 'accounts', label: 'Accounts', icon: 'M3 10h18M7 15h1m4 0h1m-7 4h12a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z' },
    { id: 'setups', label: 'Setups & Checklists', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4' },
    { id: 'analytics', label: 'Analytics Engine', icon: 'M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z' },
    { id: 'settings', label: 'Settings', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z' },
    { id: 'backup', label: 'Backup / Restore', icon: 'M8 4H6a2 2 0 00-2 2v12a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-2m-4-1v8m0 0l3-3m-3 3L9 8m-5 5h2.586a1 1 0 01.707.293l2.414 2.414a1 1 0 00.707.293h3.172a1 1 0 00.707-.293l2.414-2.414a1 1 0 01.707-.293H20' }
  ];

  const handleTabClick = (id: PageId | 'menu') => {
    if (id === 'menu') {
      setIsMenuOpen(!isMenuOpen);
    } else {
      setIsMenuOpen(false);
      onNavigate(id);
    }
  };

  return (
    <>
      {/* Menu Overlay */}
      {isMenuOpen && (
        <div className="fixed inset-0 bg-slate-900/60 z-40 md:hidden" onClick={() => setIsMenuOpen(false)}>
          <div className="absolute bottom-[68px] left-0 w-full bg-slate-900 rounded-t-2xl px-4 py-6 text-slate-200">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4 px-2">More Options</h3>
            <div className="grid grid-cols-2 gap-2">
              {menuItems.map(item => (
                <button
                  key={item.id}
                  onClick={() => handleTabClick(item.id)}
                  className={`flex flex-col items-center justify-center p-4 rounded-xl gap-2 transition-colors ${activePage === item.id ? 'bg-slate-800 text-emerald-400' : 'bg-slate-800/50 text-slate-300 hover:bg-slate-800'}`}
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={item.icon} />
                  </svg>
                  <span className="text-[10px] font-medium text-center">{item.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab Bar */}
      <div className="fixed bottom-0 left-0 w-full bg-slate-900 border-t border-slate-800/80 z-50 md:hidden pb-safe">
        <div className="flex items-center justify-around h-[68px] px-2">
          {tabs.map((tab) => {
            const isActive = activePage === tab.id || (tab.id === 'menu' && isMenuOpen);
            return (
              <button
                key={tab.id}
                onClick={() => handleTabClick(tab.id)}
                className={`flex flex-col items-center justify-center w-16 h-full gap-1 transition-colors ${
                  tab.id === 'new-trade' ? '' : isActive ? 'text-emerald-400' : 'text-slate-400 hover:text-slate-300'
                }`}
              >
                {tab.icon}
                {tab.id !== 'new-trade' && (
                  <span className={`text-[10px] font-medium ${isActive ? 'text-emerald-400 font-semibold' : 'text-slate-400'}`}>
                    {tab.label}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
};
