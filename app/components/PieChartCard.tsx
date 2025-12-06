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

// 可愛的粉嫩色調色盤
const COLORS = [
  '#F472B6', // pink-400
  '#A78BFA', // violet-400
  '#60A5FA', // blue-400
  '#34D399', // emerald-400
  '#FBBF24', // amber-400
  '#FB923C', // orange-400
  '#F87171', // red-400
  '#2DD4BF', // teal-400
  '#818CF8', // indigo-400
  '#E879F9', // fuchsia-400
];

export default function PieChartCard({ holdings, isLoading }: PieChartCardProps) {
  if (isLoading) {
    return (
      <div className="card-cute p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center">
            <span className="text-xl">🍰</span>
          </div>
          <h3 className="text-lg font-bold text-gray-800">持股佔比</h3>
        </div>
        <div className="h-64 flex items-center justify-center">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-pink-200 to-purple-200 flex items-center justify-center animate-bounce">
            <span className="text-2xl">💫</span>
          </div>
        </div>
      </div>
    );
  }

  if (holdings.length === 0 || holdings.every((h) => h.marketValue === 0)) {
    return (
      <div className="card-cute p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center">
            <span className="text-xl">🍰</span>
          </div>
          <h3 className="text-lg font-bold text-gray-800">持股佔比</h3>
        </div>
        <div className="h-64 flex flex-col items-center justify-center">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-pink-100 to-purple-100 flex items-center justify-center mb-4">
            <span className="text-4xl">📊</span>
          </div>
          <p className="text-pink-400 font-medium">請先新增持股並更新報價</p>
        </div>
      </div>
    );
  }

  // 準備圖表資料，依市值排序
  const chartData = holdings
    .filter((h) => h.marketValue > 0)
    .sort((a, b) => b.marketValue - a.marketValue)
    .map((h, index) => ({
      name: h.symbol,
      value: h.marketValue,
      weight: h.weight,
      color: COLORS[index % COLORS.length],
    }));

  // 自訂 Tooltip
  const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: Array<{ payload: { name: string; value: number; weight: number } }> }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white/95 backdrop-blur-sm shadow-lg rounded-2xl px-4 py-3 border-2 border-pink-100">
          <p className="font-bold text-gray-800">{data.name}</p>
          <p className="text-sm text-pink-500 font-medium">
            市值: {formatCurrency(data.value)}
          </p>
          <p className="text-sm text-purple-500 font-medium">
            佔比: {(data.weight * 100).toFixed(1)}%
          </p>
        </div>
      );
    }
    return null;
  };

  // 自訂 Legend
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const renderLegend = (props: any) => {
    const { payload } = props;
    if (!payload) return null;

    return (
      <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 mt-4">
        {payload.slice(0, 6).map((entry: { value: string; color?: string; payload?: ChartDataItem }, index: number) => (
          <div key={index} className="flex items-center text-sm bg-white/50 rounded-full px-3 py-1">
            <div
              className="w-3 h-3 rounded-full mr-2"
              style={{ backgroundColor: entry.color || '#ccc' }}
            />
            <span className="text-gray-700 font-medium">
              {entry.value} <span className="text-pink-400">({entry.payload ? (entry.payload.weight * 100).toFixed(1) : 0}%)</span>
            </span>
          </div>
        ))}
        {payload.length > 6 && (
          <span className="text-sm text-pink-400 font-medium">+{payload.length - 6} 其他</span>
        )}
      </div>
    );
  };

  return (
    <div className="card-cute p-6">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center shadow-lg shadow-purple-200/50">
          <span className="text-xl">🍰</span>
        </div>
        <h3 className="text-lg font-bold text-gray-800">持股佔比</h3>
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
              paddingAngle={3}
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
