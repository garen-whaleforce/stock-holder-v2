'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Profile, Holding, HoldingWithMetrics, PortfolioSummary, Quote, StoredData, HoldingMarket, RiskLevel } from '@/lib/types';
import { loadFromStorage, saveToStorage, updatePriceCache, getAllCachedPrices } from '@/lib/storage';
import {
  calculateAllHoldingsMetrics,
  calculatePortfolioSummary,
  buildPortfolioPayload,
  quotesToPriceMap,
  quotesToNameMap,
} from '@/lib/portfolio';

import ProfileSelector from './ProfileSelector';
import SummaryCards from './SummaryCards';
import AddHoldingForm from './AddHoldingForm';
import HoldingsTable from './HoldingsTable';
import PieChartCard from './PieChartCard';
import ChartsSection from './ChartsSection';
import AdvicePanel from './AdvicePanel';
import Toast from './Toast';

export default function PortfolioPage() {
  const [isClient, setIsClient] = useState(false);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [activeProfileId, setActiveProfileId] = useState<string>('');
  const [priceMap, setPriceMap] = useState<Record<string, number>>({});
  const [nameMap, setNameMap] = useState<Record<string, string>>({});
  const [holdingsWithMetrics, setHoldingsWithMetrics] = useState<HoldingWithMetrics[]>([]);
  const [summary, setSummary] = useState<PortfolioSummary | null>(null);
  const [isLoadingQuotes, setIsLoadingQuotes] = useState(false);
  const [isLoadingAdvice, setIsLoadingAdvice] = useState(false);
  const [advice, setAdvice] = useState<string | null>(null);
  const [adviceError, setAdviceError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [exchangeRate, setExchangeRate] = useState<number>(32);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const activeProfile = profiles.find((p) => p.id === activeProfileId);
  const isMixed = activeProfile?.market === 'MIXED';

  const fetchExchangeRate = useCallback(async () => {
    try {
      const response = await fetch('/api/exchange-rate');
      if (response.ok) {
        const data = await response.json();
        setExchangeRate(data.rate);
      }
    } catch (error) {
      console.error('Failed to fetch exchange rate:', error);
    }
  }, []);

  useEffect(() => {
    setIsClient(true);
    const data = loadFromStorage();
    setProfiles(data.profiles);
    setActiveProfileId(data.activeProfileId);
    const cached = getAllCachedPrices();
    setPriceMap(cached);
  }, []);

  useEffect(() => {
    if (isMixed) {
      fetchExchangeRate();
    }
  }, [isMixed, fetchExchangeRate]);

  useEffect(() => {
    if (!activeProfile) return;

    const updatedHoldings = activeProfile.holdings.map((h) => ({
      ...h,
      name: nameMap[h.symbol] || h.name || h.symbol,
    }));

    const metrics = calculateAllHoldingsMetrics(
      updatedHoldings,
      priceMap,
      activeProfile.market || 'US',
      activeProfile.baseCurrency || 'USD',
      exchangeRate
    );
    setHoldingsWithMetrics(metrics);

    const portfolioSummary = calculatePortfolioSummary(metrics, isMixed ? exchangeRate : undefined);
    setSummary(portfolioSummary);
  }, [activeProfile, priceMap, nameMap, exchangeRate, isMixed]);

  const saveData = useCallback((newProfiles: Profile[], newActiveId: string) => {
    const data: StoredData = {
      profiles: newProfiles,
      activeProfileId: newActiveId,
      priceCache: {},
    };
    saveToStorage(data);
    setProfiles(newProfiles);
    setActiveProfileId(newActiveId);
  }, []);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type });
  };

  const handleSelectProfile = (profileId: string) => {
    setActiveProfileId(profileId);
    const data = loadFromStorage();
    data.activeProfileId = profileId;
    saveToStorage(data);
    setAdvice(null);
    setAdviceError(null);
  };

  const handleCreateProfile = (profile: Profile) => {
    const newProfiles = [...profiles, profile];
    saveData(newProfiles, profile.id);
    showToast('Portfolio created');
  };

  const handleDeleteProfile = (profileId: string) => {
    const newProfiles = profiles.filter((p) => p.id !== profileId);
    const newActiveId = newProfiles[0]?.id || '';
    saveData(newProfiles, newActiveId);
    showToast('Portfolio deleted');
  };

  const handleUpdateProfile = (profile: Profile) => {
    const newProfiles = profiles.map((p) => (p.id === profile.id ? profile : p));
    saveData(newProfiles, activeProfileId);
    showToast('Portfolio updated');
  };

  const handleRiskLevelChange = (riskLevel: RiskLevel) => {
    if (!activeProfile) return;
    const updatedProfile = { ...activeProfile, riskLevel };
    const newProfiles = profiles.map((p) => (p.id === activeProfile.id ? updatedProfile : p));
    saveData(newProfiles, activeProfileId);
  };

  const handleAddHolding = async (symbol: string, quantity: number, costBasis: number, holdingMarket?: HoldingMarket) => {
    if (!activeProfile) return;

    const existingIndex = activeProfile.holdings.findIndex((h) => h.symbol === symbol);

    let updatedHoldings: Holding[];
    if (existingIndex >= 0) {
      const existing = activeProfile.holdings[existingIndex];
      const totalQuantity = existing.quantity + quantity;
      const totalCost = existing.costBasis * existing.quantity + costBasis * quantity;
      const newCostBasis = totalCost / totalQuantity;

      updatedHoldings = [...activeProfile.holdings];
      updatedHoldings[existingIndex] = {
        ...existing,
        quantity: totalQuantity,
        costBasis: newCostBasis,
      };
    } else {
      const newHolding: Holding = {
        id: uuidv4(),
        symbol,
        name: nameMap[symbol] || symbol,
        quantity,
        costBasis,
        market: holdingMarket,
      };
      updatedHoldings = [...activeProfile.holdings, newHolding];
    }

    const updatedProfile = { ...activeProfile, holdings: updatedHoldings };
    const newProfiles = profiles.map((p) => (p.id === activeProfile.id ? updatedProfile : p));
    saveData(newProfiles, activeProfileId);
    showToast(`${existingIndex >= 0 ? 'Updated' : 'Added'} ${symbol}`);

    if (!priceMap[symbol]) {
      await fetchQuotesForSymbols([symbol], holdingMarket);
    }
  };

  const handleEditHolding = (holding: Holding) => {
    if (!activeProfile) return;

    const updatedHoldings = activeProfile.holdings.map((h) =>
      h.id === holding.id ? holding : h
    );
    const updatedProfile = { ...activeProfile, holdings: updatedHoldings };
    const newProfiles = profiles.map((p) => (p.id === activeProfile.id ? updatedProfile : p));
    saveData(newProfiles, activeProfileId);
    showToast('Position updated');
  };

  const handleDeleteHolding = (id: string) => {
    if (!activeProfile) return;

    const updatedHoldings = activeProfile.holdings.filter((h) => h.id !== id);
    const updatedProfile = { ...activeProfile, holdings: updatedHoldings };
    const newProfiles = profiles.map((p) => (p.id === activeProfile.id ? updatedProfile : p));
    saveData(newProfiles, activeProfileId);
    showToast('持股已刪除');
  };

  const fetchQuotesForSymbols = async (symbols: string[], holdingMarket?: HoldingMarket) => {
    if (symbols.length === 0 || !activeProfile) return;

    setIsLoadingQuotes(true);
    try {
      let requestBody: Record<string, unknown>;

      if (activeProfile.market === 'MIXED') {
        if (holdingMarket) {
          if (holdingMarket === 'US') {
            requestBody = { market: 'MIXED', usSymbols: symbols, twSymbols: [] };
          } else {
            requestBody = { market: 'MIXED', usSymbols: [], twSymbols: symbols };
          }
        } else {
          const usSymbols = activeProfile.holdings
            .filter((h) => h.market === 'US')
            .map((h) => h.symbol);
          const twSymbols = activeProfile.holdings
            .filter((h) => h.market === 'TW')
            .map((h) => h.symbol);
          requestBody = { market: 'MIXED', usSymbols, twSymbols };
        }
      } else {
        requestBody = { symbols, market: activeProfile.market || 'US' };
      }

      const response = await fetch('/api/quotes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch quotes');
      }

      const data = await response.json();
      const quotes: Quote[] = data.quotes;

      const newPriceMap = quotesToPriceMap(quotes);
      const newNameMap = quotesToNameMap(quotes);

      setPriceMap((prev) => ({ ...prev, ...newPriceMap }));
      setNameMap((prev) => ({ ...prev, ...newNameMap }));

      updatePriceCache(newPriceMap);

      if (activeProfile) {
        const needsUpdate = activeProfile.holdings.some(
          (h) => newNameMap[h.symbol] && h.name !== newNameMap[h.symbol]
        );
        if (needsUpdate) {
          const updatedHoldings = activeProfile.holdings.map((h) => ({
            ...h,
            name: newNameMap[h.symbol] || h.name,
          }));
          const updatedProfile = { ...activeProfile, holdings: updatedHoldings };
          const newProfiles = profiles.map((p) =>
            p.id === activeProfile.id ? updatedProfile : p
          );
          saveData(newProfiles, activeProfileId);
        }
      }

      showToast('報價已更新');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch quotes';
      showToast(message, 'error');
    } finally {
      setIsLoadingQuotes(false);
    }
  };

  const handleRefreshQuotes = () => {
    if (!activeProfile || activeProfile.holdings.length === 0) {
      showToast('沒有持股需要更新', 'info');
      return;
    }

    const symbols = activeProfile.holdings.map((h) => h.symbol);
    fetchQuotesForSymbols(symbols);
  };

  const handleGetAdvice = async () => {
    if (!activeProfile || holdingsWithMetrics.length === 0 || !summary) {
      showToast('請先新增持股並更新報價', 'info');
      return;
    }

    const hasNoPrices = holdingsWithMetrics.every((h) => h.currentPrice === 0);
    if (hasNoPrices) {
      showToast('請先更新報價', 'info');
      return;
    }

    setIsLoadingAdvice(true);
    setAdviceError(null);

    try {
      const payload = buildPortfolioPayload(activeProfile, holdingsWithMetrics, summary);

      const response = await fetch('/api/advice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profile: payload }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to get advice');
      }

      const data = await response.json();
      if (data.advice) {
        setAdvice(data.advice);
      } else {
        setAdviceError('No advice in response');
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to get advice';
      setAdviceError(message);
    } finally {
      setIsLoadingAdvice(false);
    }
  };

  // 匯出資料
  const handleExport = () => {
    const data: StoredData = {
      profiles,
      activeProfileId,
      priceCache: {},
    };
    const jsonString = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `小金庫_備份_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('資料已匯出');
  };

  // 匯入資料
  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const data = JSON.parse(content) as StoredData;

        // 驗證資料結構
        if (!data.profiles || !Array.isArray(data.profiles)) {
          throw new Error('無效的資料格式');
        }

        // 為匯入的 profiles 產生新的 ID 避免衝突
        const importedProfiles = data.profiles.map((p) => ({
          ...p,
          id: uuidv4(),
          holdings: p.holdings.map((h) => ({ ...h, id: uuidv4() })),
        }));

        // 合併現有和匯入的 profiles
        const newProfiles = [...profiles, ...importedProfiles];
        const newActiveId = importedProfiles[0]?.id || activeProfileId;

        saveData(newProfiles, newActiveId);
        showToast(`成功匯入 ${importedProfiles.length} 個投資組合`);
      } catch (error) {
        console.error('Import error:', error);
        showToast('匯入失敗：檔案格式不正確', 'error');
      }
    };
    reader.readAsText(file);

    // 清空 input 讓同一檔案可以再次選取
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  if (!isClient) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{background: 'linear-gradient(135deg, #fef3f2 0%, #fef9c3 25%, #dcfce7 50%, #e0f2fe 75%, #f3e8ff 100%)'}}>
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-5 rounded-2xl flex items-center justify-center relative overflow-hidden" style={{background: 'linear-gradient(135deg, #f472b6 0%, #8b5cf6 50%, #3b82f6 100%)'}}>
            <div className="absolute inset-0 bg-gradient-to-br from-white/30 to-transparent"></div>
            <svg className="w-8 h-8 text-white relative z-10 animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 bg-clip-text text-transparent mb-2">小金庫</h2>
          <p className="text-slate-500 font-medium text-sm">載入中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-white/70 backdrop-blur-xl border-b border-white/50 sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl flex items-center justify-center relative overflow-hidden" style={{background: 'linear-gradient(135deg, #f472b6 0%, #8b5cf6 50%, #3b82f6 100%)'}}>
                <div className="absolute inset-0 bg-gradient-to-br from-white/30 to-transparent"></div>
                <svg className="w-6 h-6 text-white relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <div>
                <h1 className="text-xl font-extrabold bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 bg-clip-text text-transparent tracking-tight">小金庫</h1>
                <p className="text-xs text-slate-500 hidden sm:block font-medium">投資組合管理</p>
              </div>
            </div>
            <ProfileSelector
              profiles={profiles}
              activeProfileId={activeProfileId}
              onSelectProfile={handleSelectProfile}
              onCreateProfile={handleCreateProfile}
              onDeleteProfile={handleDeleteProfile}
              onUpdateProfile={handleUpdateProfile}
            />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex-1 w-full">
        <div className="space-y-6">
          {/* Summary Cards */}
          <SummaryCards
            summary={summary}
            isLoading={isLoadingQuotes}
            baseCurrency={activeProfile?.baseCurrency || 'USD'}
            exchangeRate={exchangeRate}
            isMixed={isMixed}
          />

          {/* Add Holding Form */}
          <AddHoldingForm
            market={activeProfile?.market || 'US'}
            onAdd={handleAddHolding}
            isLoading={isLoadingQuotes}
          />

          {/* Refresh Button */}
          <div className="flex justify-end">
            <button
              onClick={handleRefreshQuotes}
              disabled={isLoadingQuotes || !activeProfile?.holdings.length}
              className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoadingQuotes ? (
                <>
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span>更新中...</span>
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  <span>更新報價</span>
                </>
              )}
            </button>
          </div>

          {/* Holdings Table - Full Width */}
          <HoldingsTable
            holdings={holdingsWithMetrics}
            onEdit={handleEditHolding}
            onDelete={handleDeleteHolding}
            isLoading={isLoadingQuotes}
          />

          {/* Pie Chart - Below Table */}
          <PieChartCard holdings={holdingsWithMetrics} isLoading={isLoadingQuotes} />

          {/* Charts Section - Multiple Charts */}
          <ChartsSection
            holdings={holdingsWithMetrics}
            isLoading={isLoadingQuotes}
            isMixed={isMixed}
          />

          {/* AI Advice */}
          <AdvicePanel
            advice={advice}
            isLoading={isLoadingAdvice}
            error={adviceError}
            onGetAdvice={handleGetAdvice}
            disabled={!activeProfile?.holdings.length || holdingsWithMetrics.every((h) => h.currentPrice === 0)}
            riskLevel={activeProfile?.riskLevel || 'balanced'}
            onRiskLevelChange={handleRiskLevelChange}
          />
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white/60 backdrop-blur-sm border-t border-slate-200/50 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-center text-xs text-slate-400 font-medium">
              本工具僅供資訊參考，不構成投資建議
            </p>
            <div className="flex items-center gap-3">
              {/* 隱藏的 file input */}
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImport}
                accept=".json"
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-all flex items-center gap-1.5"
                title="匯入資料"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
                匯入
              </button>
              <button
                onClick={handleExport}
                disabled={profiles.length === 0}
                className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-all flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                title="匯出資料"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                匯出
              </button>
              <span className="text-xs text-slate-300">|</span>
              <p className="text-xs text-slate-300">
                小金庫 v2.0
              </p>
            </div>
          </div>
        </div>
      </footer>

      {/* Toast */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          show={true}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}
