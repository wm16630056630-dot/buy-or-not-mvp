function formatAmount(amount) {
  return `¥${amount.toLocaleString('zh-CN')}`;
}

function createAmountOptions({ placeholder, max, start = 0, step = 500, allowEmpty = false }) {
  const ranges = [];

  for (let value = start; value < max; value += step) {
    ranges.push(`${formatAmount(value)} - ${formatAmount(value + step)}`);
  }

  return [
    placeholder,
    ...(allowEmpty ? ['暂不填写'] : []),
    ...ranges,
    `${formatAmount(max)}以上`,
    '自定义金额',
  ];
}

export const balanceOptions = createAmountOptions({
  placeholder: '请选择当前可用余额',
  max: 10000,
});

export const livingCostOptions = createAmountOptions({
  placeholder: '请选择生活费预算',
  max: 5000,
});

export const livingCostBudgetMethods = ['按周预算', '按月预算'];

export const fixedExpenseTypes = [
  '暂无固定支出',
  '房租 / 住宿费',
  '学费',
  '交通费',
  '信用卡 / 花呗还款',
  '课程 / 考试费',
  '其他固定支出',
];

export const fixedExpenseAmountOptions = createAmountOptions({
  placeholder: '请选择支出金额',
  max: 5000,
});

export const incomeSources = [
  '暂无明确收入',
  '生活费',
  '工资 / 实习补贴',
  '奖学金',
  '兼职收入',
  '报销到账',
  '其他收入',
];

export const incomeAmountOptions = createAmountOptions({
  placeholder: '请选择收入金额',
  max: 5000,
  allowEmpty: true,
});

export const savingsAmountOptions = createAmountOptions({
  placeholder: '请选择存款金额',
  max: 20000,
});

export const updateFrequencyOptions = [
  '每 3 天提醒一次',
  '每 7 天提醒一次',
  '每 14 天提醒一次',
  '仅在大额消费后提醒',
  '每月提醒一次',
];

export const productTypes = [
  '请选择商品类型',
  '数码电子',
  '服饰鞋包',
  '美妆护肤',
  '学习课程',
  '出行旅行',
  '餐饮娱乐',
  '生活用品',
  '其他',
];

export const productPriceOptions = createAmountOptions({
  placeholder: '请选择商品价格',
  max: 5000,
});

export const purchaseReasons = [
  '请选择购买原因',
  '刚需必买',
  '学习/工作效率提升',
  '替换坏掉的旧物',
  '奖励自己',
  '情绪不好想买',
  '被种草/跟风',
  '限时折扣',
  '其他',
];

export const usageFrequencies = [
  '不确定',
  '每天都会用',
  '每周 4-5 次',
  '每周 1-3 次',
  '每月 1-3 次',
  '可能只用几次',
  '买来收藏/备用',
];

export const alternativeStatuses = [
  '请选择',
  '没有替代品',
  '有替代品，且还能正常用',
  '有替代品，但体验较差',
  '同类物品已经很多',
  '不确定是否有替代品',
];

export const promotionStatuses = [
  '否',
  '是，24小时内结束',
  '是，3天内结束',
  '是，但经常促销',
  '不确定是否真优惠',
];

export const emotionStatuses = [
  '平静理性',
  '有点冲动/焦虑',
  '奖励自己',
  '怕错过优惠',
  '被朋友/平台种草',
  '压力大想消费',
];

export const fixedExpenseImpacts = [
  '完全不影响',
  '可能有一点影响',
  '会明显压缩生活费',
  '可能影响房租/学费/还款',
  '不确定，需要系统计算',
];
