import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Account, Setup, Trade, TradingDay, Tag, Settings, FilterState } from '../types';
import { dbService, StorageStatus } from '../db/database';

export type AutosaveStatus = 'Saved' | 'Saving...' | 'Unsaved changes' | 'Save failed';

interface JournalContextType {
  accounts: Account[];
  setups: Setup[];
  trades: Trade[];
  tradingDays: TradingDay[];
  tags: Tag[];
  settings: Settings;
  autosaveStatus: AutosaveStatus;
  storageStatus: StorageStatus | null;
  filters: FilterState;
  isLoading: boolean;
  notification: { type: 'success' | 'error' | 'info'; message: string } | null;

  setFilters: React.Dispatch<React.SetStateAction<FilterState>>;
  resetFilters: () => void;
  showNotification: (type: 'success' | 'error' | 'info', message: string) => void;

  saveAccount: (account: Account) => Promise<void>;
  deleteAccount: (id: string) => Promise<void>;

  saveSetup: (setup: Setup) => Promise<void>;
  deleteSetup: (id: string) => Promise<void>;

  saveTrade: (trade: Trade) => Promise<void>;
  deleteTrade: (id: string) => Promise<void>;

  saveDayLog: (day: TradingDay) => Promise<void>;
  saveSettings: (settings: Settings) => Promise<void>;

  refreshData: () => Promise<void>;
  exportBackup: () => Promise<Blob>;
  importBackup: (file: File) => Promise<{ success: boolean; message: string }>;
  saveScreenshotBlob: (key: string, blob: Blob) => Promise<void>;
  getScreenshotBlob: (key: string) => Promise<Blob | null>;
}

const defaultFilters: FilterState = {
  accountId: 'ALL',
  setupId: 'ALL',
  startDate: '',
  endDate: '',
  symbol: '',
  direction: 'ALL',
  status: 'ALL',
  outcome: 'ALL',
  session: 'ALL',
  minAdherence: 0,
  minRisk: 0,
  maxRisk: 100,
  emotion: 'ALL',
  violation: 'ALL',
  tag: 'ALL',
  searchQuery: ''
};

const JournalContext = createContext<JournalContextType | undefined>(undefined);

