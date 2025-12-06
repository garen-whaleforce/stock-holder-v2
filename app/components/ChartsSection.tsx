'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
  Legend,
  Treemap,
} from 'recharts';
import { HoldingWithMetrics } from '@/lib/types';
import { formatCurrency, formatPercent } from '@/lib/portfolio';

interface ChartsSectionProps {
  holdings: HoldingWithMetrics[];
  isLoading: boolean;
  isMixed?: boolean;
}

// 彩色調色盤
const COLORS = {
  profit: '#10b981',
  loss: '#ef4444',
  primary: ['#8b5cf6', '#6366f1', '#3b82f6', '#06b6d4', '#10b981', '#f59e0b', '#f472b6', '#a78bfa'],
  us: '#3b82f6',
  tw: '#f59e0b',
};

const TREEMAP_COLORS = [
  '#8b5cf6', '#6366f1', '#3b82f6', '#06b6d4', '#10b981',
  '#84cc16', '#f59e0b', '#f472b6', '#ec4899', '#a78bfa',
];

export default function ChartsSection({ holdings, isLoading, isMixed = false }: ChartsSectionProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="card p-5">
            <div className="shimmer h-6 rounded w-32 mb-4"></div>
            <div className="shimmer h-64 rounded"></div>
          </div>
        ))}
      </div>
    );
  }

  if (holdings.length === 0 || holdings.every((h) => h.currentPrice === 0)) {
    return null;
  }

  // 1. 損益比較數據
  const pnlData = holdings
    .filter((h) => h.currentPrice > 0)
    .map((h) => ({
      symbol: h.symbol,
      pnl: (h.currentPrice - h.costBasis) * h.quantity,
      isProfit: (h.currentPrice - h.costBasis) >= 0,
    }))
    .sort((a, b) => b.pnl - a.pnl);

  // 2. 報酬率排名數據
  const returnData = holdings
    .filter((h) => h.currentPrice > 0)
    .map((h) => ({
      symbol: h.symbol,
      returnRate: h.unrealizedPnLPercent * 100,
      isProfit: h.unrealizedPnLPercent >= 0,
    }))
    .sort((a, b) => b.returnRate - a.returnRate);

  // 3. Treemap 數據
  const treemapData = holdings
    .filter((h) => h.marketValue > 0)
    .map((h, index) => ({
      name: h.symbol,
      size: h.marketValue,
      weight: h.weight,
      color: TREEMAP_COLORS[index % TREEMAP_COLORS.length],
    }));

  // 4. 成本 vs 市值數據
  const costValueData = holdings
    .filter((h) => h.currentPrice > 0)
    .sort((a, b) => b.marketValue - a.marketValue)
    .slice(0, 8)
    .map((h) => ({
      symbol: h.symbol,
      cost: h.costBasis * h.quantity,
      value: h.originalMarketValue || h.marketValue,
    }));

  // 5. 市場分布數據（僅 MIXED 帳戶）
  const marketData = isMixed ? (() => {
    const usHoldings = holdings.filter((h) => h.market === 'US');
    const twHoldings = holdings.filter((h) => h.market === 'TW');
    const usValue = usHoldings.reduce((sum, h) => sum + h.marketValue, 0);
    const twValue = twHoldings.reduce((sum, h) => sum + h.marketValue, 0);
    const total = usValue + twValue;

    if (total === 0) return [];

    return [
      { name: '美股 US', value: usValue, percent: (usValue / total * 100).toFixed(1), color: COLORS.us },
      { name: '台股 TW', value: twValue, percent: (twValue / total * 100).toFixed(1), color: COLORS.tw },
    ].filter(d => d.value > 0);
  })() : [];

  // 自定義 Tooltip
  const PnlTooltip = ({ active, payload }: { active?: boolean; payload?: Array<{ payload: { symbol: string; pnl: number } }> }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white shadow-lg rounded-lg px-4 py-3 border border-slate-200">
          <p className="font-semibold text-slate-800">{data.symbol}</p>
          <p className={`text-sm font-medium ${data.pnl >= 0 ? 'text-success-600' : 'text-danger-600'}`}>
            損益：{data.pnl >= 0 ? '+' : ''}{formatCurrency(data.pnl)}
          </p>
        </div>
      );
    }
    return null;
  };

  const ReturnTooltip = ({ active, payload }: { active?: boolean; payload?: Array<{ payload: { symbol: string; returnRate: number } }> }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white shadow-lg rounded-lg px-4 py-3 border border-slate-200">
          <p className="font-semibold text-slate-800">{data.symbol}</p>
          <p className={`text-sm font-medium ${data.returnRate >= 0 ? 'text-success-600' : 'text-danger-600'}`}>
            報酬率：{data.returnRate >= 0 ? '+' : ''}{data.returnRate.toFixed(2)}%
          </p>
        </div>
      );
    }
    return null;
  };

  const CostValueTooltip = ({ active, payload }: { active?: boolean; payload?: Array<{ payload: { symbol: string; cost: number; value: number } }> }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const diff = data.value - data.cost;
      return (
        <div className="bg-white shadow-lg rounded-lg px-4 py-3 border border-slate-200">
          <p className="font-semibold text-slate-800">{data.symbol}</p>
          <p className="text-sm text-slate-600">成本：{formatCurrency(data.cost)}</p>
          <p className="text-sm text-slate-600">市值：{formatCurrency(data.value)}</p>
          <p className={`text-sm font-medium ${diff >= 0 ? 'text-success-600' : 'text-danger-600'}`}>
            差額：{diff >= 0 ? '+' : ''}{formatCurrency(diff)}
          </p>
        </div>
      );
    }
    return null;
  };

  // Treemap 自定義內容
  const TreemapContent = (props: {
    x: number;
    y: number;
    width: number;
    height: number;
    name: string;
    weight: number;
    color: string;
  }) => {
    const { x, y, width, height, name, weight, color } = props;

    if (width < 40 || height < 30) return null;

    return (
      <g>
        <rect
          x={x}
          y={y}
          width={width}
          height={height}
          fill={color}
          stroke="#fff"
          strokeWidth={2}
          rx={4}
        />
        {width > 50 && height > 40 && (
          <>
            <text
              x={x + width / 2}
              y={y + height / 2 - 8}
              textAnchor="middle"
              fill="#fff"
              fontSize={12}
              fontWeight="bold"
            >
              {name}
            </text>
            <text
              x={x + width / 2}
              y={y + height / 2 + 10}
              textAnchor="middle"
              fill="rgba(255,255,255,0.8)"
              fontSize={10}
            >
              {(weight * 100).toFixed(1)}%
            </text>
          </>
        )}
      </g>
    );
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 1. 損益比較長條圖 */}
        <div className="card p-5">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-100 to-red-100 flex items-center justify-center">
              <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div>
              <h3 className="font-semibold text-slate-800">損益比較</h3>
              <p className="text-xs text-slate-500">各股票損益金額</p>
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={pnlData} layout="vertical" margin={{ left: 10, right: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis type="number" tick={{ fontSize: 11 }} tickFormatter={(v) => `$${(v/1000).toFixed(0)}k`} />
                <YAxis type="category" dataKey="symbol" tick={{ fontSize: 11 }} width={50} />
                <Tooltip content={<PnlTooltip />} />
                <Bar dataKey="pnl" radius={[0, 4, 4, 0]}>
                  {pnlData.map((entry, index) => (
                    <Cell key={index} fill={entry.isProfit ? COLORS.profit : COLORS.loss} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 2. 報酬率排名 */}
        <div className="card p-5">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-100 to-blue-100 flex items-center justify-center">
              <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
            <div>
              <h3 className="font-semibold text-slate-800">報酬率排名</h3>
              <p className="text-xs text-slate-500">各股票報酬率高低</p>
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={returnData} layout="vertical" margin={{ left: 10, right: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis type="number" tick={{ fontSize: 11 }} tickFormatter={(v) => `${v.toFixed(0)}%`} />
                <YAxis type="category" dataKey="symbol" tick={{ fontSize: 11 }} width={50} />
                <Tooltip content={<ReturnTooltip />} />
                <Bar dataKey="returnRate" radius={[0, 4, 4, 0]}>
                  {returnData.map((entry, index) => (
                    <Cell key={index} fill={entry.isProfit ? COLORS.profit : COLORS.loss} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 3. Treemap 權重分布 */}
        <div className="card p-5">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-violet-100 to-pink-100 flex items-center justify-center">
              <svg className="w-5 h-5 text-violet-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
              </svg>
            </div>
            <div>
              <h3 className="font-semibold text-slate-800">權重分布圖</h3>
              <p className="text-xs text-slate-500">持股市值權重視覺化</p>
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <Treemap
                data={treemapData}
                dataKey="size"
                aspectRatio={4 / 3}
                stroke="#fff"
                fill="#8884d8"
                content={<TreemapContent x={0} y={0} width={0} height={0} name="" weight={0} color="" />}
              />
            </ResponsiveContainer>
          </div>
        </div>

        {/* 4. 成本 vs 市值 */}
        <div className="card p-5">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-100 to-cyan-100 flex items-center justify-center">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <h3 className="font-semibold text-slate-800">成本 vs 市值</h3>
              <p className="text-xs text-slate-500">投入成本與當前市值比較</p>
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={costValueData} margin={{ left: 10, right: 10, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="symbol" tick={{ fontSize: 10 }} angle={-45} textAnchor="end" height={50} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `$${(v/1000).toFixed(0)}k`} />
                <Tooltip content={<CostValueTooltip />} />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
                <Bar dataKey="cost" name="成本" fill="#94a3b8" radius={[4, 4, 0, 0]} />
                <Bar dataKey="value" name="市值" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* 5. 市場分布（僅 MIXED 帳戶） */}
      {isMixed && marketData.length > 0 && (
        <div className="card p-5">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-100 to-blue-100 flex items-center justify-center">
              <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h3 className="font-semibold text-slate-800">市場分布</h3>
              <p className="text-xs text-slate-500">美股與台股配置比例</p>
            </div>
          </div>
          <div className="h-64 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={marketData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={3}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${percent}%`}
                  labelLine={false}
                >
                  {marketData.map((entry, index) => (
                    <Cell key={index} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload as { name: string; value: number; percent: string };
                      return (
                        <div className="bg-white shadow-lg rounded-lg px-4 py-3 border border-slate-200">
                          <p className="font-semibold text-slate-800">{data.name}</p>
                          <p className="text-sm text-slate-600">市值：{formatCurrency(data.value)}</p>
                          <p className="text-sm text-slate-600">佔比：{data.percent}%</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}
