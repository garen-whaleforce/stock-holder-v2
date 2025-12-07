'use client';

import { useState } from 'react';
import { Market, HoldingMarket, AssetClass, BondCategory, CURRENCY_SYMBOLS } from '@/lib/types';

// 資產類型選項
type AssetTypeOption = 'equity' | 'corp' | 'ust';

interface AddHoldingFormProps {
  market: Market;
  onAdd: (holding: {
    symbol: string;
    quantity: number;
    costBasis: number;
    holdingMarket?: HoldingMarket;
    assetClass?: AssetClass;
    bondCategory?: BondCategory;
    couponRate?: number;
    maturityDate?: string;
    currentPrice?: number;
    name?: string;
  }) => void;
  isLoading: boolean;
}

export default function AddHoldingForm({ market, onAdd, isLoading }: AddHoldingFormProps) {
  const [assetType, setAssetType] = useState<AssetTypeOption>('equity');
  const [symbol, setSymbol] = useState('');
  const [bondName, setBondName] = useState('');
  const [quantity, setQuantity] = useState('');
  const [costBasis, setCostBasis] = useState('');
  const [holdingMarket, setHoldingMarket] = useState<HoldingMarket>('US');
  const [couponRate, setCouponRate] = useState('');
  const [maturityDate, setMaturityDate] = useState('');
  const [currentPrice, setCurrentPrice] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const isMixed = market === 'MIXED';
  const effectiveMarket = isMixed ? holdingMarket : market;
  const isTwMarket = effectiveMarket === 'TW';
  const currencySymbol = isTwMarket ? CURRENCY_SYMBOLS.TWD : CURRENCY_SYMBOLS.USD;
  const symbolPlaceholder = isTwMarket ? 'e.g., 2330' : 'e.g., AAPL';
  const costPlaceholder = isTwMarket ? '650.00' : '150.00';

  const isBond = assetType === 'corp' || assetType === 'ust';

  const getAssetTypeLabel = (type: AssetTypeOption): string => {
    switch (type) {
      case 'equity': return '股票';
      case 'corp': return '公司債';
      case 'ust': return '美國公債';
    }
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (isBond) {
      // 債券驗證
      if (!symbol.trim()) {
        newErrors.symbol = '請輸入債券代號';
      }

      const qty = parseFloat(quantity);
      if (!quantity || isNaN(qty) || qty <= 0) {
        newErrors.quantity = '請輸入有效的面額';
      }

      const cost = parseFloat(costBasis);
      if (!costBasis || isNaN(cost) || cost <= 0) {
        newErrors.costBasis = '請輸入有效的買入價格';
      }

      const price = parseFloat(currentPrice);
      if (!currentPrice || isNaN(price) || price <= 0) {
        newErrors.currentPrice = '請輸入有效的目前價格';
      }

      if (couponRate) {
        const rate = parseFloat(couponRate);
        if (isNaN(rate) || rate < 0 || rate > 100) {
          newErrors.couponRate = '票面利率須為 0-100';
        }
      }

      if (maturityDate) {
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (!dateRegex.test(maturityDate)) {
          newErrors.maturityDate = '日期格式須為 YYYY-MM-DD';
        }
      }
    } else {
      // 股票驗證
      if (!symbol.trim()) {
        newErrors.symbol = '請輸入股票代號';
      } else if (isTwMarket) {
        if (!/^\d{4,6}$/.test(symbol.trim())) {
          newErrors.symbol = '台股代號須為 4-6 位數字';
        }
      } else {
        if (!/^[A-Za-z]{1,5}$/.test(symbol.trim())) {
          newErrors.symbol = '美股代號須為 1-5 個英文字母';
        }
      }

      const qty = parseFloat(quantity);
      if (!quantity || isNaN(qty) || qty <= 0) {
        newErrors.quantity = '請輸入有效的股數';
      }

      const cost = parseFloat(costBasis);
      if (!costBasis || isNaN(cost) || cost <= 0) {
        newErrors.costBasis = '請輸入有效的成本';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    if (isBond) {
      onAdd({
        symbol: symbol.trim().toUpperCase(),
        quantity: parseFloat(quantity),
        costBasis: parseFloat(costBasis),
        holdingMarket: 'US', // 債券只支援美股市場
        assetClass: 'bond',
        bondCategory: assetType as BondCategory,
        couponRate: couponRate ? parseFloat(couponRate) : undefined,
        maturityDate: maturityDate || undefined,
        currentPrice: parseFloat(currentPrice),
        name: bondName.trim() || undefined,
      });
    } else {
      const cleanedSymbol = isTwMarket
        ? symbol.trim()
        : symbol.trim().toUpperCase();

      onAdd({
        symbol: cleanedSymbol,
        quantity: parseFloat(quantity),
        costBasis: parseFloat(costBasis),
        holdingMarket: isMixed ? holdingMarket : undefined,
      });
    }

    // 重置表單
    setSymbol('');
    setBondName('');
    setQuantity('');
    setCostBasis('');
    setCouponRate('');
    setMaturityDate('');
    setCurrentPrice('');
    setErrors({});
  };

  const handleSymbolChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (isBond) {
      setSymbol(value.toUpperCase());
    } else if (isTwMarket) {
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

  const handleAssetTypeChange = (type: AssetTypeOption) => {
    setAssetType(type);
    // 重置表單
    setSymbol('');
    setBondName('');
    setQuantity('');
    setCostBasis('');
    setCouponRate('');
    setMaturityDate('');
    setCurrentPrice('');
    setErrors({});
    // 債券只支援美股市場
    if (type !== 'equity') {
      setHoldingMarket('US');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="card p-5">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-10 h-10 rounded-lg bg-navy-100 flex items-center justify-center">
          <svg className="w-5 h-5 text-navy-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
        </div>
        <div>
          <h3 className="font-semibold text-slate-800">新增持股</h3>
          <p className="text-xs text-slate-500">輸入您的資產資訊</p>
        </div>
      </div>

      {/* 資產類型選擇器 */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-slate-700 mb-2">
          資產類型
        </label>
        <div className="flex gap-2">
          {(['equity', 'corp', 'ust'] as AssetTypeOption[]).map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => handleAssetTypeChange(type)}
              disabled={isLoading}
              className={`flex-1 px-3 py-2 rounded-lg font-medium text-sm transition-all ${
                assetType === type
                  ? type === 'equity'
                    ? 'bg-navy-800 text-white'
                    : type === 'corp'
                    ? 'bg-amber-600 text-white'
                    : 'bg-emerald-600 text-white'
                  : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-50'
              }`}
            >
              {getAssetTypeLabel(type)}
            </button>
          ))}
        </div>
      </div>

      {isBond ? (
        // 債券表單
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                債券代號 <span className="text-danger-500">*</span>
              </label>
              <input
                type="text"
                value={symbol}
                onChange={handleSymbolChange}
                placeholder="e.g., TLT, BND"
                className={`w-full px-3 py-2.5 border rounded-lg font-medium transition-colors ${
                  errors.symbol ? 'border-danger-300 focus:border-danger-500' : 'border-slate-300 focus:border-navy-500'
                }`}
                disabled={isLoading}
              />
              {errors.symbol && (
                <p className="mt-1 text-xs text-danger-600">{errors.symbol}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                債券名稱
              </label>
              <input
                type="text"
                value={bondName}
                onChange={(e) => setBondName(e.target.value)}
                placeholder="e.g., US Treasury 10Y"
                className="w-full px-3 py-2.5 border border-slate-300 rounded-lg font-medium transition-colors focus:border-navy-500"
                disabled={isLoading}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                總面額 ($) <span className="text-danger-500">*</span>
              </label>
              <input
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="10000"
                step="100"
                min="0"
                className={`w-full px-3 py-2.5 border rounded-lg font-medium transition-colors ${
                  errors.quantity ? 'border-danger-300 focus:border-danger-500' : 'border-slate-300 focus:border-navy-500'
                }`}
                disabled={isLoading}
              />
              {errors.quantity && (
                <p className="mt-1 text-xs text-danger-600">{errors.quantity}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                買入價格 (每$100) <span className="text-danger-500">*</span>
              </label>
              <input
                type="number"
                value={costBasis}
                onChange={(e) => setCostBasis(e.target.value)}
                placeholder="98.50"
                step="0.01"
                min="0"
                className={`w-full px-3 py-2.5 border rounded-lg font-medium transition-colors ${
                  errors.costBasis ? 'border-danger-300 focus:border-danger-500' : 'border-slate-300 focus:border-navy-500'
                }`}
                disabled={isLoading}
              />
              {errors.costBasis && (
                <p className="mt-1 text-xs text-danger-600">{errors.costBasis}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                目前價格 (每$100) <span className="text-danger-500">*</span>
              </label>
              <input
                type="number"
                value={currentPrice}
                onChange={(e) => setCurrentPrice(e.target.value)}
                placeholder="99.25"
                step="0.01"
                min="0"
                className={`w-full px-3 py-2.5 border rounded-lg font-medium transition-colors ${
                  errors.currentPrice ? 'border-danger-300 focus:border-danger-500' : 'border-slate-300 focus:border-navy-500'
                }`}
                disabled={isLoading}
              />
              {errors.currentPrice && (
                <p className="mt-1 text-xs text-danger-600">{errors.currentPrice}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                票面利率 (%)
              </label>
              <input
                type="number"
                value={couponRate}
                onChange={(e) => setCouponRate(e.target.value)}
                placeholder="4.25"
                step="0.01"
                min="0"
                max="100"
                className={`w-full px-3 py-2.5 border rounded-lg font-medium transition-colors ${
                  errors.couponRate ? 'border-danger-300 focus:border-danger-500' : 'border-slate-300 focus:border-navy-500'
                }`}
                disabled={isLoading}
              />
              {errors.couponRate && (
                <p className="mt-1 text-xs text-danger-600">{errors.couponRate}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                到期日
              </label>
              <input
                type="date"
                value={maturityDate}
                onChange={(e) => setMaturityDate(e.target.value)}
                className={`w-full px-3 py-2.5 border rounded-lg font-medium transition-colors ${
                  errors.maturityDate ? 'border-danger-300 focus:border-danger-500' : 'border-slate-300 focus:border-navy-500'
                }`}
                disabled={isLoading}
              />
              {errors.maturityDate && (
                <p className="mt-1 text-xs text-danger-600">{errors.maturityDate}</p>
              )}
            </div>

            <div className="flex items-end">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span>新增中...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    <span>新增</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      ) : (
        // 股票表單
        <div className={`grid grid-cols-1 gap-4 ${isMixed ? 'sm:grid-cols-5' : 'sm:grid-cols-4'}`}>
          {isMixed && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                市場
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => handleMarketChange('US')}
                  disabled={isLoading}
                  className={`flex-1 px-3 py-2.5 rounded-lg font-medium text-sm transition-all ${
                    holdingMarket === 'US'
                      ? 'bg-navy-800 text-white'
                      : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  US
                </button>
                <button
                  type="button"
                  onClick={() => handleMarketChange('TW')}
                  disabled={isLoading}
                  className={`flex-1 px-3 py-2.5 rounded-lg font-medium text-sm transition-all ${
                    holdingMarket === 'TW'
                      ? 'bg-navy-800 text-white'
                      : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  TW
                </button>
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              股票代號
            </label>
            <input
              type="text"
              value={symbol}
              onChange={handleSymbolChange}
              placeholder={symbolPlaceholder}
              className={`w-full px-3 py-2.5 border rounded-lg font-medium transition-colors ${
                errors.symbol ? 'border-danger-300 focus:border-danger-500' : 'border-slate-300 focus:border-navy-500'
              }`}
              disabled={isLoading}
            />
            {errors.symbol && (
              <p className="mt-1 text-xs text-danger-600">{errors.symbol}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              股數
            </label>
            <input
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder="100"
              step="0.01"
              min="0"
              className={`w-full px-3 py-2.5 border rounded-lg font-medium transition-colors ${
                errors.quantity ? 'border-danger-300 focus:border-danger-500' : 'border-slate-300 focus:border-navy-500'
              }`}
              disabled={isLoading}
            />
            {errors.quantity && (
              <p className="mt-1 text-xs text-danger-600">{errors.quantity}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              成本價 ({currencySymbol})
            </label>
            <input
              type="number"
              value={costBasis}
              onChange={(e) => setCostBasis(e.target.value)}
              placeholder={costPlaceholder}
              step="0.01"
              min="0"
              className={`w-full px-3 py-2.5 border rounded-lg font-medium transition-colors ${
                errors.costBasis ? 'border-danger-300 focus:border-danger-500' : 'border-slate-300 focus:border-navy-500'
              }`}
              disabled={isLoading}
            />
            {errors.costBasis && (
              <p className="mt-1 text-xs text-danger-600">{errors.costBasis}</p>
            )}
          </div>

          <div className="flex items-end">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span>新增中...</span>
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  <span>新增</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </form>
  );
}
