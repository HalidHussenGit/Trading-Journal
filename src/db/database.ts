import { supabase } from './supabaseClient';
import { Account, Setup, Trade, TradingDay, Tag, Settings, SetupChecklistItem } from '../types';

export interface AppDatabaseData {
  accounts: Account[];
  setups: Setup[];
  trades: Trade[];
  tradingDays: TradingDay[];
  tags: Tag[];
  settings: Settings;
}

class SupabaseDatabaseService {

  // ==========================================
  // ACCOUNTS
  // ==========================================
  async getAllAccounts(userId: string): Promise<Account[]> {
    const { data, error } = await supabase
      .from('accounts')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching accounts:', error);
      return [];
    }

    return (data || []).map(row => ({
      id: row.id,
      name: row.name,
      brokerOrFirm: row.broker_or_firm || '',
      accountType: row.account_type || 'Personal',
      currency: row.currency || '$',
      initialBalance: Number(row.initial_balance || 0),
      currentBalance: Number(row.current_balance || 0),
      defaultRiskPercent: Number(row.default_risk_percent || 1.0),
      dailyLossLimitPercent: Number(row.daily_loss_limit_percent || 0),
      maxDrawdownPercent: Number(row.max_drawdown_percent || 0),
      tradingStyle: row.trading_style || '',
      status: row.status || 'Active',
      notes: row.notes || '',
      isArchived: row.is_archived || false,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    }));
  }

  async saveAccount(account: Account, userId: string): Promise<void> {
    const row = {
      id: account.id,
      user_id: userId,
      name: account.name,
      broker_or_firm: account.brokerOrFirm,
      account_type: account.accountType,
      currency: account.currency,
      initial_balance: account.initialBalance,
      current_balance: account.currentBalance,
      default_risk_percent: account.defaultRiskPercent,
      daily_loss_limit_percent: account.dailyLossLimitPercent,
      max_drawdown_percent: account.maxDrawdownPercent,
      trading_style: account.tradingStyle,
      status: account.status,
      notes: account.notes,
      is_archived: account.isArchived || false,
      updated_at: new Date().toISOString()
    };

    const { error } = await supabase.from('accounts').upsert(row);
    if (error) {
      console.error('Error saving account:', error);
      throw error;
    }
  }

  async deleteAccount(id: string): Promise<void> {
    const { error } = await supabase.from('accounts').delete().eq('id', id);
    if (error) throw error;
  }

  // ==========================================
  // SETUPS
  // ==========================================
  async getAllSetups(userId: string): Promise<Setup[]> {
    const { data: setupsData, error: setupsErr } = await supabase
      .from('setups')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: true });

    if (setupsErr) {
      console.error('Error fetching setups:', setupsErr);
      return [];
    }

    if (!setupsData || setupsData.length === 0) return [];

    const setupIds = setupsData.map(s => s.id);
    const { data: itemsData, error: itemsErr } = await supabase
      .from('setup_checklist_items')
      .select('*')
      .in('setup_id', setupIds)
      .order('order_index', { ascending: true });

    if (itemsErr) {
      console.error('Error fetching setup checklist items:', itemsErr);
    }

    const itemsBySetupId = new Map<string, SetupChecklistItem[]>();
    (itemsData || []).forEach(row => {
      const list = itemsBySetupId.get(row.setup_id) || [];
      list.push({
        id: row.id,
        setupId: row.setup_id,
        name: row.name,
        description: row.description || '',
        required: row.required || false,
        order: row.order_index || 1,
        active: row.active !== false,
        createdAt: row.created_at,
        updatedAt: row.updated_at
      });
      itemsBySetupId.set(row.setup_id, list);
    });

    return setupsData.map(row => ({
      id: row.id,
      name: row.name,
      description: row.description || '',
      market: row.market || '',
      instrument: row.instrument || '',
      timeframes: row.timeframes || [],
      sessions: row.sessions || [],
      direction: row.direction || 'Both',
      entryModel: row.entry_model || '',
      stopLossModel: row.stop_loss_model || '',
      takeProfitModel: row.take_profit_model || '',
      minimumRR: Number(row.minimum_rr || 0),
      defaultRiskPercent: Number(row.default_risk_percent || 1.0),
      rules: row.rules || [],
      invalidConditions: row.invalid_conditions || [],
      checklist: itemsBySetupId.get(row.id) || [],
      notes: row.notes || '',
      status: row.status || 'Active',
      isArchived: row.is_archived || false,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    }));
  }

  async saveSetup(setup: Setup, userId: string): Promise<void> {
    const setupRow = {
      id: setup.id,
      user_id: userId,
      name: setup.name,
      description: setup.description,
      market: setup.market,
      instrument: setup.instrument,
      timeframes: setup.timeframes,
      sessions: setup.sessions,
      direction: setup.direction,
      entry_model: setup.entryModel,
      stop_loss_model: setup.stopLossModel,
      take_profit_model: setup.takeProfitModel,
      minimum_rr: setup.minimumRR,
      default_risk_percent: setup.defaultRiskPercent,
      rules: setup.rules,
      invalid_conditions: setup.invalidConditions,
      notes: setup.notes,
      status: setup.status,
      is_archived: setup.isArchived || false,
      updated_at: new Date().toISOString()
    };

    const { error: setupErr } = await supabase.from('setups').upsert(setupRow);
    if (setupErr) {
      console.error('Error saving setup:', setupErr);
      throw setupErr;
    }

    // Save checklist items
    await supabase.from('setup_checklist_items').delete().eq('setup_id', setup.id);

    if (setup.checklist && setup.checklist.length > 0) {
      const itemRows = setup.checklist.map((item, idx) => ({
        id: item.id,
        setup_id: setup.id,
        name: item.name,
        description: item.description,
        required: item.required,
        order_index: item.order || idx + 1,
        active: item.active
      }));

      const { error: itemErr } = await supabase.from('setup_checklist_items').insert(itemRows);
      if (itemErr) {
        console.error('Error saving setup checklist items:', itemErr);
        throw itemErr;
      }
    }
  }

  async deleteSetup(id: string): Promise<void> {
    const { error } = await supabase.from('setups').delete().eq('id', id);
    if (error) throw error;
  }

  // ==========================================
  // TRADES & CHILD TABLES
  // ==========================================
  async getAllTrades(userId: string): Promise<Trade[]> {
    const { data: tradesData, error: tradesErr } = await supabase
      .from('trades')
      .select('*')
      .eq('user_id', userId)
      .order('trade_date', { ascending: false });

    if (tradesErr) {
      console.error('Error fetching trades:', tradesErr);
      return [];
    }

    if (!tradesData || tradesData.length === 0) return [];

    const tradeIds = tradesData.map(t => t.id);

    // Fetch Exits, Screenshots, Timeline events in parallel
    const [exitsRes, screenshotsRes, timelineRes] = await Promise.all([
      supabase.from('trade_exits').select('*').in('trade_id', tradeIds).order('exit_timestamp', { ascending: true }),
      supabase.from('trade_screenshots').select('*').in('trade_id', tradeIds).order('order_index', { ascending: true }),
      supabase.from('trade_timeline_events').select('*').in('trade_id', tradeIds).order('event_timestamp', { ascending: true })
    ]);

    const exitsByTradeId = new Map<string, any[]>();
    (exitsRes.data || []).forEach(row => {
      const list = exitsByTradeId.get(row.trade_id) || [];
      list.push({
        id: row.id,
        levelName: row.level_name,
        exitPrice: Number(row.exit_price),
        sizePercent: Number(row.size_percent),
        sizeQuantity: row.size_quantity ? Number(row.size_quantity) : undefined,
        realizedPL: Number(row.realized_pl || 0),
        realizedR: Number(row.realized_r || 0),
        exitReason: row.exit_reason || '',
        timestamp: row.exit_timestamp
      });
      exitsByTradeId.set(row.trade_id, list);
    });

    const screenshotsByTradeId = new Map<string, any[]>();
    (screenshotsRes.data || []).forEach(row => {
      const list = screenshotsByTradeId.get(row.trade_id) || [];
      list.push({
        id: row.id,
        tradeId: row.trade_id,
        category: row.category || 'Other',
        caption: row.caption || '',
        storageKey: row.storage_path, // Maps storage_path to storageKey for LazyImage compatibility
        previewUrl: row.preview_url || undefined,
        order: row.order_index || 1,
        createdAt: row.created_at
      });
      screenshotsByTradeId.set(row.trade_id, list);
    });

    const timelineByTradeId = new Map<string, any[]>();
    (timelineRes.data || []).forEach(row => {
      const list = timelineByTradeId.get(row.trade_id) || [];
      list.push({
        id: row.id,
        timestamp: row.event_timestamp,
        type: row.event_type,
        description: row.description || ''
      });
      timelineByTradeId.set(row.trade_id, list);
    });

    // Re-assemble into nested Trade objects
    return tradesData.map(row => {
      return {
        id: row.id,
        accountId: row.account_id,
        setupId: row.setup_id || '',
        symbol: row.symbol,
        direction: row.direction || 'Long',
        status: row.status || 'Draft',
        date: row.trade_date,
        time: row.trade_time || '00:00',
        session: row.session || 'London',
        timeframe: row.timeframe || '15m',
        marketCondition: row.market_condition || '',
        tags: row.tags || [],
        violations: row.violations || [],

        planned: {
          entry: Number(row.planned_entry || 0),
          stopLoss: Number(row.planned_stop_loss || 0),
          takeProfit: Number(row.planned_take_profit || 0),
          riskPercent: Number(row.planned_risk_percent || 0),
          riskAmount: Number(row.planned_risk_amount || 0),
          plannedRR: Number(row.planned_rr || 0),
          positionSize: Number(row.planned_position_size || 0),
          pointValue: row.planned_point_value ? Number(row.planned_point_value) : undefined,
          contractSize: row.planned_contract_size ? Number(row.planned_contract_size) : undefined,
          leverage: row.planned_leverage ? Number(row.planned_leverage) : undefined
        },

        actual: {
          entry: Number(row.actual_entry || 0),
          exit: Number(row.actual_exit || 0),
          positionSize: Number(row.actual_position_size || 0),
          fees: Number(row.actual_fees || 0),
          commission: Number(row.actual_commission || 0),
          swap: Number(row.actual_swap || 0),
          slippage: Number(row.actual_slippage || 0),
          exitReason: row.actual_exit_reason || ''
        },

        result: {
          status: row.result_status || 'Custom',
          netPL: Number(row.result_net_pl || 0),
          grossPL: Number(row.result_gross_pl || 0),
          rMultiple: Number(row.result_r_multiple || 0),
          holdingTimeMinutes: row.result_holding_time_minutes ? Number(row.result_holding_time_minutes) : undefined
        },

        checklistSnapshot: row.checklist_snapshot || { total: 0, completed: 0, adherencePercent: 0, items: [] },

        psychology: {
          preTradeEmotion: row.psych_pre_trade_emotion || 'Neutral',
          confidenceRating: Number(row.psych_confidence_rating || 5),
          focusRating: Number(row.psych_focus_rating || 5),
          stressRating: Number(row.psych_stress_rating || 5),
          patienceRating: Number(row.psych_patience_rating || 5),
          energyRating: Number(row.psych_energy_rating || 5),
          postTradeEmotion: row.psych_post_trade_emotion || undefined
        },

        qualityScores: {
          setup: Number(row.quality_setup || 0),
          execution: Number(row.quality_execution || 0),
          riskManagement: Number(row.quality_risk_management || 0),
          psychology: Number(row.quality_psychology || 0),
          discipline: Number(row.quality_discipline || 0),
          overall: Number(row.quality_overall || 0)
        },

        journal: {
          thesis: row.journal_thesis || '',
          whatWentWell: row.journal_what_went_well || '',
          whatWentWrong: row.journal_what_went_wrong || '',
          followedPlan: row.journal_followed_plan || 'Yes',
          interferedDuringTrade: row.journal_interfered_during_trade || false,
          movedStopLoss: row.journal_moved_stop_loss || false,
          closedEarly: row.journal_closed_early || false,
          hesitatedOnEntry: row.journal_hesitated_on_entry || false,
          revengeOrOvertraded: row.journal_revenge_or_overtraded || false,
          lessonsLearned: row.journal_lessons_learned || '',
          whatToDoDifferently: row.journal_what_to_do_differently || ''
        },

        exits: exitsByTradeId.get(row.id) || [],
        screenshots: screenshotsByTradeId.get(row.id) || [],
        timeline: timelineByTradeId.get(row.id) || [],

        isArchived: row.is_archived || false,
        createdAt: row.created_at,
        updatedAt: row.updated_at
      };
    });
  }

  async saveTrade(trade: Trade, userId: string): Promise<void> {
    const tradeRow = {
      id: trade.id,
      user_id: userId,
      account_id: trade.accountId,
      setup_id: trade.setupId || null,
      symbol: trade.symbol,
      direction: trade.direction,
      status: trade.status,
      trade_date: trade.date,
      trade_time: trade.time,
      session: trade.session,
      timeframe: trade.timeframe,
      market_condition: trade.marketCondition,
      tags: trade.tags || [],
      violations: trade.violations || [],

      planned_entry: trade.planned?.entry,
      planned_stop_loss: trade.planned?.stopLoss,
      planned_take_profit: trade.planned?.takeProfit,
      planned_risk_percent: trade.planned?.riskPercent,
      planned_risk_amount: trade.planned?.riskAmount,
      planned_rr: trade.planned?.plannedRR,
      planned_position_size: trade.planned?.positionSize,
      planned_point_value: trade.planned?.pointValue,
      planned_contract_size: trade.planned?.contractSize,
      planned_leverage: trade.planned?.leverage,

      actual_entry: trade.actual?.entry,
      actual_exit: trade.actual?.exit,
      actual_position_size: trade.actual?.positionSize,
      actual_fees: trade.actual?.fees || 0,
      actual_commission: trade.actual?.commission || 0,
      actual_swap: trade.actual?.swap || 0,
      actual_slippage: trade.actual?.slippage || 0,
      actual_exit_reason: trade.actual?.exitReason || '',

      result_status: trade.result?.status,
      result_net_pl: trade.result?.netPL || 0,
      result_gross_pl: trade.result?.grossPL || 0,
      result_r_multiple: trade.result?.rMultiple || 0,
      result_holding_time_minutes: trade.result?.holdingTimeMinutes,

      checklist_snapshot: trade.checklistSnapshot || {},

      psych_pre_trade_emotion: trade.psychology?.preTradeEmotion,
      psych_confidence_rating: trade.psychology?.confidenceRating,
      psych_focus_rating: trade.psychology?.focusRating,
      psych_stress_rating: trade.psychology?.stressRating,
      psych_patience_rating: trade.psychology?.patienceRating,
      psych_energy_rating: trade.psychology?.energyRating,
      psych_post_trade_emotion: trade.psychology?.postTradeEmotion,

      quality_setup: trade.qualityScores?.setup || 0,
      quality_execution: trade.qualityScores?.execution || 0,
      quality_risk_management: trade.qualityScores?.riskManagement || 0,
      quality_psychology: trade.qualityScores?.psychology || 0,
      quality_discipline: trade.qualityScores?.discipline || 0,

      journal_thesis: trade.journal?.thesis || '',
      journal_what_went_well: trade.journal?.whatWentWell || '',
      journal_what_went_wrong: trade.journal?.whatWentWrong || '',
      journal_followed_plan: trade.journal?.followedPlan || 'Yes',
      journal_interfered_during_trade: trade.journal?.interferedDuringTrade || false,
      journal_moved_stop_loss: trade.journal?.movedStopLoss || false,
      journal_closed_early: trade.journal?.closedEarly || false,
      journal_hesitated_on_entry: trade.journal?.hesitatedOnEntry || false,
      journal_revenge_or_overtraded: trade.journal?.revengeOrOvertraded || false,
      journal_lessons_learned: trade.journal?.lessonsLearned || '',
      journal_what_to_do_differently: trade.journal?.whatToDoDifferently || '',

      is_archived: trade.isArchived || false,
      updated_at: new Date().toISOString()
    };

    const { error: tradeErr } = await supabase.from('trades').upsert(tradeRow);
    if (tradeErr) {
      console.error('Error saving trade record:', tradeErr);
      throw tradeErr;
    }

    // Save Exits
    await supabase.from('trade_exits').delete().eq('trade_id', trade.id);
    if (trade.exits && trade.exits.length > 0) {
      const exitRows = trade.exits.map(ex => ({
        id: ex.id,
        trade_id: trade.id,
        level_name: ex.levelName,
        exit_price: ex.exitPrice,
        size_percent: ex.sizePercent,
        size_quantity: ex.sizeQuantity,
        realized_pl: ex.realizedPL,
        realized_r: ex.realizedR,
        exit_reason: ex.exitReason,
        exit_timestamp: ex.timestamp || new Date().toISOString()
      }));
      await supabase.from('trade_exits').insert(exitRows);
    }

    // Save Screenshots metadata
    await supabase.from('trade_screenshots').delete().eq('trade_id', trade.id);
    if (trade.screenshots && trade.screenshots.length > 0) {
      const screenshotRows = trade.screenshots.map((s, idx) => ({
        id: s.id,
        trade_id: trade.id,
        category: s.category,
        caption: s.caption,
        storage_path: s.storageKey,
        preview_url: s.previewUrl,
        order_index: s.order || idx + 1
      }));
      await supabase.from('trade_screenshots').insert(screenshotRows);
    }

    // Save Timeline Events
    await supabase.from('trade_timeline_events').delete().eq('trade_id', trade.id);
    if (trade.timeline && trade.timeline.length > 0) {
      const timelineRows = trade.timeline.map(t => ({
        id: t.id,
        trade_id: trade.id,
        event_type: t.type,
        description: t.description,
        event_timestamp: t.timestamp || new Date().toISOString()
      }));
      await supabase.from('trade_timeline_events').insert(timelineRows);
    }
  }

  async deleteTrade(id: string): Promise<void> {
    const { error } = await supabase.from('trades').delete().eq('id', id);
    if (error) throw error;
  }

  // ==========================================
  // TRADING DAYS
  // ==========================================
  async getAllTradingDays(userId: string): Promise<TradingDay[]> {
    const { data, error } = await supabase
      .from('trading_days')
      .select('*')
      .eq('user_id', userId)
      .order('day', { ascending: false });

    if (error) {
      console.error('Error fetching trading days:', error);
      return [];
    }

    return (data || []).map(row => ({
      id: row.id,
      date: row.day,
      didTrade: row.did_trade || false,
      tradeCount: row.trade_count || 0,
      dailyPL: Number(row.daily_pl || 0),
      dailyR: Number(row.daily_r || 0),
      noTradeReason: row.no_trade_reason || undefined,
      noTradeNotes: row.no_trade_notes || undefined,
      emotionalState: row.emotional_state || undefined,
      energyRating: row.energy_rating ? Number(row.energy_rating) : undefined,
      focusRating: row.focus_rating ? Number(row.focus_rating) : undefined,
      disciplineScore: row.discipline_score ? Number(row.discipline_score) : undefined,
      notes: row.notes || '',
      createdAt: row.created_at,
      updatedAt: row.updated_at
    }));
  }

  async saveTradingDay(tradingDay: TradingDay, userId: string): Promise<void> {
    const row = {
      id: tradingDay.id,
      user_id: userId,
      day: tradingDay.date,
      did_trade: tradingDay.didTrade,
      trade_count: tradingDay.tradeCount,
      daily_pl: tradingDay.dailyPL,
      daily_r: tradingDay.dailyR,
      no_trade_reason: tradingDay.noTradeReason || null,
      no_trade_notes: tradingDay.noTradeNotes || null,
      emotional_state: tradingDay.emotionalState || null,
      energy_rating: tradingDay.energyRating || null,
      focus_rating: tradingDay.focusRating || null,
      discipline_score: tradingDay.disciplineScore || null,
      notes: tradingDay.notes || '',
      updated_at: new Date().toISOString()
    };

    const { error } = await supabase.from('trading_days').upsert(row);
    if (error) {
      console.error('Error saving trading day:', error);
      throw error;
    }
  }

  // ==========================================
  // TAGS
  // ==========================================
  async getAllTags(userId: string): Promise<Tag[]> {
    const { data, error } = await supabase
      .from('tags')
      .select('*')
      .eq('user_id', userId);

    if (error) {
      console.error('Error fetching tags:', error);
      return [];
    }

    return (data || []).map(row => ({
      id: row.id,
      name: row.name,
      color: row.color || '#64748b'
    }));
  }

  async saveTag(tag: Tag, userId: string): Promise<void> {
    const { error } = await supabase.from('tags').upsert({
      id: tag.id,
      user_id: userId,
      name: tag.name,
      color: tag.color
    });
    if (error) throw error;
  }

  async deleteTag(id: string): Promise<void> {
    const { error } = await supabase.from('tags').delete().eq('id', id);
    if (error) throw error;
  }

  // ==========================================
  // SETTINGS
  // ==========================================
  async getSettings(userId: string): Promise<Settings | null> {
    const { data, error } = await supabase
      .from('settings')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error || !data) {
      return null;
    }

    return {
      theme: 'Light',
      currency: data.currency || '$',
      dateFormat: data.date_format || 'YYYY-MM-DD',
      timezone: data.timezone || 'UTC',
      defaultAccountId: data.default_account_id || '',
      defaultSetupId: data.default_setup_id || '',
      defaultRiskPercent: Number(data.default_risk_percent || 1.0),
      normalRiskMaxPercent: Number(data.normal_risk_max_percent || 1.5),
      warningRiskMaxPercent: Number(data.warning_risk_max_percent || 3.0),
      criticalRiskMaxPercent: Number(data.critical_risk_max_percent || 5.0),
      autosaveIntervalMs: Number(data.autosave_interval_ms || 2000),
      autosaveEnabled: data.autosave_enabled !== false,
      hardChecklistEnforcement: data.hard_checklist_enforcement || false,
      hardRiskWarnings: data.hard_risk_warnings !== false,
      noTradeReminders: data.no_trade_reminders !== false,
      storagePersisted: data.storage_persisted !== false
    };
  }

  async saveSettings(settings: Settings, userId: string): Promise<void> {
    const row = {
      user_id: userId,
      theme: settings.theme,
      currency: settings.currency,
      date_format: settings.dateFormat,
      timezone: settings.timezone,
      default_account_id: settings.defaultAccountId || null,
      default_setup_id: settings.defaultSetupId || null,
      default_risk_percent: settings.defaultRiskPercent,
      normal_risk_max_percent: settings.normalRiskMaxPercent,
      warning_risk_max_percent: settings.warningRiskMaxPercent,
      critical_risk_max_percent: settings.criticalRiskMaxPercent,
      autosave_interval_ms: settings.autosaveIntervalMs,
      autosave_enabled: settings.autosaveEnabled,
      hard_checklist_enforcement: settings.hardChecklistEnforcement,
      hard_risk_warnings: settings.hardRiskWarnings,
      no_trade_reminders: settings.noTradeReminders,
      storage_persisted: settings.storagePersisted !== false,
      updated_at: new Date().toISOString()
    };

    const { error } = await supabase.from('settings').upsert(row);
    if (error) {
      console.error('Error saving settings:', error);
      throw error;
    }
  }

  // ==========================================
  // SCREENSHOT STORAGE (SUPABASE BUCKET: trade-screenshots)
  // ==========================================
  async saveScreenshotBlob(storageKey: string, fileOrBlob: File | Blob): Promise<string> {
    const filePath = `screenshots/${storageKey}`;
    const { error } = await supabase.storage
      .from('trade-screenshots')
      .upload(filePath, fileOrBlob, {
        upsert: true
      });

    if (error) {
      console.warn('Supabase storage upload error:', error.message);
      // Fallback: return data URL preview if storage bucket is not configured yet
      return new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(fileOrBlob);
      });
    }

    return filePath;
  }

  async getScreenshotUrl(storagePath: string): Promise<string | null> {
    if (storagePath.startsWith('data:')) {
      return storagePath;
    }
    const { data } = supabase.storage.from('trade-screenshots').getPublicUrl(storagePath);
    return data?.publicUrl || null;
  }

  async deleteScreenshotBlob(storagePath: string): Promise<void> {
    if (storagePath.startsWith('data:')) return;
    await supabase.storage.from('trade-screenshots').remove([storagePath]);
  }

  // ==========================================
  // FULL PORTABLE EXPORT / RESTORE SNAPSHOT
  // ==========================================
  async exportFullData(userId: string): Promise<AppDatabaseData> {
    const [accounts, setups, trades, tradingDays, tags, settings] = await Promise.all([
      this.getAllAccounts(userId),
      this.getAllSetups(userId),
      this.getAllTrades(userId),
      this.getAllTradingDays(userId),
      this.getAllTags(userId),
      this.getSettings(userId)
    ]);

    const defaultSettings: Settings = {
      theme: 'Light',
      currency: '$',
      dateFormat: 'YYYY-MM-DD',
      timezone: 'UTC',
      defaultAccountId: '',
      defaultSetupId: '',
      defaultRiskPercent: 1.0,
      normalRiskMaxPercent: 1.5,
      warningRiskMaxPercent: 3.0,
      criticalRiskMaxPercent: 5.0,
      autosaveIntervalMs: 2000,
      autosaveEnabled: true,
      hardChecklistEnforcement: false,
      hardRiskWarnings: true,
      noTradeReminders: true,
      storagePersisted: true
    };

    return {
      accounts,
      setups,
      trades,
      tradingDays,
      tags,
      settings: settings || defaultSettings
    };
  }

  async importFullData(data: AppDatabaseData, userId: string): Promise<void> {
    if (data.accounts) {
      for (const acc of data.accounts) await this.saveAccount(acc, userId);
    }
    if (data.setups) {
      for (const set of data.setups) await this.saveSetup(set, userId);
    }
    if (data.trades) {
      for (const tr of data.trades) await this.saveTrade(tr, userId);
    }
    if (data.tradingDays) {
      for (const td of data.tradingDays) await this.saveTradingDay(td, userId);
    }
    if (data.tags) {
      for (const tg of data.tags) await this.saveTag(tg, userId);
    }
    if (data.settings) {
      await this.saveSettings(data.settings, userId);
    }
  }
}

export const dbService = new SupabaseDatabaseService();
