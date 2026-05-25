import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, CalendarDays, Landmark, PiggyBank, RefreshCw, Wallet } from 'lucide-react';
import Card from '../components/Card';
import { SelectField, TextField } from '../components/Field';
import MetricCard from '../components/MetricCard';
import PrimaryButton from '../components/PrimaryButton';
import ProgressBar from '../components/ProgressBar';
import {
  balanceOptions,
  fixedExpenseAmountOptions,
  fixedExpenseTypes,
  incomeAmountOptions,
  incomeSources,
  livingCostBudgetMethods,
  livingCostOptions,
  savingsAmountOptions,
  updateFrequencyOptions,
} from '../data/options';
import { calculateWalletMetrics, formatMoney, getWalletStatus, toAmount } from '../utils/calculations';
import { clearWalletDraft, loadWalletDraft, saveWalletDraft } from '../utils/storage';

const emptyProfile = {
  balanceRange: balanceOptions[0],
  balanceCustomAmount: '',
  monthlyLivingCostRange: livingCostOptions[0],
  monthlyLivingCostCustomAmount: '',
  livingCostBudgetMethod: livingCostBudgetMethods[0],
  livingCostPeriodStartDate: '',
  fixedExpenseType: fixedExpenseTypes[0],
  fixedExpenseRange: fixedExpenseAmountOptions[0],
  fixedExpenseCustomAmount: '',
  fixedExpenseDate: '',
  nextIncomeSource: incomeSources[0],
  nextIncomeRange: incomeAmountOptions[0],
  nextIncomeCustomAmount: '',
  nextIncomeDate: '',
  savingsGoalRange: savingsAmountOptions[0],
  savingsGoalCustomAmount: '',
  minimumSavingsRange: savingsAmountOptions[0],
  minimumSavingsCustomAmount: '',
  updateFrequency: '每 7 天提醒一次',
};

function hasCustomError(range, value) {
  return range === '自定义金额' && (!value || Number(value) < 0);
}

function buildProfile(form) {
  const fixedExpenseAmount =
    form.fixedExpenseType === '暂无固定支出'
      ? 0
      : toAmount(form.fixedExpenseRange, form.fixedExpenseCustomAmount);

  const profile = {
    ...form,
    balanceAmount: toAmount(form.balanceRange, form.balanceCustomAmount),
    monthlyLivingCostAmount: toAmount(
      form.monthlyLivingCostRange,
      form.monthlyLivingCostCustomAmount,
    ),
    fixedExpenseAmount,
    nextIncomeAmount: toAmount(form.nextIncomeRange, form.nextIncomeCustomAmount),
    savingsGoalAmount: toAmount(form.savingsGoalRange, form.savingsGoalCustomAmount),
    minimumSavingsAmount: toAmount(form.minimumSavingsRange, form.minimumSavingsCustomAmount),
    lastUpdatedAt: new Date().toISOString(),
  };

  return {
    ...profile,
    ...calculateWalletMetrics(profile),
  };
}

function normalizeForm(value) {
  return { ...emptyProfile, ...(value || {}) };
}

