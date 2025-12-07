'use client';

import { useState } from 'react';
import { PortfolioSummary, Currency, ASSET_CLASS_LABELS, BOND_CATEGORY_LABELS } from '@/lib/types';
import { formatCurrency, formatPercent } from '@/lib/portfolio';

interface SummaryCardsProps {
  summary: PortfolioSummary | null;
  isLoading: boolean;
  baseCurrency?: Currency;
  exchangeRate?: number;
  isMixed?: boolean;
}

export default function SummaryCards({ summary, isLoading, baseCurrency = 'USD', exchangeRate, isMixed = false }: SummaryCardsProps) {
  const [displayCurrency, setDisplayCurrency] = useState<Currency>(baseCurrency);

  // 轉換金額到顯示幣別
  const convertAmount = (amount: number): number => {
    if (!exchangeRate) return amount;
    if (baseCurrency === displayCurrency) return amount;

    // baseCurrency -> displayCurrency
    if (baseCurrency === 'USD' && displayCurrency === 'TWD') {
      return amount * exchangeRate;
    }
    if (baseCurrency === 'TWD' && displayCurrency === 'USD') {
      return amount / exchangeRate;
    }
    return amount;
  };

  const toggleCurrency = () => {
    setDisplayCurrency(prev => prev === 'USD' ? 'TWD' : 'USD');
  };
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="card p-5">
            <div className="shimmer h-4 rounded w-24 mb-3"></div>
            <div className="shimmer h-8 rounded w-32"></div>
          </div>
        ))}
      </div>
    );
  }

  if (!summary) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card p-5">
          <p className="stat-label mb-2">總市值</p>
          <p className="stat-value text-slate-400">$0.00</p>
        </div>
        <div className="card p-5">
          <p className="stat-label mb-2">未實現損益</p>
          <p className="stat-value text-slate-400">--</p>
        </div>
        <div className="card p-5">
          <p className="stat-label mb-2">前三大集中度</p>
          <p className="stat-value text-slate-400">--</p>
        </div>
        <div className="card p-5">
          <p className="stat-label mb-2">持股數量</p>
          <p className="stat-value text-slate-400">0</p>
        </div>
      </div>
    );
  }

  const isProfit = summary.totalUnrealizedPnL >= 0;

  // 集中度警示
  const getConcentrationStatus = (concentration: number) => {
    if (concentration > 0.7) return { color: 'text-danger-600', badge: 'badge-danger', label: '高風險' };
    if (concentration > 0.5) return { color: 'text-gold-600', badge: 'badge-warning', label: '中等' };
    return { color: 'text-success-600', badge: 'badge-success', label: '分散良好' };
  };

  const concentrationStatus = getConcentrationStatus(summary.concentration);

  // 計算是否有資產類別分布資料（股票或債券市值大於0）
  const hasAssetBreakdown = summary.assetClassBreakdown &&
    (summary.assetClassBreakdown.equity.marketValue > 0 || summary.assetClassBreakdown.bond.totalMarketValue > 0);

  return (
    <div className="space-y-4">
      {/* Main Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Value */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-3">
            <p className="stat-label">總市值</p>
            <div className="flex items-center gap-2">
              {exchangeRate && (
                <button
                  onClick={toggleCurrency}
                  className="px-2 py-1 text-xs font-semibold rounded-lg transition-all bg-navy-100 text-navy-700 hover:bg-navy-200"
                  title="切換幣別"
                >
                  {displayCurrency === 'USD' ? '$ USD' : 'NT$ TWD'}
                </button>
              )}
              <div className="w-8 h-8 rounded-lg bg-navy-100 flex items-center justify-center">
                <svg className="w-4 h-4 text-navy-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>
          <p className="stat-value">{formatCurrency(convertAmount(summary.totalMarketValue), displayCurrency)}</p>
          <p className="text-xs text-slate-500 mt-2">
            成本：{formatCurrency(convertAmount(summary.totalCost), displayCurrency)}
          </p>
        </div>

        {/* P&L */}
        <div className={`card p-5 ${isProfit ? 'border-success-200 bg-success-50/30' : 'border-danger-200 bg-danger-50/30'}`}>
          <div className="flex items-center justify-between mb-3">
            <p className="stat-label">未實現損益</p>
            <div className={`w-8 h-8 rounded-lg ${isProfit ? 'bg-success-100' : 'bg-danger-100'} flex items-center justify-center`}>
              {isProfit ? (
                <svg className="w-4 h-4 text-success-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              ) : (
                <svg className="w-4 h-4 text-danger-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
                </svg>
              )}
            </div>
          </div>
          <p className={`stat-value ${isProfit ? 'text-success-600' : 'text-danger-600'}`}>
            {isProfit ? '+' : ''}{formatCurrency(convertAmount(summary.totalUnrealizedPnL), displayCurrency)}
          </p>
          <p className={`text-sm font-semibold mt-2 ${isProfit ? 'text-success-600' : 'text-danger-600'}`}>
            {formatPercent(summary.totalUnrealizedPnLPercent)}
          </p>
        </div>

        {/* Concentration */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-3">
            <p className="stat-label">前三大集中度</p>
            <span className={concentrationStatus.badge}>{concentrationStatus.label}</span>
          </div>
          <p className={`stat-value ${concentrationStatus.color}`}>
            {(summary.concentration * 100).toFixed(1)}%
          </p>
          <p className="text-xs text-slate-500 mt-2">
            {summary.concentration > 0.5 ? '建議分散投資' : '分散良好'}
          </p>
        </div>

        {/* Holdings Count */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-3">
            <p className="stat-label">持股數量</p>
            <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center">
              <svg className="w-4 h-4 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
          </div>
          <p className="stat-value">{summary.totalHoldingsCount || 0}</p>
          <p className="text-xs text-slate-500 mt-2">目前持有</p>
        </div>
      </div>

      {/* Asset Class Breakdown */}
      {hasAssetBreakdown && (
        <div className="card p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-violet-100 flex items-center justify-center">
              <svg className="w-5 h-5 text-violet-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
              </svg>
            </div>
            <div>
              <p className="font-semibold text-slate-800">資產配置</p>
              <p className="text-xs text-slate-500">股票與債券分布</p>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mb-4">
            <div className="h-3 rounded-full bg-slate-100 overflow-hidden flex">
              {summary.assetClassBreakdown!.equity.weight > 0 && (
                <div
                  className="h-full bg-navy-500 transition-all duration-500"
                  style={{ width: `${summary.assetClassBreakdown!.equity.weight * 100}%` }}
                />
              )}
              {summary.assetClassBreakdown!.bond.corp.weight > 0 && (
                <div
                  className="h-full bg-amber-500 transition-all duration-500"
                  style={{ width: `${summary.assetClassBreakdown!.bond.corp.weight * 100}%` }}
                />
              )}
              {summary.assetClassBreakdown!.bond.ust.weight > 0 && (
                <div
                  className="h-full bg-emerald-500 transition-all duration-500"
                  style={{ width: `${summary.assetClassBreakdown!.bond.ust.weight * 100}%` }}
                />
              )}
            </div>
          </div>

          {/* Legend and Details */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Equity */}
            {summary.assetClassBreakdown!.equity.marketValue > 0 && (
              <div className="p-3 bg-navy-50 rounded-lg border border-navy-100">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-3 h-3 rounded-full bg-navy-500"></div>
                  <span className="text-sm font-medium text-slate-700">{ASSET_CLASS_LABELS.equity}</span>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span className="text-xs text-slate-500">市值</span>
                    <span className="text-sm font-semibold text-slate-800">
                      {formatCurrency(convertAmount(summary.assetClassBreakdown!.equity.marketValue), displayCurrency)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-xs text-slate-500">佔比</span>
                    <span className="text-sm font-semibold text-navy-600">
                      {(summary.assetClassBreakdown!.equity.weight * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Corporate Bonds */}
            {summary.assetClassBreakdown!.bond.corp.marketValue > 0 && (
              <div className="p-3 bg-amber-50 rounded-lg border border-amber-100">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                  <span className="text-sm font-medium text-slate-700">{BOND_CATEGORY_LABELS.corp}</span>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span className="text-xs text-slate-500">市值</span>
                    <span className="text-sm font-semibold text-slate-800">
                      {formatCurrency(convertAmount(summary.assetClassBreakdown!.bond.corp.marketValue), displayCurrency)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-xs text-slate-500">佔比</span>
                    <span className="text-sm font-semibold text-amber-600">
                      {(summary.assetClassBreakdown!.bond.corp.weight * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* US Treasuries */}
            {summary.assetClassBreakdown!.bond.ust.marketValue > 0 && (
              <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-100">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                  <span className="text-sm font-medium text-slate-700">{BOND_CATEGORY_LABELS.ust}</span>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span className="text-xs text-slate-500">市值</span>
                    <span className="text-sm font-semibold text-slate-800">
                      {formatCurrency(convertAmount(summary.assetClassBreakdown!.bond.ust.marketValue), displayCurrency)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-xs text-slate-500">佔比</span>
                    <span className="text-sm font-semibold text-emerald-600">
                      {(summary.assetClassBreakdown!.bond.ust.weight * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Bond Total (if both corp and ust exist) */}
          {summary.assetClassBreakdown!.bond.corp.marketValue > 0 &&
           summary.assetClassBreakdown!.bond.ust.marketValue > 0 && (
            <div className="mt-3 pt-3 border-t border-slate-200">
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-600">債券總計</span>
                <div className="text-right">
                  <span className="font-semibold text-slate-800">
                    {formatCurrency(convertAmount(summary.assetClassBreakdown!.bond.totalMarketValue), displayCurrency)}
                  </span>
                  <span className="text-slate-500 ml-2">
                    ({(summary.assetClassBreakdown!.bond.weight * 100).toFixed(1)}%)
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Market Breakdown for Mixed Account */}
      {isMixed && (summary.usBreakdown || summary.twBreakdown) && (
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-navy-100 flex items-center justify-center">
                <svg className="w-5 h-5 text-navy-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="font-semibold text-slate-800">市場分布</p>
                <p className="text-xs text-slate-500">多市場投資組合概覽</p>
              </div>
            </div>
            {exchangeRate && (
              <div className="text-right">
                <p className="text-sm font-semibold text-slate-800">1 USD = {exchangeRate.toFixed(2)} TWD</p>
                <p className="text-xs text-slate-500">匯率</p>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {summary.usBreakdown && (
              <div className="p-4 bg-slate-50 rounded-lg">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-lg">US</span>
                  <span className="text-sm font-medium text-slate-600">美股市場</span>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-slate-500">市值</span>
                    <span className="text-sm font-semibold text-slate-800">{formatCurrency(summary.usBreakdown.marketValue, 'USD')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-slate-500">損益</span>
                    <span className={`text-sm font-semibold ${summary.usBreakdown.unrealizedPnL >= 0 ? 'text-success-600' : 'text-danger-600'}`}>
                      {summary.usBreakdown.unrealizedPnL >= 0 ? '+' : ''}{formatCurrency(summary.usBreakdown.unrealizedPnL, 'USD')}
                    </span>
                  </div>
                </div>
              </div>
            )}
            {summary.twBreakdown && (
              <div className="p-4 bg-slate-50 rounded-lg">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-lg">TW</span>
                  <span className="text-sm font-medium text-slate-600">台股市場</span>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-slate-500">市值</span>
                    <span className="text-sm font-semibold text-slate-800">{formatCurrency(summary.twBreakdown.marketValue, 'TWD')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-slate-500">損益</span>
                    <span className={`text-sm font-semibold ${summary.twBreakdown.unrealizedPnL >= 0 ? 'text-success-600' : 'text-danger-600'}`}>
                      {summary.twBreakdown.unrealizedPnL >= 0 ? '+' : ''}{formatCurrency(summary.twBreakdown.unrealizedPnL, 'TWD')}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
