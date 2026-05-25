function parseMoney(text) {
  return Number(text.replace(/[^\d.]/g, ''));
}

export function toAmount(range, customAmount = '') {
  if (range === '自定义金额') {
    const value = Number(customAmount);
    return Number.isFinite(value) && value >= 0 ? value : 0;
  }

  if (range?.includes(' - ')) {
    const [min, max] = range.split(' - ').map(parseMoney);
    return Math.round((min + max) / 2);
  }

  if (range?.includes('以上') || range?.includes('以下')) {
    return parseMoney(range);
  }

  return 0;
}

export function clampScore(value) {
  return Math.min(100, Math.max(0, Math.round(value)));
}

export function daysFromToday(dateText) {
  if (!dateText) return null;

  const today = new Date();
  const target = new Date(`${dateText}T12:00:00`);
  const todayAtNoon = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 12);
  const diff = target.getTime() - todayAtNoon.getTime();

  return Math.max(0, Math.round(diff / 86400000));
}

function formatDate(date) {
  return date.toISOString().slice(0, 10);
}

function addDays(date, days) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function addMonths(date, months) {
  const next = new Date(date);
  next.setMonth(next.getMonth() + months);
  return next;
}

function getDefaultPeriodStart(method) {
  const today = new Date();
  const start = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 12);

  if (method === '按周预算') {
    const mondayOffset = (start.getDay() + 6) % 7;
    start.setDate(start.getDate() - mondayOffset);
    return formatDate(start);
  }

  start.setDate(1);
  return formatDate(start);
}

function getLivingCostCycle(profile) {
  const method = profile.livingCostBudgetMethod || '按周预算';
  const startText = profile.livingCostPeriodStartDate || getDefaultPeriodStart(method);
  const today = new Date();
  const todayAtNoon = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 12);
  let start = new Date(`${startText}T12:00:00`);
  let end = method === '按周预算' ? addDays(start, 6) : addDays(addMonths(start, 1), -1);

  while (end < todayAtNoon) {
    start = method === '按周预算' ? addDays(start, 7) : addMonths(start, 1);
    end = method === '按周预算' ? addDays(start, 6) : addDays(addMonths(start, 1), -1);
  }

  const cycleDays = Math.max(1, Math.round((end.getTime() - start.getTime()) / 86400000) + 1);
  const daysUntilEnd = daysFromToday(formatDate(end));

  return {
    method,
    startDate: formatDate(start),
    endDate: formatDate(end),
    cycleDays,
    daysUntilEnd,
  };
}

function getDailyLivingCost(profile) {
  const livingCostAmount = Number(profile.monthlyLivingCostAmount) || 0;
  const cycle = getLivingCostCycle(profile);

  return livingCostAmount / cycle.cycleDays;
}

function getDatedCashflows(profile, includeIncome) {
  const fixedExpenseDay = daysFromToday(profile.fixedExpenseDate);
  const incomeDay = daysFromToday(profile.nextIncomeDate);
  const fixedExpenseAmount = Number(profile.fixedExpenseAmount) || 0;
  const nextIncomeAmount = Number(profile.nextIncomeAmount) || 0;

  return {
    expenses:
      fixedExpenseAmount > 0 && fixedExpenseDay !== null
        ? [{ day: fixedExpenseDay, amount: fixedExpenseAmount }]
        : [],
    incomes:
      includeIncome && nextIncomeAmount > 0 && incomeDay !== null
        ? [{ day: incomeDay, amount: nextIncomeAmount }]
        : [],
  };
}

export function simulateCashflow(profile, options = {}) {
  const {
    includeIncome = false,
    maxDays = 365,
    purchaseAmount = 0,
  } = options;
  const dailyLivingCost = getDailyLivingCost(profile);
  const minimumSavingsAmount = Number(profile.minimumSavingsAmount) || 0;
  let balance = (Number(profile.balanceAmount) || 0) - Number(purchaseAmount || 0);
  let safeDays = 0;
  const { expenses, incomes } = getDatedCashflows(profile, includeIncome);

  expenses
    .filter((item) => item.day === 0)
    .forEach((item) => {
      balance -= item.amount;
    });

  incomes
    .filter((item) => item.day === 0)
    .forEach((item) => {
      balance += item.amount;
    });

  let dippedBelowMinimum = balance < minimumSavingsAmount;

  if (dippedBelowMinimum || dailyLivingCost <= 0) {
    return { safeDays: 0, endingBalance: balance, dippedBelowMinimum };
  }

  for (let day = 1; day <= maxDays; day += 1) {
    balance -= dailyLivingCost;

    expenses
      .filter((item) => item.day === day)
      .forEach((item) => {
        balance -= item.amount;
      });

    incomes
      .filter((item) => item.day === day)
      .forEach((item) => {
        balance += item.amount;
      });

    if (balance < minimumSavingsAmount) {
      dippedBelowMinimum = true;
      break;
    }

    safeDays = day;
  }

  return {
    safeDays,
    endingBalance: balance,
    dippedBelowMinimum,
  };
}

