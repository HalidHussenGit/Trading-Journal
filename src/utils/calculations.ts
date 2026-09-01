import { Trade, TradeExit } from '../types';

export interface PositionCalculationParams {
  entry: number;
  stopLoss: number;
  takeProfit?: number;
  riskPercent: number;
  accountBalance: number;
  direction: 'Long' | 'Short';
  pointValue?: number;
  contractSize?: number;
}

export interface PositionCalculationResult {
  stopDistance: number;
  targetDistance: number;
  riskAmount: number;
  plannedRR: number;
  positionSize: number;
  potentialLoss: number;
  potentialProfit: number;
  isValid: boolean;
  message?: string;
}

export function calculateRiskAndPositionSize(params: PositionCalculationParams): PositionCalculationResult {
  const {
    entry,
    stopLoss,
    takeProfit = 0,
    riskPercent,
    accountBalance,
    direction,
    pointValue = 1,
    contractSize = 1
  } = params;

  if (!entry || !stopLoss || entry <= 0 || stopLoss <= 0 || accountBalance <= 0 || riskPercent <= 0) {
    return {
      stopDistance: 0,
      targetDistance: 0,
      riskAmount: 0,
      plannedRR: 0,
      positionSize: 0,
      potentialLoss: 0,
      potentialProfit: 0,
      isValid: false,
      message: 'Invalid price levels or balance'
    };
  }

  const isLong = direction === 'Long';
  const stopDistance = isLong ? (entry - stopLoss) : (stopLoss - entry);
  const targetDistance = takeProfit > 0 ? (isLong ? (takeProfit - entry) : (entry - takeProfit)) : 0;

  if (stopDistance <= 0) {
    return {
      stopDistance: 0,
      targetDistance: 0,
      riskAmount: 0,
      plannedRR: 0,
      positionSize: 0,
      potentialLoss: 0,
      potentialProfit: 0,
      isValid: false,
      message: isLong ? 'Stop Loss must be below Entry for Long' : 'Stop Loss must be above Entry for Short'
    };
  }

  const riskAmount = (accountBalance * riskPercent) / 100;
  const plannedRR = targetDistance > 0 ? targetDistance / stopDistance : 0;

  // Position Sizing: RiskAmount / (StopDistance * PointValue * ContractSize)
  const positionSize = riskAmount / (stopDistance * (pointValue || 1) * (contractSize || 1));
  const potentialLoss = riskAmount;
  const potentialProfit = riskAmount * plannedRR;

  return {
    stopDistance: Number(stopDistance.toFixed(5)),
    targetDistance: Number(targetDistance.toFixed(5)),
    riskAmount: Number(riskAmount.toFixed(2)),
    plannedRR: Number(plannedRR.toFixed(2)),
    positionSize: Number(positionSize.toFixed(2)),
    potentialLoss: Number(potentialLoss.toFixed(2)),
    potentialProfit: Number(potentialProfit.toFixed(2)),
    isValid: true
  };
}

export interface MultiExitCalculationResult {
  weightedExitPrice: number;
  totalRealizedPL: number;
  totalRealizedR: number;
  remainingSizePercent: number;
  exitsCount: number;
}

export function calculateMultiExitResults(
  exits: TradeExit[],
  plannedRiskAmount: number
): MultiExitCalculationResult {
  if (!exits || exits.length === 0) {
    return {
      weightedExitPrice: 0,
      totalRealizedPL: 0,
      totalRealizedR: 0,
      remainingSizePercent: 100,
      exitsCount: 0
    };
  }

  let totalWeight = 0;
  let weightedPriceSum = 0;
  let totalPL = 0;

  exits.forEach(exit => {
    const sizePct = exit.sizePercent || 0;
    totalWeight += sizePct;
    weightedPriceSum += (exit.exitPrice || 0) * sizePct;
    totalPL += (exit.realizedPL || 0);
  });

  const weightedExitPrice = totalWeight > 0 ? weightedPriceSum / totalWeight : 0;
  const totalRealizedR = plannedRiskAmount > 0 ? totalPL / plannedRiskAmount : 0;
  const remainingSizePercent = Math.max(0, 100 - totalWeight);

  return {
    weightedExitPrice: Number(weightedExitPrice.toFixed(5)),
    totalRealizedPL: Number(totalPL.toFixed(2)),
    totalRealizedR: Number(totalRealizedR.toFixed(2)),
    remainingSizePercent: Number(remainingSizePercent.toFixed(1)),
    exitsCount: exits.length
  };
}

