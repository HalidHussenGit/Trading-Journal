function computePriceBasedRR(entry, stopLoss, exitOrTP, direction) {
  if (!entry || !stopLoss || !exitOrTP || entry <= 0 || stopLoss <= 0 || exitOrTP <= 0) return 0;
  const riskDistance    = direction === 'Long' ? entry - stopLoss    : stopLoss - entry;
  const rewardDistance  = direction === 'Long' ? exitOrTP - entry    : entry - exitOrTP;
  if (riskDistance <= 0) return 0;
  return rewardDistance / riskDistance;
}
console.log("Loss:", computePriceBasedRR(100, 90, 80, 'Long'));
console.log("Win:", computePriceBasedRR(100, 90, 120, 'Long'));
