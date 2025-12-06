'use client';

import { useState, useMemo } from 'react';
import { HoldingWithMetrics, Holding } from '@/lib/types';
import { formatCurrency, formatPercent } from '@/lib/portfolio';

type SortKey = 'symbol' | 'quantity' | 'costBasis' | 'currentPrice' | 'marketValue' | 'pnl' | 'pnlPercent' | 'weight';
type SortDirection = 'asc' | 'desc';

interface HoldingsTableProps {
  holdings: HoldingWithMetrics[];
  onEdit: (holding: Holding) => void;
  onDelete: (id: string) => void;
  isLoading: boolean;
}

interface EditModalProps {
  holding: HoldingWithMetrics;
  onSave: (holding: Holding) => void;
  onClose: () => void;
}

function EditModal({ holding, onSave, onClose }: EditModalProps) {
  const [quantity, setQuantity] = useState(holding.quantity.toString());
  const [costBasis, setCostBasis] = useState(holding.costBasis.toString());
  const [note, setNote] = useState(holding.note || '');

  const handleSave = () => {
    const qty = parseFloat(quantity);
    const cost = parseFloat(costBasis);
    if (isNaN(qty) || qty <= 0 || isNaN(cost) || cost <= 0) {
      alert('請輸入有效的數值');
      return;
    }

    onSave({
      ...holding,
      quantity: qty,
      costBasis: cost,
      note: note.trim() || undefined,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="card p-6 w-full max-w-md animate-fade-in">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-slate-800">
            編輯 {holding.symbol}
          </h3>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
            <svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              股數
            </label>
            <input
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              step="0.01"
              min="0"
              className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-navy-500/20 focus:border-navy-500 transition-colors"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              成本價 ({holding.originalCurrency === 'TWD' ? 'TWD' : 'USD'})
            </label>
            <input
              type="number"
              value={costBasis}
              onChange={(e) => setCostBasis(e.target.value)}
              step="0.01"
              min="0"
              className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-navy-500/20 focus:border-navy-500 transition-colors"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              備註（選填）
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={2}
              className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-navy-500/20 focus:border-navy-500 transition-colors resize-none"
            />
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={onClose}
            className="btn-secondary"
          >
            取消
          </button>
          <button
            onClick={handleSave}
            className="btn-primary"
          >
            儲存變更
          </button>
        </div>
      </div>
    </div>
  );
}

export default function HoldingsTable({
  holdings,
  onEdit,
  onDelete,
  isLoading,
}: HoldingsTableProps) {
  const [editingHolding, setEditingHolding] = useState<HoldingWithMetrics | null>(null);
  const [sortKey, setSortKey] = useState<SortKey>('marketValue');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  // 排序邏輯
  const sortedHoldings = useMemo(() => {
    return [...holdings].sort((a, b) => {
      let aVal: number | string;
      let bVal: number | string;

      switch (sortKey) {
        case 'symbol':
          aVal = a.symbol;
          bVal = b.symbol;
          break;
        case 'quantity':
          aVal = a.quantity;
          bVal = b.quantity;
          break;
        case 'costBasis':
          aVal = a.costBasis;
          bVal = b.costBasis;
          break;
        case 'currentPrice':
          aVal = a.currentPrice;
          bVal = b.currentPrice;
          break;
        case 'marketValue':
          aVal = a.originalMarketValue || 0;
          bVal = b.originalMarketValue || 0;
          break;
        case 'pnl':
          aVal = (a.currentPrice - a.costBasis) * a.quantity;
          bVal = (b.currentPrice - b.costBasis) * b.quantity;
          break;
        case 'pnlPercent':
          aVal = a.unrealizedPnLPercent;
          bVal = b.unrealizedPnLPercent;
          break;
        case 'weight':
          aVal = a.weight;
          bVal = b.weight;
          break;
        default:
          return 0;
      }

      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return sortDirection === 'asc'
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal);
      }

      return sortDirection === 'asc'
        ? (aVal as number) - (bVal as number)
        : (bVal as number) - (aVal as number);
    });
  }, [holdings, sortKey, sortDirection]);

  // 點擊欄位標題排序
  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDirection('desc');
    }
  };

  // 排序指示器
  const SortIndicator = ({ columnKey }: { columnKey: SortKey }) => {
    if (sortKey !== columnKey) {
      return (
        <svg className="w-3 h-3 text-slate-300 ml-1 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
        </svg>
      );
    }
    return sortDirection === 'desc' ? (
      <svg className="w-3 h-3 text-navy-600 ml-1 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    ) : (
      <svg className="w-3 h-3 text-navy-600 ml-1 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
      </svg>
    );
  };

  if (isLoading) {
    return (
      <div className="card overflow-hidden">
        <div className="p-5">
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="shimmer h-14 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (holdings.length === 0) {
    return (
      <div className="card p-10 text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-100 flex items-center justify-center">
          <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
          </svg>
        </div>
        <p className="text-slate-800 font-semibold text-lg">尚無持股</p>
        <p className="text-sm text-slate-500 mt-1">使用上方表單新增您的第一筆持股</p>
      </div>
    );
  }

  const handleDelete = (id: string, symbol: string) => {
    if (confirm(`確定要刪除 ${symbol} 嗎？`)) {
      onDelete(id);
    }
  };

  return (
    <>
      <div className="card overflow-hidden">
        {/* Desktop Table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="table-pro">
            <thead>
              <tr>
                <th
                  className="cursor-pointer hover:bg-slate-100 transition-colors select-none"
                  onClick={() => handleSort('symbol')}
                >
                  股票代號 <SortIndicator columnKey="symbol" />
                </th>
                <th
                  className="text-right cursor-pointer hover:bg-slate-100 transition-colors select-none"
                  onClick={() => handleSort('quantity')}
                >
                  股數 <SortIndicator columnKey="quantity" />
                </th>
                <th
                  className="text-right cursor-pointer hover:bg-slate-100 transition-colors select-none"
                  onClick={() => handleSort('costBasis')}
                >
                  成本 <SortIndicator columnKey="costBasis" />
                </th>
                <th
                  className="text-right cursor-pointer hover:bg-slate-100 transition-colors select-none"
                  onClick={() => handleSort('currentPrice')}
                >
                  現價 <SortIndicator columnKey="currentPrice" />
                </th>
                <th
                  className="text-right cursor-pointer hover:bg-slate-100 transition-colors select-none"
                  onClick={() => handleSort('marketValue')}
                >
                  市值 <SortIndicator columnKey="marketValue" />
                </th>
                <th
                  className="text-right cursor-pointer hover:bg-slate-100 transition-colors select-none"
                  onClick={() => handleSort('pnl')}
                >
                  損益 <SortIndicator columnKey="pnl" />
                </th>
                <th
                  className="text-right cursor-pointer hover:bg-slate-100 transition-colors select-none"
                  onClick={() => handleSort('weight')}
                >
                  權重 <SortIndicator columnKey="weight" />
                </th>
                <th className="text-center">操作</th>
              </tr>
            </thead>
            <tbody>
              {sortedHoldings.map((holding) => {
                const isProfit = holding.unrealizedPnL >= 0;
                const pnlColor = isProfit ? 'text-success-600' : 'text-danger-600';

                return (
                  <tr key={holding.id}>
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-navy-100 flex items-center justify-center font-semibold text-navy-700 text-sm">
                          {holding.symbol.slice(0, 2)}
                        </div>
                        <div>
                          <div className="font-semibold text-slate-800">{holding.symbol}</div>
                          <div className="text-xs text-slate-500 truncate max-w-[120px]">{holding.name}</div>
                        </div>
                      </div>
                    </td>
                    <td className="text-right font-medium text-slate-700">
                      {holding.quantity.toLocaleString()}
                    </td>
                    <td className="text-right text-slate-600">
                      {formatCurrency(holding.costBasis, holding.originalCurrency || 'USD')}
                    </td>
                    <td className="text-right font-semibold text-slate-800">
                      {holding.currentPrice > 0 ? formatCurrency(holding.currentPrice, holding.originalCurrency || 'USD') : '--'}
                    </td>
                    <td className="text-right text-slate-700">
                      {holding.originalMarketValue > 0 ? formatCurrency(holding.originalMarketValue, holding.originalCurrency || 'USD') : '--'}
                    </td>
                    <td className={`text-right ${pnlColor}`}>
                      {holding.currentPrice > 0 ? (
                        <div>
                          <div className="font-semibold">{isProfit ? '+' : ''}{formatCurrency((holding.currentPrice - holding.costBasis) * holding.quantity, holding.originalCurrency || 'USD')}</div>
                          <div className="text-xs">{formatPercent(holding.unrealizedPnLPercent)}</div>
                        </div>
                      ) : '--'}
                    </td>
                    <td className="text-right font-medium text-slate-600">
                      {holding.weight > 0 ? `${(holding.weight * 100).toFixed(1)}%` : '--'}
                    </td>
                    <td>
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => setEditingHolding(holding)}
                          className="p-2 text-slate-400 hover:text-navy-600 hover:bg-navy-50 rounded-lg transition-all"
                          title="Edit"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDelete(holding.id, holding.symbol)}
                          className="p-2 text-slate-400 hover:text-danger-600 hover:bg-danger-50 rounded-lg transition-all"
                          title="Delete"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Mobile Card List */}
        <div className="md:hidden divide-y divide-slate-100">
          {sortedHoldings.map((holding) => {
            const isProfit = holding.unrealizedPnL >= 0;
            const pnlColor = isProfit ? 'text-success-600' : 'text-danger-600';

            return (
              <div key={holding.id} className="p-4">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-navy-100 flex items-center justify-center font-semibold text-navy-700 text-sm">
                      {holding.symbol.slice(0, 2)}
                    </div>
                    <div>
                      <div className="font-semibold text-slate-800">{holding.symbol}</div>
                      <div className="text-xs text-slate-500">{holding.name}</div>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => setEditingHolding(holding)}
                      className="p-2 text-slate-400 hover:text-navy-600 hover:bg-navy-50 rounded-lg transition-all"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleDelete(holding.id, holding.symbol)}
                      className="p-2 text-slate-400 hover:text-danger-600 hover:bg-danger-50 rounded-lg transition-all"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="bg-slate-50 rounded-lg p-3">
                    <span className="text-slate-500 text-xs">股數</span>
                    <div className="text-slate-800 font-medium">{holding.quantity.toLocaleString()}</div>
                  </div>
                  <div className="bg-slate-50 rounded-lg p-3">
                    <span className="text-slate-500 text-xs">成本</span>
                    <div className="text-slate-800 font-medium">{formatCurrency(holding.costBasis, holding.originalCurrency || 'USD')}</div>
                  </div>
                  <div className="bg-slate-50 rounded-lg p-3">
                    <span className="text-slate-500 text-xs">現價</span>
                    <div className="text-slate-800 font-semibold">
                      {holding.currentPrice > 0 ? formatCurrency(holding.currentPrice, holding.originalCurrency || 'USD') : '--'}
                    </div>
                  </div>
                  <div className="bg-slate-50 rounded-lg p-3">
                    <span className="text-slate-500 text-xs">市值</span>
                    <div className="text-slate-800 font-medium">
                      {holding.originalMarketValue > 0 ? formatCurrency(holding.originalMarketValue, holding.originalCurrency || 'USD') : '--'}
                    </div>
                  </div>
                </div>
                {holding.currentPrice > 0 && (
                  <div className={`mt-3 p-3 rounded-lg ${isProfit ? 'bg-success-50' : 'bg-danger-50'} flex justify-between items-center`}>
                    <span className="text-sm text-slate-600">損益</span>
                    <span className={`font-semibold ${pnlColor}`}>
                      {isProfit ? '+' : ''}{formatCurrency((holding.currentPrice - holding.costBasis) * holding.quantity, holding.originalCurrency || 'USD')} ({formatPercent(holding.unrealizedPnLPercent)})
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Edit Modal */}
      {editingHolding && (
        <EditModal
          holding={editingHolding}
          onSave={onEdit}
          onClose={() => setEditingHolding(null)}
        />
      )}
    </>
  );
}
