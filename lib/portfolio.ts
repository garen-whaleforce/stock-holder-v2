import {
  Holding,
  HoldingWithMetrics,
  PortfolioPayload,
  PortfolioSummary,
  MarketBreakdown,
  AssetClassBreakdown,
  Profile,
  Quote,
  Currency,
  HoldingMarket,
} from './types';
import { convertCurrency } from './exchangeRate';

/**
 * 根據持股或 Profile 市場決定原始幣別
 */
function getHoldingCurrency(holding: Holding, profileMarket: string): Currency {
  if (holding.market === 'TW') return 'TWD';
  if (holding.market === 'US') return 'USD';
  if (profileMarket === 'TW') return 'TWD';
  return 'USD';
}

/**
 * 計算持股的市值（區分股票與債券）
 * 股票：quantity * currentPrice
 * 債券：faceValue * (currentPrice / 100)
 */
function calculateMarketValue(holding: Holding, currentPrice: number): number {
  const isBond = holding.assetClass === 'bond';
  if (isBond) {
    // 債券：quantity = 總面額，currentPrice = 每100面額的價格
    return holding.quantity * (currentPrice / 100);
  }
  // 股票：quantity = 股數，currentPrice = 每股價格
  return holding.quantity * currentPrice;
}

/**
 * 計算持股的成本（區分股票與債券）
 * 股票：quantity * costBasis
 * 債券：faceValue * (costBasis / 100)
 */
function calculateCost(holding: Holding): number {
  const isBond = holding.assetClass === 'bond';
  if (isBond) {
    // 債券：costBasis = 買入價格（每100面額）
    return holding.quantity * (holding.costBasis / 100);
  }
  // 股票：costBasis = 每股成本
  return holding.quantity * holding.costBasis;
}

/**
 * 計算持股的損益百分比（區分股票與債券）
 */
function calculatePnLPercent(holding: Holding, currentPrice: number): number {
  if (holding.costBasis <= 0) return 0;
  // 對於股票和債券，損益百分比計算方式相同（都是價格變化百分比）
  return (currentPrice - holding.costBasis) / holding.costBasis;
}

/**
 * 計算單一持股的指標（支援匯率轉換）
 */
export function calculateHoldingMetrics(
  holding: Holding,
  currentPrice: number,
  totalMarketValue: number,
  originalCurrency: Currency = 'USD'
): HoldingWithMetrics {
  const originalMarketValue = calculateMarketValue(holding, currentPrice);
  const weight = totalMarketValue > 0 ? originalMarketValue / totalMarketValue : 0;
  const cost = calculateCost(holding);
  const unrealizedPnL = originalMarketValue - cost;
  const unrealizedPnLPercent = calculatePnLPercent(holding, currentPrice);

  return {
    ...holding,
    currentPrice,
    originalCurrency,
    marketValue: originalMarketValue, // 會在後續步驟轉換
    originalMarketValue,
    weight,
    unrealizedPnL,
    originalUnrealizedPnL: unrealizedPnL, // 單一持股函數中，原始與轉換後相同
    unrealizedPnLPercent,
  };
}

/**
 * 計算所有持股的指標（支援混合帳戶匯率轉換）
 */
export function calculateAllHoldingsMetrics(
  holdings: Holding[],
  priceMap: Record<string, number>,
  profileMarket: string = 'US',
  baseCurrency: Currency = 'USD',
  exchangeRate: number = 32
): HoldingWithMetrics[] {
  // 第一階段：計算原始市值並轉換到 baseCurrency
  let totalMarketValue = 0;
  const preliminaryData = holdings.map((holding) => {
    // 對於債券，優先使用手動輸入的 currentPrice
    const isBond = holding.assetClass === 'bond';
    const currentPrice = isBond && holding.currentPrice !== undefined
      ? holding.currentPrice
      : (priceMap[holding.symbol] || 0);
    const originalCurrency = getHoldingCurrency(holding, profileMarket);
    const originalMarketValue = calculateMarketValue(holding, currentPrice);

    // 轉換到 baseCurrency
    const convertedMarketValue = convertCurrency(
      originalMarketValue,
      originalCurrency,
      baseCurrency,
      exchangeRate
    );

    totalMarketValue += convertedMarketValue;

    return {
      holding,
      currentPrice,
      originalCurrency,
      originalMarketValue,
      convertedMarketValue,
    };
  });

  // 第二階段：計算各持股權重與轉換後的損益
  return preliminaryData.map(({ holding, currentPrice, originalCurrency, originalMarketValue, convertedMarketValue }) => {
    const weight = totalMarketValue > 0 ? convertedMarketValue / totalMarketValue : 0;
    const cost = calculateCost(holding);
    const originalPnL = originalMarketValue - cost;

    // 轉換損益到 baseCurrency
    const convertedPnL = convertCurrency(
      originalPnL,
      originalCurrency,
      baseCurrency,
      exchangeRate
    );

    const unrealizedPnLPercent = calculatePnLPercent(holding, currentPrice);

    return {
      ...holding,
      currentPrice,
      originalCurrency,
      marketValue: convertedMarketValue,
      originalMarketValue,
      weight,
      unrealizedPnL: convertedPnL,
      originalUnrealizedPnL: originalPnL, // 保存原始幣別損益
      unrealizedPnLPercent,
    };
  });
}