export interface PortfolioMetrics {
  totalTrades: number;
  closedTradesCount: number;
  winningTradesCount: number;
  losingTradesCount: number;
  breakevenTradesCount: number;
  winRate: number; // 0 - 100
  totalPL: number;
  totalR: number;
  avgR: number;
  avgWinPL: number;
  avgLossPL: number;
  largestWinPL: number;
  largestLossPL: number;
  profitFactor: number;
  expectancy: number; // Expectancy per trade ($)
  expectancyR: number; // Expectancy per trade in R
  maxDrawdownAmount: number;
  maxDrawdownPercent: number;
  currentDrawdownAmount: number;
  currentDrawdownPercent: number;
  maxConsecutiveWins: number;
  maxConsecutiveLosses: number;
  currentStreak: number; // + for wins, - for losses
  avgAdherencePercent: number;
  overallQualityScore: number; // 1-10
  violationCount: number;
  hasEnoughData: boolean;
}

export function calculatePortfolioMetrics(trades: Trade[], accountInitialBalance: number = 10000): PortfolioMetrics {
  const closedTrades = trades.filter(t => t.status === 'Closed' && !t.isArchived);

  if (closedTrades.length === 0) {
    return {
      totalTrades: trades.length,
      closedTradesCount: 0,
      winningTradesCount: 0,
      losingTradesCount: 0,
      breakevenTradesCount: 0,
      winRate: 0,
      totalPL: 0,
      totalR: 0,
      avgR: 0,
      avgWinPL: 0,
      avgLossPL: 0,
      largestWinPL: 0,
      largestLossPL: 0,
      profitFactor: 0,
      expectancy: 0,
      expectancyR: 0,
      maxDrawdownAmount: 0,
      maxDrawdownPercent: 0,
      currentDrawdownAmount: 0,
      currentDrawdownPercent: 0,
      maxConsecutiveWins: 0,
      maxConsecutiveLosses: 0,
      currentStreak: 0,
      avgAdherencePercent: 0,
      overallQualityScore: 0,
      violationCount: 0,
      hasEnoughData: false
    };
  }

  // Sort by date ascending for sequential metrics
  const sorted = [...closedTrades].sort((a, b) => new Date(`${a.date}T${a.time || '00:00'}`).getTime() - new Date(`${b.date}T${b.time || '00:00'}`).getTime());

  let winningCount = 0;
  let losingCount = 0;
  let breakevenCount = 0;

  let grossWins = 0;
  let grossLosses = 0;
  let totalPL = 0;
  let totalR = 0;
  let winningR = 0;
  let losingR = 0;
  let largestWinPL = 0;
  let largestLossPL = 0;

  let maxWinsStreak = 0;
  let maxLossesStreak = 0;
  let currentWins = 0;
  let currentLosses = 0;
  let lastOutcome: 'win' | 'loss' | 'breakeven' | null = null;

  let totalAdherence = 0;
  let totalQuality = 0;
  let qualityCount = 0;
  let totalViolations = 0;

  // Equity curve tracking
  let peakBalance = accountInitialBalance;
  let currentBalance = accountInitialBalance;
  let maxDDAmount = 0;
  let maxDDPercent = 0;

  sorted.forEach(t => {
    const pl = t.result?.netPL || 0;
    const r = t.result?.rMultiple || 0;
    totalPL += pl;
    totalR += r;

    currentBalance += pl;
    if (currentBalance > peakBalance) {
      peakBalance = currentBalance;
    }
    const ddAmount = peakBalance - currentBalance;
    const ddPercent = peakBalance > 0 ? (ddAmount / peakBalance) * 100 : 0;
    if (ddAmount > maxDDAmount) maxDDAmount = ddAmount;
    if (ddPercent > maxDDPercent) maxDDPercent = ddPercent;

    let isWin = false;
    let isLoss = false;
    const outcomeStatus = t.result?.status;

    if (outcomeStatus === 'Win' || outcomeStatus === 'Partial Win') {
      isWin = true;
    } else if (outcomeStatus === 'Loss' || outcomeStatus === 'Partial Loss') {
      isLoss = true;
    } else if (outcomeStatus === 'Breakeven') {
      isWin = false;
      isLoss = false;
    } else {
      if (pl > 0.01) isWin = true;
      else if (pl < -0.01) isLoss = true;
    }

    if (isWin) {
      winningCount++;
      grossWins += pl;
      winningR += r;
      if (pl > largestWinPL) largestWinPL = pl;

      currentWins++;
      currentLosses = 0;
      if (currentWins > maxWinsStreak) maxWinsStreak = currentWins;
      lastOutcome = 'win';
    } else if (isLoss) {
      losingCount++;
      grossLosses += Math.abs(pl);
      losingR += Math.abs(r);
      if (pl < largestLossPL) largestLossPL = pl;

      currentLosses++;
      currentWins = 0;
      if (currentLosses > maxLossesStreak) maxLossesStreak = currentLosses;
      lastOutcome = 'loss';
    } else {
      breakevenCount++;
      lastOutcome = 'breakeven';
    }

    const adherence = t.checklistSnapshot?.adherencePercent !== undefined
      ? t.checklistSnapshot.adherencePercent
      : 100;
    totalAdherence += adherence;

    if (t.qualityScores?.overall) {
      totalQuality += t.qualityScores.overall;
      qualityCount++;
    }

    if (t.violations && t.violations.length > 0) {
      totalViolations += t.violations.length;
    }
  });

  const winRate = (winningCount / closedTrades.length) * 100;
  const avgWinPL = winningCount > 0 ? grossWins / winningCount : 0;
  const avgLossPL = losingCount > 0 ? grossLosses / losingCount : 0;
  const avgR = winningCount > 0 ? winningR / winningCount : 0;

  const profitFactor = grossLosses > 0 ? grossWins / grossLosses : grossWins > 0 ? 999 : 0;

  // Expectancy = (WinRate * AvgWin) - (LossRate * AvgLoss)
  const lossRate = (losingCount / closedTrades.length);
  const expectancy = ((winRate / 100) * avgWinPL) - (lossRate * avgLossPL);
  const avgLossR = losingCount > 0 ? losingR / losingCount : 0;
  const expectancyR = ((winRate / 100) * avgR) - (lossRate * avgLossR);

  const currentDDAmount = peakBalance - currentBalance;
  const currentDDPercent = peakBalance > 0 ? (currentDDAmount / peakBalance) * 100 : 0;

  const currentStreak = lastOutcome === 'win' ? currentWins : lastOutcome === 'loss' ? -currentLosses : 0;
  const avgAdherencePercent = closedTrades.length > 0 ? totalAdherence / closedTrades.length : 0;
  const overallQualityScore = (qualityCount > 0 && totalQuality > 0) 
    ? totalQuality / qualityCount 
    : (avgAdherencePercent / 10);

  return {
    totalTrades: trades.length,
    closedTradesCount: closedTrades.length,
    winningTradesCount: winningCount,
    losingTradesCount: losingCount,
    breakevenTradesCount: breakevenCount,
    winRate: Number(winRate.toFixed(1)),
    totalPL: Number(totalPL.toFixed(2)),
    totalR: Number(totalR.toFixed(2)),
    avgR: Number(avgR.toFixed(2)),
    avgWinPL: Number(avgWinPL.toFixed(2)),
    avgLossPL: Number(avgLossPL.toFixed(2)),
    largestWinPL: Number(largestWinPL.toFixed(2)),
    largestLossPL: Number(largestLossPL.toFixed(2)),
    profitFactor: Number(profitFactor.toFixed(2)),
    expectancy: Number(expectancy.toFixed(2)),
    expectancyR: Number(expectancyR.toFixed(2)),
    maxDrawdownAmount: Number(maxDDAmount.toFixed(2)),
    maxDrawdownPercent: Number(maxDDPercent.toFixed(1)),
    currentDrawdownAmount: Number(currentDDAmount.toFixed(2)),
    currentDrawdownPercent: Number(currentDDPercent.toFixed(1)),
    maxConsecutiveWins: maxWinsStreak,
    maxConsecutiveLosses: maxLossesStreak,
    currentStreak,
    avgAdherencePercent: Number(avgAdherencePercent.toFixed(1)),
    overallQualityScore: Number(overallQualityScore.toFixed(1)),
    violationCount: totalViolations,
    hasEnoughData: closedTrades.length >= 1
  };
}

