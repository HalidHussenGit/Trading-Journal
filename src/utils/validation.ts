import { Account, Setup, Trade } from '../types';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export function validateAccount(account: Partial<Account>): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!account.name || account.name.trim() === '') {
    errors.push('Account name is required.');
  }

  if (account.initialBalance === undefined || isNaN(account.initialBalance) || account.initialBalance < 0) {
    errors.push('Initial balance must be a non-negative number.');
  }

  if (account.defaultRiskPercent !== undefined && (account.defaultRiskPercent < 0 || account.defaultRiskPercent > 100)) {
    errors.push('Default risk percent must be between 0% and 100%.');
  }

  if (account.dailyLossLimitPercent !== undefined && (account.dailyLossLimitPercent < 0 || account.dailyLossLimitPercent > 100)) {
    errors.push('Daily loss limit percent must be between 0% and 100%.');
  }

  if (account.maxDrawdownPercent !== undefined && (account.maxDrawdownPercent < 0 || account.maxDrawdownPercent > 100)) {
    errors.push('Max drawdown percent must be between 0% and 100%.');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

export function validateSetup(setup: Partial<Setup>): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!setup.name || setup.name.trim() === '') {
    errors.push('Setup name is required.');
  }

  if (setup.checklist) {
    setup.checklist.forEach((item, idx) => {
      if (!item.name || item.name.trim() === '') {
        errors.push(`Checklist item #${idx + 1} must have a title.`);
      }
    });
  } else {
    warnings.push('Setup has no checklist items. Trades using this setup will have 100% default adherence.');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

export function validateTrade(trade: Partial<Trade>, isDraft: boolean = false): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!isDraft) {
    if (!trade.accountId) {
      errors.push('An account must be selected for the trade.');
    }
    if (!trade.setupId) {
      errors.push('A trading setup must be selected for the trade.');
    }
    if (!trade.symbol || trade.symbol.trim() === '') {
      errors.push('Trade symbol (instrument) is required.');
    }
    if (!trade.date) {
      errors.push('Trade date is required.');
    }
  }

  // Price level validation
  const planned = trade.planned;
  if (planned) {
    if (planned.entry !== undefined && planned.entry <= 0) {
      errors.push('Planned Entry price must be greater than 0.');
    }
    if (planned.stopLoss !== undefined && planned.stopLoss <= 0) {
      errors.push('Planned Stop Loss price must be greater than 0.');
    }
    if (planned.takeProfit !== undefined && planned.takeProfit <= 0) {
      errors.push('Planned Take Profit price must be greater than 0.');
    }

    if (planned.entry && planned.stopLoss && trade.direction) {
      if (trade.direction === 'Long' && planned.stopLoss >= planned.entry) {
        errors.push('For a Long position, Stop Loss must be strictly below Entry price.');
      } else if (trade.direction === 'Short' && planned.stopLoss <= planned.entry) {
        errors.push('For a Short position, Stop Loss must be strictly above Entry price.');
      }

      if (planned.takeProfit) {
        if (trade.direction === 'Long' && planned.takeProfit <= planned.entry) {
          warnings.push('For a Long position, Take Profit is usually placed above Entry price.');
        } else if (trade.direction === 'Short' && planned.takeProfit >= planned.entry) {
          warnings.push('For a Short position, Take Profit is usually placed below Entry price.');
        }
      }
    }

    if (planned.riskPercent !== undefined && planned.riskPercent > 5) {
      warnings.push(`High risk warning: Risk of ${planned.riskPercent}% exceeds recommended 5% maximum.`);
    }
  }

  // Multi-Exit Size validation
  if (trade.exits && trade.exits.length > 0) {
    const totalExitSizePercent = trade.exits.reduce((acc, exit) => acc + (exit.sizePercent || 0), 0);
    if (totalExitSizePercent > 100.01) {
      errors.push(`Total partial exit position size (${totalExitSizePercent.toFixed(1)}%) exceeds 100%.`);
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

export function validateBackupData(data: any): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!data || typeof data !== 'object') {
    return { isValid: false, errors: ['Invalid backup payload: payload is not a valid JSON object.'], warnings: [] };
  }

  if (!Array.isArray(data.accounts)) {
    errors.push('Backup missing valid "accounts" dataset array.');
  }
  if (!Array.isArray(data.setups)) {
    errors.push('Backup missing valid "setups" dataset array.');
  }
  if (!Array.isArray(data.trades)) {
    errors.push('Backup missing valid "trades" dataset array.');
  }
  if (!Array.isArray(data.tradingDays)) {
    errors.push('Backup missing valid "tradingDays" dataset array.');
  }

  // ID uniqueness check
  if (Array.isArray(data.trades)) {
    const ids = new Set<string>();
    for (const t of data.trades) {
      if (!t.id) {
        errors.push('Found trade record without a valid ID.');
        break;
      }
      if (ids.has(t.id)) {
        errors.push(`Duplicate trade ID found in backup: ${t.id}`);
        break;
      }
      ids.add(t.id);
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}
