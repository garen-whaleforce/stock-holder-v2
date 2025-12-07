// 市場類型
export type Market = 'US' | 'TW' | 'MIXED';

// 幣別類型
export type Currency = 'USD' | 'TWD';

// 單一持股的市場類型（不含 MIXED）
export type HoldingMarket = 'US' | 'TW';

// 風險偏好類型
export type RiskLevel = 'conservative' | 'balanced' | 'aggressive';

// 資產類別
export type AssetClass = 'equity' | 'bond';

// 債券分類
export type BondCategory = 'corp' | 'ust';

// 資產類別顯示名稱對照
export const ASSET_CLASS_LABELS: Record<AssetClass, string> = {
  equity: '股票',
  bond: '債券',
};

// 債券分類顯示名稱對照
export const BOND_CATEGORY_LABELS: Record<BondCategory, string> = {
  corp: '公司債',
  ust: '美國公債',
};

// FMP API 回傳的報價資料（美股）
export interface FMPQuote {
  symbol: string;
  name: string;
  price: number;
  changesPercentage: number;
  change: number;
  dayLow: number;
  dayHigh: number;
  yearHigh: number;
  yearLow: number;
  marketCap: number;
  priceAvg50: number;
  priceAvg200: number;
  volume: number;
  avgVolume: number;
  exchange: string;
  open: number;
  previousClose: number;
  eps: number;
  pe: number;
  earningsAnnouncement: string;
  sharesOutstanding: number;
  timestamp: number;
}

// 統一的報價資料格式（支援美股與台股）
export interface Quote {
  symbol: string;
  name: string;
  price: number;
  market: Market;
  currency: Currency;
  changesPercentage?: number;
  change?: number;
  marketCap?: number;
}

// 單一持股資料
export interface Holding {
  id: string;
  symbol: string;
  name: string;
  quantity: number; // 股票：股數；債券：總面額
  costBasis: number; // 股票：每股成本；債券：買入價格（每100面額）
  market?: HoldingMarket; // 該持股所屬市場（混合帳戶用）
  note?: string;
  // 資產類別相關欄位
  assetClass?: AssetClass; // 預設為 'equity'
  // 債券專用欄位（assetClass === 'bond' 時使用）
  bondCategory?: BondCategory; // 'corp' 或 'ust'
  couponRate?: number; // 票面利率（%）
  maturityDate?: string; // 到期日（YYYY-MM-DD）
  currentPrice?: number; // 目前價格（債券用：每100面額；手動輸入）
}

// 計算後的持股資料（包含現價與損益）
export interface HoldingWithMetrics extends Holding {
  currentPrice: number;
  originalCurrency: Currency; // 原始幣別
  marketValue: number; // 轉換後的市值（以 baseCurrency 計）
  originalMarketValue: number; // 原始幣別市值
  weight: number;
  unrealizedPnL: number; // 轉換後的損益
  unrealizedPnLPercent: number;
}

// 投資組合 Profile
export interface Profile {
  id: string;
  name: string;
  riskLevel: RiskLevel;
  market: Market;
  baseCurrency: Currency;
  holdings: Holding[];
}

// 市場分類摘要（混合帳戶用）
export interface MarketBreakdown {
  marketValue: number;
  cost: number;
  unrealizedPnL: number;
}

// 資產類別細分（用於 Summary）
export interface AssetClassBreakdown {
  equity: {
    marketValue: number;
    weight: number;
  };
  bond: {
    totalMarketValue: number;
    weight: number;
    corp: {
      marketValue: number;
      weight: number;
    };
    ust: {
      marketValue: number;
      weight: number;
    };
  };
}

// 投資組合摘要資訊
export interface PortfolioSummary {
  totalMarketValue: number;
  totalCost: number;
  totalUnrealizedPnL: number;
  totalUnrealizedPnLPercent: number;
  topHoldings: HoldingWithMetrics[];
  concentration: number; // 前三大持股佔比
  exchangeRate?: number; // USD/TWD 匯率（混合帳戶用）
  // 市場分類摘要（混合帳戶用，以原始幣別計算）
  usBreakdown?: MarketBreakdown;
  twBreakdown?: MarketBreakdown;
  // 資產類別分布
  assetClassBreakdown?: AssetClassBreakdown;
}

// 給 AI 的 Payload 中的 Holding
export interface PortfolioHoldingPayload {
  symbol: string;
  name: string;
  quantity: number;
  costBasis: number;
  currentPrice: number;
  marketValue: number;
  weight: number;
  unrealizedPnL: number;
  unrealizedPnLPercent: number;
  assetClass?: AssetClass;
  bondCategory?: BondCategory;
  couponRate?: number;
  maturityDate?: string;
}

// 給 AI 的 Payload
export interface PortfolioPayload {
  profileName: string;
  riskLevel: RiskLevel;
  market: Market;
  baseCurrency: Currency;
  totalMarketValue: number;
  totalCost: number;
  totalUnrealizedPnL: number;
  concentration: number;
  holdings: PortfolioHoldingPayload[];
  // 資產配置摘要
  assetClassBreakdown?: AssetClassBreakdown;
}

// API 請求與回應類型
export interface QuotesRequest {
  symbols: string[];
  market: Market;
}

export interface QuotesResponse {
  quotes: Quote[];
}

export interface AdviceRequest {
  profile: PortfolioPayload;
}

export interface AdviceResponse {
  advice: string;
}

// localStorage 的資料結構
export interface StoredData {
  profiles: Profile[];
  activeProfileId: string;
  priceCache: Record<string, { price: number; timestamp: number }>;
}

// 市場顯示名稱對照
export const MARKET_LABELS: Record<Market, string> = {
  US: '美股',
  TW: '台股',
  MIXED: '混合',
};

// 幣別符號對照
export const CURRENCY_SYMBOLS: Record<Currency, string> = {
  USD: '$',
  TWD: 'NT$',
};