export interface AdherenceBucketMetric {
  bucketLabel: string;
  minPercent: number;
  maxPercent: number;
  tradeCount: number;
  winRate: number;
  avgR: number;
  totalR: number;
  totalPL: number;
  profitFactor: number;
}

export function calculateAdherenceBuckets(trades: Trade[]): AdherenceBucketMetric[] {
  const closed = trades.filter(t => t.status === 'Closed' && !t.isArchived);

  const buckets = [
    { label: '90 – 100%', min: 90, max: 100 },
    { label: '80 – 89%', min: 80, max: 89.9 },
    { label: '70 – 79%', min: 70, max: 79.9 },
    { label: '60 – 69%', min: 60, max: 69.9 },
    { label: '< 60%', min: 0, max: 59.9 }
  ];

  return buckets.map(b => {
    const bucketTrades = closed.filter(t => {
      const p = t.checklistSnapshot?.adherencePercent ?? 0;
      return p >= b.min && p <= b.max;
    });

    const metrics = calculatePortfolioMetrics(bucketTrades);

    return {
      bucketLabel: b.label,
      minPercent: b.min,
      maxPercent: b.max,
      tradeCount: bucketTrades.length,
      winRate: metrics.winRate,
      avgR: metrics.avgR,
      totalR: metrics.totalR,
      totalPL: metrics.totalPL,
      profitFactor: metrics.profitFactor
    };
  });
}

