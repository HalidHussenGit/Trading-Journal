import React, { useState } from 'react';
import { useJournal } from '../context/JournalContext';
import { Account, AccountType } from '../types';
import { Modal } from '../components/common/Modal';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { calculatePortfolioMetrics } from '../utils/calculations';

export const Accounts: React.FC = () => {
  const { accounts, trades, saveAccount, deleteAccount, showNotification } = useJournal();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Partial<Account> | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(accounts[0]?.id || null);

  const handleOpenCreate = () => {
    setEditingAccount({
      id: '',
      name: '',
      brokerOrFirm: '',
      accountType: 'PropFirm',
      currency: '$',
      initialBalance: 10000,
      currentBalance: 10000,
      consistencyRatePercent: 0,
      dailyLossLimitPercent: 3.0,
      maxDrawdownPercent: 6.0,
      tradingStyle: 'Day Trading',
      status: 'Active',
      notes: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (acc: Account) => {
    setEditingAccount({ ...acc });
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAccount || !editingAccount.name) return;

    try {
      const accToSave: Account = {
        id: editingAccount.id || '',
        name: editingAccount.name,
        brokerOrFirm: editingAccount.brokerOrFirm || '',
        accountType: (editingAccount.accountType as AccountType) || 'PropFirm',
        currency: editingAccount.currency || '$',
        initialBalance: Number(editingAccount.initialBalance) || 0,
        currentBalance: Number(editingAccount.currentBalance) || Number(editingAccount.initialBalance) || 0,
        consistencyRatePercent: editingAccount.consistencyRatePercent !== undefined && !isNaN(Number(editingAccount.consistencyRatePercent)) ? Number(editingAccount.consistencyRatePercent) : 0,
        dailyLossLimitPercent: editingAccount.dailyLossLimitPercent !== undefined && !isNaN(Number(editingAccount.dailyLossLimitPercent)) ? Number(editingAccount.dailyLossLimitPercent) : 3.0,
        maxDrawdownPercent: editingAccount.maxDrawdownPercent !== undefined && !isNaN(Number(editingAccount.maxDrawdownPercent)) ? Number(editingAccount.maxDrawdownPercent) : 6.0,
        tradingStyle: editingAccount.tradingStyle || '',
        status: editingAccount.status || 'Active',
        notes: editingAccount.notes || '',
        createdAt: editingAccount.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await saveAccount(accToSave);
      setIsModalOpen(false);
      setEditingAccount(null);
      showNotification('success', 'Account saved successfully!');
    } catch (err: any) {
      showNotification('error', `Error saving account: ${err.message || 'Database error'}`);
    }
  };

  const selectedAcc = accounts.find(a => a.id === selectedAccountId) || accounts[0];
  const accTrades = selectedAcc ? trades.filter(t => t.accountId === selectedAcc.id) : [];
  const metrics = selectedAcc ? calculatePortfolioMetrics(accTrades, selectedAcc.initialBalance) : null;

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header Bar */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-slate-900">Trading Accounts</h2>
          <p className="text-xs text-slate-500 mt-0.5">Manage your personal, prop firm, and funded trading accounts.</p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="flex items-center gap-1.5 px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded text-xs font-medium transition-colors shadow-xs"
        >
          <span>+ Add Account</span>
        </button>
      </div>

      {/* Account Cards Grid */}
      {accounts.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-lg border border-slate-200 border-dashed space-y-3">
          <div className="text-slate-400 font-medium text-sm">No trading accounts found</div>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">Create your first trading account to start logging trades and computing performance statistics.</p>
          <button
            onClick={handleOpenCreate}
            className="px-4 py-2 bg-slate-900 text-white rounded text-xs font-medium hover:bg-slate-800 transition-colors"
          >
            Create Account
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {accounts.map(acc => {
            const isSelected = selectedAccountId === acc.id;
            const aTrades = trades.filter(t => t.accountId === acc.id);
            const aMetrics = calculatePortfolioMetrics(aTrades, acc.initialBalance);
            const totalPL = aMetrics.totalPL;

            return (
              <div
                key={acc.id}
                onClick={() => setSelectedAccountId(acc.id)}
                className={`bg-white p-5 rounded-lg border cursor-pointer transition-all ${
                  isSelected ? 'border-slate-900 ring-1 ring-slate-900 shadow-sm' : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider bg-slate-100 text-slate-700">
                      {acc.accountType}
                    </span>
                    <h3 className="text-sm font-bold text-slate-900 mt-1">{acc.name}</h3>
                    <p className="text-xs text-slate-500">{acc.brokerOrFirm || 'Self-Managed'}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={(e) => { e.stopPropagation(); handleOpenEdit(acc); }}
                      className="p-1 text-slate-400 hover:text-slate-700 rounded hover:bg-slate-100"
                      title="Edit Account"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); setDeletingId(acc.id); }}
                      className="p-1 text-slate-400 hover:text-rose-600 rounded hover:bg-rose-50"
                      title="Delete Account"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-baseline justify-between">
                  <div>
                    <div className="text-[10px] text-slate-400 uppercase font-medium">Balance</div>
                    <div className="text-base font-bold font-mono text-slate-900">
                      {acc.currency}{acc.currentBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] text-slate-400 uppercase font-medium">P&L</div>
                    <div className={`text-sm font-bold font-mono ${totalPL >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {totalPL >= 0 ? '+' : ''}${totalPL.toLocaleString()}
                    </div>
                  </div>
                </div>

                <div className="mt-3 grid grid-cols-3 gap-2 text-center text-[11px] bg-slate-50 p-2 rounded border border-slate-100">
                  <div>
                    <div className="text-slate-400 text-[10px]">Trades</div>
                    <div className="font-semibold text-slate-800">{aMetrics.closedTradesCount}</div>
                  </div>
                  <div>
                    <div className="text-slate-400 text-[10px]">Win Rate</div>
                    <div className="font-semibold text-slate-800">{aMetrics.hasEnoughData ? `${aMetrics.winRate}%` : 'N/A'}</div>
                  </div>
                  <div>
                    <div className="text-slate-400 text-[10px]">Consistency</div>
                    <div className="font-semibold text-slate-800">{acc.consistencyRatePercent ?? 0}%</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Account Detail Drawer */}
      {selectedAcc && metrics && (
        <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-base font-bold text-slate-900">{selectedAcc.name} — Performance Detail</h3>
              <p className="text-xs text-slate-500">{selectedAcc.brokerOrFirm || 'Broker'} · Initial Balance: {selectedAcc.currency}{selectedAcc.initialBalance.toLocaleString()}</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500">Daily Loss Limit: <strong className="text-slate-800 font-mono">{selectedAcc.dailyLossLimitPercent}%</strong></span>
              <span className="text-xs text-slate-500">Max DD Limit: <strong className="text-slate-800 font-mono">{selectedAcc.maxDrawdownPercent}%</strong></span>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
            <div className="bg-slate-50 p-3 rounded border border-slate-100">
              <div className="text-slate-500 text-[11px]">Expectancy</div>
              <div className="font-bold text-slate-900 font-mono text-sm mt-0.5">${metrics.expectancy} / trade</div>
            </div>
            <div className="bg-slate-50 p-3 rounded border border-slate-100">
              <div className="text-slate-500 text-[11px]">Profit Factor</div>
              <div className="font-bold text-slate-900 font-mono text-sm mt-0.5">{metrics.profitFactor}</div>
            </div>
            <div className="bg-slate-50 p-3 rounded border border-slate-100">
              <div className="text-slate-500 text-[11px]">Avg R / Trade</div>
              <div className="font-bold text-emerald-600 font-mono text-sm mt-0.5">+{metrics.avgR}R</div>
            </div>
            <div className="bg-slate-50 p-3 rounded border border-slate-100">
              <div className="text-slate-500 text-[11px]">Max Peak Drawdown</div>
              <div className="font-bold text-rose-600 font-mono text-sm mt-0.5">-{metrics.maxDrawdownPercent}%</div>
            </div>
          </div>
        </div>
      )}

      {/* Account Modal Form */}
      {editingAccount && (
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title={editingAccount.id ? 'Edit Account' : 'Create Account'}
        >
          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Account Name *</label>
              <input
                type="text"
                required
                value={editingAccount.name || ''}
                onChange={e => setEditingAccount({ ...editingAccount, name: e.target.value })}
                placeholder="e.g. Prop Firm – $10,000"
                className="w-full px-3 py-1.5 border border-slate-300 rounded text-xs focus:ring-1 focus:ring-slate-900 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Broker or Firm</label>
                <input
                  type="text"
                  value={editingAccount.brokerOrFirm || ''}
                  onChange={e => setEditingAccount({ ...editingAccount, brokerOrFirm: e.target.value })}
                  placeholder="e.g. FTMO, OANDA, Interactive Brokers"
                  className="w-full px-3 py-1.5 border border-slate-300 rounded text-xs focus:ring-1 focus:ring-slate-900 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Account Type</label>
                <select
                  value={editingAccount.accountType || 'PropFirm'}
                  onChange={e => setEditingAccount({ ...editingAccount, accountType: e.target.value as AccountType })}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded text-xs focus:ring-1 focus:ring-slate-900 focus:outline-none"
                >
                  <option value="Personal">Personal</option>
                  <option value="PropFirm">Prop Firm</option>
                  <option value="Funded">Funded</option>
                  <option value="Demo">Demo</option>
                  <option value="Backtest">Backtest</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Initial Balance ($) *</label>
                <input
                  type="number"
                  step="any"
                  required
                  value={editingAccount.initialBalance ?? 10000}
                  onChange={e => setEditingAccount({ ...editingAccount, initialBalance: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded text-xs focus:ring-1 focus:ring-slate-900 focus:outline-none font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Consistency Rate %</label>
                <input
                  type="number"
                  step="0.1"
                  value={editingAccount.consistencyRatePercent ?? 0}
                  onChange={e => {
                    const parsed = parseFloat(e.target.value);
                    setEditingAccount({ ...editingAccount, consistencyRatePercent: isNaN(parsed) ? 0 : parsed });
                  }}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded text-xs focus:ring-1 focus:ring-slate-900 focus:outline-none font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Daily Loss Limit %</label>
                <input
                  type="number"
                  step="0.1"
                  value={editingAccount.dailyLossLimitPercent ?? 0}
                  onChange={e => {
                    const parsed = parseFloat(e.target.value);
                    setEditingAccount({ ...editingAccount, dailyLossLimitPercent: isNaN(parsed) ? 0 : parsed });
                  }}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded text-xs focus:ring-1 focus:ring-slate-900 focus:outline-none font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Max Drawdown Limit %</label>
                <input
                  type="number"
                  step="0.1"
                  value={editingAccount.maxDrawdownPercent ?? 0}
                  onChange={e => {
                    const parsed = parseFloat(e.target.value);
                    setEditingAccount({ ...editingAccount, maxDrawdownPercent: isNaN(parsed) ? 0 : parsed });
                  }}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded text-xs focus:ring-1 focus:ring-slate-900 focus:outline-none font-mono"
                />
              </div>
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
                Save Account
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        isOpen={!!deletingId}
        onClose={() => setDeletingId(null)}
        onConfirm={() => { if (deletingId) deleteAccount(deletingId); }}
        title="Delete Account"
        message="Are you sure you want to delete this trading account? This action cannot be undone."
      />
    </div>
  );
};
