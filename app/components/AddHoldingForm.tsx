'use client';

import { useState } from 'react';
import { Market, HoldingMarket, CURRENCY_SYMBOLS } from '@/lib/types';

interface AddHoldingFormProps {
  market: Market;
  onAdd: (symbol: string, quantity: number, costBasis: number, holdingMarket?: HoldingMarket) => void;
  isLoading: boolean;
}

export default function AddHoldingForm({ market, onAdd, isLoading }: AddHoldingFormProps) {
  const [symbol, setSymbol] = useState('');
  const [quantity, setQuantity] = useState('');
  const [costBasis, setCostBasis] = useState('');
  const [holdingMarket, setHoldingMarket] = useState<HoldingMarket>('US');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const isMixed = market === 'MIXED';
  const effectiveMarket = isMixed ? holdingMarket : market;
  const isTwMarket = effectiveMarket === 'TW';
  const currencySymbol = isTwMarket ? CURRENCY_SYMBOLS.TWD : CURRENCY_SYMBOLS.USD;
  const symbolPlaceholder = isTwMarket ? '例如: 2330' : '例如: AAPL';
  const costPlaceholder = isTwMarket ? '650.00' : '150.00';

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!symbol.trim()) {
      newErrors.symbol = '請輸入股票代碼';
    } else if (isTwMarket) {
      if (!/^\d{4,6}$/.test(symbol.trim())) {
        newErrors.symbol = '台股代碼須為 4-6 位數字';
      }
    } else {
      if (!/^[A-Za-z]{1,5}$/.test(symbol.trim())) {
        newErrors.symbol = '美股代碼須為 1-5 個英文字母';
      }
    }

    const qty = parseFloat(quantity);
    if (!quantity || isNaN(qty) || qty <= 0) {
      newErrors.quantity = '請輸入有效股數';
    }

    const cost = parseFloat(costBasis);
    if (!costBasis || isNaN(cost) || cost <= 0) {
      newErrors.costBasis = '請輸入有效成本';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const cleanedSymbol = isTwMarket
      ? symbol.trim()
      : symbol.trim().toUpperCase();

    onAdd(
      cleanedSymbol,
      parseFloat(quantity),
      parseFloat(costBasis),
      isMixed ? holdingMarket : undefined
    );

    setSymbol('');
    setQuantity('');
    setCostBasis('');
    setErrors({});
  };

  const handleSymbolChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (isTwMarket) {
      setSymbol(value.replace(/[^0-9]/g, ''));
    } else {
      setSymbol(value.toUpperCase());
    }
  };

  const handleMarketChange = (newMarket: HoldingMarket) => {
    setHoldingMarket(newMarket);
    setSymbol('');
    setErrors({});
  };

  return (
    <form onSubmit={handleSubmit} className="card-cute p-6">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-pink-400 to-rose-400 flex items-center justify-center shadow-lg shadow-pink-200/50">
          <span className="text-xl">➕</span>
        </div>
        <h3 className="text-lg font-bold text-gray-800">新增持股</h3>
      </div>
      <div className={`grid grid-cols-1 gap-4 ${isMixed ? 'sm:grid-cols-5' : 'sm:grid-cols-4'}`}>
        {isMixed && (
          <div>
            <label className="block text-sm font-semibold text-pink-500 mb-2">
              市場
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => handleMarketChange('US')}
                disabled={isLoading}
                className={`flex-1 px-3 py-2.5 rounded-xl font-semibold text-sm transition-all ${
                  holdingMarket === 'US'
                    ? 'bg-gradient-to-r from-blue-400 to-blue-500 text-white shadow-lg shadow-blue-200/50'
                    : 'bg-white border-2 border-pink-200 text-pink-500 hover:border-pink-300'
                }`}
              >
                🇺🇸 美股
              </button>
              <button
                type="button"
                onClick={() => handleMarketChange('TW')}
                disabled={isLoading}
                className={`flex-1 px-3 py-2.5 rounded-xl font-semibold text-sm transition-all ${
                  holdingMarket === 'TW'
                    ? 'bg-gradient-to-r from-green-400 to-emerald-500 text-white shadow-lg shadow-green-200/50'
                    : 'bg-white border-2 border-pink-200 text-pink-500 hover:border-pink-300'
                }`}
              >
                🇹🇼 台股
              </button>
            </div>
          </div>
        )}

        <div>
          <label className="block text-sm font-semibold text-pink-500 mb-2">
            股票代碼
          </label>
          <input
            type="text"
            value={symbol}
            onChange={handleSymbolChange}
            placeholder={symbolPlaceholder}
            className={`w-full px-4 py-2.5 border-2 rounded-xl bg-white/80 font-medium transition-colors ${
              errors.symbol ? 'border-rose-300 focus:border-rose-400' : 'border-pink-200 focus:border-pink-400'
            }`}
            disabled={isLoading}
          />
          {errors.symbol && (
            <p className="mt-1 text-xs text-rose-500 font-medium">{errors.symbol}</p>
          )}
        </div>
        <div>
          <label className="block text-sm font-semibold text-pink-500 mb-2">
            股數
          </label>
          <input
            type="number"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            placeholder="100"
            step="0.01"
            min="0"
            className={`w-full px-4 py-2.5 border-2 rounded-xl bg-white/80 font-medium transition-colors ${
              errors.quantity ? 'border-rose-300 focus:border-rose-400' : 'border-pink-200 focus:border-pink-400'
            }`}
            disabled={isLoading}
          />
          {errors.quantity && (
            <p className="mt-1 text-xs text-rose-500 font-medium">{errors.quantity}</p>
          )}
        </div>
        <div>
          <label className="block text-sm font-semibold text-pink-500 mb-2">
            平均成本 ({currencySymbol})
          </label>
          <input
            type="number"
            value={costBasis}
            onChange={(e) => setCostBasis(e.target.value)}
            placeholder={costPlaceholder}
            step="0.01"
            min="0"
            className={`w-full px-4 py-2.5 border-2 rounded-xl bg-white/80 font-medium transition-colors ${
              errors.costBasis ? 'border-rose-300 focus:border-rose-400' : 'border-pink-200 focus:border-pink-400'
            }`}
            disabled={isLoading}
          />
          {errors.costBasis && (
            <p className="mt-1 text-xs text-rose-500 font-medium">{errors.costBasis}</p>
          )}
        </div>
        <div className="flex items-end">
          <button
            type="submit"
            disabled={isLoading}
            className="w-full btn-cute-primary flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <span>處理中</span>
              </>
            ) : (
              <>
                <span className="text-lg">✨</span>
                <span>新增</span>
              </>
            )}
          </button>
        </div>
      </div>
    </form>
  );
}