export function getSafetyPeriodDays(profile) {
  const cycleEndDays = getLivingCostCycle(profile).daysUntilEnd;
  const incomeDays =
    Number(profile.nextIncomeAmount) > 0 ? daysFromToday(profile.nextIncomeDate) : null;
  const candidates = [7, cycleEndDays, incomeDays].filter((item) => item !== null);

  return Math.min(30, Math.max(...candidates));
}

export function calculateSafeAvailableAmount(profile, options = {}) {
  const { purchaseAmount = 0 } = options;
  const dailyLivingCost = getDailyLivingCost(profile);
  const balanceAmount = Number(profile.balanceAmount) || 0;
  const minimumSavingsAmount = Number(profile.minimumSavingsAmount) || 0;
  const periodDays = getSafetyPeriodDays(profile);
  const { expenses, incomes } = getDatedCashflows(profile, true);
  let maxSafeSpend = Number.POSITIVE_INFINITY;
  let firstRiskDay = null;

  for (let day = 1; day <= periodDays; day += 1) {
    const expenseTotal = expenses
      .filter((item) => item.day <= day)
      .reduce((sum, item) => sum + item.amount, 0);
    const incomeTotal = incomes
      .filter((item) => item.day <= day)
      .reduce((sum, item) => sum + item.amount, 0);
    const balanceAtDay =
      balanceAmount - purchaseAmount - dailyLivingCost * day - expenseTotal + incomeTotal;
    const safetyMargin = balanceAtDay - minimumSavingsAmount;

    maxSafeSpend = Math.min(maxSafeSpend, safetyMargin);
    if (firstRiskDay === null && safetyMargin < 0) {
      firstRiskDay = day;
    }
  }

  return {
    amount: Math.max(0, Math.floor(maxSafeSpend)),
    periodDays,
    maxSafeSpend: Math.max(0, Math.floor(maxSafeSpend)),
    firstRiskDay,
    isLowConfidence: false,
  };
}

export function calculateWalletMetrics(profile) {
  const balanceAmount = Number(profile.balanceAmount) || 0;
  const savingsGoalAmount = Number(profile.savingsGoalAmount) || 0;
  const conservative = simulateCashflow(profile, { includeIncome: false });
  const withIncome = simulateCashflow(profile, { includeIncome: true });
  const walletScore = clampScore((conservative.safeDays / 120) * 100);
  const savingsProgress = savingsGoalAmount
    ? clampScore((balanceAmount / savingsGoalAmount) * 100)
    : 0;
  const savingsGapAmount = Math.max(0, savingsGoalAmount - balanceAmount);
  const safeAvailable = calculateSafeAvailableAmount(profile);
  const livingCostCycle = getLivingCostCycle(profile);
  const weeklySafeAvailableAmount = safeAvailable.amount;

  return {
    walletScore,
    safeSurvivalDays: conservative.safeDays,
    referenceSafeSurvivalDays: withIncome.safeDays,
    savingsProgress,
    savingsGapAmount,
    weeklyFreeSpendAmount: weeklySafeAvailableAmount,
    weeklySafeAvailableAmount,
    safeAvailablePeriodDays: safeAvailable.periodDays,
    safeAvailableRiskDay: safeAvailable.firstRiskDay,
    safeAvailableLowConfidence: safeAvailable.isLowConfidence,
    livingCostCycle,
  };
}

export function calculateAfterPurchase(profile, priceAmount) {
  const afterProfile = {
    ...profile,
    balanceAmount: Math.max(0, Number(profile.balanceAmount || 0) - Number(priceAmount || 0)),
  };
  const before = calculateWalletMetrics(profile);
  const after = calculateWalletMetrics(afterProfile);

  return {
    beforeWalletScore: before.walletScore,
    afterWalletScore: after.walletScore,
    beforeSafeSurvivalDays: before.safeSurvivalDays,
    afterSafeSurvivalDays: after.safeSurvivalDays,
    survivalDaysDelta: after.safeSurvivalDays - before.safeSurvivalDays,
  };
}

export function getWalletStatus(score) {
  if (score >= 80) return { label: '安全', text: '当前状态较安全，可以进行正常消费判断' };
  if (score >= 60) return { label: '相对稳定', text: '建议非必要消费前先发起审判' };
  if (score >= 40) return { label: '需要谨慎', text: '当前财务状态偏紧，建议减少非必要消费' };
  if (score >= 20) return { label: '高风险', text: '当前财务压力较高，不建议非刚需消费' };
  return { label: '紧急风险', text: '当前现金流紧张，建议优先保障必要支出' };
}

export function getCoolingHours(priceAmount) {
  if (priceAmount < 100) return 24;
  if (priceAmount <= 500) return 48;
  if (priceAmount <= 2000) return 24 * 7;
  return 24 * 14;
}

export function formatMoney(amount) {
  return `¥${Math.round(Number(amount) || 0).toLocaleString('zh-CN')}`;
}
