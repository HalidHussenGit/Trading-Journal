import React, { useState } from 'react';
import { useJournal } from '../context/JournalContext';
import { PageId } from '../components/layout/Sidebar';
import { Trade } from '../types';
import { CloseTradeModal } from '../components/common/CloseTradeModal';
import { ConfirmDialog } from '../components/common/ConfirmDialog';

interface TradesProps {
  onNavigate: (page: PageId, tradeId?: string) => void;
}

export const Trades: React.FC<TradesProps> = ({ onNavigate }) => {
  const { trades, accounts, setups, filters, setFilters, deleteTrade } = useJournal();
  
  const [sortField, setSortField] = useState<keyof Trade | 'netPL' | 'rMultiple' | 'adherencePercent'>('date');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [closingTrade, setClosingTrade] = useState<Trade | null>(null);
  const [deletingTrade, setDeletingTrade] = useState<Trade | null>(null);

  // Filter Trades
  const filtered = trades.filter(t => {
    if (filters.accountId !== 'ALL' && t.accountId !== filters.accountId) return false;
    if (filters.setupId !== 'ALL' && t.setupId !== filters.setupId) return false;
    if (filters.direction !== 'ALL' && t.direction !== filters.direction) return false;
    if (filters.status !== 'ALL' && t.status !== filters.status) return false;
    if (filters.outcome !== 'ALL' && t.result?.status !== filters.outcome) return false;
    if (filters.session !== 'ALL' && t.session !== filters.session) return false;
    if (filters.startDate && t.date < filters.startDate) return false;
    if (filters.endDate && t.date > filters.endDate) return false;
    
    if (filters.searchQuery.trim() !== '') {
      const q = filters.searchQuery.toLowerCase();
      const matchSymbol = t.symbol.toLowerCase().includes(q);
      const matchThesis = (t.journal?.thesis || '').toLowerCase().includes(q);
      const matchNotes = (t.journal?.whatWentWell || '').toLowerCase().includes(q);
      const matchTags = t.tags.some(tag => tag.toLowerCase().includes(q));
      const matchId = t.id.toLowerCase().includes(q);
      if (!matchSymbol && !matchThesis && !matchNotes && !matchTags && !matchId) return false;
    }
    return true;
  });

  // Sort Trades
  const sorted = [...filtered].sort((a, b) => {
    let valA: any = a[sortField as keyof Trade];
    let valB: any = b[sortField as keyof Trade];

    if (sortField === 'netPL') {
      valA = a.result?.netPL ?? 0;
      valB = b.result?.netPL ?? 0;
    } else if (sortField === 'rMultiple') {
      valA = a.result?.rMultiple ?? 0;
      valB = b.result?.rMultiple ?? 0;
    } else if (sortField === 'adherencePercent') {
      valA = a.checklistSnapshot?.adherencePercent ?? 0;
      valB = b.checklistSnapshot?.adherencePercent ?? 0;
    }

    if (valA < valB) return sortDir === 'asc' ? -1 : 1;
    if (valA > valB) return sortDir === 'asc' ? 1 : -1;
    return 0;
  });

  const handleSort = (field: any) => {
    if (sortField === field) {
      setSortDir(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDir('desc');
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header & Filter Bar */}
      <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <select
            value={filters.accountId}
            onChange={e => setFilters(prev => ({ ...prev, accountId: e.target.value }))}
            className="bg-slate-50 border border-slate-200 rounded px-2.5 py-1 text-xs text-slate-800"
          >
            <option value="ALL">All Accounts ({accounts.length})</option>
            {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
          </select>

          <select
            value={filters.setupId}
            onChange={e => setFilters(prev => ({ ...prev, setupId: e.target.value }))}
            className="bg-slate-50 border border-slate-200 rounded px-2.5 py-1 text-xs text-slate-800"
          >
            <option value="ALL">All Setups ({setups.length})</option>
            {setups.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>

          <select
            value={filters.direction}
            onChange={e => setFilters(prev => ({ ...prev, direction: e.target.value }))}
            className="bg-slate-50 border border-slate-200 rounded px-2.5 py-1 text-xs text-slate-800"
          >
            <option value="ALL">All Directions</option>
            <option value="Long">Long</option>
            <option value="Short">Short</option>
          </select>

          <select
            value={filters.outcome}
            onChange={e => setFilters(prev => ({ ...prev, outcome: e.target.value }))}
            className="bg-slate-50 border border-slate-200 rounded px-2.5 py-1 text-xs text-slate-800"
          >
            <option value="ALL">All Outcomes</option>
            <option value="Win">Win</option>
            <option value="Loss">Loss</option>
            <option value="Breakeven">Breakeven</option>
          </select>
        </div>

        <div className="text-xs font-mono text-slate-500">
          Showing <span className="font-bold text-slate-900">{sorted.length}</span> of {trades.length} trades
        </div>
      </div>

      {/* Trades Table */}
      {sorted.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-lg border border-slate-200 border-dashed space-y-3">
          <div className="text-slate-400 font-medium text-sm">No trades found matching criteria</div>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">Try adjusting your filters or click "Log Trade" to record a new position.</p>
          <button
            onClick={() => onNavigate('new-trade')}
            className="px-4 py-2 bg-slate-900 text-white rounded text-xs font-medium hover:bg-slate-800 transition-colors"
          >
            Log Trade
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[10px] tracking-wider select-none">
                <tr>
                  <th className="py-3 px-4 cursor-pointer hover:text-slate-900" onClick={() => handleSort('date')}>Date & Time</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Account</th>
                  <th className="py-3 px-4">Setup</th>
                  <th className="py-3 px-4 cursor-pointer hover:text-slate-900" onClick={() => handleSort('symbol')}>Symbol</th>
                  <th className="py-3 px-4">Dir</th>
                  <th className="py-3 px-4">Planned Entry</th>
                  <th className="py-3 px-4 cursor-pointer hover:text-slate-900" onClick={() => handleSort('netPL')}>Net P&L</th>
                  <th className="py-3 px-4 cursor-pointer hover:text-slate-900" onClick={() => handleSort('rMultiple')}>Realized R</th>
                  <th className="py-3 px-4 cursor-pointer hover:text-slate-900" onClick={() => handleSort('adherencePercent')}>Adherence</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {sorted.map(t => {
                  const acc = accounts.find(a => a.id === t.accountId);
                  const stp = setups.find(s => s.id === t.setupId);
                  const isWin = t.result?.netPL > 0;
                  const isLoss = t.result?.netPL < 0;

                  return (
                    <tr
                      key={t.id}
                      onClick={() => onNavigate('trade-detail', t.id)}
                      className="hover:bg-slate-50 cursor-pointer transition-colors"
                    >
                      <td className="py-3 px-4 font-sans font-medium text-slate-900 whitespace-nowrap">
                        {t.date} <span className="text-[10px] text-slate-400 font-mono">{t.time}</span>
                      </td>
                      <td className="py-3 px-4" onClick={e => e.stopPropagation()}>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide ${
                          t.status === 'Closed' ? 'bg-emerald-100 text-emerald-800' :
                          t.status === 'Draft'  ? 'bg-amber-100 text-amber-800 border border-amber-300' :
                          t.status === 'Open'   ? 'bg-blue-100 text-blue-800' :
                          'bg-slate-100 text-slate-600'
                        }`}>
                          {t.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-sans text-slate-600 truncate max-w-[120px]">{acc?.name || 'Main'}</td>
                      <td className="py-3 px-4 font-sans text-slate-600 truncate max-w-[130px]">{stp?.name || 'General'}</td>
                      <td className="py-3 px-4 font-bold text-slate-900 font-mono">{t.symbol}</td>
                      <td className="py-3 px-4">
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${t.direction === 'Long' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                          {t.direction}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-600 font-mono">{t.planned?.entry}</td>
                      <td className={`py-3 px-4 font-bold font-mono ${isWin ? 'text-emerald-600' : isLoss ? 'text-rose-600' : 'text-slate-400'}`}>
                        {t.status === 'Closed' ? `${isWin ? '+' : ''}$${t.result?.netPL}` : <span className="text-slate-300 text-[10px]">—</span>}
                      </td>
                      <td className={`py-3 px-4 font-bold font-mono ${isWin ? 'text-emerald-600' : isLoss ? 'text-rose-600' : 'text-slate-400'}`}>
                        {t.status === 'Closed' ? `${isWin ? '+' : ''}${t.result?.rMultiple}R` : <span className="text-slate-300 text-[10px]">—</span>}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                          (t.checklistSnapshot?.adherencePercent || 0) >= 80 ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}>
                          {t.checklistSnapshot?.adherencePercent ?? 100}%
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-sans" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1">
                          {t.status === 'Closed' ? (
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide ${
                              isWin ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' : 
                              isLoss ? 'bg-rose-100 text-rose-800 border border-rose-200' : 
                              'bg-slate-100 text-slate-600 border border-slate-200'
                            }`}>
                              {t.result?.status || 'Closed'}
                            </span>
                          ) : (
                            <button
                              onClick={() => setClosingTrade(t)}
                              className="px-2.5 py-1 bg-emerald-700 text-white rounded text-[10px] font-bold hover:bg-emerald-800 transition-colors"
                              title="Close Trade"
                            >
                              Close
                            </button>
                          )}
                          <button
                            onClick={() => onNavigate('new-trade', t.id)}
                            className="p-1 text-slate-500 hover:text-slate-900 rounded hover:bg-slate-100 transition-colors"
                            title="Edit Trade"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => setDeletingTrade(t)}
                            className="p-1 text-slate-400 hover:text-rose-600 rounded hover:bg-rose-50 transition-colors"
                            title="Delete Trade"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Close Trade Modal */}
      {closingTrade && (
        <CloseTradeModal
          trade={closingTrade}
          isOpen={true}
          onClose={() => setClosingTrade(null)}
        />
      )}

      {/* Delete Confirmation Modal */}
      {deletingTrade && (
        <ConfirmDialog
          isOpen={!!deletingTrade}
          onClose={() => setDeletingTrade(null)}
          onConfirm={async () => {
            await deleteTrade(deletingTrade.id);
            setDeletingTrade(null);
          }}
          title="Delete Trade Record"
          message={`Are you sure you want to delete trade record for ${deletingTrade.symbol} (${deletingTrade.date})? This action cannot be undone.`}
          confirmText="Delete Trade"
          cancelText="Cancel"
          isDanger={true}
        />
      )}
    </div>
  );
};
