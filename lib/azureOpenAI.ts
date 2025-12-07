import { PortfolioPayload, MARKET_LABELS, CURRENCY_SYMBOLS, ASSET_CLASS_LABELS, BOND_CATEGORY_LABELS } from './types';

const RISK_LEVEL_MAP: Record<string, string> = {
  conservative: '保守型',
  balanced: '平衡型',
  aggressive: '積極型',
};

/**
 * 將投資組合資料轉換為 AI 可讀的格式
 */
function formatPortfolioForAI(portfolio: PortfolioPayload): string {
  const riskLevelChinese = RISK_LEVEL_MAP[portfolio.riskLevel] || portfolio.riskLevel;
  const marketLabel = MARKET_LABELS[portfolio.market] || portfolio.market;
  const currencySymbol = CURRENCY_SYMBOLS[portfolio.baseCurrency] || '$';

  // 分類股票和債券
  const equityHoldings = portfolio.holdings.filter(h => h.assetClass !== 'bond');
  const bondHoldings = portfolio.holdings.filter(h => h.assetClass === 'bond');

  // 格式化股票持股
  const equityInfo = equityHoldings.length > 0
    ? equityHoldings.map((h) => {
        const pnlSign = h.unrealizedPnL >= 0 ? '+' : '';
        return `- ${h.symbol} (${h.name}): 持有 ${h.quantity} 股, 成本 ${currencySymbol}${h.costBasis.toFixed(2)}, 現價 ${currencySymbol}${h.currentPrice.toFixed(2)}, 市值 ${currencySymbol}${h.marketValue.toFixed(2)}, 損益 ${pnlSign}${currencySymbol}${h.unrealizedPnL.toFixed(2)} (${pnlSign}${(h.unrealizedPnLPercent * 100).toFixed(2)}%), 佔比 ${(h.weight * 100).toFixed(2)}%`;
      }).join('\n')
    : '(無股票持股)';

  // 格式化債券持股
  const bondInfo = bondHoldings.length > 0
    ? bondHoldings.map((h) => {
        const pnlSign = h.unrealizedPnL >= 0 ? '+' : '';
        const bondType = h.bondCategory ? BOND_CATEGORY_LABELS[h.bondCategory] : '債券';
        const couponInfo = h.couponRate ? `, 票面利率 ${h.couponRate}%` : '';
        const maturityInfo = h.maturityDate ? `, 到期日 ${h.maturityDate}` : '';
        return `- ${h.symbol} (${h.name}) [${bondType}]: 面額 ${currencySymbol}${h.quantity.toLocaleString()}${couponInfo}${maturityInfo}, 買入價 ${h.costBasis.toFixed(2)}/100, 現價 ${h.currentPrice.toFixed(2)}/100, 市值 ${currencySymbol}${h.marketValue.toFixed(2)}, 損益 ${pnlSign}${currencySymbol}${h.unrealizedPnL.toFixed(2)} (${pnlSign}${(h.unrealizedPnLPercent * 100).toFixed(2)}%), 佔比 ${(h.weight * 100).toFixed(2)}%`;
      }).join('\n')
    : '';

  const totalPnLSign = portfolio.totalUnrealizedPnL >= 0 ? '+' : '';
  const totalPnLPercent =
    portfolio.totalCost > 0
      ? ((portfolio.totalUnrealizedPnL / portfolio.totalCost) * 100).toFixed(2)
      : '0.00';

  // 資產配置資訊
  let assetAllocationInfo = '';
  if (portfolio.assetClassBreakdown) {
    const ab = portfolio.assetClassBreakdown;
    assetAllocationInfo = `
資產配置:
- 股票: ${currencySymbol}${ab.equity.marketValue.toFixed(2)} (${(ab.equity.weight * 100).toFixed(1)}%)
- 債券總計: ${currencySymbol}${ab.bond.totalMarketValue.toFixed(2)} (${(ab.bond.weight * 100).toFixed(1)}%)`;

    if (ab.bond.corp.marketValue > 0) {
      assetAllocationInfo += `\n  - 公司債: ${currencySymbol}${ab.bond.corp.marketValue.toFixed(2)} (${(ab.bond.corp.weight * 100).toFixed(1)}%)`;
    }
    if (ab.bond.ust.marketValue > 0) {
      assetAllocationInfo += `\n  - 美國公債: ${currencySymbol}${ab.bond.ust.marketValue.toFixed(2)} (${(ab.bond.ust.weight * 100).toFixed(1)}%)`;
    }
  }

  let result = `
投資組合名稱: ${portfolio.profileName}
市場: ${marketLabel}
幣別: ${portfolio.baseCurrency}
風險偏好: ${riskLevelChinese}
總市值: ${currencySymbol}${portfolio.totalMarketValue.toFixed(2)}
總成本: ${currencySymbol}${portfolio.totalCost.toFixed(2)}
總損益: ${totalPnLSign}${currencySymbol}${portfolio.totalUnrealizedPnL.toFixed(2)} (${totalPnLSign}${totalPnLPercent}%)
前三大持股集中度: ${(portfolio.concentration * 100).toFixed(2)}%
${assetAllocationInfo}

股票持股明細:
${equityInfo}`;

  if (bondHoldings.length > 0) {
    result += `

債券持股明細:
${bondInfo}`;
  }

  return result.trim();
}

