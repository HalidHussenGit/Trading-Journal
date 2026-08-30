import React, { useState } from 'react';

export interface DataPoint {
  label: string;
  value: number;
  secondaryValue?: number;
  sublabel?: string;
}

// 1. EQUITY CURVE CHART
interface EquityCurveChartProps {
  data: { date: string; balance: number; rMultiple: number; tradeId: string }[];
  initialBalance: number;
  height?: number;
}

export const EquityCurveChart: React.FC<EquityCurveChartProps> = ({ data, initialBalance, height = 260 }) => {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  if (!data || data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-48 bg-slate-50 border border-slate-200 border-dashed rounded text-slate-400 text-xs font-medium">
        <span>Not enough data yet</span>
        <span className="text-[11px] text-slate-400 mt-1">Log closed trades to render equity curve</span>
      </div>
    );
  }

  // Prepend baseline
  const points = [{ date: 'Start', balance: initialBalance, rMultiple: 0, tradeId: 'init' }, ...data];
  const balances = points.map(p => p.balance);
  const minBal = Math.min(...balances);
  const maxBal = Math.max(...balances);
  const range = (maxBal - minBal) || 1;

  const width = 600;
  const padding = 40;
  const chartW = width - padding * 2;
  const chartH = height - padding * 2;

  const getY = (val: number) => height - padding - ((val - minBal) / range) * chartH;
  const getX = (idx: number) => padding + (idx / (points.length - 1)) * chartW;

  const svgPoints = points.map((p, i) => `${getX(i)},${getY(p.balance)}`).join(' ');
  const baselineY = getY(initialBalance);

  const hoveredPoint = hoveredIdx !== null ? points[hoveredIdx] : null;
  const latestBal = points[points.length - 1].balance;
  const isOverallProfit = latestBal >= initialBalance;

  return (
    <div className="relative w-full overflow-hidden">
      <div className="flex items-center justify-between mb-2">
        <div className="text-xs font-semibold text-slate-700">Equity Curve ($)</div>
        <div className="text-xs font-mono font-medium">
          Net: <span className={isOverallProfit ? 'text-emerald-600' : 'text-rose-600'}>
            {isOverallProfit ? '+' : ''}${(latestBal - initialBalance).toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </span>
        </div>
      </div>

      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto overflow-visible select-none">
        {/* Horizontal Grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((ratio, idx) => {
          const val = minBal + range * ratio;
          const y = getY(val);
          return (
            <g key={idx}>
              <line x1={padding} y1={y} x2={width - padding} y2={y} stroke="#e2e8f0" strokeDasharray="3 3" strokeWidth={1} />
              <text x={padding - 6} y={y + 3} textAnchor="end" className="text-[9px] fill-slate-400 font-mono">
                ${Math.round(val)}
              </text>
            </g>
          );
        })}

        {/* Baseline initial balance */}
        <line x1={padding} y1={baselineY} x2={width - padding} y2={baselineY} stroke="#94a3b8" strokeWidth={1.5} strokeDasharray="4 4" />

        {/* Area fill */}
        <polygon
          points={`${getX(0)},${baselineY} ${svgPoints} ${getX(points.length - 1)},${baselineY}`}
          className={isOverallProfit ? 'fill-emerald-500/10' : 'fill-rose-500/10'}
        />

        {/* Line */}
        <polyline
          fill="none"
          stroke={isOverallProfit ? '#16a34a' : '#dc2626'}
          strokeWidth={2.5}
          strokeLinecap="round"
          strokeLinejoin="round"
          points={svgPoints}
        />

        {/* Interactive Dots */}
        {points.map((p, i) => (
          <circle
            key={i}
            cx={getX(i)}
            cy={getY(p.balance)}
            r={hoveredIdx === i ? 5 : 2.5}
            className={`${isOverallProfit ? 'fill-emerald-600' : 'fill-rose-600'} stroke-white cursor-pointer transition-all`}
            strokeWidth={1.5}
            onMouseEnter={() => setHoveredIdx(i)}
            onMouseLeave={() => setHoveredIdx(null)}
          />
        ))}

        {/* Hover line */}
        {hoveredIdx !== null && (
          <line
            x1={getX(hoveredIdx)}
            y1={padding}
            x2={getX(hoveredIdx)}
            y2={height - padding}
            stroke="#64748b"
            strokeWidth={1}
            strokeDasharray="2 2"
          />
        )}
      </svg>

      {/* Tooltip */}
      {hoveredPoint && hoveredIdx !== null && (
        <div 
          className="absolute bg-slate-900 text-white text-[11px] px-2.5 py-1.5 rounded shadow-lg pointer-events-none z-10 font-mono"
          style={{
            left: `${(getX(hoveredIdx) / width) * 100}%`,
            top: '20px',
            transform: 'translateX(-50%)'
          }}
        >
          <div className="text-slate-400 text-[10px]">{hoveredPoint.date}</div>
          <div>Balance: ${hoveredPoint.balance.toLocaleString()}</div>
          {hoveredPoint.tradeId !== 'init' && (
            <div className={hoveredPoint.rMultiple >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
              R: {hoveredPoint.rMultiple >= 0 ? '+' : ''}{hoveredPoint.rMultiple}R
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// 2. DAILY P&L BAR CHART
interface DailyPLBarChartProps {
  data: { date: string; pl: number; r: number }[];
  height?: number;
}

export const DailyPLBarChart: React.FC<DailyPLBarChartProps> = ({ data, height = 200 }) => {
  if (!data || data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-40 bg-slate-50 border border-slate-200 border-dashed rounded text-slate-400 text-xs">
        Not enough data yet
      </div>
    );
  }

  const values = data.map(d => d.pl);
  const maxAbs = Math.max(...values.map(v => Math.abs(v)), 10);

  const width = 600;
  const padding = 35;
  const chartH = height - padding * 2;
  const barWidth = Math.max(4, Math.min(24, (width - padding * 2) / data.length - 4));
  const zeroY = height / 2;

  return (
    <div className="w-full">
      <div className="text-xs font-semibold text-slate-700 mb-2">Daily Net P&L ($)</div>
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto select-none">
        {/* Zero line */}
        <line x1={padding} y1={zeroY} x2={width - padding} y2={zeroY} stroke="#94a3b8" strokeWidth={1} />

        {data.map((d, i) => {
          const x = padding + (i / data.length) * (width - padding * 2) + barWidth / 2;
          const barH = (Math.abs(d.pl) / maxAbs) * (chartH / 2);
          const y = d.pl >= 0 ? zeroY - barH : zeroY;

          return (
            <g key={i} className="group">
              <rect
                x={x}
                y={y}
                width={barWidth}
                height={Math.max(2, barH)}
                rx={1}
                className={d.pl >= 0 ? 'fill-emerald-600 hover:fill-emerald-500' : 'fill-rose-600 hover:fill-rose-500'}
              />
              <title>{`${d.date}: ${d.pl >= 0 ? '+' : ''}$${d.pl} (${d.r >= 0 ? '+' : ''}${d.r}R)`}</title>
            </g>
          );
        })}
      </svg>
    </div>
  );
};

// 3. R-MULTIPLE DISTRIBUTION HISTOGRAM
interface RDistributionProps {
  trades: { rMultiple: number }[];
}

export const RMultipleDistributionChart: React.FC<RDistributionProps> = ({ trades }) => {
  if (!trades || trades.length === 0) {
    return <div className="text-xs text-slate-400 text-center py-6">Not enough data yet</div>;
  }

  const buckets = [
    { label: '< -2R', count: 0, color: 'bg-rose-700' },
    { label: '-2R to -1R', count: 0, color: 'bg-rose-600' },
    { label: '-1R to 0R', count: 0, color: 'bg-rose-400' },
    { label: '0R to +1R', count: 0, color: 'bg-emerald-400' },
    { label: '+1R to +2R', count: 0, color: 'bg-emerald-600' },
    { label: '> +2R', count: 0, color: 'bg-emerald-700' }
  ];

  trades.forEach(t => {
    const r = t.rMultiple || 0;
    if (r < -2) buckets[0].count++;
    else if (r >= -2 && r < -1) buckets[1].count++;
    else if (r >= -1 && r < 0) buckets[2].count++;
    else if (r >= 0 && r < 1) buckets[3].count++;
    else if (r >= 1 && r <= 2) buckets[4].count++;
    else if (r > 2) buckets[5].count++;
  });

  const maxCount = Math.max(...buckets.map(b => b.count), 1);

  return (
    <div className="space-y-2">
      <div className="text-xs font-semibold text-slate-700">R-Multiple Distribution</div>
      <div className="space-y-1.5">
        {buckets.map((b, idx) => {
          const pct = Math.round((b.count / maxCount) * 100);
          return (
            <div key={idx} className="flex items-center gap-2 text-xs">
              <span className="w-20 text-[11px] font-mono text-slate-600 text-right">{b.label}</span>
              <div className="flex-1 bg-slate-100 h-4 rounded overflow-hidden flex items-center">
                <div
                  className={`h-full ${b.color} transition-all duration-300`}
                  style={{ width: `${pct}%` }}
                />
              </div>
              <span className="w-8 text-[11px] font-mono text-slate-600">{b.count}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
