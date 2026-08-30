import React from 'react';
import { useJournal } from '../context/JournalContext';

export const RiskManagement: React.FC = () => {
  const { accounts, trades, settings } = useJournal();

  // Find all Open positions
  const openTrades = trades.filter(t => t.status === 'Open');

  // Compute total open risk across all positions
  const totalOpenRiskAmount = openTrades.reduce((sum, t) => sum + (t.planned?.riskAmount || 0), 0);

  // Breakdown 1: Open Risk by Account
  const riskByAccount = accounts.map(acc => {
    const accOpenTrades = openTrades.filter(t => t.accountId === acc.id);
    const openRisk = accOpenTrades.reduce((sum, t) => sum + (t.planned?.riskAmount || 0), 0);
    const openRiskPct = acc.currentBalance > 0 ? (openRisk / acc.currentBalance) * 100 : 0;
    return {
      account: acc,
      openTradesCount: accOpenTrades.length,
      openRiskAmount: Number(openRisk.toFixed(2)),
      openRiskPercent: Number(openRiskPct.toFixed(2))
    };
  });

  // Breakdown 2: Open Risk by Symbol
  const symbolMap = new Map<string, { count: number; riskAmount: number }>();
  openTrades.forEach(t => {
    const sym = t.symbol.toUpperCase();
    const existing = symbolMap.get(sym) || { count: 0, riskAmount: 0 };
    symbolMap.set(sym, {
      count: existing.count + 1,
      riskAmount: existing.riskAmount + (t.planned?.riskAmount || 0)
    });
  });
  const riskBySymbol = Array.from(symbolMap.entries()).map(([symbol, val]) => ({
    symbol,
    openTradesCount: val.count,
    openRiskAmount: Number(val.riskAmount.toFixed(2))
  }));

  // Breakdown 3: Open Risk by Setup
  const setupMap = new Map<string, { count: number; riskAmount: number }>();
  openTrades.forEach(t => {
    const setupId = t.setupId || 'General';
    const existing = setupMap.get(setupId) || { count: 0, riskAmount: 0 };
    setupMap.set(setupId, {
      count: existing.count + 1,
      riskAmount: existing.riskAmount + (t.planned?.riskAmount || 0)
    });
  });
  const riskBySetup = Array.from(setupMap.entries()).map(([setupId, val]) => ({
    setupId,
    openTradesCount: val.count,
    openRiskAmount: Number(val.riskAmount.toFixed(2))
  }));

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header & Status Indicator */}
      <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-xs flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-slate-900">Risk Management Center</h2>
          <p className="text-xs text-slate-500 mt-0.5">Real-time open risk exposure and daily loss limit enforcement monitor.</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-600">Global Risk Status:</span>
          <span className={`px-3 py-1 rounded text-xs font-bold font-mono ${
            totalOpenRiskAmount === 0 ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
            totalOpenRiskAmount < 500 ? 'bg-slate-100 text-slate-800 border border-slate-200' : 'bg-amber-50 text-amber-800 border border-amber-300'
          }`}>
            {totalOpenRiskAmount === 0 ? 'SAFE (No Open Risk)' : `ELEVATED ($${totalOpenRiskAmount.toLocaleString()})`}
          </span>
        </div>
      </div>

      {/* Account Risk Monitors Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {accounts.map(acc => {
          const accRisk = riskByAccount.find(r => r.account.id === acc.id);
          const openRisk = accRisk?.openRiskAmount || 0;
          const openRiskPct = accRisk?.openRiskPercent || 0;

          const isCritical = openRiskPct > settings.criticalRiskMaxPercent;
          const isWarning = openRiskPct > settings.warningRiskMaxPercent;

          return (
            <div key={acc.id} className="bg-white p-5 rounded-lg border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">{acc.name}</h3>
                  <p className="text-xs text-slate-500">Balance: {acc.currency}{acc.currentBalance.toLocaleString()}</p>
                </div>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                  isCritical ? 'bg-rose-100 text-rose-800' :
                  isWarning ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                }`}>
                  {isCritical ? 'Critical' : isWarning ? 'Warning' : 'Safe'}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs font-mono bg-slate-50 p-2.5 rounded border border-slate-100">
                <div>
                  <span className="text-slate-400 text-[10px]">Open Risk ($)</span>
                  <div className="font-bold text-slate-900">${openRisk}</div>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px]">Open Risk %</span>
                  <div className="font-bold text-slate-900">{openRiskPct}%</div>
                </div>
              </div>

              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Daily Loss Limit ({acc.dailyLossLimitPercent}%)</span>
                  <span className="font-mono font-semibold">${((acc.currentBalance * acc.dailyLossLimitPercent) / 100).toFixed(0)}</span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded overflow-hidden">
                  <div
                    className={`h-full ${isWarning ? 'bg-amber-500' : 'bg-emerald-500'}`}
                    style={{ width: `${Math.min(100, (openRiskPct / acc.dailyLossLimitPercent) * 100)}%` }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* GRANULAR OPEN RISK EXPOSURE BREAKDOWN */}
      <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-xs space-y-4">
        <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-2">
          Granular Portfolio Risk Exposure Breakdown
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs font-mono">
          {/* By Account */}
          <div className="p-4 bg-slate-50 rounded border border-slate-200 space-y-2">
            <div className="font-bold text-slate-800 font-sans border-b border-slate-200 pb-1">By Account</div>
            {riskByAccount.map(r => (
              <div key={r.account.id} className="flex justify-between items-center py-1 border-b border-slate-100">
                <span className="font-sans font-medium text-slate-700 truncate max-w-[120px]">{r.account.name}</span>
                <span className="font-bold text-slate-900">${r.openRiskAmount} ({r.openRiskPercent}%)</span>
              </div>
            ))}
          </div>

          {/* By Symbol */}
          <div className="p-4 bg-slate-50 rounded border border-slate-200 space-y-2">
            <div className="font-bold text-slate-800 font-sans border-b border-slate-200 pb-1">By Symbol</div>
            {riskBySymbol.length === 0 ? (
              <div className="text-slate-400 text-center py-3">No open symbol risk</div>
            ) : (
              riskBySymbol.map(s => (
                <div key={s.symbol} className="flex justify-between items-center py-1 border-b border-slate-100">
                  <span className="font-bold text-slate-900">{s.symbol} ({s.openTradesCount})</span>
                  <span className="font-bold text-slate-900">${s.openRiskAmount}</span>
                </div>
              ))
            )}
          </div>

          {/* By Setup */}
          <div className="p-4 bg-slate-50 rounded border border-slate-200 space-y-2">
            <div className="font-bold text-slate-800 font-sans border-b border-slate-200 pb-1">By Setup</div>
            {riskBySetup.length === 0 ? (
              <div className="text-slate-400 text-center py-3">No open setup risk</div>
            ) : (
              riskBySetup.map(st => (
                <div key={st.setupId} className="flex justify-between items-center py-1 border-b border-slate-100">
                  <span className="font-sans text-slate-700 truncate max-w-[120px]">{st.setupId}</span>
                  <span className="font-bold text-slate-900">${st.openRiskAmount}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
