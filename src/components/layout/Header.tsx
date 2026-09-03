import React from 'react';
import { useJournal } from '../../context/JournalContext';
import { AutosaveBadge } from '../common/AutosaveBadge';
import { PageId } from './Sidebar';
import { calculatePortfolioMetrics } from '../../utils/calculations';

interface HeaderProps {
  onNavigate: (page: PageId) => void;
  title: string;
}

export const Header: React.FC<HeaderProps> = ({ onNavigate, title }) => {
  const { currentUser, logout, accounts, trades, filters, setFilters, autosaveStatus, notification } = useJournal();

  return (
    <header className="h-14 md:h-16 bg-white border-b border-slate-200 px-4 md:px-6 flex items-center justify-between sticky top-0 z-40 shadow-xs">
      {/* Title & Page Context */}
      <div className="flex items-center gap-4">
        <h1 className="text-lg font-bold text-slate-900 tracking-tight">{title}</h1>
      </div>

      {/* Global Controls & Account Switcher */}
      <div className="flex items-center gap-2 md:gap-4">
        {/* Account Selector Filter */}
        <div className="hidden md:flex items-center gap-2 bg-slate-50 border border-slate-200 rounded px-2.5 py-1">
          <span className="text-xs text-slate-500 font-medium">Account:</span>
          <select
            value={filters.accountId}
            onChange={(e) => setFilters(prev => ({ ...prev, accountId: e.target.value }))}
            className="bg-transparent text-xs font-semibold text-slate-800 focus:outline-none cursor-pointer"
          >
            <option value="ALL">All Accounts ({accounts.length})</option>
            {accounts.map(acc => {
              const accTrades = trades.filter(t => t.accountId === acc.id);
              const totalPL = calculatePortfolioMetrics(accTrades, acc.initialBalance).totalPL || 0;
              return (
                <option key={acc.id} value={acc.id}>
                  {acc.name} ({acc.currency}{(acc.initialBalance + totalPL).toLocaleString()})
                </option>
              );
            })}
          </select>
        </div>

        {/* Global Search Bar */}
        <div className="relative hidden md:block">
          <input
            type="text"
            placeholder="Search notes, symbol, tags..."
            value={filters.searchQuery}
            onChange={(e) => setFilters(prev => ({ ...prev, searchQuery: e.target.value }))}
            className="w-48 sm:w-64 pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-400"
          />
          <svg className="w-4 h-4 text-slate-400 absolute left-2.5 top-2 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>

        {/* Autosave Status Indicator */}
        <AutosaveBadge status={autosaveStatus} />

        {/* User Session & Logout */}
        {currentUser && (
          <div className="hidden md:flex items-center gap-2 border-l border-slate-200 pl-3">
            <span className="text-xs font-mono font-semibold text-slate-700 bg-slate-100 px-2 py-1 rounded">
              @{currentUser.username}
            </span>
            <button
              onClick={logout}
              title="Sign Out"
              className="text-xs font-medium text-slate-500 hover:text-rose-600 transition-colors p-1"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
        )}

        {/* Quick New Trade Action */}
        <button
          onClick={() => onNavigate('new-trade')}
          className="hidden md:flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded text-xs font-medium transition-colors shadow-xs"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
          </svg>
          <span>Log Trade</span>
        </button>
      </div>

      {/* Toast Notification Banner */}
      {notification && (
        <div className={`fixed bottom-6 right-6 z-50 px-5 py-4 rounded-xl shadow-2xl border backdrop-blur-md flex items-center gap-3 animate-in slide-in-from-bottom-8 fade-in duration-300 transform-gpu ${
          notification.type === 'success' ? 'bg-slate-900/95 text-white border-slate-800 shadow-emerald-500/20' :
          notification.type === 'error' ? 'bg-slate-900/95 text-white border-slate-800 shadow-rose-500/20' : 
          'bg-slate-900/95 text-white border-slate-800 shadow-blue-500/20'
        }`}>
          {notification.type === 'success' && (
            <div className="bg-emerald-500/20 text-emerald-400 rounded-full p-1.5 border border-emerald-500/30">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          )}
          {notification.type === 'error' && (
            <div className="bg-rose-500/20 text-rose-400 rounded-full p-1.5 border border-rose-500/30">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
          )}
          {notification.type === 'info' && (
            <div className="bg-blue-500/20 text-blue-400 rounded-full p-1.5 border border-blue-500/30">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          )}
          <span className="text-sm font-medium tracking-wide">{notification.message}</span>
        </div>
      )}
    </header>
  );
};
