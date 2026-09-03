import React, { useState } from 'react';
import { useJournal } from '../context/JournalContext';
import { calculatePortfolioMetrics, calculateAdherenceBuckets, calculateProfitConsistency } from '../utils/calculations';
import { EquityCurveChart, DailyPLBarChart, OutcomesPieChart } from '../components/common/Charts';
import { PageId } from '../components/layout/Sidebar';
import { CloseTradeModal } from '../components/common/CloseTradeModal';
import { Trade } from '../types';

interface DashboardProps {
  onNavigate: (page: PageId, tradeId?: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onNavigate }) => {
  const { trades, accounts, setups, filters, setFilters } = useJournal();
  const [closingTrade, setClosingTrade] = useState<Trade | null>(null);


  // Filter trades based on active header filters
  const filteredTrades = trades.filter(t => {
    if (filters.accountId !== 'ALL' && t.accountId !== filters.accountId) return false;
    if (filters.setupId !== 'ALL' && t.setupId !== filters.setupId) return false;
    if (filters.startDate && t.date < filters.startDate) return false;
    if (filters.endDate && t.date > filters.endDate) return false;
    return true;
  });

  const activeAccount = accounts.find(a => a.id === filters.accountId);
  const initialBalance = activeAccount ? activeAccount.initialBalance : accounts.reduce((acc, a) => acc + a.initialBalance, 0) || 10000;
  
  const metrics = calculatePortfolioMetrics(filteredTrades, initialBalance);
  const adherenceBuckets = calculateAdherenceBuckets(filteredTrades);

  // Profit Consistency — only meaningful when a single account is selected with a rule set
  const consistencyTarget = activeAccount?.consistencyRatePercent ?? 0;
  const consistency = calculateProfitConsistency(filteredTrades, consistencyTarget);

  // Closed trades sorted chronologically for equity curve
  const closedTrades = filteredTrades
    .filter(t => t.status === 'Closed' && !t.isArchived)
    .sort((a, b) => new Date(`${a.date}T${a.time || '00:00'}`).getTime() - new Date(`${b.date}T${b.time || '00:00'}`).getTime());

  let runningBalance = initialBalance;
  const equityPoints = closedTrades.map(t => {
    runningBalance += (t.result?.netPL || 0);
    return {
      date: t.date,
      balance: Number(runningBalance.toFixed(2)),
      rMultiple: t.result?.rMultiple || 0,
      tradeId: t.id
    };
  });

  // Aggregate Daily P&L for Daily Bar Chart
  const dailyMap = new Map<string, { pl: number; r: number }>();
  closedTrades.forEach(t => {
    const existing = dailyMap.get(t.date) || { pl: 0, r: 0 };
    dailyMap.set(t.date, {
      pl: existing.pl + (t.result?.netPL || 0),
      r: existing.r + (t.result?.rMultiple || 0)
    });
  });
  const dailyData = Array.from(dailyMap.entries()).map(([date, val]) => ({
    date,
    pl: Number(val.pl.toFixed(2)),
    r: Number(val.r.toFixed(2))
  }));

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">

      {/* Draft Trades Alert Panel */}
      {(() => {
        const draftTrades = trades.filter(t => t.status !== 'Closed' && !t.isArchived);
        if (draftTrades.length === 0) return null;
        return (
          <div className="bg-white border border-slate-200 shadow-xs rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                {draftTrades.length} trade{draftTrades.length > 1 ? 's' : ''} need closing
              </span>
            </div>
            <div className="space-y-2">
              {draftTrades.slice(0, 4).map(t => (
                <div
                  key={t.id}
                  onClick={() => onNavigate('trade-detail', t.id)}
                  className="flex items-center justify-between bg-slate-50 hover:bg-slate-100 rounded border border-slate-200 px-3.5 py-2 text-xs cursor-pointer transition-colors group"
                  title="Click to view trade details"
                >
                  <div className="flex items-center gap-3">
                    <span className="font-mono font-bold text-slate-900 group-hover:text-blue-600 transition-colors">{t.symbol}</span>
                    <span className="text-slate-500 font-sans">{t.date} · {t.direction} · Entry {t.planned?.entry}</span>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); setClosingTrade(t); }}
                    className="px-3 py-1 bg-emerald-700 text-white rounded text-[10px] font-bold hover:bg-emerald-800 transition-colors"
                  >
                    Close
                  </button>
                </div>
              ))}
              {draftTrades.length > 4 && (
                <div className="text-xs text-slate-400 text-center font-mono">+{draftTrades.length - 4} more open trades…</div>
              )}
            </div>
          </div>
        );
      })()}

      {/* Global Filter Bar */}

      <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="text-xs font-semibold text-slate-700">Filter Overview:</div>
          
          <select
            value={filters.setupId}
            onChange={(e) => setFilters(prev => ({ ...prev, setupId: e.target.value }))}
            className="bg-slate-50 border border-slate-200 rounded px-2.5 py-1 text-xs text-slate-800"
          >
            <option value="ALL">All Setups ({setups.length})</option>
            {setups.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>

          <div className="flex items-center gap-1 text-xs text-slate-600">
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => setFilters(prev => ({ ...prev, startDate: e.target.value }))}
              className="bg-slate-50 border border-slate-200 rounded px-2 py-1 text-xs text-slate-800"
            />
            <span>to</span>
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => setFilters(prev => ({ ...prev, endDate: e.target.value }))}
              className="bg-slate-50 border border-slate-200 rounded px-2 py-1 text-xs text-slate-800"
            />
          </div>

          {(filters.accountId !== 'ALL' || filters.setupId !== 'ALL' || filters.startDate || filters.endDate) && (
            <button
              onClick={() => setFilters(prev => ({ ...prev, accountId: 'ALL', setupId: 'ALL', startDate: '', endDate: '' }))}
              className="text-xs text-slate-500 hover:text-slate-800 underline font-medium"
            >
              Reset Filters
            </button>
          )}
        </div>

        <div className="text-xs text-slate-500 font-mono">
          Showing <span className="font-semibold text-slate-900">{metrics.closedTradesCount}</span> closed trades
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className={`grid gap-4 grid-cols-2 ${consistencyTarget > 0 ? 'md:grid-cols-5' : 'md:grid-cols-4'}`}>
        {/* Net P&L */}
        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs">
          <div className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">Net P&L</div>
          <div className={`text-lg font-bold font-mono mt-1 ${metrics.totalPL >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
            {metrics.totalPL >= 0 ? '+' : ''}${metrics.totalPL.toLocaleString()}
          </div>
        </div>

        {/* Win Rate */}
        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs">
          <div className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">Win Rate</div>
          <div className="text-lg font-bold font-mono text-slate-900 mt-1">
            {metrics.hasEnoughData ? `${metrics.winRate}%` : 'N/A'}
          </div>
        </div>

        {/* Risk to Reward Ratio */}
        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs">
          <div className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">Risk to Reward</div>
          <div className="text-lg font-bold font-mono text-slate-900 mt-1">
            {metrics.hasEnoughData ? (metrics.avgR >= 0 ? `1 : ${metrics.avgR || '1.0'}` : `1 : 0`) : 'N/A'}
          </div>
        </div>

        {/* Checklist Adherence */}
        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs">
          <div className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">Checklist Adherence</div>
          <div className="text-lg font-bold font-mono text-slate-900 mt-1">
            {metrics.hasEnoughData ? `${metrics.avgAdherencePercent}%` : 'N/A'}
          </div>
        </div>

        {/* Profit Consistency — 5th tile, only when a rule is configured */}
        {consistencyTarget > 0 && (
          <div className={`col-span-2 md:col-span-1 bg-white p-4 rounded-lg border shadow-xs ${
            consistency.status === 'Pass' ? 'border-emerald-200' :
            consistency.status === 'Fail' ? 'border-rose-200' : 'border-slate-200'
          }`}>
            <div className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">Consistency</div>
            {consistency.status === 'N/A' ? (
              <div className="text-lg font-bold font-mono text-slate-400 mt-1">N/A</div>
            ) : (
              <>
                <div className={`text-lg font-bold font-mono mt-1 ${
                  consistency.status === 'Pass' ? 'text-emerald-600' : 'text-rose-600'
                }`}>
                  {consistency.status === 'Pass' ? '✓ Pass' : '✗ Fail'}
                </div>
                <div className="text-[11px] text-slate-500 mt-1 font-mono">
                  Best <span className="text-slate-700 font-semibold">${consistency.bestTradePL.toLocaleString()}</span>
                  {' · '}limit <span className="text-slate-700 font-semibold">${consistency.consistencyLimit.toLocaleString()}</span>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Main Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Equity Curve (Spans 2 columns) */}
        <div className="lg:col-span-2 bg-white p-5 rounded-lg border border-slate-200 shadow-xs">
          <EquityCurveChart
            data={equityPoints}
            initialBalance={initialBalance}
            onSelectTrade={(id) => onNavigate('trade-detail', id)}
          />
        </div>

        {/* Outcomes & Streaks */}
        <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-xs space-y-6">
          <OutcomesPieChart
            wins={closedTrades.filter(t => t.result?.status === 'Win').length}
            partialWins={closedTrades.filter(t => t.result?.status === 'Partial Win').length}
            losses={closedTrades.filter(t => t.result?.status === 'Loss').length}
            partialLosses={closedTrades.filter(t => t.result?.status === 'Partial Loss').length}
            breakevens={closedTrades.filter(t => t.result?.status === 'Breakeven').length}
          />
          
          <div className="border-t border-slate-100 pt-5 space-y-3">
            <div className="text-xs font-semibold text-slate-700 flex items-center justify-between">
              <span>Streak Statistics</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex-1 flex flex-col bg-white border border-slate-200 rounded-lg p-3 transition-all hover:shadow-sm">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1">Max Wins</span>
                <div className="flex items-end gap-1.5">
                  <span className="text-2xl font-bold font-mono text-emerald-600 leading-none">{metrics.maxConsecutiveWins}</span>
                  <span className="text-[10px] text-slate-400 font-medium mb-0.5">trades</span>
                </div>
              </div>

              <div className="flex-1 flex flex-col bg-white border border-slate-200 rounded-lg p-3 transition-all hover:shadow-sm">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1">Max Losses</span>
                <div className="flex items-end gap-1.5">
                  <span className="text-2xl font-bold font-mono text-rose-600 leading-none">{metrics.maxConsecutiveLosses}</span>
                  <span className="text-[10px] text-slate-400 font-medium mb-0.5">trades</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Daily P&L & Process Insights Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-5 rounded-lg border border-slate-200 shadow-xs">
          <DailyPLBarChart data={dailyData} />
        </div>

        {/* Process Insights Module */}
        <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Process & Adherence Breakdown</h3>
          </div>

          {metrics.hasEnoughData ? (
            <div className="space-y-3">
              <div className="text-xs text-slate-600 leading-relaxed">
                Observed performance across checklist adherence tiers:
              </div>
              <div className="space-y-2">
                {adherenceBuckets.map((b, i) => (
                  <div key={i} className="flex items-center justify-between text-xs p-2 bg-slate-50 rounded border border-slate-100">
                    <span className="font-mono font-semibold text-slate-700">{b.bucketLabel}</span>
                    <span className="text-slate-500">{b.tradeCount} trades</span>
                    <span className={b.avgR >= 0 ? 'text-emerald-600 font-mono font-semibold' : 'text-rose-600 font-mono font-semibold'}>
                      Avg {b.avgR >= 0 ? '+' : ''}{b.avgR}R
                    </span>
                  </div>
                ))}
              </div>
              <p className="text-[11px] text-slate-400 italic">
                * Correlation observations only. Quality ratings are kept strictly independent of P&L results.
              </p>
            </div>
          ) : (
            <div className="text-xs text-slate-400 text-center py-8">
              Not enough data yet. Log trades with checklist adherence to unlock process insights.
            </div>
          )}
        </div>
      </div>

      {/* Recent Trades Activity List */}
      <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-xs space-y-3">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Recent Trades Activity</h3>
        </div>

        {filteredTrades.length === 0 ? (
          <div className="text-xs text-slate-400 text-center py-6">No recent trades logged yet.</div>
        ) : (
          <div className="space-y-1.5 font-mono">
            {filteredTrades
              .slice(0, 5)
              .map(t => {
                const isClosed = t.status === 'Closed';
                const isWin = (t.result?.netPL || 0) > 0;
                const isLoss = (t.result?.netPL || 0) < 0;
                return (
                  <div
                    key={t.id}
                    onClick={() => onNavigate('trade-detail', t.id)}
                    className="flex flex-col gap-2 bg-slate-50 hover:bg-slate-100/80 px-4 py-3 rounded border border-slate-200 text-xs cursor-pointer transition-colors group"
                    title="Click to view trade details"
                  >
                    <div className="flex items-center justify-between">
                      <div className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors truncate">
                        {t.symbol}
                      </div>
                      <div className="flex justify-end">
                        {isClosed ? (
                          <span className={`font-bold tabular-nums ${isWin ? 'text-emerald-600' : isLoss ? 'text-rose-600' : 'text-slate-500'}`}>
                            {isWin ? '+' : ''}${t.result?.netPL}
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); setClosingTrade(t); }}
                            className="px-2.5 py-1 bg-emerald-700 text-white rounded text-[10px] font-bold hover:bg-emerald-800 transition-colors"
                          >
                            Close Trade
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 overflow-hidden">
                        <span className={`shrink-0 px-1.5 py-0.5 rounded text-[10px] font-bold ${t.direction === 'Long' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                          {t.direction}
                        </span>
                        <span className="text-[11px] text-slate-500 truncate">
                          {t.date} {t.time}
                        </span>
                      </div>
                      <div className="flex justify-start">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide text-center ${
                          t.status === 'Closed' ? (
                            isWin ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' :
                            isLoss ? 'bg-rose-100 text-rose-800 border border-rose-200' :
                            'bg-slate-100 text-slate-600 border border-slate-200'
                          ) :
                          t.status === 'Draft' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                          'bg-blue-50 text-blue-700 border border-blue-200'
                        }`}>
                          {t.status === 'Closed' ? (t.result?.status || 'Closed') : t.status}
                        </span>
                      </div>
                    </div>
                  </div>

                );
              })}
          </div>
        )}
      </div>
      {/* Close Trade Modal */}
      {closingTrade && (
        <CloseTradeModal
          trade={closingTrade}
          isOpen={true}
          onClose={() => setClosingTrade(null)}
        />
      )}
    </div>
  );
};
