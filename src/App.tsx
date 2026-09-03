import React, { useState } from 'react';
import { JournalProvider } from './context/JournalContext';
import { Sidebar, PageId } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { Dashboard } from './pages/Dashboard';
import { Accounts } from './pages/Accounts';
import { Setups } from './pages/Setups';
import { NewTrade } from './pages/NewTrade';
import { Trades } from './pages/Trades';
import { TradeDetail } from './pages/TradeDetail';
import { DailyJournal } from './pages/DailyJournal';
import { Analytics } from './pages/Analytics';
import { RiskManagement } from './pages/RiskManagement';
import { SettingsPage } from './pages/Settings';
import { BackupRestore } from './pages/BackupRestore';

import { useJournal } from './context/JournalContext';

import { LoadingScreen } from './components/common/LoadingScreen';

export const AppContent: React.FC = () => {
  const { trades, isLoading } = useJournal();
  const [activePage, setActivePage] = useState<PageId>('dashboard');
  const [activeTradeId, setActiveTradeId] = useState<string | null>(null);

  const handleNavigate = (page: PageId, tradeId?: string) => {
    setActivePage(page);
    setActiveTradeId(tradeId || null);
  };

  const activeTrade = trades.find(t => t.id === activeTradeId) || null;

  const pageTitles: Record<PageId, string> = {
    dashboard: 'Dashboard',
    calendar: 'Trading Calendar & Journal',
    accounts: 'Accounts',
    setups: 'Setups & Checklists',
    'new-trade': activeTrade ? 'Edit Trade Record' : 'New Trade Log',
    trades: 'Trades Log',
    'trade-detail': 'Trade Detail View',
    'daily-journal': 'Trading Calendar & Journal',
    analytics: 'Analytics Engine',
    risk: 'Risk Management Center',
    settings: 'Settings',
    backup: 'Backup & Restore'
  };

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <div className="flex h-screen bg-slate-100 font-sans text-slate-900 overflow-hidden">
      <Sidebar activePage={activePage} onNavigate={handleNavigate} />
      
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header onNavigate={handleNavigate} title={pageTitles[activePage]} />
        <main className="flex-1 overflow-y-auto bg-slate-100/60">
          {activePage === 'dashboard' && <Dashboard onNavigate={handleNavigate} />}
          {(activePage === 'calendar' || activePage === 'daily-journal') && <DailyJournal onNavigate={handleNavigate} />}
          {activePage === 'accounts' && <Accounts />}
          {activePage === 'setups' && <Setups />}
          {activePage === 'new-trade' && <NewTrade onNavigate={handleNavigate} existingTrade={activeTrade} />}
          {activePage === 'trades' && <Trades onNavigate={handleNavigate} />}
          {activePage === 'trade-detail' && <TradeDetail tradeId={activeTradeId} onNavigate={handleNavigate} />}
          {activePage === 'analytics' && <Analytics />}
          {activePage === 'risk' && <RiskManagement />}
          {activePage === 'settings' && <SettingsPage />}
          {activePage === 'backup' && <BackupRestore />}
        </main>
      </div>
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <JournalProvider>
      <AppContent />
    </JournalProvider>
  );
};

export default App;