/**
 * 計算資產類別分布
 */
function calculateAssetClassBreakdown(
  holdingsWithMetrics: HoldingWithMetrics[],
  totalMarketValue: number
): AssetClassBreakdown {
  // 分類持股
  const equityHoldings = holdingsWithMetrics.filter(h => h.assetClass !== 'bond');
  const bondHoldings = holdingsWithMetrics.filter(h => h.assetClass === 'bond');
  const corpBondHoldings = bondHoldings.filter(h => h.bondCategory === 'corp');
  const ustBondHoldings = bondHoldings.filter(h => h.bondCategory === 'ust');

  // 計算各類別市值
  const equityMarketValue = equityHoldings.reduce((sum, h) => sum + h.marketValue, 0);
  const bondTotalMarketValue = bondHoldings.reduce((sum, h) => sum + h.marketValue, 0);
  const corpMarketValue = corpBondHoldings.reduce((sum, h) => sum + h.marketValue, 0);
  const ustMarketValue = ustBondHoldings.reduce((sum, h) => sum + h.marketValue, 0);

  // 計算權重
  const equityWeight = totalMarketValue > 0 ? equityMarketValue / totalMarketValue : 0;
  const bondWeight = totalMarketValue > 0 ? bondTotalMarketValue / totalMarketValue : 0;
  const corpWeight = totalMarketValue > 0 ? corpMarketValue / totalMarketValue : 0;
  const ustWeight = totalMarketValue > 0 ? ustMarketValue / totalMarketValue : 0;

  return {
    equity: {
      marketValue: equityMarketValue,
      weight: equityWeight,
    },
    bond: {
      totalMarketValue: bondTotalMarketValue,
      weight: bondWeight,
      corp: {
        marketValue: corpMarketValue,
        weight: corpWeight,
      },
      ust: {
        marketValue: ustMarketValue,
        weight: ustWeight,
      },
    },
  };
}

/**
 * 計算投資組合摘要
 */
