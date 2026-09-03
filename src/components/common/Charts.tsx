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
  onSelectTrade?: (tradeId: string) => void;
}

export const EquityCurveChart: React.FC<EquityCurveChartProps> = ({ data, initialBalance, height = 260, onSelectTrade }) => {
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
            onClick={() => {
              if (p.tradeId && p.tradeId !== 'init' && onSelectTrade) {
                onSelectTrade(p.tradeId);
              }
            }}
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

// 3. OUTCOMES DONUT CHART
interface OutcomesPieChartProps {
  wins: number;
  partialWins: number;
  losses: number;
  partialLosses: number;
  breakevens: number;
}

export const OutcomesPieChart: React.FC<OutcomesPieChartProps> = ({ wins, partialWins, losses, partialLosses, breakevens }) => {
  const total = wins + partialWins + losses + partialLosses + breakevens;

  if (total === 0) {
    return <div className="text-xs text-slate-400 text-center py-6">Not enough data yet</div>;
  }

  const data = [
    { label: 'Win', value: wins, color: '#059669' }, // emerald-600
    { label: 'Partial Win', value: partialWins, color: '#0d9488' }, // teal-600
    { label: 'Breakeven', value: breakevens, color: '#94a3b8' }, // slate-400
    { label: 'Partial Loss', value: partialLosses, color: '#fb7185' }, // rose-400
    { label: 'Loss', value: losses, color: '#e11d48' }, // rose-600
  ].filter(d => d.value > 0);

  // SVG dimensions
  const size = 200;
  const cx = size / 2;
  const cy = size / 2;
  const radius = 70; // For stroke-based donut
  const strokeWidth = 30;
  const circumference = 2 * Math.PI * radius;

  let currentOffset = 0;
  const segments = data.map((d, i) => {
    const fraction = d.value / total;
    const dashOffset = -currentOffset;
    currentOffset += fraction * circumference;
    
    // Add small gap by subtracting from dashArray stroke length slightly, unless it's 100%
    const gap = data.length > 1 ? 2 : 0;
    const adjustedDashArray = `${Math.max(0, fraction * circumference - gap)} ${circumference}`;

    return (
      <circle
        key={i}
        cx={cx}
        cy={cy}
        r={radius}
        fill="transparent"
        stroke={d.color}
        strokeWidth={strokeWidth}
        strokeDasharray={adjustedDashArray}
        strokeDashoffset={dashOffset}
        className="transition-all duration-500 hover:opacity-80 cursor-pointer"
        strokeLinecap="round"
        transform={`rotate(-90 ${cx} ${cy})`}
      >
        <title>{`${d.label}: ${d.value} trades (${Math.round(fraction * 100)}%)`}</title>
      </circle>
    );
  });

  return (
    <div className="flex flex-col items-center justify-center">
      <div className="w-full flex justify-between items-center mb-2">
         <div className="text-xs font-semibold text-slate-700">Trade Outcomes</div>
      </div>
      <div className="relative w-[200px] h-[200px]">
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          {/* Background circle for empty state or to give base ring */}
          <circle cx={cx} cy={cy} r={radius} fill="transparent" stroke="#f1f5f9" strokeWidth={strokeWidth} />
          {segments}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-2xl font-bold font-mono text-slate-800">{total}</span>
          <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold mt-1">Trades</span>
        </div>
      </div>
      <div className="w-full grid grid-cols-2 gap-3 mt-4">
        {data.map((d, i) => (
          <div key={i} className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: d.color }}></div>
            <div className="flex flex-col">
              <span className="text-[11px] font-semibold text-slate-700 leading-none">{d.label}</span>
              <span className="text-[10px] text-slate-500 font-mono mt-0.5">
                {d.value} ({Math.round((d.value / total) * 100)}%)
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

