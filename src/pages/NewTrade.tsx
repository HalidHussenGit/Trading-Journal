import React, { useState, useEffect } from 'react';
import { useJournal } from '../context/JournalContext';
import { Trade, TradeExit, TradeChecklistSnapshotItem, ScreenshotCategory, TradeScreenshot } from '../types';
import { calculateRiskAndPositionSize, calculateMultiExitResults } from '../utils/calculations';
import { validateTrade } from '../utils/validation';
import { PageId } from '../components/layout/Sidebar';

interface NewTradeProps {
  onNavigate: (page: PageId, tradeId?: string) => void;
  existingTrade?: Trade | null;
}

export const NewTrade: React.FC<NewTradeProps> = ({ onNavigate, existingTrade }) => {
  const { accounts, setups, saveTrade, saveScreenshotBlob, settings, showNotification } = useJournal();

  const [activeStep, setActiveStep] = useState<number>(1);

  // Form State
  const [tradeId, setTradeId] = useState<string>(existingTrade?.id || '');
  const [accountId, setAccountId] = useState<string>(existingTrade?.accountId || accounts[0]?.id || '');
  const [setupId, setSetupId] = useState<string>(existingTrade?.setupId || setups[0]?.id || '');
  const [symbol, setSymbol] = useState<string>(existingTrade?.symbol || 'EURUSD');
  const [direction, setDirection] = useState<'Long' | 'Short'>(existingTrade?.direction || 'Long');
  const [status, setStatus] = useState<any>(existingTrade?.status || 'Draft');
  const [date, setDate] = useState<string>(existingTrade?.date || new Date().toISOString().split('T')[0]);
  const [time, setTime] = useState<string>(existingTrade?.time || new Date().toTimeString().slice(0, 5));
  const [session, setSession] = useState<any>(existingTrade?.session || 'London');
  const [timeframe, setTimeframe] = useState<string>(existingTrade?.timeframe || '15m');
  const [marketCondition, setMarketCondition] = useState<string>(existingTrade?.marketCondition || 'Trending');
  const [tagInput, setTagInput] = useState<string>('');
  const [tags, setTags] = useState<string[]>(existingTrade?.tags || []);

  // Planned & Risk Sizing State
  const [entryPrice, setEntryPrice] = useState<number>(existingTrade?.planned?.entry || 1.0850);
  const [stopLossPrice, setStopLossPrice] = useState<number>(existingTrade?.planned?.stopLoss || 1.0830);
  const [takeProfitPrice, setTakeProfitPrice] = useState<number>(existingTrade?.planned?.takeProfit || 1.0910);
  const [lotSize, setLotSize] = useState<number>(existingTrade?.planned?.lotSize || 0);
  const riskPercent = existingTrade?.planned?.riskPercent || settings.defaultRiskPercent || 1.0;

  // Partial Exits
  const [exits, setExits] = useState<TradeExit[]>(existingTrade?.exits || [
    { id: '', levelName: 'TP1', exitPrice: 1.0910, sizePercent: 100, realizedPL: 0, realizedR: 0, exitReason: 'Target Reached', timestamp: new Date().toISOString() }
  ]);

  // Checklist Snapshot State
  const [checklistItems, setChecklistItems] = useState<TradeChecklistSnapshotItem[]>([]);

  // Thesis & Single Screenshot
  const [thesis, setThesis] = useState<string>(existingTrade?.journal?.thesis || '');
  const [screenshot, setScreenshot] = useState<{ id: string; category: ScreenshotCategory; caption: string; file?: File; previewUrl?: string } | null>(
    existingTrade?.screenshots && existingTrade.screenshots.length > 0
      ? { id: existingTrade.screenshots[0].id, category: existingTrade.screenshots[0].category, caption: existingTrade.screenshots[0].caption, previewUrl: existingTrade.screenshots[0].previewUrl }
      : null
  );

  const [violations] = useState<string[]>(existingTrade?.violations || []);

  // Sync state when existingTrade changes
  useEffect(() => {
    if (existingTrade) {
      setTradeId(existingTrade.id);
      setAccountId(existingTrade.accountId);
      setSetupId(existingTrade.setupId || setups[0]?.id || '');
      setSymbol(existingTrade.symbol);
      setDirection(existingTrade.direction);
      setStatus(existingTrade.status);
      setDate(existingTrade.date);
      setTime(existingTrade.time || new Date().toTimeString().slice(0, 5));
      setSession(existingTrade.session || 'London');
      setTimeframe(existingTrade.timeframe || '15m');
      setMarketCondition(existingTrade.marketCondition || 'Trending');
      setTags(existingTrade.tags || []);
      setEntryPrice(existingTrade.planned?.entry || 1.0850);
      setStopLossPrice(existingTrade.planned?.stopLoss || 1.0830);
      setTakeProfitPrice(existingTrade.planned?.takeProfit || 1.0910);
      setLotSize(existingTrade.planned?.lotSize || 0);
      setExits(existingTrade.exits && existingTrade.exits.length > 0 ? existingTrade.exits : [
        { id: '', levelName: 'TP1', exitPrice: existingTrade.planned?.takeProfit || 1.0910, sizePercent: 100, realizedPL: 0, realizedR: 0, exitReason: 'Target Reached', timestamp: new Date().toISOString() }
      ]);
      if (existingTrade.checklistSnapshot?.items) {
        setChecklistItems(existingTrade.checklistSnapshot.items);
      }
      setThesis(existingTrade.journal?.thesis || '');
      if (existingTrade.screenshots && existingTrade.screenshots.length > 0) {
        setScreenshot({
          id: existingTrade.screenshots[0].id,
          category: existingTrade.screenshots[0].category,
          caption: existingTrade.screenshots[0].caption,
          previewUrl: existingTrade.screenshots[0].previewUrl
        });
      } else {
        setScreenshot(null);
      }
    }
  }, [existingTrade]);

  // Sync checklist from setup when setupId changes and not editing an existing snapshot
  useEffect(() => {
    if (existingTrade && existingTrade.checklistSnapshot && existingTrade.setupId === setupId) {
      setChecklistItems(existingTrade.checklistSnapshot.items || []);
    } else {
      const selectedSetup = setups.find(s => s.id === setupId);
      if (selectedSetup && selectedSetup.checklist) {
        setChecklistItems(selectedSetup.checklist.map(item => ({
          id: item.id,
          name: item.name,
          description: item.description,
          required: item.required,
          checked: true,
          order: item.order
        })));
      }
    }
  }, [setupId, setups, existingTrade]);

  // Account balance lookup
  const selectedAccount = accounts.find(a => a.id === accountId);
  const accountBalance = selectedAccount ? selectedAccount.currentBalance : 10000;

  // Compute Position & Risk metrics live
  const riskCalc = calculateRiskAndPositionSize({
    entry: entryPrice,
    stopLoss: stopLossPrice,
    takeProfit: takeProfitPrice,
    riskPercent,
    accountBalance,
    direction
  });

  // Compute Multi-Exit weighted metrics live
  const exitCalc = calculateMultiExitResults(exits, riskCalc.riskAmount);

  // Calculate checklist adherence %
  const completedChecklistCount = checklistItems.filter(i => i.checked).length;
  const totalChecklistCount = checklistItems.length;
  const adherencePercent = totalChecklistCount > 0 ? Math.round((completedChecklistCount / totalChecklistCount) * 100) : 100;
  const missingRequired = checklistItems.filter(i => i.required && !i.checked);

  // Add Tag handler
  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput('');
    }
  };

  // Single Screenshot Upload handler
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const previewUrl = URL.createObjectURL(file);
      const uniqueId = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
      setScreenshot({
        id: uniqueId,
        category: 'Before Entry',
        caption: file.name,
        file,
        previewUrl
      });
    }
  };

  const handleSaveTrade = async () => {
    const savedScreenshots: TradeScreenshot[] = [];
    if (screenshot) {
      let storageKey = screenshot.id;
      if (screenshot.file) {
        const savedPath = await saveScreenshotBlob(screenshot.id, screenshot.file);
        storageKey = savedPath;
      }
      savedScreenshots.push({
        id: screenshot.id,
        tradeId: tradeId || '',
        category: screenshot.category,
        caption: screenshot.caption,
        storageKey,
        previewUrl: screenshot.previewUrl,
        order: 1,
        createdAt: new Date().toISOString()
      });
    }

    const newTradeRecord: Trade = {
      id: tradeId,
      accountId,
      setupId,
      symbol: symbol.toUpperCase().trim(),
      direction,
      status: existingTrade?.status || status || 'Draft',
      date,
      time,
      session,
      timeframe,
      marketCondition,
      tags,

      planned: {
        entry: entryPrice,
        stopLoss: stopLossPrice,
        takeProfit: takeProfitPrice,
        riskPercent,
        riskAmount: riskCalc.riskAmount,
        plannedRR: riskCalc.plannedRR,
        positionSize: riskCalc.positionSize,
        lotSize: lotSize > 0 ? lotSize : undefined
      },

      actual: existingTrade?.actual || {
        entry: entryPrice,
        exit: 0,
        positionSize: riskCalc.positionSize,
        lotSize: lotSize > 0 ? lotSize : undefined,
        fees: 0,
        commission: 0,
        swap: 0,
        slippage: 0,
        exitReason: ''
      },

      exits,

      result: existingTrade?.result || {
        status: 'Custom',
        netPL: 0,
        grossPL: 0,
        rMultiple: 0
      },

      checklistSnapshot: {
        total: totalChecklistCount,
        completed: completedChecklistCount,
        adherencePercent,
        items: checklistItems
      },

      psychology: existingTrade?.psychology || {
        preTradeEmotion: 'Calm',
        confidenceRating: 8,
        focusRating: 8,
        stressRating: 3,
        patienceRating: 8,
        energyRating: 8
      },

      qualityScores: existingTrade?.qualityScores || {
        setup: 8,
        execution: 8,
        riskManagement: 8,
        psychology: 8,
        discipline: 8,
        overall: 8
      },

      violations,
      screenshots: savedScreenshots.length > 0 ? savedScreenshots : (existingTrade?.screenshots || []),
      journal: {
        thesis,
        whatWentWell: existingTrade?.journal?.whatWentWell || '',
        whatWentWrong: existingTrade?.journal?.whatWentWrong || '',
        followedPlan: (missingRequired.length === 0 ? 'Yes' : 'Partially') as any,
        interferedDuringTrade: existingTrade?.journal?.interferedDuringTrade ?? false,
        movedStopLoss: existingTrade?.journal?.movedStopLoss ?? false,
        closedEarly: existingTrade?.journal?.closedEarly ?? false,
        hesitatedOnEntry: existingTrade?.journal?.hesitatedOnEntry ?? false,
        revengeOrOvertraded: existingTrade?.journal?.revengeOrOvertraded ?? false,
        lessonsLearned: existingTrade?.journal?.lessonsLearned || '',
        whatToDoDifferently: existingTrade?.journal?.whatToDoDifferently || ''
      },

      timeline: existingTrade?.timeline || [
        { id: '', timestamp: new Date().toISOString(), type: 'Created', description: 'Trade logged as Draft' }
      ],

      createdAt: existingTrade?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const validation = validateTrade(newTradeRecord, true);
    if (!validation.isValid) {
      showNotification('error', `Validation error: ${validation.errors.join(' ')}`);
      return;
    }

    await saveTrade(newTradeRecord);
    if (existingTrade) {
      onNavigate('trade-detail', tradeId);
    } else {
      onNavigate('trades');
    }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Wizard Steps Header */}
      <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs flex items-center justify-between overflow-x-auto">
        {[
          { step: 1, name: '1. Trade Info' },
          { step: 2, name: '2. Setup Checklist' },
          { step: 3, name: '3. Risk & Sizing' },
          { step: 4, name: '4. Partial Exits' },
          { step: 5, name: '5. Review & Save' }
        ].map(s => (
          <button
            key={s.step}
            onClick={() => setActiveStep(s.step)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold whitespace-nowrap transition-colors ${
              activeStep === s.step ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-500 hover:bg-slate-100'
            }`}
          >
            <span>{s.name}</span>
          </button>
        ))}
      </div>

      {/* STEP 1: TRADE INFO */}
      {activeStep === 1 && (
        <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-xs space-y-6">
          <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">Trade Identification & Details</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Trading Account *</label>
              <select
                value={accountId}
                onChange={e => setAccountId(e.target.value)}
                className="w-full px-3 py-1.5 border border-slate-300 rounded text-xs focus:ring-1 focus:ring-slate-900 focus:outline-none"
              >
                {accounts.map(a => (
                  <option key={a.id} value={a.id}>{a.name} ({a.currency}{a.currentBalance.toLocaleString()})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Trading Setup *</label>
              <select
                value={setupId}
                onChange={e => setSetupId(e.target.value)}
                className="w-full px-3 py-1.5 border border-slate-300 rounded text-xs focus:ring-1 focus:ring-slate-900 focus:outline-none"
              >
                {setups.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Symbol / Pair *</label>
              <input
                type="text"
                required
                value={symbol}
                onChange={e => setSymbol(e.target.value)}
                placeholder="e.g. EURUSD, NQ1!, BTCUSD"
                className="w-full px-3 py-1.5 border border-slate-300 rounded text-xs font-mono uppercase focus:ring-1 focus:ring-slate-900 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Direction</label>
              <select
                value={direction}
                onChange={e => setDirection(e.target.value as any)}
                className="w-full px-3 py-1.5 border border-slate-300 rounded text-xs focus:ring-1 focus:ring-slate-900 focus:outline-none"
              >
                <option value="Long">Long (Buy)</option>
                <option value="Short">Short (Sell)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Trade Status</label>
              <select
                value={status}
                onChange={e => setStatus(e.target.value as any)}
                className="w-full px-3 py-1.5 border border-slate-300 rounded text-xs focus:ring-1 focus:ring-slate-900 focus:outline-none"
              >
                <option value="Draft">Draft</option>
                <option value="Open">Open</option>
                <option value="Closed">Closed</option>
                <option value="Planned">Planned</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Date</label>
              <input
                type="date"
                value={date}
                onChange={e => setDate(e.target.value)}
                className="w-full px-3 py-1.5 border border-slate-300 rounded text-xs focus:ring-1 focus:ring-slate-900 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Time</label>
              <input
                type="time"
                value={time}
                onChange={e => setTime(e.target.value)}
                className="w-full px-3 py-1.5 border border-slate-300 rounded text-xs focus:ring-1 focus:ring-slate-900 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Session</label>
              <select
                value={session}
                onChange={e => setSession(e.target.value as any)}
                className="w-full px-3 py-1.5 border border-slate-300 rounded text-xs focus:ring-1 focus:ring-slate-900 focus:outline-none"
              >
                <option value="Asian">Asian</option>
                <option value="London">London</option>
                <option value="New York">New York</option>
                <option value="Overlap">Overlap</option>
                <option value="Off-Hours">Off-Hours</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Timeframe</label>
              <select
                value={timeframe}
                onChange={e => setTimeframe(e.target.value)}
                className="w-full px-3 py-1.5 border border-slate-300 rounded text-xs focus:ring-1 focus:ring-slate-900 focus:outline-none"
              >
                <option value="1m">1m</option>
                <option value="5m">5m</option>
                <option value="15m">15m</option>
                <option value="1h">1h</option>
                <option value="4h">4h</option>
                <option value="1D">1D</option>
              </select>
            </div>
          </div>



          {/* Trade Thesis */}
          <div className="border-t border-slate-100 pt-4">
            <label className="block text-xs font-semibold text-slate-700 mb-1">Trade Thesis ("Why did I take this trade?")</label>
            <textarea
              rows={3}
              value={thesis}
              onChange={e => setThesis(e.target.value)}
              placeholder="Detail market structure, confluence factors, key levels..."
              className="w-full px-3 py-2 border border-slate-300 rounded text-xs focus:ring-1 focus:ring-slate-900 focus:outline-none"
            />
          </div>

          {/* Single Screenshot Upload */}
          <div className="border-t border-slate-100 pt-4">
            <label className="block text-xs font-semibold text-slate-700 mb-2">Trade Chart Screenshot</label>
            
            {screenshot ? (
              <div className="relative max-w-sm bg-slate-50 p-2 rounded border border-slate-200 text-xs space-y-1">
                <img src={screenshot.previewUrl} alt="Chart Screenshot" className="w-full h-40 object-cover rounded" />
                <div className="text-[10px] font-bold text-slate-700 truncate">{screenshot.caption}</div>
                <button
                  type="button"
                  onClick={() => setScreenshot(null)}
                  className="absolute top-3 right-3 bg-slate-900/80 hover:bg-rose-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs transition-colors"
                >
                  ×
                </button>
              </div>
            ) : (
              <label className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-medium rounded cursor-pointer transition-colors border border-slate-200">
                <svg className="w-4 h-4 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span>Upload Chart Screenshot</span>
                <input type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
              </label>
            )}
          </div>
        </div>
      )}

      {/* STEP 2: SETUP CHECKLIST SNAPSHOT */}
      {activeStep === 2 && (
        <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Setup Validation Checklist</h3>
              <p className="text-xs text-slate-500">Record rule adherence at trade time. Stored as an immutable historical snapshot.</p>
            </div>
            <div className="text-right">
              <div className="text-sm font-bold font-mono text-slate-900">{completedChecklistCount}/{totalChecklistCount} Checked</div>
              <div className={`text-xs font-mono font-semibold ${adherencePercent >= 80 ? 'text-emerald-600' : adherencePercent >= 60 ? 'text-amber-600' : 'text-rose-600'}`}>
                {adherencePercent}% Adherence
              </div>
            </div>
          </div>

          {missingRequired.length > 0 && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded text-amber-800 text-xs flex items-center gap-2">
              <svg className="w-4 h-4 shrink-0 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <span>Caution: {missingRequired.length} mandatory required checklist rules are unchecked.</span>
            </div>
          )}

          <div className="space-y-2">
            {checklistItems.map((item, idx) => (
              <label
                key={item.id || idx}
                className={`flex items-start gap-3 p-3 rounded border cursor-pointer transition-all ${
                  item.checked ? 'bg-emerald-50/40 border-emerald-200' : 'bg-slate-50 border-slate-200'
                }`}
              >
                <input
                  type="checkbox"
                  checked={item.checked}
                  onChange={e => {
                    const updated = [...checklistItems];
                    updated[idx].checked = e.target.checked;
                    setChecklistItems(updated);
                  }}
                  className="mt-0.5 rounded text-emerald-600 focus:ring-emerald-500"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2 text-xs font-semibold text-slate-800">
                    <span>{item.name}</span>
                    {item.required && (
                      <span className="px-1.5 py-0.2 rounded text-[10px] uppercase tracking-wider bg-rose-100 text-rose-700 font-bold">
                        Required
                      </span>
                    )}
                  </div>
                  {item.description && <p className="text-[11px] text-slate-500 mt-0.5">{item.description}</p>}
                </div>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* STEP 3: RISK & POSITION SIZING CALCULATOR */}
      {activeStep === 3 && (
        <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">Trade Plan & Position Sizing</h3>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Planned Entry *</label>
              <input
                type="number"
                step="any"
                required
                value={entryPrice}
                onChange={e => setEntryPrice(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-1.5 border border-slate-300 rounded text-xs font-mono focus:ring-1 focus:ring-slate-900 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Planned Stop Loss *</label>
              <input
                type="number"
                step="any"
                required
                value={stopLossPrice}
                onChange={e => setStopLossPrice(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-1.5 border border-slate-300 rounded text-xs font-mono focus:ring-1 focus:ring-slate-900 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Target Take Profit *</label>
              <input
                type="number"
                step="any"
                required
                value={takeProfitPrice}
                onChange={e => setTakeProfitPrice(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-1.5 border border-slate-300 rounded text-xs font-mono focus:ring-1 focus:ring-slate-900 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Lot Size</label>
              <input
                type="number"
                step="any"
                value={lotSize || ''}
                onChange={e => setLotSize(parseFloat(e.target.value) || 0)}
                placeholder="e.g. 1.0"
                className="w-full px-3 py-1.5 border border-slate-300 rounded text-xs font-mono focus:ring-1 focus:ring-slate-900 focus:outline-none"
              />
            </div>
          </div>

          {/* Computed Risk Output Box */}
          <div className="bg-slate-900 text-white p-4 rounded-lg space-y-3 font-mono">
            <div className="text-xs text-slate-400 font-sans uppercase font-bold tracking-wider">Calculated Position Sizing & Risk Parameters</div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
              <div>
                <div className="text-slate-400 text-[10px]">Stop Distance</div>
                <div className="text-sm font-bold">{riskCalc.stopDistance} pips/pts</div>
              </div>
              <div>
                <div className="text-slate-400 text-[10px]">Planned R:R</div>
                <div className="text-sm font-bold text-emerald-400">1 : {riskCalc.plannedRR}</div>
              </div>
              <div>
                <div className="text-slate-400 text-[10px]">Risk Amount ($)</div>
                <div className="text-sm font-bold text-rose-400">${riskCalc.riskAmount}</div>
              </div>
              <div>
                <div className="text-slate-400 text-[10px]">Position Size</div>
                <div className="text-sm font-bold text-emerald-400">{riskCalc.positionSize} units</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* STEP 4: MULTI-EXIT TARGETS */}
      {activeStep === 4 && (
        <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Multiple Take-Profits & Partial Exits</h3>
              <p className="text-xs text-slate-500">Configure partial exit levels and compute weighted exit prices.</p>
            </div>
            <button
              type="button"
              onClick={() => {
                const newExit: TradeExit = {
                  id: '',
                  levelName: `TP${exits.length + 1}`,
                  exitPrice: takeProfitPrice,
                  sizePercent: 50,
                  realizedPL: 0,
                  realizedR: 0,
                  exitReason: 'Partial Profit',
                  timestamp: new Date().toISOString()
                };
                setExits([...exits, newExit]);
              }}
              className="px-3 py-1 bg-slate-900 text-white rounded text-xs font-medium hover:bg-slate-800"
            >
              + Add Exit Level
            </button>
          </div>

          <div className="space-y-3">
            {exits.map((ex, idx) => (
              <div key={ex.id || idx} className="grid grid-cols-6 gap-2 items-center p-3 bg-slate-50 rounded border border-slate-200 text-xs">
                <div className="col-span-2">
                  <label className="text-[10px] text-slate-500 block font-medium">Level Name</label>
                  <input
                    type="text"
                    value={ex.levelName}
                    onChange={e => {
                      const updated = [...exits];
                      updated[idx].levelName = e.target.value;
                      setExits(updated);
                    }}
                    className="w-full px-2 py-1 border rounded text-xs font-mono"
                  />
                </div>
                <div className="col-span-3">
                  <label className="text-[10px] text-slate-500 block font-medium">Exit Price</label>
                  <input
                    type="number"
                    step="any"
                    value={ex.exitPrice}
                    onChange={e => {
                      const updated = [...exits];
                      updated[idx].exitPrice = parseFloat(e.target.value) || 0;
                      setExits(updated);
                    }}
                    className="w-full px-2 py-1 border rounded text-xs font-mono"
                  />
                </div>
                <div className="col-span-1 text-right">
                  <button
                    type="button"
                    onClick={() => setExits(exits.filter((_, i) => i !== idx))}
                    className="text-slate-400 hover:text-rose-600 p-1"
                  >
                    ×
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="p-3 bg-slate-100 rounded border border-slate-200 flex items-center justify-between text-xs font-mono">
            <div>Weighted Exit Price: <strong className="text-slate-900">{exitCalc.weightedExitPrice}</strong></div>
            <div>Total R: <strong className="text-slate-900">{exitCalc.totalRealizedR}R</strong></div>
          </div>
        </div>
      )}

      {/* STEP 5: REVIEW & SAVE */}
      {activeStep === 5 && (
        <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-xs space-y-6">
          <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">
            {existingTrade ? 'Review & Update Trade Details' : 'Final Review & Confirmation'}
          </h3>
          
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-xs bg-slate-50 p-4 rounded border border-slate-200">
            <div>
              <div className="text-slate-400">Symbol / Direction</div>
              <div className="font-bold text-slate-900 font-mono">{symbol} ({direction})</div>
            </div>
            <div>
              <div className="text-slate-400">Adherence</div>
              <div className="font-bold text-slate-900 font-mono">{adherencePercent}% ({completedChecklistCount}/{totalChecklistCount})</div>
            </div>
            <div>
              <div className="text-slate-400">Planned R:R</div>
              <div className="font-bold text-emerald-600 font-mono">1 : {riskCalc.plannedRR}</div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => existingTrade ? onNavigate('trade-detail', existingTrade.id) : onNavigate('trades')}
              className="px-4 py-2 border border-slate-300 text-slate-700 rounded text-xs font-medium hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSaveTrade}
              className="px-5 py-2 bg-slate-900 text-white rounded text-xs font-medium hover:bg-slate-800 shadow-xs"
            >
              {existingTrade ? 'Update Trade →' : 'Save as Draft →'}
            </button>
          </div>
        </div>
      )}

      {/* Navigation Footer */}
      <div className="flex items-center justify-between pt-2">
        <button
          type="button"
          disabled={activeStep === 1}
          onClick={() => setActiveStep(prev => Math.max(1, prev - 1))}
          className="px-4 py-2 border border-slate-300 text-slate-700 rounded text-xs font-medium hover:bg-slate-50 disabled:opacity-50"
        >
          Previous Step
        </button>
        <button
          type="button"
          disabled={activeStep === 5}
          onClick={() => setActiveStep(prev => Math.min(5, prev + 1))}
          className="px-4 py-2 bg-slate-900 text-white rounded text-xs font-medium hover:bg-slate-800 disabled:opacity-50"
        >
          Next Step
        </button>
      </div>
    </div>
  );
};

export default NewTrade;
