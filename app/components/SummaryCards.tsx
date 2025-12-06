'use client';

import { PortfolioSummary, Currency, MarketBreakdown } from '@/lib/types';
import { formatCurrency, formatPercent } from '@/lib/portfolio';

interface SummaryCardsProps {
  summary: PortfolioSummary | null;
  isLoading: boolean;
  baseCurrency?: Currency;
  exchangeRate?: number;
  isMixed?: boolean;
}

export default function SummaryCards({ summary, isLoading, baseCurrency = 'USD', exchangeRate, isMixed = false }: SummaryCardsProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {[1, 2, 3].map((i) => (
          <div key={i} className="card-cute p-6">
            <div className="shimmer h-4 rounded-full w-20 mb-4"></div>
            <div className="shimmer h-8 rounded-full w-32"></div>
          </div>
        ))}
      </div>
    );
  }

  if (!summary) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        <div className="card-cute p-6">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-2xl">💰</span>
            <span className="text-sm font-medium text-pink-400">總市值</span>
          </div>
          <div className="text-2xl font-bold text-gray-400">$0.00</div>
        </div>
        <div className="card-cute p-6">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-2xl">📈</span>
            <span className="text-sm font-medium text-pink-400">未實現損益</span>
          </div>
          <div className="text-2xl font-bold text-gray-400">--</div>
        </div>
        <div className="card-cute p-6">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-2xl">🎯</span>
            <span className="text-sm font-medium text-pink-400">前三大持股集中度</span>
          </div>
          <div className="text-2xl font-bold text-gray-400">--</div>
        </div>
      </div>
    );
  }

  const isProfit = summary.totalUnrealizedPnL >= 0;
  const pnlColor = isProfit ? 'text-emerald-500' : 'text-rose-500';
  const pnlBgClass = isProfit
    ? 'bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-200/50'
    : 'bg-gradient-to-br from-rose-50 to-pink-50 border-rose-200/50';

  // 集中度警示顏色
  const getConcentrationColor = (concentration: number) => {
    if (concentration > 0.7) return 'text-rose-500';
    if (concentration > 0.5) return 'text-amber-500';
    return 'text-emerald-500';
  };

  const getConcentrationEmoji = (concentration: number) => {
    if (concentration > 0.7) return '⚠️';
    if (concentration > 0.5) return '🤔';
    return '✨';
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
      {/* 總市值 */}
      <div className="card-cute p-6 bg-gradient-to-br from-white to-pink-50/50">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-pink-400 to-rose-400 flex items-center justify-center shadow-lg shadow-pink-200/50">
            <span className="text-xl">💰</span>
          </div>
          <span className="text-sm font-semibold text-pink-500">總市值</span>
        </div>
        <div className="text-2xl font-extrabold text-gray-800">
          {formatCurrency(summary.totalMarketValue, baseCurrency)}
        </div>
        <div className="text-xs text-pink-400 mt-2 font-medium">
          成本: {formatCurrency(summary.totalCost, baseCurrency)}
        </div>
        {/* 混合帳戶顯示市場分類 */}
        {isMixed && (summary.usBreakdown || summary.twBreakdown) && (
          <div className="mt-4 pt-4 border-t border-pink-100 space-y-2">
            {summary.usBreakdown && (
              <div className="flex justify-between text-xs">
                <span className="text-blue-500 font-medium flex items-center gap-1">
                  <span>🇺🇸</span> 美股
                </span>
                <span className="text-gray-700 font-semibold">{formatCurrency(summary.usBreakdown.marketValue, 'USD')}</span>
              </div>
            )}
            {summary.twBreakdown && (
              <div className="flex justify-between text-xs">
                <span className="text-green-500 font-medium flex items-center gap-1">
                  <span>🇹🇼</span> 台股
                </span>
                <span className="text-gray-700 font-semibold">{formatCurrency(summary.twBreakdown.marketValue, 'TWD')}</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 未實現損益 */}
      <div className={`card-cute p-6 ${pnlBgClass}`}>
        <div className="flex items-center gap-2 mb-3">
          <div className={`w-10 h-10 rounded-2xl ${isProfit ? 'bg-gradient-to-br from-emerald-400 to-teal-400' : 'bg-gradient-to-br from-rose-400 to-pink-400'} flex items-center justify-center shadow-lg ${isProfit ? 'shadow-emerald-200/50' : 'shadow-rose-200/50'}`}>
            <span className="text-xl">{isProfit ? '📈' : '📉'}</span>
          </div>
          <span className={`text-sm font-semibold ${isProfit ? 'text-emerald-600' : 'text-rose-500'}`}>未實現損益</span>
        </div>
        <div className={`text-2xl font-extrabold ${pnlColor}`}>
          {isProfit ? '+' : ''}{formatCurrency(summary.totalUnrealizedPnL, baseCurrency)}
        </div>
        <div className={`text-sm font-bold ${pnlColor} mt-2`}>
          {formatPercent(summary.totalUnrealizedPnLPercent)}
        </div>
        {/* 混合帳戶顯示市場分類損益 */}
        {isMixed && (summary.usBreakdown || summary.twBreakdown) && (
          <div className="mt-4 pt-4 border-t border-gray-200/50 space-y-2">
            {summary.usBreakdown && (
              <div className="flex justify-between text-xs">
                <span className="text-blue-500 font-medium flex items-center gap-1">
                  <span>🇺🇸</span> 美股
                </span>
                <span className={`font-semibold ${summary.usBreakdown.unrealizedPnL >= 0 ? 'text-emerald-600' : 'text-rose-500'}`}>
                  {summary.usBreakdown.unrealizedPnL >= 0 ? '+' : ''}{formatCurrency(summary.usBreakdown.unrealizedPnL, 'USD')}
                </span>
              </div>
            )}
            {summary.twBreakdown && (
              <div className="flex justify-between text-xs">
                <span className="text-green-500 font-medium flex items-center gap-1">
                  <span>🇹🇼</span> 台股
                </span>
                <span className={`font-semibold ${summary.twBreakdown.unrealizedPnL >= 0 ? 'text-emerald-600' : 'text-rose-500'}`}>
                  {summary.twBreakdown.unrealizedPnL >= 0 ? '+' : ''}{formatCurrency(summary.twBreakdown.unrealizedPnL, 'TWD')}
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 集中度 */}
      <div className="card-cute p-6 bg-gradient-to-br from-white to-purple-50/50">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-purple-400 to-violet-400 flex items-center justify-center shadow-lg shadow-purple-200/50">
            <span className="text-xl">🎯</span>
          </div>
          <span className="text-sm font-semibold text-purple-500">前三大持股集中度</span>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-2xl font-extrabold ${getConcentrationColor(summary.concentration)}`}>
            {(summary.concentration * 100).toFixed(1)}%
          </span>
          <span className="text-xl">{getConcentrationEmoji(summary.concentration)}</span>
        </div>
        <div className="text-xs text-purple-400 mt-2 font-medium">
          {summary.concentration > 0.5 ? '建議分散投資喔～' : '分散度很棒呢！'}
        </div>
      </div>

      {/* 匯率資訊（混合帳戶） */}
      {isMixed && exchangeRate && (
        <div className="sm:col-span-2 lg:col-span-3 card-cute p-5 bg-gradient-to-r from-blue-50/80 via-indigo-50/80 to-purple-50/80">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-400 to-indigo-400 flex items-center justify-center shadow-lg shadow-blue-200/50">
                <span className="text-2xl">💱</span>
              </div>
              <div>
                <div className="text-sm font-bold text-indigo-600">混合帳戶匯率</div>
                <div className="text-xs text-indigo-400">所有市值已轉換為 {baseCurrency}</div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-xl font-extrabold text-indigo-600">
                1 USD = {exchangeRate.toFixed(2)} TWD
              </div>
              <div className="text-xs text-indigo-400 font-medium">即時匯率</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
