import React, { useState } from 'react';
import { useJournal } from '../context/JournalContext';
import { calculatePortfolioMetrics, calculateAdherenceBuckets } from '../utils/calculations';

export const Analytics: React.FC = () => {
  const { trades, setups } = useJournal();
  const [activeTab, setActiveTab] = useState<'overview' | 'setups' | 'adherence' | 'violations' | 'sessions'>('overview');

  const closedTrades = trades.filter(t => t.status === 'Closed' && !t.isArchived);
  const metrics = calculatePortfolioMetrics(closedTrades);
  const adherenceBuckets = calculateAdherenceBuckets(closedTrades);

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Analytics Tab Header */}
      <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs flex items-center gap-4 overflow-x-auto">
        {[
          { id: 'overview', label: '1. Overall Metrics' },
          { id: 'setups', label: '2. By Setup & Account' },
          { id: 'adherence', label: '3. Checklist Adherence' },
          { id: 'violations', label: '4. Rule Violations' },
          { id: 'sessions', label: '5. Sessions & Weekdays' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-3.5 py-1.5 rounded text-xs font-semibold whitespace-nowrap transition-colors ${
              activeTab === tab.id ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* TAB 1: OVERALL METRICS */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs">
              <div className="text-slate-400 text-[10px] uppercase font-semibold">Total Closed Trades</div>
              <div className="text-xl font-bold font-mono text-slate-900 mt-1">{metrics.closedTradesCount}</div>
            </div>
            <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs">
              <div className="text-slate-400 text-[10px] uppercase font-semibold">Win Rate</div>
              <div className="text-xl font-bold font-mono text-slate-900 mt-1">{metrics.winRate}%</div>
            </div>
            <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs">
              <div className="text-slate-400 text-[10px] uppercase font-semibold">Profit Factor</div>
              <div className="text-xl font-bold font-mono text-slate-900 mt-1">{metrics.profitFactor}</div>
            </div>
            <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs">
              <div className="text-slate-400 text-[10px] uppercase font-semibold">Expectancy</div>
              <div className="text-xl font-bold font-mono text-emerald-600 mt-1">+{metrics.expectancyR}R</div>
            </div>
          </div>

          <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-xs space-y-4">
            <h3 className="text-xs font-bold text-slate-900 uppercase">Core Distribution Summary</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs font-mono">
              <div className="p-3 bg-slate-50 rounded border border-slate-100">
                <span className="text-slate-400 text-[10px] block">Avg Winning Trade</span>
                <span className="font-bold text-emerald-600">+${metrics.avgWinPL}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded border border-slate-100">
                <span className="text-slate-400 text-[10px] block">Avg Losing Trade</span>
                <span className="font-bold text-rose-600">-${metrics.avgLossPL}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded border border-slate-100">
                <span className="text-slate-400 text-[10px] block">Largest Win</span>
                <span className="font-bold text-emerald-600">+${metrics.largestWinPL}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded border border-slate-100">
                <span className="text-slate-400 text-[10px] block">Largest Loss</span>
                <span className="font-bold text-rose-600">${metrics.largestLossPL}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: BY SETUP & ACCOUNT */}
      {activeTab === 'setups' && (
        <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-xs space-y-4">
          <h3 className="text-xs font-bold text-slate-900 uppercase">Setup Performance Breakdown</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse font-mono">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">Setup Name</th>
                  <th className="py-2.5 px-3">Trades</th>
                  <th className="py-2.5 px-3">Win Rate</th>
                  <th className="py-2.5 px-3">Avg R</th>
                  <th className="py-2.5 px-3">Total P&L</th>
                  <th className="py-2.5 px-3">Profit Factor</th>
                  <th className="py-2.5 px-3">Avg Adherence</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {setups.map(stp => {
                  const stpTrades = closedTrades.filter(t => t.setupId === stp.id);
                  const stpMetrics = calculatePortfolioMetrics(stpTrades);
                  return (
                    <tr key={stp.id} className="hover:bg-slate-50">
                      <td className="py-2.5 px-3 font-bold font-sans text-slate-900">{stp.name}</td>
                      <td className="py-2.5 px-3">{stpTrades.length}</td>
                      <td className="py-2.5 px-3">{stpMetrics.hasEnoughData ? `${stpMetrics.winRate}%` : 'N/A'}</td>
                      <td className={`py-2.5 px-3 ${stpMetrics.avgR >= 0 ? 'text-emerald-600 font-bold' : 'text-rose-600 font-bold'}`}>
                        {stpMetrics.avgR >= 0 ? '+' : ''}{stpMetrics.avgR}R
                      </td>
                      <td className={`py-2.5 px-3 ${stpMetrics.totalPL >= 0 ? 'text-emerald-600 font-bold' : 'text-rose-600 font-bold'}`}>
                        ${stpMetrics.totalPL}
                      </td>
                      <td className="py-2.5 px-3">{stpMetrics.profitFactor}</td>
                      <td className="py-2.5 px-3">{stpMetrics.avgAdherencePercent}%</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: CHECKLIST ADHERENCE */}
      {activeTab === 'adherence' && (
        <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-xs space-y-4">
          <div className="border-b border-slate-100 pb-2">
            <h3 className="text-xs font-bold text-slate-900 uppercase">Checklist Adherence Buckets</h3>
            <p className="text-xs text-slate-500">Historical performance grouped by recorded checklist adherence %.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
            {adherenceBuckets.map((b, idx) => (
              <div key={idx} className="p-4 bg-slate-50 rounded border border-slate-200 text-xs font-mono space-y-2">
                <div className="font-bold text-slate-800 text-sm font-sans">{b.bucketLabel}</div>
                <div className="text-slate-500">{b.tradeCount} trades</div>
                <div className="pt-2 border-t border-slate-200 space-y-1">
                  <div>Win Rate: <strong className="text-slate-900">{b.winRate}%</strong></div>
                  <div>Avg R: <strong className={b.avgR >= 0 ? 'text-emerald-600' : 'text-rose-600'}>{b.avgR}R</strong></div>
                  <div>P&L: <strong className={b.totalPL >= 0 ? 'text-emerald-600' : 'text-rose-600'}>${b.totalPL}</strong></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
