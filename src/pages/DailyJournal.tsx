import React, { useState } from 'react';
import { useJournal } from '../context/JournalContext';
import { TradingDay, NoTradeReason, Trade } from '../types';
import { Modal } from '../components/common/Modal';
import { CloseTradeModal } from '../components/common/CloseTradeModal';
import { PageId } from '../components/layout/Sidebar';

interface DailyJournalProps {
  onNavigate?: (page: PageId, tradeId?: string) => void;
}

export const DailyJournal: React.FC<DailyJournalProps> = ({ onNavigate }) => {
  const { tradingDays, trades, saveDayLog } = useJournal();
  
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const [selectedDay, setSelectedDay] = useState<TradingDay | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [closingTrade, setClosingTrade] = useState<Trade | null>(null);

  // Month navigation helpers
  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();

  const monthsList = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // Years starting from 2020 for backtesting support
  const availableYears = Array.from({ length: 16 }, (_, i) => 2020 + i);

  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);
  const daysInMonth = lastDayOfMonth.getDate();
  const startingWeekday = firstDayOfMonth.getDay(); // 0 = Sun, 1 = Mon...

  // Compute month trades summary
  const monthStr = `${year}-${String(month + 1).padStart(2, '0')}`;
  const monthTrades = trades.filter(t => t.date.startsWith(monthStr) && t.status === 'Closed');
  const monthTradingDaysCount = new Set(monthTrades.map(t => t.date)).size;
  const monthNetPL = monthTrades.reduce((acc, t) => acc + (t.result?.netPL || 0), 0);
  const monthNetR = monthTrades.reduce((acc, t) => acc + (t.result?.rMultiple || 0), 0);

  const handleOpenDayModal = (dateStr: string) => {
    const dayTrades = trades.filter(t => t.date === dateStr && t.status === 'Closed');
    const dayPL = dayTrades.reduce((acc, t) => acc + (t.result?.netPL || 0), 0);
    const dayR = dayTrades.reduce((acc, t) => acc + (t.result?.rMultiple || 0), 0);

    const existingLog = tradingDays.find(d => d.date === dateStr);
    setSelectedDay(existingLog || {
      id: dateStr,
      date: dateStr,
      didTrade: dayTrades.length > 0,
      tradeCount: dayTrades.length,
      dailyPL: dayPL,
      dailyR: dayR,
      noTradeReason: 'No Valid Setup',
      notes: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    setIsModalOpen(true);
  };

  const handleSaveDayLog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDay) return;

    await saveDayLog({
      ...selectedDay,
      updatedAt: new Date().toISOString()
    });
    setIsModalOpen(false);
    setSelectedDay(null);
  };

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      {/* Calendar Header & Monthly Summary Bar */}
      <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="text-base font-bold text-slate-900 min-w-[160px]">
              {currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}
            </h2>

            {/* Direct Month & Year Dropdown Selectors */}
            <div className="flex items-center gap-2">
              <select
                value={month}
                onChange={(e) => setCurrentMonth(new Date(year, parseInt(e.target.value), 1))}
                className="px-2.5 py-1.5 border border-slate-300 rounded text-xs font-semibold text-slate-800 bg-white focus:ring-1 focus:ring-slate-900 focus:outline-none cursor-pointer"
              >
                {monthsList.map((mName, idx) => (
                  <option key={idx} value={idx}>{mName}</option>
                ))}
              </select>

              <select
                value={year}
                onChange={(e) => setCurrentMonth(new Date(parseInt(e.target.value), month, 1))}
                className="px-2.5 py-1.5 border border-slate-300 rounded text-xs font-bold text-slate-800 bg-white focus:ring-1 focus:ring-slate-900 focus:outline-none cursor-pointer font-mono"
              >
                {availableYears.map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>

            {/* Stepper Buttons */}
            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentMonth(new Date(year, month - 1, 1))}
                className="px-2.5 py-1.5 border border-slate-300 rounded text-slate-600 hover:bg-slate-50 text-xs font-bold"
                title="Previous Month"
              >
                ← Prev
              </button>
              <button
                onClick={() => setCurrentMonth(new Date())}
                className="px-2.5 py-1.5 border border-slate-300 rounded text-slate-600 hover:bg-slate-50 text-xs font-medium"
              >
                Today
              </button>
              <button
                onClick={() => setCurrentMonth(new Date(year, month + 1, 1))}
                className="px-2.5 py-1.5 border border-slate-300 rounded text-slate-600 hover:bg-slate-50 text-xs font-bold"
                title="Next Month"
              >
                Next →
              </button>
            </div>
          </div>

          {/* Monthly Summary Statistics */}
          <div className="flex items-center gap-4 text-xs font-mono">
            <div>
              <span className="text-slate-400 text-[10px] uppercase block">Trading Days</span>
              <span className="font-bold text-slate-900">{monthTradingDaysCount} days</span>
            </div>
            <div>
              <span className="text-slate-400 text-[10px] uppercase block">Monthly Net P&L</span>
              <span className={`font-bold ${monthNetPL >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                {monthNetPL >= 0 ? '+' : ''}${Number(monthNetPL.toFixed(2)).toLocaleString()}
              </span>
            </div>
            <div>
              <span className="text-slate-400 text-[10px] uppercase block">Monthly Net R</span>
              <span className={`font-bold ${monthNetR >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                {monthNetR >= 0 ? '+' : ''}{Number(monthNetR.toFixed(2))}R
              </span>
            </div>
          </div>
        </div>

        {/* Quick Month Selector Bar */}
        <div className="pt-3 border-t border-slate-100">
          <div className="flex items-center gap-1.5 overflow-x-auto">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mr-1">Quick Month:</span>
            {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map((m, idx) => (
              <button
                key={m}
                onClick={() => setCurrentMonth(new Date(year, idx, 1))}
                className={`px-2.5 py-1 rounded text-xs font-semibold transition-colors ${
                  month === idx
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {m}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Calendar Grid View */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-xs overflow-hidden">
        {/* Weekday Headers */}
        <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50 text-center text-xs font-semibold text-slate-600 py-2.5">
          <div>Sun</div><div>Mon</div><div>Tue</div><div>Wed</div><div>Thu</div><div>Fri</div><div>Sat</div>
        </div>

        {/* Calendar Days Cells */}
        <div className="grid grid-cols-7 divide-x divide-y divide-slate-100 bg-slate-100/50 min-h-[500px]">
          {/* Empty lead-in slots */}
          {Array.from({ length: startingWeekday }).map((_, idx) => (
            <div key={`empty-${idx}`} className="bg-slate-50/50 min-h-[100px]" />
          ))}

          {/* Days of month */}
          {Array.from({ length: daysInMonth }).map((_, idx) => {
            const dayNum = idx + 1;
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
            
            const dayTrades = trades.filter(t => t.date === dateStr && t.status === 'Closed');
            const draftTrades = trades.filter(t => t.date === dateStr && t.status !== 'Closed');
            const dayPL = dayTrades.reduce((acc, t) => acc + (t.result?.netPL || 0), 0);
            const dayR = dayTrades.reduce((acc, t) => acc + (t.result?.rMultiple || 0), 0);
            const logEntry = tradingDays.find(d => d.date === dateStr);

            const didTrade = dayTrades.length > 0;
            const hasDraft = draftTrades.length > 0;
            const isProfit = dayPL > 0;
            const isLoss = dayPL < 0;

            return (
              <div
                key={dateStr}
                onClick={() => handleOpenDayModal(dateStr)}
                className="bg-white p-2.5 min-h-[100px] flex flex-col justify-between cursor-pointer hover:bg-slate-50 transition-colors group relative"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700 font-mono">{dayNum}</span>
                  <div className="flex items-center gap-1">
                    {hasDraft && (
                      <span className="w-2 h-2 rounded-full bg-amber-400 border border-amber-600" title={`${draftTrades.length} draft trade(s)`} />
                    )}
                    {logEntry && !didTrade && !hasDraft && logEntry.noTradeReason && (
                      <span className="px-1.5 py-0.2 rounded text-[9px] font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                        No Trade
                      </span>
                    )}
                  </div>
                </div>

                {didTrade ? (
                  <div className={`p-1.5 rounded border text-xs font-mono overflow-hidden ${
                    isProfit ? 'bg-emerald-50 text-emerald-800 border-emerald-200' :
                    isLoss ? 'bg-rose-50 text-rose-800 border-rose-200' : 'bg-slate-100 text-slate-800 border-slate-200'
                  }`}>
                    <div className="font-bold flex items-center justify-between text-[11px] leading-tight">
                      <span className="truncate">{dayTrades.length} closed</span>
                      <span className="ml-1 whitespace-nowrap">{isProfit ? '+' : ''}${Number(dayPL.toFixed(2)).toLocaleString()}</span>
                    </div>
                    <div className="text-[10px] opacity-80 mt-0.5">{isProfit ? '+' : ''}{Number(dayR.toFixed(2))}R</div>
                  </div>
                ) : hasDraft ? (
                  <div className="p-1.5 rounded border border-amber-200 bg-amber-50 text-xs font-mono">
                    <div className="font-bold text-amber-800 text-[11px]">{draftTrades.length} open</div>
                    <div className="text-[10px] text-amber-600">Needs closing</div>
                  </div>
                ) : (
                  <div className="text-[11px] text-slate-400 font-mono italic">
                    {logEntry?.noTradeReason || '+ Log Day'}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Day Log Modal */}
      {selectedDay && (
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title={`Daily Journal — ${selectedDay.date}`}
        >
          <form onSubmit={handleSaveDayLog} className="space-y-4">
            {/* Day Trades Summary */}
            {(() => {
              const dayAllTrades = trades.filter(t => t.date === selectedDay.date);
              return dayAllTrades.length > 0 ? (
                <div className="space-y-2">
                  <div className="text-xs font-semibold text-slate-700">Trades this day</div>
                  {dayAllTrades.map(t => {
                    const isClosed = t.status === 'Closed';
                    const isWin = (t.result?.netPL || 0) > 0;
                    const isLoss = (t.result?.netPL || 0) < 0;
                    return (
                      <div
                        key={t.id}
                        onClick={() => {
                          if (onNavigate) {
                            setIsModalOpen(false);
                            onNavigate('trade-detail', t.id);
                          }
                        }}
                        className="flex items-center justify-between bg-slate-50 hover:bg-slate-100 cursor-pointer transition-colors rounded border border-slate-200 px-3 py-2 text-xs group"
                        title="Click to view trade details"
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-slate-900 group-hover:text-blue-600 transition-colors">{t.symbol}</span>
                        </div>
                        <div className="text-slate-500">{t.direction} · {t.session}</div>
                        {isClosed ? (
                          <span className={`font-mono font-bold ${ isWin ? 'text-emerald-600' : isLoss ? 'text-rose-600' : 'text-slate-500' }`}>
                            {isWin ? '+' : ''}${Number((t.result?.netPL || 0).toFixed(2)).toLocaleString()} ({isWin ? '+' : ''}{Number((t.result?.rMultiple || 0).toFixed(2))}R)
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setIsModalOpen(false);
                              setClosingTrade(t);
                            }}
                            className="px-2.5 py-1 bg-emerald-700 text-white rounded text-[10px] font-bold hover:bg-emerald-800"
                          >
                            Close Trade
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : null;
            })()}

            <div className="flex items-center gap-4 bg-slate-50 p-3 rounded border border-slate-200 text-xs">
              <label className="flex items-center gap-2 font-semibold text-slate-800 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedDay.didTrade}
                  onChange={e => setSelectedDay({ ...selectedDay, didTrade: e.target.checked })}
                  className="rounded text-slate-900 focus:ring-slate-900"
                />
                <span>Traded on this day</span>
              </label>
              {selectedDay.didTrade && (
                <div className="text-slate-500 font-mono">
                    {selectedDay.tradeCount} trades · P&L:{' '}
                    <span className={Number(selectedDay.dailyPL) >= 0 ? 'text-emerald-600 font-semibold' : 'text-rose-600 font-semibold'}>
                      {Number(selectedDay.dailyPL) >= 0 ? '+' : ''}${Number(Number(selectedDay.dailyPL).toFixed(2)).toLocaleString()}
                    </span>
                    {' · '}
                    <span className={Number(selectedDay.dailyR) >= 0 ? 'text-emerald-600 font-semibold' : 'text-rose-600 font-semibold'}>
                      {Number(selectedDay.dailyR) >= 0 ? '+' : ''}{Number(Number(selectedDay.dailyR).toFixed(2))}R
                    </span>
                  </div>
              )}
            </div>

            {/* COMPULSORY NO-TRADE DAY REASON PICKER */}
            {!selectedDay.didTrade && (
              <div className="p-3 bg-amber-50/50 border border-amber-200 rounded space-y-2">
                <label className="block text-xs font-semibold text-amber-900">
                  No-Trade Reason (Compulsory for non-trading days) *
                </label>
                <select
                  required
                  value={selectedDay.noTradeReason || 'No Valid Setup'}
                  onChange={e => setSelectedDay({ ...selectedDay, noTradeReason: e.target.value as NoTradeReason })}
                  className="w-full px-3 py-1.5 border border-amber-300 rounded text-xs focus:ring-1 focus:ring-amber-500 focus:outline-none"
                >
                  <option value="No Valid Setup">No Valid Setup</option>
                  <option value="Didn't Trigger">Didn't Trigger</option>
                  <option value="Poor Market Conditions">Poor Market Conditions</option>
                  <option value="Risk/Daily Loss Limit Reached">Risk / Daily Loss Limit Reached</option>
                  <option value="Emotional State">Emotional State</option>
                  <option value="Personal / Schedule">Personal / Schedule</option>
                  <option value="Didn't Monitor">Didn't Monitor Market</option>
                  <option value="Chose Not To Trade">Chose Not To Trade</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Daily Journal Notes</label>
              <textarea
                rows={3}
                value={selectedDay.notes || ''}
                onChange={e => setSelectedDay({ ...selectedDay, notes: e.target.value })}
                placeholder="Log notes on market conditions, daily mindset, key lessons..."
                className="w-full px-3 py-2 border border-slate-300 rounded text-xs focus:ring-1 focus:ring-slate-900 focus:outline-none"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-3.5 py-1.5 border border-slate-300 rounded text-xs font-medium text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 bg-slate-900 text-white rounded text-xs font-medium hover:bg-slate-800"
              >
                Save Day Log
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Close Trade Modal (opened from calendar day) */}
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
