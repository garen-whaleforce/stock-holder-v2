'use client';

import { useState } from 'react';
import { HoldingWithMetrics, Holding } from '@/lib/types';
import { formatCurrency, formatPercent } from '@/lib/portfolio';

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
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="card-cute p-6 w-full max-w-md animate-bounce-in">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-pink-400 to-rose-400 flex items-center justify-center">
            <span className="text-xl">✏️</span>
          </div>
          <h3 className="text-lg font-bold text-gray-800">
            編輯 {holding.symbol}
          </h3>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-pink-500 mb-2">
              股數
            </label>
            <input
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              step="0.01"
              min="0"
              className="w-full px-4 py-3 border-2 border-pink-200 rounded-2xl bg-white/80 focus:border-pink-400 transition-colors"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-pink-500 mb-2">
              平均成本 ({holding.originalCurrency === 'TWD' ? 'TWD' : 'USD'})
            </label>
            <input
              type="number"
              value={costBasis}
              onChange={(e) => setCostBasis(e.target.value)}
              step="0.01"
              min="0"
              className="w-full px-4 py-3 border-2 border-pink-200 rounded-2xl bg-white/80 focus:border-pink-400 transition-colors"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-pink-500 mb-2">
              備註 (選填)
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={2}
              className="w-full px-4 py-3 border-2 border-pink-200 rounded-2xl bg-white/80 focus:border-pink-400 transition-colors resize-none"
            />
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={onClose}
            className="px-5 py-2.5 text-pink-500 font-semibold hover:bg-pink-50 rounded-2xl transition-colors"
          >
            取消
          </button>
          <button
            onClick={handleSave}
            className="btn-cute-primary"
          >
            儲存 💾
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

  if (isLoading) {
    return (
      <div className="card-cute overflow-hidden">
        <div className="p-5">
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="shimmer h-16 rounded-2xl"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (holdings.length === 0) {
    return (
      <div className="card-cute p-10 text-center">
        <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-pink-100 to-purple-100 flex items-center justify-center">
          <span className="text-4xl">📦</span>
        </div>
        <p className="text-pink-500 font-semibold text-lg">尚未新增任何持股</p>
        <p className="text-sm text-pink-400 mt-2">使用上方表單新增您的第一筆持股吧！✨</p>
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
      <div className="card-cute overflow-hidden">
        {/* 桌機版表格 */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-pink-50 to-purple-50 border-b border-pink-100">
              <tr>
                <th className="text-left px-5 py-4 text-xs font-bold text-pink-500 uppercase tracking-wider">股票</th>
                <th className="text-right px-5 py-4 text-xs font-bold text-pink-500 uppercase tracking-wider">股數</th>
                <th className="text-right px-5 py-4 text-xs font-bold text-pink-500 uppercase tracking-wider">成本</th>
                <th className="text-right px-5 py-4 text-xs font-bold text-pink-500 uppercase tracking-wider">現價</th>
                <th className="text-right px-5 py-4 text-xs font-bold text-pink-500 uppercase tracking-wider">市值</th>
                <th className="text-right px-5 py-4 text-xs font-bold text-pink-500 uppercase tracking-wider">損益</th>
                <th className="text-right px-5 py-4 text-xs font-bold text-pink-500 uppercase tracking-wider">佔比</th>
                <th className="text-center px-5 py-4 text-xs font-bold text-pink-500 uppercase tracking-wider">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-pink-50">
              {holdings.map((holding, index) => {
                const isProfit = holding.unrealizedPnL >= 0;
                const pnlColor = isProfit ? 'text-emerald-500' : 'text-rose-500';
                const rowBg = index % 2 === 0 ? 'bg-white/50' : 'bg-pink-50/30';

                return (
                  <tr key={holding.id} className={`${rowBg} hover:bg-pink-50/50 transition-colors`}>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-200 to-purple-200 flex items-center justify-center font-bold text-pink-600 text-sm">
                          {holding.symbol.slice(0, 2)}
                        </div>
                        <div>
                          <div className="font-bold text-gray-800">{holding.symbol}</div>
                          <div className="text-sm text-pink-400 truncate max-w-[120px]">{holding.name}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-right font-semibold text-gray-700">
                      {holding.quantity.toLocaleString()}
                    </td>
                    <td className="px-5 py-4 text-right text-pink-500 font-medium">
                      {formatCurrency(holding.costBasis, holding.originalCurrency || 'USD')}
                    </td>
                    <td className="px-5 py-4 text-right text-gray-800 font-bold">
                      {holding.currentPrice > 0 ? formatCurrency(holding.currentPrice, holding.originalCurrency || 'USD') : '--'}
                    </td>
                    <td className="px-5 py-4 text-right text-gray-700 font-semibold">
                      {holding.originalMarketValue > 0 ? formatCurrency(holding.originalMarketValue, holding.originalCurrency || 'USD') : '--'}
                    </td>
                    <td className={`px-5 py-4 text-right ${pnlColor}`}>
                      {holding.currentPrice > 0 ? (
                        <div>
                          <div className="font-bold">{isProfit ? '+' : ''}{formatCurrency((holding.currentPrice - holding.costBasis) * holding.quantity, holding.originalCurrency || 'USD')}</div>
                          <div className="text-xs font-medium">{formatPercent(holding.unrealizedPnLPercent)}</div>
                        </div>
                      ) : '--'}
                    </td>
                    <td className="px-5 py-4 text-right text-purple-500 font-semibold">
                      {holding.weight > 0 ? `${(holding.weight * 100).toFixed(1)}%` : '--'}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => setEditingHolding(holding)}
                          className="p-2 text-pink-400 hover:text-pink-600 hover:bg-pink-100 rounded-xl transition-all"
                          title="編輯"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDelete(holding.id, holding.symbol)}
                          className="p-2 text-pink-400 hover:text-rose-500 hover:bg-rose-100 rounded-xl transition-all"
                          title="刪除"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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

        {/* 手機版卡片列表 */}
        <div className="md:hidden divide-y divide-pink-100">
          {holdings.map((holding) => {
            const isProfit = holding.unrealizedPnL >= 0;
            const pnlColor = isProfit ? 'text-emerald-500' : 'text-rose-500';
            const pnlBg = isProfit ? 'bg-emerald-50' : 'bg-rose-50';

            return (
              <div key={holding.id} className="p-5">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-pink-200 to-purple-200 flex items-center justify-center font-bold text-pink-600">
                      {holding.symbol.slice(0, 2)}
                    </div>
                    <div>
                      <div className="font-bold text-gray-800">{holding.symbol}</div>
                      <div className="text-sm text-pink-400">{holding.name}</div>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => setEditingHolding(holding)}
                      className="p-2 text-pink-400 hover:text-pink-600 hover:bg-pink-100 rounded-xl transition-all"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleDelete(holding.id, holding.symbol)}
                      className="p-2 text-pink-400 hover:text-rose-500 hover:bg-rose-100 rounded-xl transition-all"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="bg-pink-50/50 rounded-xl p-3">
                    <span className="text-pink-400 text-xs font-medium">股數</span>
                    <div className="text-gray-800 font-semibold">{holding.quantity.toLocaleString()}</div>
                  </div>
                  <div className="bg-pink-50/50 rounded-xl p-3">
                    <span className="text-pink-400 text-xs font-medium">成本</span>
                    <div className="text-gray-800 font-semibold">{formatCurrency(holding.costBasis, holding.originalCurrency || 'USD')}</div>
                  </div>
                  <div className="bg-purple-50/50 rounded-xl p-3">
                    <span className="text-purple-400 text-xs font-medium">現價</span>
                    <div className="text-gray-800 font-bold">
                      {holding.currentPrice > 0 ? formatCurrency(holding.currentPrice, holding.originalCurrency || 'USD') : '--'}
                    </div>
                  </div>
                  <div className="bg-purple-50/50 rounded-xl p-3">
                    <span className="text-purple-400 text-xs font-medium">市值</span>
                    <div className="text-gray-800 font-semibold">
                      {holding.originalMarketValue > 0 ? formatCurrency(holding.originalMarketValue, holding.originalCurrency || 'USD') : '--'}
                    </div>
                  </div>
                </div>
                {holding.currentPrice > 0 && (
                  <div className={`mt-4 p-3 rounded-2xl ${pnlBg} flex justify-between items-center`}>
                    <span className="text-sm text-gray-600 font-medium">損益</span>
                    <span className={`font-bold ${pnlColor}`}>
                      {isProfit ? '+' : ''}{formatCurrency((holding.currentPrice - holding.costBasis) * holding.quantity, holding.originalCurrency || 'USD')} ({formatPercent(holding.unrealizedPnLPercent)})
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* 編輯 Modal */}
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
