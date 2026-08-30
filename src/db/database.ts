import { Account, Setup, Trade, TradingDay, Tag, Settings, TradeScreenshot } from '../types';
import { validateAccount, validateSetup, validateTrade, validateBackupData } from '../utils/validation';
import { SimpleZip, parseZipBlob } from '../utils/zip';

const DB_NAME = 'AyzohEnjiJournalDB';
const DB_VERSION = 1;

export interface AppDatabaseData {
  accounts: Account[];
  setups: Setup[];
  trades: Trade[];
  tradingDays: TradingDay[];
  tags: Tag[];
  settings: Settings;
}

export interface StorageStatus {
  isPersisted: boolean;
  usageBytes: number;
  quotaBytes: number;
  usageMB: string;
  quotaMB: string;
}

class JournalDatabaseService {
  private db: IDBDatabase | null = null;
  private isInitialized = false;

  public async init(): Promise<void> {
    if (this.isInitialized && this.db) return;

    // Call storage durability request on startup
    await this.requestStorageDurability();

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
        const db = (event.target as IDBOpenDBRequest).result;

        if (!db.objectStoreNames.contains('accounts')) {
          db.createObjectStore('accounts', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('setups')) {
          db.createObjectStore('setups', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('trades')) {
          const tradeStore = db.createObjectStore('trades', { keyPath: 'id' });
          tradeStore.createIndex('accountId', 'accountId', { unique: false });
          tradeStore.createIndex('setupId', 'setupId', { unique: false });
          tradeStore.createIndex('date', 'date', { unique: false });
          tradeStore.createIndex('symbol', 'symbol', { unique: false });
          tradeStore.createIndex('status', 'status', { unique: false });
        }
        if (!db.objectStoreNames.contains('tradingDays')) {
          db.createObjectStore('tradingDays', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('tags')) {
          db.createObjectStore('tags', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('settings')) {
          db.createObjectStore('settings', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('tradeScreenshots')) {
          db.createObjectStore('tradeScreenshots', { keyPath: 'id' });
        }
      };

      request.onsuccess = (event) => {
        this.db = (event.target as IDBOpenDBRequest).result;
        this.isInitialized = true;
        resolve();
      };

      request.onerror = (event) => {
        console.error('IndexedDB init error:', (event.target as IDBOpenDBRequest).error);
        reject((event.target as IDBOpenDBRequest).error);
      };
    });
  }

  public async requestStorageDurability(): Promise<boolean> {
    if (navigator.storage && navigator.storage.persist) {
      try {
        const isPersisted = await navigator.storage.persist();
        console.log(`[Storage Durability] Persisted: ${isPersisted}`);
        return isPersisted;
      } catch (err) {
        console.warn('Storage persist request failed:', err);
      }
    }
    return false;
  }

  public async getStorageStatus(): Promise<StorageStatus> {
    let isPersisted = false;
    let usageBytes = 0;
    let quotaBytes = 0;

    if (navigator.storage) {
      if (navigator.storage.persisted) {
        isPersisted = await navigator.storage.persisted();
      }
      if (navigator.storage.estimate) {
        const estimate = await navigator.storage.estimate();
        usageBytes = estimate.usage || 0;
        quotaBytes = estimate.quota || 0;
      }
    }

    return {
      isPersisted,
      usageBytes,
      quotaBytes,
      usageMB: (usageBytes / (1024 * 1024)).toFixed(2),
      quotaMB: (quotaBytes / (1024 * 1024)).toFixed(0)
    };
  }

  // --- CRUD HELPERS ---

  private async getStore<T>(storeName: string): Promise<T[]> {
    await this.init();
    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction(storeName, 'readonly');
      const store = tx.objectStore(storeName);
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result as T[]);
      request.onerror = () => reject(request.error);
    });
  }

  private async putRecord<T>(storeName: string, record: T): Promise<void> {
    await this.init();
    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      const request = store.put(record);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  private async deleteRecord(storeName: string, id: string): Promise<void> {
    await this.init();
    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      const request = store.delete(id);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // --- PUBLIC API ---

  public async loadAllData(): Promise<AppDatabaseData> {
    const [accounts, setups, trades, tradingDays, tags, settingsList] = await Promise.all([
      this.getStore<Account>('accounts'),
      this.getStore<Setup>('setups'),
      this.getStore<Trade>('trades'),
      this.getStore<TradingDay>('tradingDays'),
      this.getStore<Tag>('tags'),
      this.getStore<Settings>('settings')
    ]);

    const settings = settingsList[0] || this.getDefaultSettings();

    return {
      accounts,
      setups,
      trades,
      tradingDays,
      tags,
      settings
    };
  }

  public async saveAccount(account: Account): Promise<void> {
    const val = validateAccount(account);
    if (!val.isValid) throw new Error(val.errors.join(' '));
    await this.putRecord('accounts', account);
  }

  public async deleteAccount(id: string): Promise<void> {
    await this.deleteRecord('accounts', id);
  }

  public async saveSetup(setup: Setup): Promise<void> {
    const val = validateSetup(setup);
    if (!val.isValid) throw new Error(val.errors.join(' '));
    await this.putRecord('setups', setup);
  }

  public async deleteSetup(id: string): Promise<void> {
    await this.deleteRecord('setups', id);
  }

  public async saveTrade(trade: Trade): Promise<void> {
    const val = validateTrade(trade, trade.status === 'Draft');
    if (!val.isValid) throw new Error(val.errors.join(' '));
    await this.putRecord('trades', trade);
  }

  public async deleteTrade(id: string): Promise<void> {
    await this.deleteRecord('trades', id);
  }

  public async saveTradingDay(day: TradingDay): Promise<void> {
    await this.putRecord('tradingDays', day);
  }

  public async saveSettings(settings: Settings): Promise<void> {
    await this.putRecord('settings', settings);
  }

  // --- SCREENSHOT BLOB STORAGE ---

  public async saveScreenshotBlob(storageKey: string, blob: Blob): Promise<void> {
    await this.init();
    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction('tradeScreenshots', 'readwrite');
      const store = tx.objectStore('tradeScreenshots');
      const request = store.put({ id: storageKey, blob, timestamp: new Date().toISOString() });
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  public async getScreenshotBlob(storageKey: string): Promise<Blob | null> {
    await this.init();
    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction('tradeScreenshots', 'readonly');
      const store = tx.objectStore('tradeScreenshots');
      const request = store.get(storageKey);
      request.onsuccess = () => {
        const res = request.result;
        resolve(res ? res.blob : null);
      };
      request.onerror = () => reject(request.error);
    });
  }

  // --- BACKUP & RESTORE ZIP ---

  public async exportFullBackupZip(): Promise<Blob> {
    const data = await this.loadAllData();
    const zip = new SimpleZip();

    // 1. Add database JSON
    zip.addFile('data.json', JSON.stringify(data, null, 2));

    // 2. Add screenshot media Blobs
    const screenshots = await this.getStore<{ id: string; blob: Blob }>('tradeScreenshots');
    for (const item of screenshots) {
      if (item.blob) {
        const arrayBuffer = await item.blob.arrayBuffer();
        zip.addFile(`media/${item.id}`, new Uint8Array(arrayBuffer));
      }
    }

    return await zip.generateBlob();
  }

  public async importFullBackupZip(file: File): Promise<{ success: boolean; message: string }> {
    try {
      const extractedFiles = await parseZipBlob(file);

      // Check data.json
      const jsonBytes = extractedFiles['data.json'];
      if (!jsonBytes) {
        return { success: false, message: 'Invalid backup ZIP: missing data.json file.' };
      }

      const jsonStr = new TextDecoder().decode(jsonBytes);
      const data = JSON.parse(jsonStr);

      const validation = validateBackupData(data);
      if (!validation.isValid) {
        return { success: false, message: `Backup validation failed: ${validation.errors.join(', ')}` };
      }

      // Restore data collections
      await this.init();
      const clearAndPut = async (storeName: string, records: any[]) => {
        const tx = this.db!.transaction(storeName, 'readwrite');
        const store = tx.objectStore(storeName);
        store.clear();
        for (const rec of records) {
          store.put(rec);
        }
      };

      await clearAndPut('accounts', data.accounts || []);
      await clearAndPut('setups', data.setups || []);
      await clearAndPut('trades', data.trades || []);
      await clearAndPut('tradingDays', data.tradingDays || []);
      await clearAndPut('tags', data.tags || []);
      if (data.settings) {
        await clearAndPut('settings', [data.settings]);
      }

      // Restore screenshot media files
      const mediaTx = this.db!.transaction('tradeScreenshots', 'readwrite');
      const mediaStore = mediaTx.objectStore('tradeScreenshots');
      mediaStore.clear();

      for (const [path, bytes] of Object.entries(extractedFiles)) {
        if (path.startsWith('media/')) {
          const storageKey = path.replace('media/', '');
          const blob = new Blob([bytes]);
          mediaStore.put({ id: storageKey, blob, timestamp: new Date().toISOString() });
        }
      }

      return { success: true, message: 'Backup successfully restored!' };
    } catch (err: any) {
      console.error('Import backup error:', err);
      return { success: false, message: `Import error: ${err.message || 'Malformed archive'}` };
    }
  }

  public getDefaultSettings(): Settings {
    return {
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
      noTradeReminders: true
    };
  }
}

export const dbService = new JournalDatabaseService();
