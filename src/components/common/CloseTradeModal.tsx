import React, { useState } from 'react';
import { Trade, TradeOutcome } from '../../types';
import { useJournal } from '../../context/JournalContext';
import { Modal } from './Modal';
import { computePriceBasedRR } from '../../utils/calculations';

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
  const [pointValue, setPointValue] = useState<number>(trade.planned?.pointValue || 1);
  const [whatWentWell, setWhatWentWell] = useState<string>(trade.journal?.whatWentWell || '');
  const [whatWentWrong, setWhatWentWrong] = useState<string>(trade.journal?.whatWentWrong || '');
  const [lessonsLearned] = useState<string>(trade.journal?.lessonsLearned || '');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleOutcomeChange = (o: TradeOutcome) => {
    setOutcome(o);
    if (o === 'Win' && trade.planned?.takeProfit) {
      setActualExit(trade.planned.takeProfit);
    } else if (o === 'Loss' && trade.planned?.stopLoss) {
      setActualExit(trade.planned.stopLoss);
    } else if (o === 'Breakeven' && trade.planned?.entry) {
      setActualExit(trade.planned.entry);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const entry = trade.planned?.entry || 0;
      const sl = trade.planned?.stopLoss || 0;
      const contractSize = trade.planned?.contractSize || 1;
      const riskAmount = trade.planned?.riskAmount || 0;

      let priceDiff = 0;
      if (trade.direction === 'Long') {
        priceDiff = actualExit - entry;
      } else {
        priceDiff = entry - actualExit;
      }

      // Prefer user-entered lot size over auto-calculated position size
      // This is critical for instruments like XAUUSD where point value differs
      const lotSize = trade.planned?.lotSize;
      const effectiveSize = lotSize !== undefined && lotSize > 0 ? lotSize : (trade.planned?.positionSize || trade.actual?.positionSize || 1);
      
      const grossPL = priceDiff * effectiveSize * pointValue * contractSize;
      
      const fees = trade.actual?.fees || 0;
      const commission = trade.actual?.commission || 0;
      const swap = trade.actual?.swap || 0;
      const netPL = grossPL - fees - commission - swap;

      // ── R-Multiple: always price-distance / initial-risk ──────────────────
      // Formula: RR = abs(exit − entry) / abs(entry − SL)
      // LONG:  risk = entry − SL,  reward = exit − entry
      // SHORT: risk = SL − entry,  reward = entry − exit
      let rMultiple = computePriceBasedRR(entry, sl, actualExit, trade.direction);

      // Only fall back to dollar-based if price levels are genuinely missing
      if (rMultiple === 0 && riskAmount > 0 && netPL !== 0) {
        rMultiple = netPL / riskAmount;
      }

      // Save pointValue back to planned so it persists
      const updatedPlanned = { ...trade.planned, pointValue };

      const closedTrade: Trade = {
        ...trade,
        planned: updatedPlanned,
        status: 'Closed',
        actual: {
          ...trade.actual,
          entry: trade.actual?.entry || entry,
          exit: actualExit,
          positionSize: trade.actual?.positionSize || 0,
          fees,
          commission,
          swap,
          slippage: trade.actual?.slippage || 0,
          exitReason: outcome
        },
        result: {
          status: outcome,
          netPL: Number(netPL.toFixed(2)),
          grossPL: Number(grossPL.toFixed(2)),
          rMultiple: Number(rMultiple.toFixed(2))
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
            description: `Trade closed — ${outcome}`
          }
        ],
        updatedAt: new Date().toISOString()
      };

      await saveTrade(closedTrade);
      showNotification('success', `Trade closed as ${outcome}`);
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

  // Live P&L preview
  const lotSize = trade.planned?.lotSize;
  const effectiveSizePreview = lotSize !== undefined && lotSize > 0 ? lotSize : (trade.planned?.positionSize || trade.actual?.positionSize || 1);
  const entry = trade.planned?.entry || 0;
  const sl = trade.planned?.stopLoss || 0;
  const contractSizePreview = trade.planned?.contractSize || 1;
  const priceDiffPreview = trade.direction === 'Long' ? actualExit - entry : entry - actualExit;
  const grossPLPreview = priceDiffPreview * effectiveSizePreview * pointValue * contractSizePreview;
  const netPLPreview = grossPLPreview - (trade.actual?.fees || 0) - (trade.actual?.commission || 0) - (trade.actual?.swap || 0);

  // Live RR preview — always price-distance based
  const rrPreview = computePriceBasedRR(entry, sl, actualExit, trade.direction);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Close Trade — ${trade.symbol} (${trade.direction})`}>
      <form onSubmit={handleSave} className="space-y-5">

        {/* Trade Summary */}
        <div className="grid grid-cols-4 gap-3 bg-slate-50 p-3 rounded border border-slate-200 text-xs font-mono">
          <div>
            <div className="text-slate-400 text-[10px] uppercase">Entry</div>
            <div className="font-bold text-slate-900">{trade.planned?.entry || '—'}</div>
          </div>
          <div>
            <div className="text-slate-400 text-[10px] uppercase">SL</div>
            <div className="font-bold text-rose-700">{trade.planned?.stopLoss || '—'}</div>
          </div>
          <div>
            <div className="text-slate-400 text-[10px] uppercase">Lot Size</div>
            <div className="font-bold text-slate-900">{lotSize ?? (trade.planned?.positionSize?.toFixed(2) ?? '—')}</div>
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
        <div className="grid grid-cols-2 gap-3">
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
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Point Value
              <span className="ml-1 text-slate-400 font-normal">(e.g. 100 for Gold)</span>
            </label>
            <input
              type="number"
              step="any"
              min="0.001"
              value={pointValue}
              onChange={e => setPointValue(parseFloat(e.target.value) || 1)}
              className="w-full px-3 py-1.5 border border-slate-300 rounded text-xs font-mono focus:ring-1 focus:ring-slate-900 focus:outline-none"
            />
          </div>
        </div>

        {/* Live P&L + RR Preview */}
        <div className={`flex items-center justify-between p-3 rounded border text-xs font-mono ${
          netPLPreview > 0 ? 'bg-emerald-50 border-emerald-200' :
          netPLPreview < 0 ? 'bg-rose-50 border-rose-200' : 'bg-slate-50 border-slate-200'
        }`}>
          <div>
            <div className="text-slate-500 text-[10px] uppercase tracking-wider mb-0.5">Calculated Net P&L</div>
            <div className={`text-base font-bold ${netPLPreview > 0 ? 'text-emerald-700' : netPLPreview < 0 ? 'text-rose-700' : 'text-slate-600'}`}>
              {netPLPreview >= 0 ? '+' : ''}${Number(netPLPreview.toFixed(2))}
            </div>
          </div>
          <div className="text-right">
            <div className="text-slate-500 text-[10px] uppercase tracking-wider mb-0.5">R-Multiple</div>
            <div className={`text-base font-bold ${rrPreview > 0 ? 'text-emerald-700' : rrPreview < 0 ? 'text-rose-700' : 'text-slate-600'}`}>
              {rrPreview >= 0 ? '+' : ''}{Number(rrPreview.toFixed(2))}R
            </div>
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