// =====================================================================
// TRADE RESULT HYDRATION
// Fixes trades saved with netPL=0 due to the old CloseTradeModal bug.
// Applied at data-load time — does NOT mutate the database.
// Uses price-distance / initial-risk-distance * riskAmount which is
// unit-agnostic and works for Forex, Indices, Crypto, etc.
// =====================================================================
export function rehydrateTradeResult(trade: Trade): Trade {
  const { status, actual, planned, direction, result } = trade;

  // Only fix Closed trades where netPL is exactly 0 but an exit price is recorded
  if (
    status !== 'Closed' ||
    result?.netPL !== 0 ||
    !actual?.exit ||
    actual.exit === 0
  ) {
    return trade;
  }

  const entry = planned?.entry || actual?.entry || 0;
  const sl = planned?.stopLoss || 0;
  const actualExit = actual.exit;
  const riskAmount = planned?.riskAmount || 0;

  if (!entry || !actualExit || entry === actualExit) return trade;

  const priceDiff = direction === 'Long'
    ? actualExit - entry
    : entry - actualExit;

  const initialRisk = direction === 'Long'
    ? entry - sl
    : sl - entry;

  // Need both riskAmount and a valid stop distance to recalculate meaningfully
  if (riskAmount <= 0 || initialRisk <= 0) return trade;

  const rMultiple = priceDiff / initialRisk;
  const fees = actual.fees || 0;
  const commission = actual.commission || 0;
  const swap = actual.swap || 0;
  const grossPL = rMultiple * riskAmount;
  const netPL = grossPL - fees - commission - swap;

  // Re-derive outcome label from the recalculated value
  let outcomeStatus = result?.status ?? 'Custom';
  if (netPL > 0.01) outcomeStatus = 'Win';
  else if (netPL < -0.01) outcomeStatus = 'Loss';
  else outcomeStatus = 'Breakeven';

  return {
    ...trade,
    result: {
      ...result,
      status: outcomeStatus,
      netPL: Number(netPL.toFixed(2)),
      grossPL: Number(grossPL.toFixed(2)),
      rMultiple: Number(rMultiple.toFixed(2))
    }
  };
}
