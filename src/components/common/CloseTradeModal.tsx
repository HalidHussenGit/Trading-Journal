import React, { useState } from 'react';
import { Trade, TradeOutcome } from '../../types';
import { useJournal } from '../../context/JournalContext';
import { Modal } from './Modal';

interface CloseTradeModalProps {
  trade: Trade;
  isOpen: boolean;
  onClose: () => void;
  onClosed?: () => void;
}

export const CloseTradeModal: React.FC<CloseTradeModalProps> = ({ trade, isOpen, onClose, onClosed }) => {
  const { saveTrade, showNotification } = useJournal();

  const [outcome, setOutcome] = useState<TradeOutcome>('Win');
  const [actualExit, setActualExit] = useState<number>(trade.planned?.takeProfit || trade.planned?.entry || 0);
  const [netPL, setNetPL] = useState<number>(0);
  const [rMultiple, setRMultiple] = useState<number>(0);
  const [whatWentWell, setWhatWentWell] = useState<string>(trade.journal?.whatWentWell || '');
  const [whatWentWrong, setWhatWentWrong] = useState<string>(trade.journal?.whatWentWrong || '');
  const [lessonsLearned] = useState<string>(trade.journal?.lessonsLearned || '');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Auto-compute R-multiple when net P&L changes
  const handleNetPLChange = (val: number) => {
    setNetPL(val);
    if (trade.planned?.riskAmount && trade.planned.riskAmount > 0) {
      setRMultiple(parseFloat((val / trade.planned.riskAmount).toFixed(2)));
    }
  };

  const handleOutcomeChange = (o: TradeOutcome) => {
    setOutcome(o);
    // Flip sign of netPL for loss outcomes
    if ((o === 'Loss' || o === 'Partial Loss') && netPL > 0) setNetPL(-Math.abs(netPL));
    if ((o === 'Win' || o === 'Partial Win') && netPL < 0) setNetPL(Math.abs(netPL));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const closedTrade: Trade = {
        ...trade,
        status: 'Closed',
        actual: {
          ...trade.actual,
          exit: actualExit,
          exitReason: outcome
        },
        result: {
          status: outcome,
          netPL: netPL,
          grossPL: netPL,
          rMultiple: rMultiple
        },
        journal: {
          ...trade.journal,
          whatWentWell,
          whatWentWrong,
          lessonsLearned
        },
        timeline: [
          ...(trade.timeline || []),
          {
            id: '',
            timestamp: new Date().toISOString(),
            type: 'Closed' as const,
            description: `Trade closed — ${outcome} · ${netPL >= 0 ? '+' : ''}$${netPL} (${rMultiple >= 0 ? '+' : ''}${rMultiple}R)`
          }
        ],
        updatedAt: new Date().toISOString()
      };

      await saveTrade(closedTrade);
      showNotification('success', `Trade closed as ${outcome} · ${netPL >= 0 ? '+' : ''}$${netPL}`);
      onClose();
      onClosed?.();
    } catch (err: any) {
      showNotification('error', `Close trade failed: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const outcomeConfig: Record<TradeOutcome, { label: string; color: string; ring: string }> = {
    'Win':          { label: '🟢 Win',          color: 'bg-emerald-50 border-emerald-500 text-emerald-800',  ring: 'ring-emerald-500' },
    'Partial Win':  { label: '🟡 Partial Win',  color: 'bg-amber-50 border-amber-500 text-amber-800',       ring: 'ring-amber-500' },
    'Breakeven':    { label: '⚪ Breakeven',     color: 'bg-slate-100 border-slate-400 text-slate-700',      ring: 'ring-slate-400' },
    'Partial Loss': { label: '🟠 Partial Loss', color: 'bg-orange-50 border-orange-500 text-orange-800',    ring: 'ring-orange-500' },
    'Loss':         { label: '🔴 Loss',          color: 'bg-rose-50 border-rose-500 text-rose-800',         ring: 'ring-rose-500' },
    'Custom':       { label: 'Custom',           color: 'bg-slate-50 border-slate-300 text-slate-600',      ring: 'ring-slate-400' }
  };

  const riskAmount = trade.planned?.riskAmount;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Close Trade — ${trade.symbol} (${trade.direction})`}>
      <form onSubmit={handleSave} className="space-y-5">

        {/* Trade Summary */}
        <div className="grid grid-cols-3 gap-3 bg-slate-50 p-3 rounded border border-slate-200 text-xs font-mono">
          <div>
            <div className="text-slate-400 text-[10px] uppercase">Entry</div>
            <div className="font-bold text-slate-900">{trade.planned?.entry || '—'}</div>
          </div>
          <div>
            <div className="text-slate-400 text-[10px] uppercase">SL</div>
            <div className="font-bold text-rose-700">{trade.planned?.stopLoss || '—'}</div>
          </div>
          <div>
            <div className="text-slate-400 text-[10px] uppercase">Risk $</div>
            <div className="font-bold text-slate-900">{riskAmount ? `$${riskAmount}` : '—'}</div>
          </div>
        </div>

        {/* Outcome Selector */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-2">Trade Outcome *</label>
          <div className="grid grid-cols-3 gap-2">
            {(['Win', 'Partial Win', 'Breakeven', 'Partial Loss', 'Loss'] as TradeOutcome[]).map(o => {
              const cfg = outcomeConfig[o];
              const isSelected = outcome === o;
              return (
                <button
                  key={o}
                  type="button"
                  onClick={() => handleOutcomeChange(o)}
                  className={`px-2 py-2 rounded border text-[11px] font-bold transition-all ${
                    isSelected
                      ? `${cfg.color} ring-2 ${cfg.ring} shadow-sm`
                      : 'bg-white border-slate-200 text-slate-600 hover:border-slate-400'
                  }`}
                >
                  {cfg.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Actual Numbers */}
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Actual Exit Price</label>
            <input
              type="number"
              step="any"
              required
              value={actualExit}
              onChange={e => setActualExit(parseFloat(e.target.value) || 0)}
              className="w-full px-3 py-1.5 border border-slate-300 rounded text-xs font-mono focus:ring-1 focus:ring-slate-900 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Net P&L ($)</label>
            <input
              type="number"
              step="any"
              required
              value={netPL}
              onChange={e => handleNetPLChange(parseFloat(e.target.value) || 0)}
              className={`w-full px-3 py-1.5 border rounded text-xs font-mono font-bold focus:ring-1 focus:outline-none ${
                netPL > 0 ? 'border-emerald-300 text-emerald-700 focus:ring-emerald-500' :
                netPL < 0 ? 'border-rose-300 text-rose-700 focus:ring-rose-500' :
                'border-slate-300 focus:ring-slate-900'
              }`}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">R-Multiple</label>
            <input
              type="number"
              step="0.01"
              value={rMultiple}
              onChange={e => setRMultiple(parseFloat(e.target.value) || 0)}
              className={`w-full px-3 py-1.5 border rounded text-xs font-mono font-bold focus:ring-1 focus:outline-none ${
                rMultiple > 0 ? 'border-emerald-300 text-emerald-700' :
                rMultiple < 0 ? 'border-rose-300 text-rose-700' :
                'border-slate-300'
              }`}
            />
          </div>
        </div>

        {/* Quick Journal */}
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">What went well?</label>
            <textarea
              rows={2}
              value={whatWentWell}
              onChange={e => setWhatWentWell(e.target.value)}
              placeholder="Execution notes, process observation..."
              className="w-full px-3 py-2 border border-slate-300 rounded text-xs focus:ring-1 focus:ring-slate-900 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">What went wrong / Lessons</label>
            <textarea
              rows={2}
              value={whatWentWrong}
              onChange={e => setWhatWentWrong(e.target.value)}
              placeholder="Mistakes, improvements..."
              className="w-full px-3 py-2 border border-slate-300 rounded text-xs focus:ring-1 focus:ring-slate-900 focus:outline-none"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 border border-slate-300 rounded text-xs font-medium text-slate-700 hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className={`px-5 py-1.5 rounded text-xs font-bold text-white transition-colors disabled:opacity-50 ${
              outcome === 'Win' || outcome === 'Partial Win' ? 'bg-emerald-700 hover:bg-emerald-800' :
              outcome === 'Loss' || outcome === 'Partial Loss' ? 'bg-rose-700 hover:bg-rose-800' :
              'bg-slate-700 hover:bg-slate-800'
            }`}
          >
            {isSubmitting ? 'Closing...' : `Close as ${outcome}`}
          </button>
        </div>
      </form>
    </Modal>
  );
};
