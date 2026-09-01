import React, { useState } from 'react';
import { useJournal } from '../context/JournalContext';
import { calculatePortfolioMetrics, calculateAdherenceBuckets } from '../utils/calculations';
import { EquityCurveChart, DailyPLBarChart, RMultipleDistributionChart } from '../components/common/Charts';
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
          <div className="bg-amber-50 border border-amber-300 rounded-lg p-4 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-amber-600 text-sm">⏳</span>
                <span className="text-sm font-bold text-amber-900">
                  {draftTrades.length} trade{draftTrades.length > 1 ? 's' : ''} need closing
                </span>
              </div>
              <button
                onClick={() => onNavigate('trades')}
                className="text-xs text-amber-700 underline font-medium hover:text-amber-900"
              >
                View all →
              </button>
            </div>
            <div className="space-y-1.5">
              {draftTrades.slice(0, 4).map(t => (
                <div
                  key={t.id}
                  onClick={() => onNavigate('trade-detail', t.id)}
                  className="flex items-center justify-between bg-white rounded border border-amber-200 px-3 py-1.5 text-xs cursor-pointer hover:bg-amber-100/50 transition-colors group"
                  title="Click to view trade details"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-slate-900 group-hover:text-amber-900">{t.symbol}</span>
                    <span className="text-[10px] text-amber-600 font-mono underline">View Details →</span>
                  </div>
                  <span className="text-slate-500">{t.date} · {t.direction} · Entry {t.planned?.entry}</span>
                  <button
                    onClick={(e) => { e.stopPropagation(); setClosingTrade(t); }}
                    className="px-2.5 py-1 bg-emerald-700 text-white rounded text-[10px] font-bold hover:bg-emerald-800"
                  >
                    Close
                  </button>
                </div>
              ))}
              {draftTrades.length > 4 && (
                <div className="text-xs text-amber-600 text-center">+{draftTrades.length - 4} more…</div>
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
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Net P&L */}
        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs">
          <div className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">Net P&L</div>
          <div className={`text-lg font-bold font-mono mt-1 ${metrics.totalPL >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
            {metrics.totalPL >= 0 ? '+' : ''}${metrics.totalPL.toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Total R: <span className="font-mono font-semibold text-slate-700">{metrics.totalR >= 0 ? '+' : ''}{metrics.totalR}R</span>
          </div>
        </div>

        {/* Win Rate */}
        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs">
          <div className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">Win Rate</div>
          <div className="text-lg font-bold font-mono text-slate-900 mt-1">
            {metrics.hasEnoughData ? `${metrics.winRate}%` : 'N/A'}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            W: <span className="text-emerald-600 font-semibold">{metrics.winningTradesCount}</span> · L: <span className="text-rose-600 font-semibold">{metrics.losingTradesCount}</span> · BE: {metrics.breakevenTradesCount}
          </div>
        </div>

        {/* Risk to Reward Ratio */}
        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs">
          <div className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">Risk to Reward</div>
          <div className="text-lg font-bold font-mono text-slate-900 mt-1">
            {metrics.hasEnoughData ? (metrics.avgR >= 0 ? `1 : ${metrics.avgR || '1.0'}` : `1 : 0`) : 'N/A'}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Avg R: <span className="font-mono font-semibold text-slate-700">{metrics.avgR >= 0 ? '+' : ''}{metrics.avgR}R</span>
          </div>
        </div>

        {/* Process & Checklist Adherence */}
        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs">
          <div className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">Checklist Adherence</div>
          <div className="text-lg font-bold font-mono text-slate-900 mt-1">
            {metrics.hasEnoughData ? `${metrics.avgAdherencePercent}%` : 'N/A'}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Score: <span className="font-semibold text-slate-800">{metrics.hasEnoughData ? `${metrics.overallQualityScore}/10` : 'N/A'}</span>
          </div>
        </div>
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

        {/* R Distribution & Streaks */}
        <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-xs space-y-6">
          <RMultipleDistributionChart trades={closedTrades.map(t => ({ rMultiple: t.result?.rMultiple || 0 }))} />
          
          <div className="border-t border-slate-100 pt-4 space-y-2">
            <div className="text-xs font-semibold text-slate-700">Streak Statistics</div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-slate-50 p-2 rounded border border-slate-100">
                <div className="text-slate-500 text-[10px]">Max Win Streak</div>
                <div className="font-bold text-emerald-600 font-mono text-sm">{metrics.maxConsecutiveWins} trades</div>
              </div>
              <div className="bg-slate-50 p-2 rounded border border-slate-100">
                <div className="text-slate-500 text-[10px]">Max Loss Streak</div>
                <div className="font-bold text-rose-600 font-mono text-sm">{metrics.maxConsecutiveLosses} trades</div>
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
          <button
            onClick={() => onNavigate('trades')}
            className="text-xs font-medium text-slate-600 hover:text-slate-900 underline"
          >
            View All Trades ({filteredTrades.length}) →
          </button>
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
                    className="flex items-center justify-between bg-slate-50 hover:bg-slate-100/80 p-2.5 rounded border border-slate-200 text-xs cursor-pointer transition-colors group"
                    title="Click to view trade details"
                  >
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors w-16">{t.symbol}</span>
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${t.direction === 'Long' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                        {t.direction}
                      </span>
                      <span className="text-[11px] text-slate-500 font-sans hidden sm:inline">{t.date} {t.time}</span>
                    </div>

                    <div className="flex items-center gap-4">
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide ${
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

                      {isClosed ? (
                        <div className="text-right w-28">
                          <span className={`font-bold ${isWin ? 'text-emerald-600' : isLoss ? 'text-rose-600' : 'text-slate-500'}`}>
                            {isWin ? '+' : ''}${t.result?.netPL} ({isWin ? '+' : ''}{t.result?.rMultiple}R)
                          </span>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); setClosingTrade(t); }}
                          className="px-2.5 py-1 bg-emerald-700 text-white rounded text-[10px] font-bold hover:bg-emerald-800"
                        >
                          Close Trade
                        </button>
                      )}

                      <span className="text-[11px] text-slate-400 group-hover:text-blue-600 font-sans font-medium underline">Details →</span>
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
