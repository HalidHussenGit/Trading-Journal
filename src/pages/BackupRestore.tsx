import React, { useState } from 'react';
import { useJournal } from '../context/JournalContext';
import { ConfirmDialog } from '../components/common/ConfirmDialog';

export const BackupRestore: React.FC = () => {
  const { exportBackup, importBackup, showNotification, refreshData, saveAccount, saveSetup, saveTrade } = useJournal();
  
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [isConfirmingClear, setIsConfirmingClear] = useState(false);

  const handleExportZip = async () => {
    try {
      setIsExporting(true);
      const zipBlob = await exportBackup();
      const url = URL.createObjectURL(zipBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Ayzoh_Enji_Trading_Journal_Backup_${new Date().toISOString().split('T')[0]}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showNotification('success', 'Full ZIP backup archive exported successfully!');
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
          showNotification('success', 'Backup restored successfully!');
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
        id: 'acc_demo_01',
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
        id: 'setup_demo_01',
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
          { id: 'chk_1', setupId: 'setup_demo_01', name: 'HTF Trend Alignment', description: '4h/Daily bias matches trade', required: true, order: 1, active: true, createdAt: '', updatedAt: '' },
          { id: 'chk_2', setupId: 'setup_demo_01', name: 'Key Support / Resistance Hit', description: 'Price reacting to key level', required: true, order: 2, active: true, createdAt: '', updatedAt: '' },
          { id: 'chk_3', setupId: 'setup_demo_01', name: 'Asian Range Liquidity Swept', description: 'Asian high or low taken out', required: true, order: 3, active: true, createdAt: '', updatedAt: '' },
          { id: 'chk_4', setupId: 'setup_demo_01', name: 'LTF Market Structure Break', description: '1m/5m displacement break', required: true, order: 4, active: true, createdAt: '', updatedAt: '' },
          { id: 'chk_5', setupId: 'setup_demo_01', name: 'Fair Value Gap / Order Block Entry', description: 'Price retraced into FVG', required: false, order: 5, active: true, createdAt: '', updatedAt: '' },
          { id: 'chk_6', setupId: 'setup_demo_01', name: 'No High Impact News Next 30m', description: 'Economic calendar clear', required: true, order: 6, active: true, createdAt: '', updatedAt: '' },
          { id: 'chk_7', setupId: 'setup_demo_01', name: 'Clean Risk:Reward >= 2R', description: 'SL behind swing level', required: true, order: 7, active: true, createdAt: '', updatedAt: '' },
          { id: 'chk_8', setupId: 'setup_demo_01', name: 'Position Size within Limits', description: 'Risk <= 1%', required: true, order: 8, active: true, createdAt: '', updatedAt: '' },
          { id: 'chk_9', setupId: 'setup_demo_01', name: 'Calm Emotional State', description: 'Not revenge or FOMO', required: false, order: 9, active: true, createdAt: '', updatedAt: '' },
          { id: 'chk_10', setupId: 'setup_demo_01', name: 'Execution during Session Hours', description: 'Inside London Window', required: true, order: 10, active: true, createdAt: '', updatedAt: '' }
        ],
        notes: '',
        status: 'Active' as const,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      await saveSetup(demoSetup);

      const demoTrade1 = {
        id: 'trade_001',
        accountId: 'acc_demo_01',
        setupId: 'setup_demo_01',
        symbol: 'EURUSD',
        direction: 'Long' as const,
        status: 'Closed' as const,
        date: '2026-08-29',
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
          { id: 'ex_1', levelName: 'TP1', exitPrice: 106, sizePercent: 100, realizedPL: 300, realizedR: 3, exitReason: 'Target Reached', timestamp: new Date().toISOString() }
        ],
        result: {
          status: 'Win' as const,
          netPL: 300,
          grossPL: 300,
          rMultiple: 3
        },
        checklistSnapshot: {
          total: 10,
          completed: 7,
          adherencePercent: 70,
          items: demoSetup.checklist.map((item, idx) => ({
            id: item.id,
            name: item.name,
            description: item.description,
            required: item.required,
            checked: idx < 7,
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
      showNotification('success', 'Sample acceptance test dataset loaded successfully!');
    } catch (err: any) {
      showNotification('error', `Demo loader error: ${err.message}`);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-xs space-y-6">
        <div className="border-b border-slate-100 pb-3">
          <h2 className="text-base font-bold text-slate-900">Backup, Restore & Data Management</h2>
          <p className="text-xs text-slate-500 mt-0.5">Export full portable ZIP archives containing JSON records and screenshot files.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Export Card */}
          <div className="p-5 bg-slate-50 border border-slate-200 rounded-lg space-y-3">
            <h3 className="text-xs font-bold text-slate-900 uppercase">Export Full Backup (.ZIP)</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Generates a single ZIP package containing accounts, setups, trades, journal entries, and full-resolution screenshot files.
            </p>
            <button
              onClick={handleExportZip}
              disabled={isExporting}
              className="px-4 py-2 bg-slate-900 text-white rounded text-xs font-medium hover:bg-slate-800 disabled:opacity-50"
            >
              {isExporting ? 'Packaging ZIP...' : 'Export Backup ZIP'}
            </button>
          </div>

          {/* Import Card */}
          <div className="p-5 bg-slate-50 border border-slate-200 rounded-lg space-y-3">
            <h3 className="text-xs font-bold text-slate-900 uppercase">Import Backup Archive</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Restore your trading journal from a previous `.zip` backup file. Runs strict schema validation before overwriting.
            </p>
            <label className="inline-block px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded text-xs font-medium hover:bg-slate-50 cursor-pointer">
              {isImporting ? 'Restoring...' : 'Select Backup ZIP'}
              <input type="file" accept=".zip" onChange={handleImportFileChange} className="hidden" disabled={isImporting} />
            </label>
          </div>
        </div>

        {/* Development & Testing Utilities */}
        <div className="border-t border-slate-100 pt-5 space-y-3">
          <h3 className="text-xs font-bold text-slate-900 uppercase">Demo & Acceptance Testing Loader</h3>
          <p className="text-xs text-slate-500">Quickly load the standard acceptance test dataset (Account, London Breakout setup, Trade #1 with 70% adherence).</p>
          <button
            onClick={handleLoadDemoData}
            className="px-4 py-2 bg-emerald-700 text-white rounded text-xs font-medium hover:bg-emerald-800"
          >
            Load Acceptance Test Demo Data
          </button>
        </div>
      </div>
    </div>
  );
};