/**
 * 呼叫 Azure OpenAI 獲取投資組合建議
 * @param portfolio - 投資組合資料
 * @returns AI 生成的建議文字
 */
export async function getPortfolioAdvice(portfolio: PortfolioPayload): Promise<string> {
  const endpoint = process.env.AZURE_OPENAI_ENDPOINT;
  const apiKey = process.env.AZURE_OPENAI_API_KEY;
  const deploymentName = process.env.AZURE_OPENAI_DEPLOYMENT_NAME;
  const apiVersion = process.env.AZURE_OPENAI_API_VERSION || '2024-02-15-preview';

  if (!endpoint || !apiKey || !deploymentName) {
    throw new Error('Azure OpenAI 環境變數未完整設定');
  }

  const url = `${endpoint}/openai/deployments/${deploymentName}/chat/completions?api-version=${apiVersion}`;

  const getMarketContext = () => {
    if (portfolio.market === 'TW') {
      return '此為台股投資組合，請考量台灣股市特性、產業結構與台幣計價。';
    } else if (portfolio.market === 'MIXED') {
      return `此為混合投資組合，同時包含美股與台股。所有市值已依匯率轉換為 ${portfolio.baseCurrency} 計價。請同時考量美國與台灣股市特性。`;
    }
    return '此為美股投資組合，請考量美國股市特性與美元計價。';
  };
  const marketContext = getMarketContext();

  // 檢查是否有債券持股
  const hasBonds = portfolio.holdings.some(h => h.assetClass === 'bond');
  const hasUST = portfolio.holdings.some(h => h.bondCategory === 'ust');

  let bondContext = '';
  if (hasBonds) {
    bondContext = `

此投資組合包含債券資產。債券特性說明：
- 債券價格以每100元面額計價，市值 = 面額 × (價格/100)
- 美國公債（US Treasuries）為低風險核心資產，適合作為投資組合的穩定基石
- 公司債風險較高，但通常提供較高收益
${hasUST ? '- 此組合持有美國公債，這是極低風險的政府公債，在市場波動時具有避險功能' : ''}`;
  }

  const systemPrompt = `你是一位謹慎保守的投資組合顧問，會用繁體中文回答。${marketContext}${bondContext}

你會根據使用者的持股資料，針對每一項資產（包括股票和債券）提出「建議加碼 / 減碼 / 持有」與簡短理由，並給出整體組合的集中度與風險提醒。

${hasBonds ? `對於債券部分：
- 評估債券在整體資產配置中的比重是否適當
- 美國公債被視為低風險核心資產，適合保守型投資者
- 考量債券到期日與利率風險
` : ''}

禁止給出任何保證獲利的語句，並在最後加上一句：『以上內容僅為系統依規則產生之分析，不構成投資建議。』

請按照以下格式回覆：
1. 首先簡要評估整體組合狀況${hasBonds ? '（包括股債配置比例）' : ''}
2. 針對每項資產給出建議（加碼/減碼/持有）與理由
3. 給出風險提醒與集中度建議
4. 最後加上免責聲明`;

  const userContent = formatPortfolioForAI(portfolio);

  const maxRetries = 3;
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'api-key': apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userContent },
          ],
          temperature: 0.5,
          max_completion_tokens: 8000,
        }),
        signal: AbortSignal.timeout(120000),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Azure OpenAI API 錯誤: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      console.log(`Azure OpenAI response (attempt ${attempt}):`, JSON.stringify(data, null, 2));

      if (!data.choices || data.choices.length === 0) {
        throw new Error('Azure OpenAI 沒有回傳任何內容');
      }

      const content = data.choices[0].message?.content;

      if (!content) {
        // 檢查是否因為內容過濾被拒絕
        const finishReason = data.choices[0].finish_reason;
        if (finishReason === 'content_filter') {
          throw new Error('內容被 Azure 內容過濾器攔截，請調整投資組合資料後重試');
        }
        // 空內容但不是 content_filter，可重試
        throw new Error(`Azure OpenAI 回傳空內容 (finish_reason: ${finishReason})`);
      }

      return content;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('未知錯誤');
      console.warn(`Azure OpenAI 請求失敗 (attempt ${attempt}/${maxRetries}):`, lastError.message);

      // 如果是 content_filter 錯誤，不重試
      if (lastError.message.includes('內容過濾器')) {
        break;
      }

      // 最後一次嘗試失敗則拋出錯誤
      if (attempt === maxRetries) {
        break;
      }

      // 等待後重試（指數退避）
      await new Promise((resolve) => setTimeout(resolve, 1000 * attempt));
    }
  }

  throw new Error(`獲取 AI 建議失敗: ${lastError?.message || '未知錯誤'}`)
}
