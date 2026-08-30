import React, { useState } from 'react';
import { useJournal } from '../context/JournalContext';
import { Setup, SetupChecklistItem } from '../types';
import { Modal } from '../components/common/Modal';
import { ConfirmDialog } from '../components/common/ConfirmDialog';

export const Setups: React.FC = () => {
  const { setups, saveSetup, deleteSetup } = useJournal();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSetup, setEditingSetup] = useState<Partial<Setup> | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'info' | 'checklist' | 'rules'>('info');

  const handleOpenCreate = () => {
    setEditingSetup({
      id: `setup_${Date.now()}`,
      name: '',
      description: '',
      market: 'Forex',
      instrument: 'EURUSD, GBPUSD',
      timeframes: ['15m', '1h'],
      sessions: ['London', 'New York'],
      direction: 'Both',
      entryModel: 'Breakout & Retest',
      stopLossModel: 'Swing High/Low',
      takeProfitModel: 'Fixed R:R / Liquidity Pool',
      minimumRR: 2.0,
      defaultRiskPercent: 1.0,
      rules: [],
      invalidConditions: [],
      checklist: [
        { id: `chk_1`, setupId: '', name: 'Higher Timeframe Trend Aligned', description: 'Direction matches 4h/Daily bias', required: true, order: 1, active: true, createdAt: '', updatedAt: '' },
        { id: `chk_2`, setupId: '', name: 'Key Support / Resistance Level Hit', description: 'Price reacting to HTF level', required: true, order: 2, active: true, createdAt: '', updatedAt: '' },
        { id: `chk_3`, setupId: '', name: 'Liquidity Sweep Confirmed', description: 'Asian/London High or Low swept', required: false, order: 3, active: true, createdAt: '', updatedAt: '' },
        { id: `chk_4`, setupId: '', name: 'Market Structure Shift on LTF', description: '1m/5m MS break with displacement', required: true, order: 4, active: true, createdAt: '', updatedAt: '' }
      ],
      notes: '',
      status: 'Active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    setActiveTab('info');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (setup: Setup) => {
    setEditingSetup({ ...setup, checklist: setup.checklist ? [...setup.checklist] : [] });
    setActiveTab('info');
    setIsModalOpen(true);
  };

  const handleAddChecklistItem = () => {
    if (!editingSetup) return;
    const currentList = editingSetup.checklist || [];
    const newItem: SetupChecklistItem = {
      id: `chk_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      setupId: editingSetup.id || '',
      name: '',
      description: '',
      required: false,
      order: currentList.length + 1,
      active: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    setEditingSetup({
      ...editingSetup,
      checklist: [...currentList, newItem]
    });
  };

  const handleUpdateChecklistItem = (index: number, updates: Partial<SetupChecklistItem>) => {
    if (!editingSetup || !editingSetup.checklist) return;
    const updated = [...editingSetup.checklist];
    updated[index] = { ...updated[index], ...updates };
    setEditingSetup({ ...editingSetup, checklist: updated });
  };

  const handleDeleteChecklistItem = (index: number) => {
    if (!editingSetup || !editingSetup.checklist) return;
    const updated = editingSetup.checklist.filter((_, idx) => idx !== index);
    setEditingSetup({ ...editingSetup, checklist: updated });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSetup || !editingSetup.name) return;

    const setupToSave: Setup = {
      id: editingSetup.id || `setup_${Date.now()}`,
      name: editingSetup.name,
      description: editingSetup.description || '',
      market: editingSetup.market || 'Forex',
      instrument: editingSetup.instrument || '',
      timeframes: editingSetup.timeframes || [],
      sessions: editingSetup.sessions || [],
      direction: editingSetup.direction || 'Both',
      entryModel: editingSetup.entryModel || '',
      stopLossModel: editingSetup.stopLossModel || '',
      takeProfitModel: editingSetup.takeProfitModel || '',
      minimumRR: Number(editingSetup.minimumRR) || 1.5,
      defaultRiskPercent: Number(editingSetup.defaultRiskPercent) || 1.0,
      rules: editingSetup.rules || [],
      invalidConditions: editingSetup.invalidConditions || [],
      checklist: (editingSetup.checklist || []).map((item, idx) => ({
        ...item,
        setupId: editingSetup.id || '',
        order: idx + 1
      })),
      notes: editingSetup.notes || '',
      status: editingSetup.status || 'Active',
      createdAt: editingSetup.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await saveSetup(setupToSave);
    setIsModalOpen(false);
    setEditingSetup(null);
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header Bar */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-slate-900">Trading Setups & Checklist Rules</h2>
          <p className="text-xs text-slate-500 mt-0.5">Define entry models, min R:R requirements, and mandatory setup checklists.</p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="flex items-center gap-1.5 px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded text-xs font-medium transition-colors shadow-xs"
        >
          <span>+ New Setup</span>
        </button>
      </div>

      {/* Setups Cards */}
      {setups.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-lg border border-slate-200 border-dashed space-y-3">
          <div className="text-slate-400 font-medium text-sm">No trading setups defined</div>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">Create setup definitions with custom rules and interactive checklists to audit adherence on every trade.</p>
          <button
            onClick={handleOpenCreate}
            className="px-4 py-2 bg-slate-900 text-white rounded text-xs font-medium hover:bg-slate-800 transition-colors"
          >
            Create Setup
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {setups.map(setup => {
            const checklistCount = setup.checklist ? setup.checklist.length : 0;
            const requiredCount = setup.checklist ? setup.checklist.filter(c => c.required).length : 0;

            return (
              <div key={setup.id} className="bg-white p-5 rounded-lg border border-slate-200 shadow-xs space-y-4 hover:border-slate-300 transition-all">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider bg-slate-100 text-slate-700">
                      {setup.direction} · {setup.market}
                    </span>
                    <h3 className="text-sm font-bold text-slate-900 mt-1">{setup.name}</h3>
                    <p className="text-xs text-slate-500 line-clamp-1">{setup.description || 'No description provided'}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEdit(setup)}
                      className="p-1 text-slate-400 hover:text-slate-700 rounded hover:bg-slate-100"
                      title="Edit Setup"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => setDeletingId(setup.id)}
                      className="p-1 text-slate-400 hover:text-rose-600 rounded hover:bg-rose-50"
                      title="Delete Setup"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 p-2.5 rounded border border-slate-100 font-mono">
                  <div>
                    <span className="text-slate-400 text-[10px]">Min R:R</span>
                    <div className="font-bold text-slate-800">1:{setup.minimumRR}</div>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px]">Checklist Items</span>
                    <div className="font-bold text-slate-800">{checklistCount} ({requiredCount} req)</div>
                  </div>
                </div>

                {/* Quick preview of checklist */}
                {setup.checklist && setup.checklist.length > 0 && (
                  <div className="space-y-1 text-xs">
                    <div className="text-[11px] font-semibold text-slate-500 uppercase">Key Rules:</div>
                    {setup.checklist.slice(0, 3).map((item, i) => (
                      <div key={i} className="flex items-center gap-1.5 text-slate-700 text-[11px]">
                        <span className={`w-1.5 h-1.5 rounded-full ${item.required ? 'bg-rose-500' : 'bg-slate-400'}`} />
                        <span className="truncate">{item.name}</span>
                      </div>
                    ))}
                    {setup.checklist.length > 3 && (
                      <div className="text-[10px] text-slate-400">+ {setup.checklist.length - 3} more items</div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Setup Form Modal */}
      {editingSetup && (
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title={editingSetup.id ? 'Edit Trading Setup' : 'Create Trading Setup'}
          maxWidth="2xl"
        >
          <form onSubmit={handleSave} className="space-y-5">
            {/* Tab Navigation */}
            <div className="flex border-b border-slate-200 gap-4 text-xs font-medium">
              <button
                type="button"
                onClick={() => setActiveTab('info')}
                className={`pb-2 border-b-2 transition-colors ${activeTab === 'info' ? 'border-slate-900 text-slate-900 font-bold' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
              >
                1. General Parameters
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('checklist')}
                className={`pb-2 border-b-2 transition-colors ${activeTab === 'checklist' ? 'border-slate-900 text-slate-900 font-bold' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
              >
                2. Checklist Rules ({editingSetup.checklist?.length || 0})
              </button>
            </div>

            {/* TAB 1: GENERAL INFO */}
            {activeTab === 'info' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Setup Name *</label>
                  <input
                    type="text"
                    required
                    value={editingSetup.name || ''}
                    onChange={e => setEditingSetup({ ...editingSetup, name: e.target.value })}
                    placeholder="e.g. London Liquidity Sweep"
                    className="w-full px-3 py-1.5 border border-slate-300 rounded text-xs focus:ring-1 focus:ring-slate-900 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Market</label>
                    <input
                      type="text"
                      value={editingSetup.market || ''}
                      onChange={e => setEditingSetup({ ...editingSetup, market: e.target.value })}
                      placeholder="e.g. Forex, Crypto, Indices"
                      className="w-full px-3 py-1.5 border border-slate-300 rounded text-xs focus:ring-1 focus:ring-slate-900 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Direction</label>
                    <select
                      value={editingSetup.direction || 'Both'}
                      onChange={e => setEditingSetup({ ...editingSetup, direction: e.target.value as any })}
                      className="w-full px-3 py-1.5 border border-slate-300 rounded text-xs focus:ring-1 focus:ring-slate-900 focus:outline-none"
                    >
                      <option value="Long">Long Only</option>
                      <option value="Short">Short Only</option>
                      <option value="Both">Both (Long & Short)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Minimum R:R Target *</label>
                    <input
                      type="number"
                      step="0.1"
                      required
                      value={editingSetup.minimumRR ?? 2.0}
                      onChange={e => setEditingSetup({ ...editingSetup, minimumRR: parseFloat(e.target.value) || 1.5 })}
                      className="w-full px-3 py-1.5 border border-slate-300 rounded text-xs font-mono focus:ring-1 focus:ring-slate-900 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Default Risk %</label>
                    <input
                      type="number"
                      step="0.1"
                      value={editingSetup.defaultRiskPercent ?? 1.0}
                      onChange={e => setEditingSetup({ ...editingSetup, defaultRiskPercent: parseFloat(e.target.value) || 1.0 })}
                      className="w-full px-3 py-1.5 border border-slate-300 rounded text-xs font-mono focus:ring-1 focus:ring-slate-900 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Description / Edge Summary</label>
                  <textarea
                    rows={2}
                    value={editingSetup.description || ''}
                    onChange={e => setEditingSetup({ ...editingSetup, description: e.target.value })}
                    placeholder="Briefly describe why this setup works and what market conditions favor it..."
                    className="w-full px-3 py-1.5 border border-slate-300 rounded text-xs focus:ring-1 focus:ring-slate-900 focus:outline-none"
                  />
                </div>
              </div>
            )}

            {/* TAB 2: CHECKLIST BUILDER */}
            {activeTab === 'checklist' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-slate-500">Add mandatory or optional validation rules for this setup.</p>
                  <button
                    type="button"
                    onClick={handleAddChecklistItem}
                    className="px-3 py-1 bg-slate-900 text-white rounded text-xs font-medium hover:bg-slate-800"
                  >
                    + Add Item
                  </button>
                </div>

                <div className="space-y-2 max-h-[350px] overflow-y-auto pr-1">
                  {(!editingSetup.checklist || editingSetup.checklist.length === 0) ? (
                    <div className="text-xs text-slate-400 text-center py-6 border border-dashed rounded">
                      No checklist rules added yet. Click "+ Add Item" above.
                    </div>
                  ) : (
                    editingSetup.checklist.map((item, idx) => (
                      <div key={item.id || idx} className="p-3 bg-slate-50 rounded border border-slate-200 space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-400 w-5">#{idx + 1}</span>
                          <input
                            type="text"
                            required
                            placeholder="Checklist Item Title (e.g. HTF Bias Aligned)"
                            value={item.name}
                            onChange={e => handleUpdateChecklistItem(idx, { name: e.target.value })}
                            className="flex-1 px-2.5 py-1 border border-slate-300 rounded text-xs focus:ring-1 focus:ring-slate-900 focus:outline-none"
                          />
                          <label className="flex items-center gap-1.5 text-xs text-slate-700 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={item.required}
                              onChange={e => handleUpdateChecklistItem(idx, { required: e.target.checked })}
                              className="rounded text-slate-900 focus:ring-slate-900"
                            />
                            <span className={item.required ? 'font-semibold text-rose-600' : 'text-slate-500'}>
                              Required
                            </span>
                          </label>
                          <button
                            type="button"
                            onClick={() => handleDeleteChecklistItem(idx)}
                            className="p-1 text-slate-400 hover:text-rose-600 rounded"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>

                        <input
                          type="text"
                          placeholder="Optional explanation / detail for this rule..."
                          value={item.description || ''}
                          onChange={e => handleUpdateChecklistItem(idx, { description: e.target.value })}
                          className="w-full px-2.5 py-1 border border-slate-200 rounded text-[11px] text-slate-600 focus:outline-none"
                        />
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

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
                Save Setup
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        isOpen={!!deletingId}
        onClose={() => setDeletingId(null)}
        onConfirm={() => { if (deletingId) deleteSetup(deletingId); }}
        title="Delete Setup"
        message="Are you sure you want to delete this setup? Existing historical trade snapshots will retain their original recorded checklist data."
      />
    </div>
  );
};
