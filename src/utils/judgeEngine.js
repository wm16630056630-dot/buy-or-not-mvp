import { calculateAfterPurchase, calculateSafeAvailableAmount, getCoolingHours } from './calculations.js';

const resultMap = [
  { max: 2, type: 'buy', title: '可以买', level: 'low' },
  { max: 5, type: 'wait', title: '建议等等', level: 'medium' },
  { max: 8, type: 'cooling', title: '加入冷静清单', level: 'high' },
  { max: 11, type: 'alternative', title: '建议找平替或放弃', level: 'high' },
  { max: 14, type: 'not_recommended', title: '不建议购买', level: 'critical' },
];

function scorePrice(price, balance) {
  if (!balance) return 2;
  const ratio = price / balance;
  if (ratio >= 0.15) return 2;
  if (ratio > 0.05) return 1;
  return 0;
}

function pickScore(value, groups) {
  if (groups.low.includes(value)) return 0;
  if (groups.medium.includes(value)) return 1;
  return 2;
}

function baseResult(score) {
  return resultMap.find((item) => score <= item.max) || resultMap.at(-1);
}

function isUncertain(value) {
  return !value || value.includes('不确定') || value.includes('请选择') || value === '暂不填写';
}

export function judgePurchase(profile, purchaseCase) {
  const priceAmount = Number(purchaseCase.priceAmount) || 0;
  const balanceAmount = Number(profile.balanceAmount) || 0;
  const {
    beforeWalletScore,
    afterWalletScore,
    beforeSafeSurvivalDays,
    afterSafeSurvivalDays,
    survivalDaysDelta,
  } = calculateAfterPurchase(profile, priceAmount);
  const afterSafeAvailable = calculateSafeAvailableAmount(profile, { purchaseAmount: priceAmount });

  const dimensionScores = {
    pricePressure: scorePrice(priceAmount, balanceAmount),
    purchaseReason: pickScore(purchaseCase.purchaseReason, {
      low: ['刚需必买', '替换坏掉的旧物'],
      medium: ['学习/工作效率提升', '奖励自己'],
    }),
    usageFrequency: pickScore(purchaseCase.usageFrequency, {
      low: ['每天都会用', '每周 4-5 次'],
      medium: ['每周 1-3 次'],
    }),
    alternativeStatus: pickScore(purchaseCase.alternativeStatus, {
      low: ['没有替代品'],
      medium: ['有替代品，但体验较差', '不确定是否有替代品'],
    }),
    promotionStatus: pickScore(purchaseCase.promotionStatus, {
      low: ['否'],
      medium: ['是，3天内结束', '是，但经常促销'],
    }),
    emotionStatus: pickScore(purchaseCase.emotionStatus, {
      low: ['平静理性'],
      medium: ['奖励自己'],
    }),
    fixedExpenseImpact: pickScore(purchaseCase.fixedExpenseImpact, {
      low: ['完全不影响'],
      medium: ['可能有一点影响', '不确定，需要系统计算'],
    }),
  };

  const riskScore = Object.values(dimensionScores).reduce((sum, score) => sum + score, 0);
  let result = baseResult(riskScore);
  const reasons = [];
  const forceCooling =
    priceAmount >= balanceAmount * 0.15 ||
    purchaseCase.purchaseReason === '情绪不好想买' ||
    purchaseCase.emotionStatus === '压力大想消费' ||
    purchaseCase.usageFrequency === '不确定' ||
    (purchaseCase.promotionStatus === '是，24小时内结束' &&
      purchaseCase.purchaseReason !== '刚需必买') ||
    purchaseCase.alternativeStatus === '有替代品，且还能正常用' ||
    afterWalletScore < 60 ||
    afterSafeAvailable.firstRiskDay !== null;

  const forceReject =
    priceAmount > balanceAmount ||
    afterWalletScore < 40 ||
    purchaseCase.fixedExpenseImpact === '可能影响房租/学费/还款' ||
    (afterSafeAvailable.firstRiskDay !== null && afterSafeAvailable.firstRiskDay <= 7) ||
    afterSafeSurvivalDays < 14 ||
    (purchaseCase.usageFrequency === '可能只用几次' &&
      purchaseCase.alternativeStatus === '同类物品已经很多') ||
    (purchaseCase.emotionStatus === '压力大想消费' && priceAmount >= balanceAmount * 0.15);

  if (forceCooling && ['buy', 'wait'].includes(result.type)) {
    result = resultMap[2];
  }

  if (forceReject) {
    result = resultMap[4];
  }

  if (priceAmount > balanceAmount) {
    reasons.push('商品价格已经超过当前可用余额，现金流风险较高。');
  } else if (dimensionScores.pricePressure >= 2) {
    reasons.push('商品价格占余额比例偏高，购买后钱包血条会明显下降。');
  } else {
    reasons.push('商品价格仍在当前余额可承受范围内，但建议结合必要性判断。');
  }

  if (['刚需必买', '替换坏掉的旧物'].includes(purchaseCase.purchaseReason)) {
    reasons.push('购买原因偏刚需，不属于纯粹情绪性消费。');
  } else if (['情绪不好想买', '被种草/跟风', '限时折扣'].includes(purchaseCase.purchaseReason)) {
    reasons.push('购买动机带有冲动因素，建议延迟判断。');
  } else {
    reasons.push('商品有一定使用场景，但不一定需要立即购买。');
  }

  if (purchaseCase.alternativeStatus.includes('替代品') || purchaseCase.alternativeStatus.includes('同类')) {
    reasons.push('当前存在替代品或同类物品，适合先比较真实需求。');
  }

  if (purchaseCase.promotionStatus !== '否') {
    reasons.push('促销信息可能放大怕错过心理，冷静后再判断更稳。');
  }

  reasons.push(`购买后钱包血条预计从 ${beforeWalletScore} 降至 ${afterWalletScore}。`);
  reasons.push(
    `按日期模拟后，保守安全生存天数预计从 ${beforeSafeSurvivalDays} 天变为 ${afterSafeSurvivalDays} 天。`,
  );
  if (afterSafeAvailable.firstRiskDay !== null) {
    reasons.push(
      `购买后未来 ${afterSafeAvailable.periodDays} 天内，第 ${afterSafeAvailable.firstRiskDay} 天预计会跌破最低可接受存款。`,
    );
  }

  const uncertainCount = [
    purchaseCase.priceRange,
    purchaseCase.usageFrequency,
    purchaseCase.alternativeStatus,
    purchaseCase.promotionStatus,
    purchaseCase.fixedExpenseImpact,
    profile.nextIncomeAmount ? '' : '不确定',
  ].filter(isUncertain).length;

  return {
    ...purchaseCase,
    riskScore,
    riskLevel: result.level,
    resultType: result.type,
    resultTitle: result.title,
    reasons,
    dimensionScores,
    beforeWalletScore,
    afterWalletScore,
    beforeSafeSurvivalDays,
    afterSafeSurvivalDays,
    survivalDaysDelta,
    afterSafeAvailableAmount: afterSafeAvailable.amount,
    afterSafeAvailableRiskDay: afterSafeAvailable.firstRiskDay,
    safeAvailablePeriodDays: afterSafeAvailable.periodDays,
    confidenceLevel: uncertainCount >= 3 ? 'low' : uncertainCount >= 1 ? 'medium' : 'high',
    coolingHours: getCoolingHours(priceAmount),
    status: 'judged',
  };
}