export function calculatePortfolioSummary(
  holdingsWithMetrics: HoldingWithMetrics[],
  exchangeRate?: number
): PortfolioSummary {
  const totalMarketValue = holdingsWithMetrics.reduce((sum, h) => sum + h.marketValue, 0);
  const totalCost = holdingsWithMetrics.reduce(
    (sum, h) => {
      // 使用 calculateCost 輔助函數計算正確的成本
      const cost = calculateCost(h);
      // 轉換成本到 baseCurrency（如果有匯率的話）
      return sum + cost;
    },
    0
  );
  const totalUnrealizedPnL = holdingsWithMetrics.reduce(
    (sum, h) => sum + h.unrealizedPnL,
    0
  );
  const totalUnrealizedPnLPercent = totalCost > 0 ? totalUnrealizedPnL / totalCost : 0;

  const sortedHoldings = [...holdingsWithMetrics].sort((a, b) => b.weight - a.weight);
  const topHoldings = sortedHoldings.slice(0, 5);
  const top3Weight = sortedHoldings.slice(0, 3).reduce((sum, h) => sum + h.weight, 0);

  // 計算市場分類摘要（以原始幣別計算）
  const usHoldings = holdingsWithMetrics.filter((h) => h.market === 'US' || h.originalCurrency === 'USD');
  const twHoldings = holdingsWithMetrics.filter((h) => h.market === 'TW' || h.originalCurrency === 'TWD');

  const usBreakdown: MarketBreakdown | undefined = usHoldings.length > 0 ? {
    marketValue: usHoldings.reduce((sum, h) => sum + h.originalMarketValue, 0),
    cost: usHoldings.reduce((sum, h) => sum + calculateCost(h), 0),
    unrealizedPnL: usHoldings.reduce((sum, h) => sum + (h.originalMarketValue - calculateCost(h)), 0),
  } : undefined;

  const twBreakdown: MarketBreakdown | undefined = twHoldings.length > 0 ? {
    marketValue: twHoldings.reduce((sum, h) => sum + h.originalMarketValue, 0),
    cost: twHoldings.reduce((sum, h) => sum + calculateCost(h), 0),
    unrealizedPnL: twHoldings.reduce((sum, h) => sum + (h.originalMarketValue - calculateCost(h)), 0),
  } : undefined;

  // 計算資產類別分布
  const assetClassBreakdown = calculateAssetClassBreakdown(holdingsWithMetrics, totalMarketValue);

  return {
    totalMarketValue,
    totalCost,
    totalUnrealizedPnL,
    totalUnrealizedPnLPercent,
    topHoldings,
    totalHoldingsCount: holdingsWithMetrics.length,
    concentration: top3Weight,
    exchangeRate,
    usBreakdown,
    twBreakdown,
    assetClassBreakdown,
  };
}

/**
 * 建立給 AI 的 Payload
 */
export function buildPortfolioPayload(
  profile: Profile,
  holdingsWithMetrics: HoldingWithMetrics[],
  summary: PortfolioSummary
): PortfolioPayload {
  return {
    profileName: profile.name,
    riskLevel: profile.riskLevel,
    market: profile.market || 'US',
    baseCurrency: profile.baseCurrency || 'USD',
    totalMarketValue: summary.totalMarketValue,
    totalCost: summary.totalCost,
    totalUnrealizedPnL: summary.totalUnrealizedPnL,
    concentration: summary.concentration,
    holdings: holdingsWithMetrics.map((h) => ({
      symbol: h.symbol,
      name: h.name,
      quantity: h.quantity,
      costBasis: h.costBasis,
      currentPrice: h.currentPrice,
      marketValue: h.marketValue,
      weight: h.weight,
      unrealizedPnL: h.unrealizedPnL,
      unrealizedPnLPercent: h.unrealizedPnLPercent,
      assetClass: h.assetClass,
      bondCategory: h.bondCategory,
      couponRate: h.couponRate,
      maturityDate: h.maturityDate,
    })),
    assetClassBreakdown: summary.assetClassBreakdown,
  };
}

/**
 * 格式化金額顯示
 */
export function formatCurrency(value: number, currency: Currency = 'USD', decimals: number = 2): string {
  const currencyCode = currency === 'TWD' ? 'TWD' : 'USD';
  const locale = currency === 'TWD' ? 'zh-TW' : 'en-US';

  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currencyCode,
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

/**
 * 格式化百分比顯示
 */
export function formatPercent(value: number, decimals: number = 2): string {
  const sign = value >= 0 ? '+' : '';
  return `${sign}${(value * 100).toFixed(decimals)}%`;
}

/**
 * 將報價陣列轉換為價格對照表
 */
export function quotesToPriceMap(quotes: Quote[]): Record<string, number> {
  return quotes.reduce(
    (map, quote) => {
      map[quote.symbol] = quote.price;
      return map;
    },
    {} as Record<string, number>
  );
}

/**
 * 將報價陣列轉換為名稱對照表
 */
export function quotesToNameMap(quotes: Quote[]): Record<string, string> {
  return quotes.reduce(
    (map, quote) => {
      map[quote.symbol] = quote.name;
      return map;
    },
    {} as Record<string, string>
  );
}

/**
 * 將報價陣列轉換為市場對照表
 */
export function quotesToMarketMap(quotes: Quote[]): Record<string, HoldingMarket> {
  return quotes.reduce(
    (map, quote) => {
      if (quote.market === 'US' || quote.market === 'TW') {
        map[quote.symbol] = quote.market;
      }
      return map;
    },
    {} as Record<string, HoldingMarket>
  );
}
