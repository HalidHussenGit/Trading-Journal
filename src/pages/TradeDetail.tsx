import React, { useState } from 'react';
import { useJournal } from '../context/JournalContext';
import { PageId } from '../components/layout/Sidebar';
import { LazyImage } from '../components/common/LazyImage';
import { Modal } from '../components/common/Modal';
import { ConfirmDialog } from '../components/common/ConfirmDialog';

interface TradeDetailProps {
  tradeId: string | null;
  onNavigate: (page: PageId, tradeId?: string) => void;
}

export const TradeDetail: React.FC<TradeDetailProps> = ({ tradeId, onNavigate }) => {
  const { trades, accounts, setups, deleteTrade } = useJournal();
  const [activeLightboxImg, setActiveLightboxImg] = useState<string | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean>(false);

  const trade = trades.find(t => t.id === tradeId);
  if (!trade) {
    return (
      <div className="p-12 text-center text-slate-500 text-xs">
        Trade record not found. <button onClick={() => onNavigate('trades')} className="text-slate-900 underline font-bold">Return to log</button>
      </div>
    );
  }

  const account = accounts.find(a => a.id === trade.accountId);
  const setup = setups.find(s => s.id === trade.setupId);

  const isWin = (trade.result?.netPL || 0) > 0;
  const isLoss = (trade.result?.netPL || 0) < 0;

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      {/* Top Navigation & Status Bar */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => onNavigate('trades')}
          className="flex items-center gap-1 text-xs font-semibold text-slate-600 hover:text-slate-900"
        >
          ← Back to Trades Log
        </button>

        <div className="flex items-center gap-3">
          <button
            onClick={() => onNavigate('new-trade', trade.id)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 text-white rounded text-xs font-medium hover:bg-slate-800 transition-colors shadow-xs"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Edit Trade
          </button>
          <button
            onClick={() => setIsDeleteModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 text-rose-700 border border-rose-200 rounded text-xs font-medium hover:bg-rose-100 transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            Delete Trade
          </button>
          <span className="text-xs text-slate-400 font-mono ml-2">ID: {trade.id}</span>
        </div>
      </div>

      {/* Hero Summary Card */}
      <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className={`px-2 py-0.5 rounded text-xs font-bold ${trade.direction === 'Long' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                {trade.direction}
              </span>
              <h2 className="text-xl font-bold font-mono text-slate-900">{trade.symbol}</h2>
              <span className="text-xs text-slate-500 font-medium">({trade.timeframe} · {trade.session})</span>
            </div>
            <p className="text-xs text-slate-500">
              Account: <strong className="text-slate-800">{account?.name || 'Main'}</strong> · Setup: <strong className="text-slate-800">{setup?.name || 'General'}</strong> · Date: {trade.date} {trade.time}
            </p>
          </div>

          <div className="text-right">
            <div className="text-[10px] uppercase font-bold text-slate-400">Net Realized P&L</div>
            <div className={`text-2xl font-bold font-mono ${isWin ? 'text-emerald-600' : isLoss ? 'text-rose-600' : 'text-slate-700'}`}>
              {trade.status === 'Closed' ? `${isWin ? '+' : ''}$${trade.result?.netPL}` : trade.status}
            </div>
            {trade.status === 'Closed' && (
              <div className="text-xs font-bold font-mono text-slate-600 mt-0.5">
                Realized: <span className={isWin ? 'text-emerald-600' : 'text-rose-600'}>{isWin ? '+' : ''}{trade.result?.rMultiple}R</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Planned vs Actual Comparison Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Planned Parameters */}
        <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-xs space-y-3">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-2">1. Planned Execution Plan</h3>
          <div className="grid grid-cols-2 gap-3 text-xs font-mono">
            <div>
              <div className="text-slate-400 text-[10px]">Planned Entry</div>
              <div className="font-bold text-slate-800">{trade.planned?.entry}</div>
            </div>
            <div>
              <div className="text-slate-400 text-[10px]">Planned Stop Loss</div>
              <div className="font-bold text-slate-800">{trade.planned?.stopLoss}</div>
            </div>
            <div>
              <div className="text-slate-400 text-[10px]">Target Take Profit</div>
              <div className="font-bold text-slate-800">{trade.planned?.takeProfit}</div>
            </div>
            <div>
              <div className="text-slate-400 text-[10px]">Planned R:R</div>
              <div className="font-bold text-emerald-600">1 : {trade.planned?.plannedRR}</div>
            </div>
            <div>
              <div className="text-slate-400 text-[10px]">Risk Amount ($)</div>
              <div className="font-bold text-slate-800">${trade.planned?.riskAmount} ({trade.planned?.riskPercent}%)</div>
            </div>
            <div>
              <div className="text-slate-400 text-[10px]">Position Size</div>
              <div className="font-bold text-slate-800">{trade.planned?.positionSize} units</div>
            </div>
          </div>
        </div>

        {/* Actual Results & Multi-Exits */}
        <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-xs space-y-3">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-2">2. Actual Realized Execution</h3>
          
          <div className="space-y-2">
            {(!trade.exits || trade.exits.length === 0) ? (
              <div className="text-xs text-slate-400">Single exit trade execution.</div>
            ) : (
              <div className="space-y-1.5">
                {trade.exits.map((ex, idx) => (
                  <div key={idx} className="flex items-center justify-between text-xs p-2 bg-slate-50 rounded border border-slate-100 font-mono">
                    <span className="font-bold text-slate-800">{ex.levelName} ({ex.sizePercent}%)</span>
                    <span className="text-slate-600">Price: {ex.exitPrice}</span>
                    <span className={ex.realizedPL >= 0 ? 'text-emerald-600 font-bold' : 'text-rose-600 font-bold'}>
                      {ex.realizedPL >= 0 ? '+' : ''}${ex.realizedPL}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Historical Checklist Snapshot Audit */}
      <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
          <div>
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Immutable Setup Checklist Snapshot Audit</h3>
            <p className="text-xs text-slate-500">Record of checklist as checked at trade entry time.</p>
          </div>
          <div className="text-right font-mono">
            <span className="text-xs font-bold text-slate-900">{trade.checklistSnapshot?.completed}/{trade.checklistSnapshot?.total} Rules Checked</span>
            <div className="text-xs font-bold text-emerald-600">{trade.checklistSnapshot?.adherencePercent}% Adherence</div>
          </div>
        </div>

        <div className="space-y-2">
          {(!trade.checklistSnapshot?.items || trade.checklistSnapshot.items.length === 0) ? (
            <div className="text-xs text-slate-400">No checklist snapshot recorded for this trade.</div>
          ) : (
            trade.checklistSnapshot.items.map((item, idx) => (
              <div key={idx} className={`flex items-start gap-3 p-2.5 rounded text-xs border ${item.checked ? 'bg-emerald-50/30 border-emerald-100' : 'bg-slate-50 border-slate-200'}`}>
                <span className={`w-4 h-4 rounded flex items-center justify-center text-[10px] font-bold text-white ${item.checked ? 'bg-emerald-600' : 'bg-slate-300'}`}>
                  {item.checked ? '✓' : '×'}
                </span>
                <div className="flex-1">
                  <div className="font-semibold text-slate-800">{item.name} {item.required && <span className="text-rose-600 text-[10px] uppercase font-bold">(Required)</span>}</div>
                  {item.description && <p className="text-[11px] text-slate-500">{item.description}</p>}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Screenshots Lightbox Gallery */}
      {trade.screenshots && trade.screenshots.length > 0 && (
        <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-xs space-y-3">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-2">Chart Screenshots Gallery</h3>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {trade.screenshots.map(s => (
              <div key={s.id} className="relative bg-slate-50 p-2 rounded border border-slate-200 text-xs space-y-1">
                <LazyImage
                  storageKey={s.storageKey}
                  alt={s.caption || s.category}
                  className="w-full h-32 object-cover rounded"
                  onClick={() => setActiveLightboxImg(s.storageKey)}
                />
                <div className="text-[10px] font-bold text-slate-700">{s.category}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quality Scores & Journal Reflection */}
      <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-xs space-y-4">
        <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-2">Process Quality Scores & Reflection</h3>
        
        <div className="grid grid-cols-2 md:grid-cols-6 gap-2 text-center text-xs font-mono bg-slate-50 p-3 rounded border border-slate-200">
          <div><div className="text-slate-400 text-[10px]">Setup</div><div className="font-bold text-slate-900">{trade.qualityScores?.setup || 8}/10</div></div>
          <div><div className="text-slate-400 text-[10px]">Execution</div><div className="font-bold text-slate-900">{trade.qualityScores?.execution || 8}/10</div></div>
          <div><div className="text-slate-400 text-[10px]">Risk Mgmt</div><div className="font-bold text-slate-900">{trade.qualityScores?.riskManagement || 8}/10</div></div>
          <div><div className="text-slate-400 text-[10px]">Psychology</div><div className="font-bold text-slate-900">{trade.qualityScores?.psychology || 8}/10</div></div>
          <div><div className="text-slate-400 text-[10px]">Discipline</div><div className="font-bold text-slate-900">{trade.qualityScores?.discipline || 8}/10</div></div>
          <div><div className="text-slate-400 text-[10px]">Overall</div><div className="font-bold text-emerald-600">{trade.qualityScores?.overall || 8}/10</div></div>
        </div>

        {trade.journal?.thesis && (
          <div>
            <div className="text-xs font-semibold text-slate-700 mb-1">Trade Thesis:</div>
            <p className="text-xs text-slate-800 bg-slate-50 p-3 rounded border border-slate-100 whitespace-pre-wrap">{trade.journal.thesis}</p>
          </div>
        )}
      </div>

      {/* Lightbox Modal */}
      {activeLightboxImg && (
        <Modal isOpen={!!activeLightboxImg} onClose={() => setActiveLightboxImg(null)} title="Screenshot Lightbox View" maxWidth="4xl">
          <div className="p-2 flex justify-center">
            <LazyImage storageKey={activeLightboxImg} alt="Lightbox" className="max-h-[80vh] w-auto object-contain rounded" />
          </div>
        </Modal>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmDialog
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={async () => {
          await deleteTrade(trade.id);
          onNavigate('trades');
        }}
        title="Delete Trade Record"
        message={`Are you sure you want to permanently delete trade record for ${trade.symbol} (${trade.date})? This action cannot be undone.`}
        confirmText="Delete Trade"
        cancelText="Cancel"
        isDanger={true}
      />
    </div>
  );
};