export const JournalProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [setups, setSetups] = useState<Setup[]>([]);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [tradingDays, setTradingDays] = useState<TradingDay[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [settings, setSettings] = useState<Settings>(dbService.getDefaultSettings());
  const [autosaveStatus, setAutosaveStatus] = useState<AutosaveStatus>('Saved');
  const [storageStatus, setStorageStatus] = useState<StorageStatus | null>(null);
  const [filters, setFilters] = useState<FilterState>(defaultFilters);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [notification, setNotification] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);

  const showNotification = (type: 'success' | 'error' | 'info', message: string) => {
    setNotification({ type, message });
    setTimeout(() => {
      setNotification(null);
    }, 4000);
  };

  const loadData = async () => {
    setIsLoading(true);
    try {
      await dbService.init();
      const data = await dbService.loadAllData();
      setAccounts(data.accounts);
      setSetups(data.setups);
      setTrades(data.trades);
      setTradingDays(data.tradingDays);
      setTags(data.tags);
      setSettings(data.settings);

      const status = await dbService.getStorageStatus();
      setStorageStatus(status);
      setAutosaveStatus('Saved');
    } catch (err: any) {
      console.error('Failed to load data from IndexedDB:', err);
      showNotification('error', `Failed to load database: ${err.message}`);
      setAutosaveStatus('Save failed');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const resetFilters = () => {
    setFilters(defaultFilters);
  };

  const saveAccount = async (account: Account) => {
    setAutosaveStatus('Saving...');
    try {
      await dbService.saveAccount(account);
      setAccounts(prev => {
        const idx = prev.findIndex(a => a.id === account.id);
        if (idx >= 0) {
          const updated = [...prev];
          updated[idx] = account;
          return updated;
        }
        return [...prev, account];
      });
      setAutosaveStatus('Saved');
      showNotification('success', `Account "${account.name}" saved.`);
    } catch (err: any) {
      setAutosaveStatus('Save failed');
      showNotification('error', `Save error: ${err.message}`);
      throw err;
    }
  };

  const deleteAccount = async (id: string) => {
    setAutosaveStatus('Saving...');
    try {
      await dbService.deleteAccount(id);
      setAccounts(prev => prev.filter(a => a.id !== id));
      setAutosaveStatus('Saved');
      showNotification('info', 'Account deleted.');
    } catch (err: any) {
      setAutosaveStatus('Save failed');
      showNotification('error', `Delete error: ${err.message}`);
    }
  };

  const saveSetup = async (setup: Setup) => {
    setAutosaveStatus('Saving...');
    try {
      await dbService.saveSetup(setup);
      setSetups(prev => {
        const idx = prev.findIndex(s => s.id === setup.id);
        if (idx >= 0) {
          const updated = [...prev];
          updated[idx] = setup;
          return updated;
        }
        return [...prev, setup];
      });
      setAutosaveStatus('Saved');
      showNotification('success', `Setup "${setup.name}" saved.`);
    } catch (err: any) {
      setAutosaveStatus('Save failed');
      showNotification('error', `Save error: ${err.message}`);
      throw err;
    }
  };

  const deleteSetup = async (id: string) => {
    setAutosaveStatus('Saving...');
    try {
      await dbService.deleteSetup(id);
      setSetups(prev => prev.filter(s => s.id !== id));
      setAutosaveStatus('Saved');
      showNotification('info', 'Setup deleted.');
    } catch (err: any) {
      setAutosaveStatus('Save failed');
      showNotification('error', `Delete error: ${err.message}`);
    }
  };

  const saveTrade = async (trade: Trade) => {
    setAutosaveStatus('Saving...');
    try {
      await dbService.saveTrade(trade);
      setTrades(prev => {
        const idx = prev.findIndex(t => t.id === trade.id);
        if (idx >= 0) {
          const updated = [...prev];
          updated[idx] = trade;
          return updated;
        }
        return [trade, ...prev];
      });

      // Update associated Account current balance if trade is closed
      if (trade.status === 'Closed' && trade.accountId) {
        const acc = accounts.find(a => a.id === trade.accountId);
        if (acc) {
          // Recalculate account balance based on trades
          const accTrades = [...trades.filter(t => t.id !== trade.id && t.accountId === acc.id && t.status === 'Closed'), trade];
          const totalPL = accTrades.reduce((sum, t) => sum + (t.result?.netPL || 0), 0);
          const newBalance = acc.initialBalance + totalPL;
          const updatedAcc = { ...acc, currentBalance: newBalance, updatedAt: new Date().toISOString() };
          await dbService.saveAccount(updatedAcc);
          setAccounts(prev => prev.map(a => a.id === acc.id ? updatedAcc : a));
        }
      }

      setAutosaveStatus('Saved');
      showNotification('success', `Trade #${trade.id} saved.`);
    } catch (err: any) {
      setAutosaveStatus('Save failed');
      showNotification('error', `Trade save error: ${err.message}`);
      throw err;
    }
  };

  const deleteTrade = async (id: string) => {
    setAutosaveStatus('Saving...');
    try {
      await dbService.deleteTrade(id);
      setTrades(prev => prev.filter(t => t.id !== id));
      setAutosaveStatus('Saved');
      showNotification('info', `Trade #${id} deleted.`);
    } catch (err: any) {
      setAutosaveStatus('Save failed');
      showNotification('error', `Delete error: ${err.message}`);
    }
  };

  const saveDayLog = async (day: TradingDay) => {
    setAutosaveStatus('Saving...');
    try {
      await dbService.saveTradingDay(day);
      setTradingDays(prev => {
        const idx = prev.findIndex(d => d.id === day.id);
        if (idx >= 0) {
          const updated = [...prev];
          updated[idx] = day;
          return updated;
        }
        return [...prev, day];
      });
      setAutosaveStatus('Saved');
      showNotification('success', `Journal entry for ${day.date} saved.`);
    } catch (err: any) {
      setAutosaveStatus('Save failed');
      showNotification('error', `Save error: ${err.message}`);
    }
  };

  const saveSettings = async (newSettings: Settings) => {
    setAutosaveStatus('Saving...');
    try {
      await dbService.saveSettings(newSettings);
      setSettings(newSettings);
      setAutosaveStatus('Saved');
      showNotification('success', 'Settings saved.');
    } catch (err: any) {
      setAutosaveStatus('Save failed');
      showNotification('error', `Save error: ${err.message}`);
    }
  };

  const refreshData = async () => {
    await loadData();
  };

  const exportBackup = async () => {
    return await dbService.exportFullBackupZip();
  };

  const importBackup = async (file: File) => {
    const res = await dbService.importFullBackupZip(file);
    if (res.success) {
      await loadData();
    }
    return res;
  };

  const saveScreenshotBlob = async (key: string, blob: Blob) => {
    await dbService.saveScreenshotBlob(key, blob);
  };

  const getScreenshotBlob = async (key: string) => {
    return await dbService.getScreenshotBlob(key);
  };

  return (
    <JournalContext.Provider value={{
      accounts,
      setups,
      trades,
      tradingDays,
      tags,
      settings,
      autosaveStatus,
      storageStatus,
      filters,
      isLoading,
      notification,
      setFilters,
      resetFilters,
      showNotification,
      saveAccount,
      deleteAccount,
      saveSetup,
      deleteSetup,
      saveTrade,
      deleteTrade,
      saveDayLog,
      saveSettings,
      refreshData,
      exportBackup,
      importBackup,
      saveScreenshotBlob,
      getScreenshotBlob
    }}>
      {children}
    </JournalContext.Provider>
  );
};

export const useJournal = () => {
  const context = useContext(JournalContext);
  if (!context) {
    throw new Error('useJournal must be used within a JournalProvider');
  }
  return context;
};
