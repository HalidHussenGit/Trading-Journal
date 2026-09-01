import React, { useState } from 'react';
import { useJournal } from '../context/JournalContext';

export const BackupRestore: React.FC = () => {
  const { exportBackup, importBackup, showNotification, refreshData, saveAccount, saveSetup, saveTrade } = useJournal();
  
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  const handleExportJson = async () => {
    try {
      setIsExporting(true);
      const blob = await exportBackup();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Ayzoh_Enji_Trading_Journal_Backup_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showNotification('success', 'Supabase snapshot exported successfully!');
    } catch (err: any) {
      showNotification('error', `Export error: ${err.message}`);
    } finally {
      setIsExporting(false);
    }
  };

  const handleImportFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      try {
        setIsImporting(true);
        const res = await importBackup(file);
        if (res.success) {
          showNotification('success', 'Backup restored to Supabase successfully!');
        } else {
          showNotification('error', res.message);
        }
      } catch (err: any) {
        showNotification('error', `Import failed: ${err.message}`);
      } finally {
        setIsImporting(false);
        e.target.value = '';
      }
    }
  };

  const handleLoadDemoData = async () => {
    try {
      const demoAccount = {
        id: crypto.randomUUID(),
        name: 'Prop Account – $10,000 (Demo)',
        brokerOrFirm: 'FTMO',
        accountType: 'PropFirm' as const,
        currency: '$',
        initialBalance: 10000,
        currentBalance: 10285,
        defaultRiskPercent: 1.0,
        dailyLossLimitPercent: 3.0,
        maxDrawdownPercent: 6.0,
        tradingStyle: 'Day Trading',
        status: 'Active' as const,
        notes: 'Demo sample account for acceptance testing.',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      await saveAccount(demoAccount);

      const demoSetup = {
        id: crypto.randomUUID(),
        name: 'London Breakout',
        description: 'London open momentum breakout setup',
        market: 'Forex',
        instrument: 'EURUSD, GBPUSD',
        timeframes: ['15m'],
        sessions: ['London'],
        direction: 'Both' as const,
        entryModel: 'Breakout & Retest',
        stopLossModel: 'Swing High/Low',
        takeProfitModel: 'Fixed 3R',
        minimumRR: 2.0,
        defaultRiskPercent: 1.0,
        rules: ['Trade only during London session', 'Minimum 2R target'],
        invalidConditions: ['High Impact News within 15m'],
        checklist: [
          { id: crypto.randomUUID(), setupId: '', name: 'HTF Trend Alignment', description: '4h/Daily bias matches trade', required: true, order: 1, active: true, createdAt: '', updatedAt: '' },
          { id: crypto.randomUUID(), setupId: '', name: 'Key Support / Resistance Hit', description: 'Price reacting to key level', required: true, order: 2, active: true, createdAt: '', updatedAt: '' },
          { id: crypto.randomUUID(), setupId: '', name: 'Asian Range Liquidity Swept', description: 'Asian high or low taken out', required: true, order: 3, active: true, createdAt: '', updatedAt: '' },
          { id: crypto.randomUUID(), setupId: '', name: 'LTF Market Structure Break', description: '1m/5m displacement break', required: true, order: 4, active: true, createdAt: '', updatedAt: '' },
          { id: crypto.randomUUID(), setupId: '', name: 'Fair Value Gap / Order Block Entry', description: 'Price retraced into FVG', required: false, order: 5, active: true, createdAt: '', updatedAt: '' }
        ],
        notes: '',
        status: 'Active' as const,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      await saveSetup(demoSetup);

      const demoTrade1 = {
        id: crypto.randomUUID(),
        accountId: demoAccount.id,
        setupId: demoSetup.id,
        symbol: 'EURUSD',
        direction: 'Long' as const,
        status: 'Closed' as const,
        date: new Date().toISOString().split('T')[0],
        time: '08:30',
        session: 'London' as const,
        timeframe: '15m',
        marketCondition: 'Trending',
        tags: ['LondonBreakout', 'A+'],
        planned: {
          entry: 100,
          stopLoss: 98,
          takeProfit: 106,
          riskPercent: 1,
          riskAmount: 100,
          plannedRR: 3,
          positionSize: 50
        },
        actual: {
          entry: 100,
          exit: 106,
          positionSize: 50,
          fees: 0, commission: 0, swap: 0, slippage: 0, exitReason: 'TP Hit'
        },
        exits: [
          { id: crypto.randomUUID(), levelName: 'TP1', exitPrice: 106, sizePercent: 100, realizedPL: 300, realizedR: 3, exitReason: 'Target Reached', timestamp: new Date().toISOString() }
        ],
        result: {
          status: 'Win' as const,
          netPL: 300,
          grossPL: 300,
          rMultiple: 3
        },
        checklistSnapshot: {
          total: 5,
          completed: 4,
          adherencePercent: 80,
          items: demoSetup.checklist.map((item, idx) => ({
            id: item.id,
            name: item.name,
            description: item.description,
            required: item.required,
            checked: idx < 4,
            order: item.order
          }))
        },
        psychology: {
          preTradeEmotion: 'Calm' as const,
          confidenceRating: 9,
          focusRating: 8,
          stressRating: 2,
          patienceRating: 9,
          energyRating: 8
        },
        qualityScores: { setup: 9, execution: 8, riskManagement: 9, psychology: 9, discipline: 9, overall: 8.8 },
        violations: [],
        screenshots: [],
        journal: {
          thesis: 'Clean London breakout of Asian range high following 4h bullish bias.',
          whatWentWell: 'Waited patiently for 15m retest into FVG.',
          whatWentWrong: 'None',
          followedPlan: 'Yes' as const,
          interferedDuringTrade: false,
          movedStopLoss: false,
          closedEarly: false,
          hesitatedOnEntry: false,
          revengeOrOvertraded: false,
          lessonsLearned: 'Sticking to 15m structural stops pays off.',
          whatToDoDifferently: ''
        },
        timeline: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      await saveTrade(demoTrade1);
      await refreshData();
      showNotification('success', 'Sample demo data loaded into Supabase successfully!');
    } catch (err: any) {
      showNotification('error', `Demo loader error: ${err.message}`);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-xs space-y-6">
        <div className="border-b border-slate-100 pb-3">
          <h2 className="text-base font-bold text-slate-900">Backup, Snapshot & Data Management</h2>
          <p className="text-xs text-slate-500 mt-0.5">Export portable JSON snapshots of your Supabase records or restore previous backups.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Export Card */}
          <div className="p-5 bg-slate-50 border border-slate-200 rounded-lg space-y-3">
            <h3 className="text-xs font-bold text-slate-900 uppercase">Export Supabase Snapshot (.JSON)</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Generates a JSON snapshot containing accounts, setups, trades, journal entries, and trading days for offline archiving.
            </p>
            <button
              onClick={handleExportJson}
              disabled={isExporting}
              className="px-4 py-2 bg-slate-900 text-white rounded text-xs font-medium hover:bg-slate-800 disabled:opacity-50"
            >
              {isExporting ? 'Exporting...' : 'Export Backup JSON'}
            </button>
          </div>

          {/* Import Card */}
          <div className="p-5 bg-slate-50 border border-slate-200 rounded-lg space-y-3">
            <h3 className="text-xs font-bold text-slate-900 uppercase">Import Backup Archive</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Restore your trading journal records to Supabase from a previous `.json` backup file.
            </p>
            <label className="inline-block px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded text-xs font-medium hover:bg-slate-50 cursor-pointer">
              {isImporting ? 'Restoring...' : 'Select Backup JSON'}
              <input type="file" accept=".json" onChange={handleImportFileChange} className="hidden" disabled={isImporting} />
            </label>
          </div>
        </div>

        {/* Development & Testing Utilities */}
        <div className="border-t border-slate-100 pt-5 space-y-3">
          <h3 className="text-xs font-bold text-slate-900 uppercase">Demo Data Generator</h3>
          <p className="text-xs text-slate-500">Quickly load a sample dataset (Account, London Breakout setup, Trade #1) directly into Supabase.</p>
          <button
            onClick={handleLoadDemoData}
            className="px-4 py-2 bg-emerald-700 text-white rounded text-xs font-medium hover:bg-emerald-800"
          >
            Load Sample Demo Data
          </button>
        </div>
      </div>
    </div>
  );
};
