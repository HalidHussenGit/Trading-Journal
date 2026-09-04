import React, { useState } from 'react';
import { useJournal } from '../context/JournalContext';
import { Settings as SettingsType } from '../types';

export const SettingsPage: React.FC = () => {
  const { settings, saveSettings, storageStatus, logout } = useJournal();
  const [formSettings, setFormSettings] = useState<SettingsType>({ ...settings });

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    await saveSettings(formSettings);
  };

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-xs space-y-6">
        <div className="border-b border-slate-100 pb-3">
          <h2 className="text-base font-bold text-slate-900">Application Settings & Storage Durability</h2>
          <p className="text-xs text-slate-500 mt-0.5">Configure default trading options, risk alerts, and verify local storage persistence.</p>
        </div>

        {/* Local Storage Durability Banner */}
        <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-900">Browser Storage Durability</span>
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                storageStatus?.isPersisted ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
              }`}>
                {storageStatus?.isPersisted ? 'PERSISTED (Eviction Protected)' : 'DEFAULT (Standard)'}
              </span>
            </div>
            <p className="text-xs text-slate-500">
              IndexedDB Storage Usage: <strong className="text-slate-800 font-mono">{storageStatus?.usageMB || '0.00'} MB</strong> / {storageStatus?.quotaMB || 'Unlimited'} MB quota allocated.
            </p>
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-6">
          {/* General Preferences */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-slate-900 uppercase">General Preferences</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Base Currency Symbol</label>
                <input
                  type="text"
                  value={formSettings.currency}
                  onChange={e => setFormSettings({ ...formSettings, currency: e.target.value })}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded text-xs font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Default Risk %</label>
                <input
                  type="number"
                  step="0.1"
                  value={formSettings.defaultRiskPercent}
                  onChange={e => {
                    const parsed = parseFloat(e.target.value);
                    setFormSettings({ ...formSettings, defaultRiskPercent: isNaN(parsed) ? 0 : parsed });
                  }}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded text-xs font-mono"
                />
              </div>
            </div>
          </div>

          {/* Risk Thresholds */}
          <div className="space-y-4 border-t border-slate-100 pt-4">
            <h3 className="text-xs font-bold text-slate-900 uppercase">Risk Threshold Banners</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Normal Risk Max %</label>
                <input
                  type="number"
                  step="0.1"
                  value={formSettings.normalRiskMaxPercent}
                  onChange={e => setFormSettings({ ...formSettings, normalRiskMaxPercent: parseFloat(e.target.value) || 1.5 })}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded text-xs font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Warning Risk Max %</label>
                <input
                  type="number"
                  step="0.1"
                  value={formSettings.warningRiskMaxPercent}
                  onChange={e => {
                    const parsed = parseFloat(e.target.value);
                    setFormSettings({ ...formSettings, warningRiskMaxPercent: isNaN(parsed) ? 0 : parsed });
                  }}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded text-xs font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Critical Risk Max %</label>
                <input
                  type="number"
                  step="0.1"
                  value={formSettings.criticalRiskMaxPercent}
                  onChange={e => setFormSettings({ ...formSettings, criticalRiskMaxPercent: parseFloat(e.target.value) || 5.0 })}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded text-xs font-mono"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-slate-100">
            <button
              type="submit"
              className="px-4 py-2 bg-slate-900 text-white text-xs font-medium rounded hover:bg-slate-800"
            >
              Save Preferences
            </button>
          </div>
        </form>

        {/* Account & Session */}
        <div className="space-y-4 pt-6 border-t border-slate-200">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Account & Session</h3>
          <div className="group relative overflow-hidden flex items-center justify-between p-4 rounded-xl border border-slate-100 bg-white hover:border-rose-100 hover:shadow-sm transition-all duration-300">
            {/* Subtle background glow effect on hover */}
            <div className="absolute inset-0 bg-gradient-to-r from-rose-50/0 via-rose-50/0 to-rose-50/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
            
            <div className="relative z-10">
              <p className="text-sm font-semibold text-slate-900">Sign Out</p>
              <p className="text-xs text-slate-500 mt-0.5">End your current session on this device.</p>
            </div>
            <button
              type="button"
              onClick={logout}
              className="relative z-10 flex items-center gap-2 px-4 py-2 bg-white text-rose-600 border border-rose-200 text-xs font-semibold rounded-lg hover:bg-rose-50 hover:border-rose-300 hover:text-rose-700 transition-all shadow-sm active:scale-95"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
