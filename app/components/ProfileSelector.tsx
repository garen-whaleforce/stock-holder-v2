'use client';

import { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Profile, RiskLevel, Market, Currency, MARKET_LABELS, CURRENCY_SYMBOLS } from '@/lib/types';

interface ProfileSelectorProps {
  profiles: Profile[];
  activeProfileId: string;
  onSelectProfile: (profileId: string) => void;
  onCreateProfile: (profile: Profile) => void;
  onDeleteProfile: (profileId: string) => void;
  onUpdateProfile: (profile: Profile) => void;
}

export default function ProfileSelector({
  profiles,
  activeProfileId,
  onSelectProfile,
  onCreateProfile,
  onDeleteProfile,
  onUpdateProfile,
}: ProfileSelectorProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [newName, setNewName] = useState('');
  const [newRiskLevel, setNewRiskLevel] = useState<RiskLevel>('balanced');
  const [newMarket, setNewMarket] = useState<Market>('US');
  const [newCurrency, setNewCurrency] = useState<Currency>('USD');

  const activeProfile = profiles.find((p) => p.id === activeProfileId);

  // 根據市場自動設定幣別
  const getDefaultCurrency = (market: Market): Currency => {
    if (market === 'US') return 'USD';
    if (market === 'TW') return 'TWD';
    return 'USD'; // MIXED 預設 USD
  };

  const handleMarketChange = (market: Market) => {
    setNewMarket(market);
    if (market !== 'MIXED') {
      setNewCurrency(getDefaultCurrency(market));
    }
  };

  const handleCreate = () => {
    if (!newName.trim()) return;

    const profile: Profile = {
      id: uuidv4(),
      name: newName.trim(),
      riskLevel: newRiskLevel,
      market: newMarket,
      baseCurrency: newMarket === 'MIXED' ? newCurrency : getDefaultCurrency(newMarket),
      holdings: [],
    };

    onCreateProfile(profile);
    setNewName('');
    setNewRiskLevel('balanced');
    setNewMarket('US');
    setNewCurrency('USD');
    setIsCreating(false);
  };

  const handleEdit = () => {
    if (!activeProfile || !newName.trim()) return;

    onUpdateProfile({
      ...activeProfile,
      name: newName.trim(),
      riskLevel: newRiskLevel,
    });
    setIsEditing(false);
  };

  const handleDelete = () => {
    if (!activeProfile || profiles.length <= 1) return;
    if (confirm(`確定要刪除「${activeProfile.name}」嗎？`)) {
      onDeleteProfile(activeProfile.id);
    }
  };

  const startEditing = () => {
    if (activeProfile) {
      setNewName(activeProfile.name);
      setNewRiskLevel(activeProfile.riskLevel);
      setIsEditing(true);
    }
  };

  const riskLevelLabel: Record<RiskLevel, string> = {
    conservative: '保守型',
    balanced: '平衡型',
    aggressive: '積極型',
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* Profile 選擇下拉選單 */}
      <select
        value={activeProfileId}
        onChange={(e) => onSelectProfile(e.target.value)}
        className="px-3 py-2 border border-gray-300 rounded-lg bg-white text-sm focus:ring-2 focus:ring-navy-500 focus:border-navy-500"
      >
        {profiles.map((profile) => (
          <option key={profile.id} value={profile.id}>
            [{MARKET_LABELS[profile.market || 'US']}] {profile.name} ({CURRENCY_SYMBOLS[profile.baseCurrency]})
          </option>
        ))}
      </select>

      {/* 編輯按鈕 */}
      <button
        onClick={startEditing}
        className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
        title="編輯組合"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
      </button>

      {/* 新增按鈕 */}
      <button
        onClick={() => setIsCreating(true)}
        className="p-2 text-navy-600 hover:text-navy-700 hover:bg-navy-50 rounded-lg transition-colors"
        title="新增組合"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
      </button>

      {/* 刪除按鈕 */}
      {profiles.length > 1 && (
        <button
          onClick={handleDelete}
          className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
          title="刪除組合"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      )}

      {/* 新增 Modal */}
      {isCreating && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto my-auto">
            <h3 className="text-lg font-semibold mb-4">新增投資組合</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  市場
                </label>
                <select
                  value={newMarket}
                  onChange={(e) => handleMarketChange(e.target.value as Market)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-navy-500 focus:border-navy-500"
                >
                  <option value="US">美股</option>
                  <option value="TW">台股</option>
                  <option value="MIXED">混合（美股+台股）</option>
                </select>
              </div>

              {/* 混合帳戶顯示幣別選擇 */}
              {newMarket === 'MIXED' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    計價幣別
                  </label>
                  <select
                    value={newCurrency}
                    onChange={(e) => setNewCurrency(e.target.value as Currency)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-navy-500 focus:border-navy-500"
                  >
                    <option value="USD">USD 美元</option>
                    <option value="TWD">TWD 新台幣</option>
                  </select>
                  <p className="mt-1 text-xs text-gray-500">
                    所有持股市值將依當天匯率轉換為此幣別
                  </p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  組合名稱
                </label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="例如：退休金帳戶"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-navy-500 focus:border-navy-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  風險偏好
                </label>
                <select
                  value={newRiskLevel}
                  onChange={(e) => setNewRiskLevel(e.target.value as RiskLevel)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-navy-500 focus:border-navy-500"
                >
                  <option value="conservative">保守型</option>
                  <option value="balanced">平衡型</option>
                  <option value="aggressive">積極型</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => setIsCreating(false)}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleCreate}
                disabled={!newName.trim()}
                className="px-4 py-2 bg-navy-600 text-white rounded-lg hover:bg-navy-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                建立
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 編輯 Modal */}
      {isEditing && activeProfile && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto my-auto">
            <h3 className="text-lg font-semibold mb-4">編輯投資組合</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  市場 / 幣別
                </label>
                <div className="px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-600">
                  {MARKET_LABELS[activeProfile.market || 'US']} ({CURRENCY_SYMBOLS[activeProfile.baseCurrency]} {activeProfile.baseCurrency})
                  <span className="text-xs text-gray-400 ml-2">（建立後無法更改）</span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  組合名稱
                </label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-navy-500 focus:border-navy-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  風險偏好
                </label>
                <select
                  value={newRiskLevel}
                  onChange={(e) => setNewRiskLevel(e.target.value as RiskLevel)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-navy-500 focus:border-navy-500"
                >
                  <option value="conservative">保守型</option>
                  <option value="balanced">平衡型</option>
                  <option value="aggressive">積極型</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => setIsEditing(false)}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleEdit}
                disabled={!newName.trim()}
                className="px-4 py-2 bg-navy-600 text-white rounded-lg hover:bg-navy-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                儲存
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
