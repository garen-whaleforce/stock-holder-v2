'use client';

import { RiskLevel } from '@/lib/types';

const RISK_OPTIONS: { value: RiskLevel; label: string }[] = [
  { value: 'conservative', label: '保守型' },
  { value: 'balanced', label: '穩健型' },
  { value: 'aggressive', label: '積極型' },
];

interface AdvicePanelProps {
  advice: string | null;
  isLoading: boolean;
  error: string | null;
  onGetAdvice: () => void;
  disabled: boolean;
  riskLevel: RiskLevel;
  onRiskLevelChange: (level: RiskLevel) => void;
}

export default function AdvicePanel({
  advice,
  isLoading,
  error,
  onGetAdvice,
  disabled,
  riskLevel,
  onRiskLevelChange,
}: AdvicePanelProps) {
  return (
    <div className="card p-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gold-100 flex items-center justify-center">
            <svg className="w-5 h-5 text-gold-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </div>
          <div>
            <h3 className="font-semibold text-slate-800">AI 投資洞察</h3>
            <p className="text-xs text-slate-500">個人化投資組合分析</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <select
              value={riskLevel}
              onChange={(e) => onRiskLevelChange(e.target.value as RiskLevel)}
              disabled={isLoading}
              className="appearance-none pl-3 pr-8 py-2 text-sm border border-slate-300 rounded-lg bg-white font-medium text-slate-700 focus:border-navy-500 focus:ring-2 focus:ring-navy-500/20 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {RISK_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <svg className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
          <button
            onClick={onGetAdvice}
            disabled={disabled || isLoading}
            className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <span>分析中...</span>
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <span>取得洞察</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="space-y-3">
          <div className="shimmer h-4 rounded w-full"></div>
          <div className="shimmer h-4 rounded w-5/6"></div>
          <div className="shimmer h-4 rounded w-4/6"></div>
          <div className="shimmer h-4 rounded w-full"></div>
          <div className="shimmer h-4 rounded w-3/4"></div>
        </div>
      )}

      {/* Error State */}
      {error && !isLoading && (
        <div className="bg-danger-50 border border-danger-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-danger-100 flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-danger-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-danger-800 font-medium">無法產生洞察</p>
              <p className="text-danger-600 text-sm mt-1">{error}</p>
              <button
                onClick={onGetAdvice}
                className="text-danger-700 text-sm font-medium mt-2 hover:underline flex items-center gap-1"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                重試
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Advice Content */}
      {advice && !isLoading && !error && (
        <div className="bg-slate-50 rounded-lg p-5 border border-slate-200">
          <div className="flex items-center gap-2 mb-4">
            <svg className="w-5 h-5 text-gold-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
            <span className="text-sm font-semibold text-slate-700">AI 分析</span>
          </div>
          <div className="whitespace-pre-wrap text-slate-700 leading-relaxed">
            {advice}
          </div>
        </div>
      )}

      {/* Default State */}
      {!advice && !isLoading && !error && (
        <div className="text-center py-10">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-100 flex items-center justify-center">
            <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </div>
          <p className="text-slate-700 font-medium">取得 AI 投資組合洞察</p>
          <p className="text-sm text-slate-500 mt-1">更新報價後點擊上方按鈕</p>
        </div>
      )}
    </div>
  );
}