export default function WalletPage({ profile, onSave, onStartJudge }) {
  const [form, setForm] = useState(() => normalizeForm(profile || loadWalletDraft()));
  const [savedText, setSavedText] = useState('');
  const preview = useMemo(() => buildProfile(form), [form]);
  const status = getWalletStatus(preview.walletScore);
  const fixedExpenseRequired = form.fixedExpenseType !== '暂无固定支出';
  const today = new Date().toISOString().slice(0, 10);

  useEffect(() => {
    if (profile) setForm(normalizeForm(profile));
  }, [profile]);

  const errors = {
    balance: form.balanceRange === balanceOptions[0] ? '请选择当前可用余额' : '',
    balanceCustom: hasCustomError(form.balanceRange, form.balanceCustomAmount)
      ? '请输入有效金额'
      : '',
    livingCost:
      form.monthlyLivingCostRange === livingCostOptions[0] ? '请选择生活费预算金额' : '',
    livingCostCustom: hasCustomError(
      form.monthlyLivingCostRange,
      form.monthlyLivingCostCustomAmount,
    )
      ? '请输入有效金额'
      : '',
    fixedAmount:
      fixedExpenseRequired && form.fixedExpenseRange === fixedExpenseAmountOptions[0]
        ? '请填写固定支出金额'
        : '',
    fixedCustom: hasCustomError(form.fixedExpenseRange, form.fixedExpenseCustomAmount)
      ? '请输入有效金额'
      : '',
    fixedDate:
      fixedExpenseRequired && !form.fixedExpenseDate
        ? '请选择固定支出日期'
        : fixedExpenseRequired && form.fixedExpenseDate < today
          ? '固定支出日期不能早于今天'
          : '',
    periodStartDate:
      form.livingCostPeriodStartDate && form.livingCostPeriodStartDate > today
        ? '生活费开始日期不能晚于今天'
        : '',
    income: !form.nextIncomeSource ? '请选择预计下次收入来源' : '',
    savingsGoal: form.savingsGoalRange === savingsAmountOptions[0] ? '请选择存款目标' : '',
    savingsGoalCustom: hasCustomError(form.savingsGoalRange, form.savingsGoalCustomAmount)
      ? '请输入有效金额'
      : '',
    minimumSavings:
      form.minimumSavingsRange === savingsAmountOptions[0] ? '请选择最低可接受存款' : '',
    minimumSavingsCustom: hasCustomError(form.minimumSavingsRange, form.minimumSavingsCustomAmount)
      ? '请输入有效金额'
      : '',
  };

  const canSave = Object.values(errors).every(Boolean) === false
    ? Object.values(errors).every((item) => !item)
    : false;

  function updateField(key, value) {
    setSavedText('');
    setForm((current) => {
      const nextForm = { ...current, [key]: value };
      saveWalletDraft(nextForm);
      return nextForm;
    });
  }

  function saveProfile() {
    if (!canSave) return;
    onSave(preview);
    clearWalletDraft();
    setSavedText('财务状态已更新，可以发起购物审判');
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
      <Card>
        <div className="flex flex-col justify-between gap-3 md:flex-row md:items-start">
          <div>
            <h2 className="text-xl font-bold text-slate-950">钱包生存面板</h2>
            <p className="mt-1 text-sm leading-6 text-slate-500">
              更新基础财务状态和存款计划后，系统会按日期模拟现金流，估算钱包血条、安全生存天数、存款进度和本周安全可用额度。
            </p>
          </div>
          <div className="inline-flex items-center gap-2 rounded-lg bg-amber-50 px-3 py-2 text-xs font-bold text-amber-700">
            <RefreshCw size={14} />
            {profile ? '可随时更新' : '首次使用需更新'}
          </div>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard icon={Wallet} label="钱包血条" value={`${preview.walletScore}/100`} hint="实时估算" />
          <MetricCard
            icon={CalendarDays}
            label="安全生存天数"
            value={`${preview.safeSurvivalDays}天`}
            hint={`含收入参考 ${preview.referenceSafeSurvivalDays}天`}
          />
          <MetricCard
            icon={Landmark}
            label="存款进度"
            value={`${preview.savingsProgress}%`}
            hint={`差 ${formatMoney(preview.savingsGapAmount)}`}
          />
          <MetricCard
            icon={PiggyBank}
            label="本周安全可用"
            value={formatMoney(preview.weeklySafeAvailableAmount)}
            hint={`未来 ${preview.safeAvailablePeriodDays} 天`}
          />
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <SelectField
            label="当前可用余额"
            value={form.balanceRange}
            options={balanceOptions}
            error={errors.balance}
            onChange={(value) => updateField('balanceRange', value)}
          />
          {form.balanceRange === '自定义金额' ? (
            <TextField
              label="自定义余额"
              type="number"
              value={form.balanceCustomAmount}
              placeholder="例如 3600"
              error={errors.balanceCustom}
              onChange={(value) => updateField('balanceCustomAmount', value)}
            />
          ) : null}

          <SelectField
            label="生活费预算金额"
            value={form.monthlyLivingCostRange}
            options={livingCostOptions}
            error={errors.livingCost}
            onChange={(value) => updateField('monthlyLivingCostRange', value)}
          />
          {form.monthlyLivingCostRange === '自定义金额' ? (
            <TextField
              label="自定义生活费预算"
              type="number"
              value={form.monthlyLivingCostCustomAmount}
              placeholder="例如 1800"
              error={errors.livingCostCustom}
              onChange={(value) => updateField('monthlyLivingCostCustomAmount', value)}
            />
          ) : null}
          <SelectField
            label="生活费预算方式"
            value={form.livingCostBudgetMethod}
            options={livingCostBudgetMethods}
            helper="按周预算更适合控制本周安全可用；按月预算会自动按当前周期摊销。"
            onChange={(value) => updateField('livingCostBudgetMethod', value)}
          />
          <TextField
            label="生活费从哪天开始算"
            type="date"
            value={form.livingCostPeriodStartDate}
            max={today}
            helper="不填时，按周默认本周一开始，按月默认本月 1 号开始。"
            error={errors.periodStartDate}
            onChange={(value) => updateField('livingCostPeriodStartDate', value)}
          />

          <SelectField
            label="下一个固定支出类型"
            value={form.fixedExpenseType}
            options={fixedExpenseTypes}
            onChange={(value) => updateField('fixedExpenseType', value)}
          />
          <SelectField
            label="下一个固定支出金额"
            value={form.fixedExpenseRange}
            options={fixedExpenseAmountOptions}
            helper={fixedExpenseRequired ? '用于识别近期现金流压力。' : '暂无固定支出时不参与计算。'}
            error={errors.fixedAmount}
            onChange={(value) => updateField('fixedExpenseRange', value)}
          />
          {form.fixedExpenseRange === '自定义金额' ? (
            <TextField
              label="自定义固定支出"
              type="number"
              value={form.fixedExpenseCustomAmount}
              placeholder="例如 1500"
              error={errors.fixedCustom}
              onChange={(value) => updateField('fixedExpenseCustomAmount', value)}
            />
          ) : null}
          <TextField
            label="下一个固定支出日期"
            type="date"
            value={form.fixedExpenseDate}
            min={today}
            error={errors.fixedDate}
            onChange={(value) => updateField('fixedExpenseDate', value)}
          />

          <SelectField
            label="预计下次收入来源"
            value={form.nextIncomeSource}
            options={incomeSources}
            error={errors.income}
            onChange={(value) => updateField('nextIncomeSource', value)}
          />
          <SelectField
            label="预计下次收入金额"
            value={form.nextIncomeRange}
            options={incomeAmountOptions}
            helper="不确定可以暂不填写。"
            onChange={(value) => updateField('nextIncomeRange', value)}
          />
          {form.nextIncomeRange === '自定义金额' ? (
            <TextField
              label="自定义收入金额"
              type="number"
              value={form.nextIncomeCustomAmount}
              placeholder="例如 3000"
              onChange={(value) => updateField('nextIncomeCustomAmount', value)}
            />
          ) : null}
          <TextField
            label="预计下次收入日期"
            type="date"
            value={form.nextIncomeDate}
            onChange={(value) => updateField('nextIncomeDate', value)}
          />

          <SelectField
            label="存款目标"
            value={form.savingsGoalRange}
            options={savingsAmountOptions}
            helper="用于展示当前存款目标完成度。"
            error={errors.savingsGoal}
            onChange={(value) => updateField('savingsGoalRange', value)}
          />
          {form.savingsGoalRange === '自定义金额' ? (
            <TextField
              label="自定义存款目标"
              type="number"
              value={form.savingsGoalCustomAmount}
              placeholder="例如 12000"
              error={errors.savingsGoalCustom}
              onChange={(value) => updateField('savingsGoalCustomAmount', value)}
            />
          ) : null}

          <SelectField
            label="最低可接受存款"
            value={form.minimumSavingsRange}
            options={savingsAmountOptions}
            helper="这笔钱会作为安全垫，计算自由消费前先扣除。"
            error={errors.minimumSavings}
            onChange={(value) => updateField('minimumSavingsRange', value)}
          />
          {form.minimumSavingsRange === '自定义金额' ? (
            <TextField
              label="自定义最低存款"
              type="number"
              value={form.minimumSavingsCustomAmount}
              placeholder="例如 5000"
              error={errors.minimumSavingsCustom}
              onChange={(value) => updateField('minimumSavingsCustomAmount', value)}
            />
          ) : null}

          <SelectField
            label="财务状态更新频率"
            value={form.updateFrequency}
            options={updateFrequencyOptions}
            onChange={(value) => updateField('updateFrequency', value)}
          />
        </div>

        <div className="mt-5 rounded-lg bg-slate-50 p-4">
          <div className="mb-2 flex items-center justify-between text-sm">
            <span className="font-semibold text-slate-700">钱包血条</span>
            <span className="font-bold text-slate-950">{preview.walletScore} / 100</span>
          </div>
          <ProgressBar value={preview.walletScore} />
          <p className="mt-3 text-sm leading-6 text-slate-600">
            当前安全等级：{status.label}。{status.text}
            最低可接受存款 {formatMoney(preview.minimumSavingsAmount)} 已作为停止线。
            固定支出按日期扣除，明确金额和日期的收入进入参考口径。
          </p>
          <div className="mt-3 rounded-lg bg-white p-3 text-sm leading-6 text-slate-600">
            {preview.weeklySafeAvailableAmount > 0 ? (
              <>
                已考虑最低存款、未来 {preview.safeAvailablePeriodDays} 天生活费、已知固定支出和确认收入。
                本周最多可安全用于非必要消费 {formatMoney(preview.weeklySafeAvailableAmount)}。
              </>
            ) : (
              <>
                未来 {preview.safeAvailablePeriodDays} 天内存在现金流压力，预计余额可能低于最低可接受存款，建议暂停非必要消费。
              </>
            )}
            {' '}
            当前生活费周期：{preview.livingCostCycle?.startDate} 至 {preview.livingCostCycle?.endDate}。
          </div>
        </div>

        <div className="mt-5 flex flex-col gap-3 sm:flex-row">
          <PrimaryButton className="sm:w-40" disabled={!canSave} onClick={saveProfile}>
            保存财务状态
          </PrimaryButton>
          <PrimaryButton
            className="sm:w-40"
            variant="secondary"
            disabled={!profile && !savedText}
            onClick={onStartJudge}
          >
            发起购物审判
          </PrimaryButton>
          {savedText ? <p className="text-sm font-medium text-emerald-700">{savedText}</p> : null}
        </div>
      </Card>

      <Card>
        <h3 className="flex items-center gap-2 text-base font-bold text-slate-950">
          <AlertTriangle size={18} className="text-amber-600" />
          更新提醒
        </h3>
        <div className="mt-4 space-y-3 text-sm leading-6">
          <div className="rounded-lg bg-amber-50 p-3 text-amber-800">
            未保存财务状态时，不能发起真实购物审判。
          </div>
          <div className="rounded-lg bg-slate-50 p-3 text-slate-700">
            本周安全可用额度会取未来周期内每日最小安全余量，直接展示可用金额。
          </div>
          <div className="rounded-lg bg-emerald-50 p-3 text-emerald-800">
            本产品只提供消费决策辅助，不构成理财、投资、借贷建议。
          </div>
        </div>
      </Card>
    </div>
  );
}
