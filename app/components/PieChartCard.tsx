'use client';

import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { HoldingWithMetrics } from '@/lib/types';
import { formatCurrency } from '@/lib/portfolio';

interface PieChartCardProps {
  holdings: HoldingWithMetrics[];
  isLoading: boolean;
}

interface ChartDataItem {
  name: string;
  value: number;
  weight: number;
  color: string;
}

// Professional color palette
const COLORS = [
  '#102a43', // navy-900
  '#334e68', // navy-700
  '#486581', // navy-600
  '#627d98', // navy-500
  '#829ab1', // navy-400
  '#f59e0b', // gold-500
  '#10b981', // success-500
  '#ef4444', // danger-500
  '#64748b', // slate-500
  '#94a3b8', // slate-400
];

export default function PieChartCard({ holdings, isLoading }: PieChartCardProps) {
  if (isLoading) {
    return (
      <div className="card p-5">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-lg bg-navy-100 flex items-center justify-center">
            <svg className="w-5 h-5 text-navy-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
            </svg>
          </div>
          <h3 className="font-semibold text-slate-800">持股配置</h3>
        </div>
        <div className="h-64 flex items-center justify-center">
          <div className="w-10 h-10 rounded-full border-2 border-navy-200 border-t-navy-600 animate-spin"></div>
        </div>
      </div>
    );
  }

  if (holdings.length === 0 || holdings.every((h) => h.marketValue === 0)) {
    return (
      <div className="card p-5">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-lg bg-navy-100 flex items-center justify-center">
            <svg className="w-5 h-5 text-navy-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
            </svg>
          </div>
          <h3 className="font-semibold text-slate-800">持股配置</h3>
        </div>
        <div className="h-64 flex flex-col items-center justify-center">
          <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <p className="text-slate-500 font-medium">新增持股以查看配置</p>
        </div>
      </div>
    );
  }

  const chartData = holdings
    .filter((h) => h.marketValue > 0)
    .sort((a, b) => b.marketValue - a.marketValue)
    .map((h, index) => ({
      name: h.symbol,
      value: h.marketValue,
      weight: h.weight,
      color: COLORS[index % COLORS.length],
    }));

  const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: Array<{ payload: { name: string; value: number; weight: number } }> }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white shadow-lg rounded-lg px-4 py-3 border border-slate-200">
          <p className="font-semibold text-slate-800">{data.name}</p>
          <p className="text-sm text-slate-600">
            市值：{formatCurrency(data.value)}
          </p>
          <p className="text-sm text-slate-600">
            權重：{(data.weight * 100).toFixed(1)}%
          </p>
        </div>
      );
    }
    return null;
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const renderLegend = (props: any) => {
    const { payload } = props;
    if (!payload) return null;

    return (
      <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 mt-4">
        {payload.slice(0, 6).map((entry: { value: string; color?: string; payload?: ChartDataItem }, index: number) => (
          <div key={index} className="flex items-center text-sm">
            <div
              className="w-3 h-3 rounded mr-2"
              style={{ backgroundColor: entry.color || '#ccc' }}
            />
            <span className="text-slate-600 font-medium">
              {entry.value} <span className="text-slate-400">({entry.payload ? (entry.payload.weight * 100).toFixed(1) : 0}%)</span>
            </span>
          </div>
        ))}
        {payload.length > 6 && (
          <span className="text-sm text-slate-400">+{payload.length - 6} more</span>
        )}
      </div>
    );
  };

  return (
    <div className="card p-5">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-10 h-10 rounded-lg bg-navy-100 flex items-center justify-center">
          <svg className="w-5 h-5 text-navy-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
          </svg>
        </div>
        <h3 className="font-semibold text-slate-800">持股配置</h3>
      </div>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={45}
              outerRadius={75}
              paddingAngle={2}
              dataKey="value"
              stroke="none"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend content={renderLegend} />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
