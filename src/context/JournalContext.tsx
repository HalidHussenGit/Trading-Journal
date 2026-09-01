import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Account, Setup, Trade, TradingDay, Tag, Settings, FilterState } from '../types';
import { dbService } from '../db/database';
import { rehydrateTradeResult } from '../utils/calculations';
import { LoginPage } from '../components/auth/LoginPage';

export type AutosaveStatus = 'Saved' | 'Saving...' | 'Unsaved changes' | 'Save failed';

export interface UserSession {
  id: string;
  username: string;
}

interface JournalContextType {
  currentUser: UserSession | null;
  accounts: Account[];
  setups: Setup[];
  trades: Trade[];
  tradingDays: TradingDay[];
  tags: Tag[];
  settings: Settings;
  autosaveStatus: AutosaveStatus;
  storageStatus: { usageMB: string; quotaMB: string; isPersisted: boolean } | null;
  filters: FilterState;
  isLoading: boolean;
  notification: { type: 'success' | 'error' | 'info'; message: string } | null;

  logout: () => void;
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
  saveScreenshotBlob: (key: string, blob: Blob) => Promise<string>;
  getScreenshotUrl: (key: string) => Promise<string | null>;
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

const defaultSettings: Settings = {
  theme: 'Light',
  currency: '$',
  dateFormat: 'YYYY-MM-DD',
  timezone: 'UTC',
  defaultAccountId: '',
  defaultSetupId: '',
  defaultRiskPercent: 1.0,
  normalRiskMaxPercent: 1.5,
  warningRiskMaxPercent: 3.0,
  criticalRiskMaxPercent: 5.0,
  autosaveIntervalMs: 2000,
  autosaveEnabled: true,
  hardChecklistEnforcement: false,
  hardRiskWarnings: true,
  noTradeReminders: true,
  storagePersisted: true
};

const JournalContext = createContext<JournalContextType | undefined>(undefined);

export const JournalProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<UserSession | null>(() => {
    try {
      const stored = localStorage.getItem('trading_journal_user_session');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const [accounts, setAccounts] = useState<Account[]>([]);
  const [setups, setSetups] = useState<Setup[]>([]);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [tradingDays, setTradingDays] = useState<TradingDay[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const [autosaveStatus, setAutosaveStatus] = useState<AutosaveStatus>('Saved');
  const [filters, setFilters] = useState<FilterState>(defaultFilters);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [notification, setNotification] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);

  const showNotification = (type: 'success' | 'error' | 'info', message: string) => {
    setNotification({ type, message });
    setTimeout(() => {
      setNotification(null);
    }, 4000);
  };

  const logout = () => {
    localStorage.removeItem('trading_journal_user_session');
    setCurrentUser(null);
    setAccounts([]);
    setSetups([]);
    setTrades([]);
    setTradingDays([]);
    setTags([]);
  };

  const loadData = async (userId: string) => {
    setIsLoading(true);
    try {
      const [accs, stps, trds, days, tgs, stgs] = await Promise.all([
        dbService.getAllAccounts(userId),
        dbService.getAllSetups(userId),
        dbService.getAllTrades(userId),
        dbService.getAllTradingDays(userId),
        dbService.getAllTags(userId),
        dbService.getSettings(userId)
      ]);

      setAccounts(accs);
      setSetups(stps);
      setTrades(trds.map(rehydrateTradeResult));
      setTradingDays(days);
      setTags(tgs);
      if (stgs) setSettings(stgs);

      setAutosaveStatus('Saved');
    } catch (err: any) {
      console.error('Failed to load data from Supabase:', err);
      showNotification('error', `Cloud Sync error: ${err.message}`);
      setAutosaveStatus('Save failed');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser?.id) {
      loadData(currentUser.id);
    } else {
      setIsLoading(false);
    }
  }, [currentUser?.id]);

  const resetFilters = () => {
    setFilters(defaultFilters);
  };

  const saveAccount = async (account: Account) => {
    if (!currentUser) return;
    setAutosaveStatus('Saving...');
    try {
      const saved = await dbService.saveAccount(account, currentUser.id);
      setAccounts(prev => {
        const idx = prev.findIndex(a => a.id === account.id || a.id === saved.id);
        if (idx >= 0) {
          const updated = [...prev];
          updated[idx] = saved;
          return updated;
        }
        return [...prev, saved];
      });
      setAutosaveStatus('Saved');
      showNotification('success', `Account "${saved.name}" saved.`);
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
    if (!currentUser) return;
    setAutosaveStatus('Saving...');
    try {
      const saved = await dbService.saveSetup(setup, currentUser.id);
      setSetups(prev => {
        const idx = prev.findIndex(s => s.id === setup.id || s.id === saved.id);
        if (idx >= 0) {
          const updated = [...prev];
          updated[idx] = saved;
          return updated;
        }
        return [...prev, saved];
      });
      setAutosaveStatus('Saved');
      showNotification('success', `Setup "${saved.name}" saved.`);
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
    if (!currentUser) return;
    setAutosaveStatus('Saving...');
    try {
      const saved = await dbService.saveTrade(trade, currentUser.id);
      const hydrated = rehydrateTradeResult(saved);
      setTrades(prev => {
        // Only do an in-place update when we have a real UUID to match on.
        // If trade.id is an empty string (brand-new unsaved trade), we must
        // never use it as a lookup key — it would match wrongly or create a duplicate.
        const matchId = saved.id; // always prefer the server-assigned UUID
        const idx = prev.findIndex(t => t.id === matchId || (trade.id && t.id === trade.id));
        if (idx >= 0) {
          const updated = [...prev];
          updated[idx] = hydrated;
          return updated;
        }
        return [hydrated, ...prev];
      });

      // Refetch accounts to display auto-recalculated current_balance from Postgres trigger
      if (currentUser?.id) {
        const refreshedAccounts = await dbService.getAllAccounts(currentUser.id);
        setAccounts(refreshedAccounts);
      }

      setAutosaveStatus('Saved');
      showNotification('success', `Trade saved.`);
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
      
      // Refetch accounts to reflect trigger recalculation
      if (currentUser?.id) {
        const refreshedAccounts = await dbService.getAllAccounts(currentUser.id);
        setAccounts(refreshedAccounts);
      }

      setAutosaveStatus('Saved');
      showNotification('info', `Trade #${id} deleted.`);
    } catch (err: any) {
      setAutosaveStatus('Save failed');
      showNotification('error', `Delete error: ${err.message}`);
    }
  };

  const saveDayLog = async (day: TradingDay) => {
    if (!currentUser) return;
    setAutosaveStatus('Saving...');
    try {
      await dbService.saveTradingDay(day, currentUser.id);
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
    if (!currentUser) return;
    setAutosaveStatus('Saving...');
    try {
      await dbService.saveSettings(newSettings, currentUser.id);
      setSettings(newSettings);
      setAutosaveStatus('Saved');
      showNotification('success', 'Settings saved.');
    } catch (err: any) {
      setAutosaveStatus('Save failed');
      showNotification('error', `Save error: ${err.message}`);
    }
  };

  const refreshData = async () => {
    if (currentUser?.id) {
      await loadData(currentUser.id);
    }
  };

  const exportBackup = async (): Promise<Blob> => {
    if (!currentUser) throw new Error('User not logged in');
    const fullData = await dbService.exportFullData(currentUser.id);
    const jsonStr = JSON.stringify(fullData, null, 2);
    return new Blob([jsonStr], { type: 'application/json' });
  };

  const importBackup = async (file: File): Promise<{ success: boolean; message: string }> => {
    if (!currentUser) return { success: false, message: 'User not logged in' };
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      await dbService.importFullData(data, currentUser.id);
      await refreshData();
      return { success: true, message: 'Data imported successfully!' };
    } catch (err: any) {
      return { success: false, message: `Import failed: ${err.message}` };
    }
  };

  const saveScreenshotBlob = async (key: string, blob: Blob): Promise<string> => {
    return await dbService.saveScreenshotBlob(key, blob);
  };

  const getScreenshotUrl = async (key: string): Promise<string | null> => {
    return await dbService.getScreenshotUrl(key);
  };

  if (!currentUser) {
    return <LoginPage onLoginSuccess={(session) => setCurrentUser(session)} />;
  }

  return (
    <JournalContext.Provider value={{
      currentUser,
      accounts,
      setups,
      trades,
      tradingDays,
      tags,
      settings,
      autosaveStatus,
      storageStatus: { usageMB: 'Cloud', quotaMB: 'Unlimited', isPersisted: true },
      filters,
      isLoading,
      notification,
      logout,
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
      getScreenshotUrl
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
