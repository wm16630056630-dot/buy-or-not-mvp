import { useMemo, useState } from 'react';
import { ChevronRight, Gavel, ShieldAlert } from 'lucide-react';
import Card from '../components/Card';
import { SelectField, TextAreaField, TextField } from '../components/Field';
import PrimaryButton from '../components/PrimaryButton';
import {
  alternativeStatuses,
  emotionStatuses,
  fixedExpenseImpacts,
  productPriceOptions,
  productTypes,
  promotionStatuses,
  purchaseReasons,
  usageFrequencies,
} from '../data/options';
import { formatMoney, toAmount } from '../utils/calculations';

const emptyCase = {
  productName: '',
  productType: productTypes[0],
  priceRange: productPriceOptions[0],
  priceCustomAmount: '',
  purchaseReason: purchaseReasons[0],
  usageFrequency: usageFrequencies[0],
  alternativeStatus: alternativeStatuses[0],
  promotionStatus: promotionStatuses[0],
  emotionStatus: emotionStatuses[0],
  fixedExpenseImpact: fixedExpenseImpacts[0],
  note: '',
};

function isPlaceholder(value) {
  return value.includes('请选择');
}

export default function JudgePage({ profile, onSubmit, onNeedProfile }) {
  const [form, setForm] = useState(emptyCase);
  const priceAmount = useMemo(
    () => toAmount(form.priceRange, form.priceCustomAmount),
    [form.priceCustomAmount, form.priceRange],
  );

  const errors = {
    productName: form.productName.trim() ? '' : '请输入商品名称',
    productType: isPlaceholder(form.productType) ? '请选择商品类型' : '',
    priceRange: isPlaceholder(form.priceRange) ? '请选择商品价格' : '',
    priceCustom:
      form.priceRange === '自定义金额' && (!form.priceCustomAmount || Number(form.priceCustomAmount) <= 0)
        ? '请输入有效金额'
        : '',
    purchaseReason: isPlaceholder(form.purchaseReason) ? '请选择购买原因' : '',
    alternativeStatus: isPlaceholder(form.alternativeStatus) ? '请选择替代品情况' : '',
  };
  const canSubmit = profile && Object.values(errors).every((item) => !item);

  function updateField(key, value) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function submitCase() {
    if (!profile) {
      onNeedProfile();
      return;
    }
    if (!canSubmit) return;
    onSubmit({
      ...form,
      productName: form.productName.trim(),
      priceAmount,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  }

  if (!profile) {
    return (
      <Card>
        <div className="flex items-start gap-3">
          <ShieldAlert className="mt-1 text-amber-600" size={22} />
          <div>
            <h2 className="text-xl font-bold text-slate-950">请先更新钱包状态</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              购物审判需要当前余额、生活费、最低存款等信息，否则无法判断这笔消费是否安全。
            </p>
            <PrimaryButton className="mt-4" onClick={onNeedProfile}>
              去更新钱包状态
            </PrimaryButton>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
      <Card>
        <div className="flex flex-col justify-between gap-3 md:flex-row md:items-start">
          <div>
            <h2 className="text-xl font-bold text-slate-950">提交购物案件</h2>
            <p className="mt-1 text-sm leading-6 text-slate-500">
              填入想买的东西，系统会结合钱包时间轴、存款底线和消费动机给出建议。
            </p>
          </div>
          <div className="rounded-lg bg-slate-50 px-3 py-2 text-xs font-bold text-slate-600">
            当前钱包血条 {profile.walletScore}/100
          </div>
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <TextField
            label="商品名称"
            value={form.productName}
            maxLength={30}
            placeholder="例如无线耳机、运动鞋、课程"
            error={errors.productName}
            onChange={(value) => updateField('productName', value)}
          />
          <SelectField
            label="商品类型"
            value={form.productType}
            options={productTypes}
            error={errors.productType}
            onChange={(value) => updateField('productType', value)}
          />
          <SelectField
            label="商品价格"
            value={form.priceRange}
            options={productPriceOptions}
            error={errors.priceRange}
            onChange={(value) => updateField('priceRange', value)}
          />
          {form.priceRange === '自定义金额' ? (
            <TextField
              label="自定义价格"
              type="number"
              value={form.priceCustomAmount}
              placeholder="例如 899"
              error={errors.priceCustom}
              onChange={(value) => updateField('priceCustomAmount', value)}
            />
          ) : null}
          <SelectField
            label="购买原因"
            value={form.purchaseReason}
            options={purchaseReasons}
            error={errors.purchaseReason}
            onChange={(value) => updateField('purchaseReason', value)}
          />
          <SelectField
            label="预计使用频率"
            value={form.usageFrequency}
            options={usageFrequencies}
            onChange={(value) => updateField('usageFrequency', value)}
          />
          <SelectField
            label="是否已有替代品"
            value={form.alternativeStatus}
            options={alternativeStatuses}
            error={errors.alternativeStatus}
            onChange={(value) => updateField('alternativeStatus', value)}
          />
          <SelectField
            label="是否限时促销"
            value={form.promotionStatus}
            options={promotionStatuses}
            onChange={(value) => updateField('promotionStatus', value)}
          />
          <SelectField
            label="当前情绪状态"
            value={form.emotionStatus}
            options={emotionStatuses}
            onChange={(value) => updateField('emotionStatus', value)}
          />
          <SelectField
            label="是否会影响固定支出"
            value={form.fixedExpenseImpact}
            options={fixedExpenseImpacts}
            onChange={(value) => updateField('fixedExpenseImpact', value)}
          />
          <div className="sm:col-span-2">
            <TextAreaField
              label="补充说明"
              value={form.note}
              maxLength={200}
              placeholder="可以写为什么想买、替代方案、真实用途等"
              helper="选填，最多 200 字。"
              onChange={(value) => updateField('note', value)}
            />
          </div>
        </div>

        <PrimaryButton className="mt-5 w-full" disabled={!canSubmit} onClick={submitCase}>
          提交审判
          <ChevronRight size={16} />
        </PrimaryButton>
      </Card>

      <Card>
        <h3 className="flex items-center gap-2 text-base font-bold text-slate-950">
          <Gavel size={18} />
          审判预览
        </h3>
        <div className="mt-4 space-y-3 text-sm leading-6 text-slate-600">
          <div className="rounded-lg bg-slate-50 p-3">
            商品金额：<span className="font-bold text-slate-950">{formatMoney(priceAmount)}</span>
          </div>
          <div className="rounded-lg bg-slate-50 p-3">
            系统会重新模拟购买后的未来现金流，重点看是否跌破最低可接受存款。
          </div>
          <div className="rounded-lg bg-amber-50 p-3 text-amber-800">
            情绪消费、促销压力、替代品可用都会提高风险等级。
          </div>
        </div>
      </Card>
    </div>
  );
}
