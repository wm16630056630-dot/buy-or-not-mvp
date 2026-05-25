import { CheckCircle2, Clock, ShieldAlert, ShoppingBag, XCircle } from 'lucide-react';
import Card from '../components/Card';
import PrimaryButton from '../components/PrimaryButton';
import ProgressBar from '../components/ProgressBar';
import { formatMoney } from '../utils/calculations';

const resultLabels = {
  buy: '可以买',
  wait: '建议等等',
  cooling: '加入冷静清单',
  alternative: '建议找平替或放弃',
  not_recommended: '不建议购买',
};

function riskText(level) {
  return {
    low: '低风险',
    medium: '中风险',
    high: '高风险',
    critical: '紧急风险',
  }[level] || '待判断';
}

function statusText(status) {
  return {
    judged: '待决策',
    purchased: '已购买',
    cooling: '已加入冷静清单',
    abandoned: '已放弃',
    purchased_after_cooling: '冷静后购买',
    abandoned_after_cooling: '冷静后放弃',
    extended: '继续冷静',
  }[status] || '已记录';
}

export default function ResultPage({ caseResult, onBuy, onCool, onAbandon, onJudgeAgain }) {
  if (!caseResult) {
    return (
      <Card>
        <h2 className="text-xl font-bold text-slate-950">还没有审判结果</h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">先提交一个购物案件，系统会在这里展示判断结果。</p>
        <PrimaryButton className="mt-4" onClick={onJudgeAgain}>
          去购物审判
        </PrimaryButton>
      </Card>
    );
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
      <Card>
        <div className="flex flex-col justify-between gap-3 md:flex-row md:items-start">
          <div>
            <p className="text-sm font-semibold text-slate-500">案件：{caseResult.productName}</p>
            <h2 className="mt-1 text-xl font-bold text-slate-950">
              审判结果：{caseResult.resultTitle || resultLabels[caseResult.resultType]}
            </h2>
            <p className="mt-1 text-sm leading-6 text-slate-500">
              {caseResult.productType} / {formatMoney(caseResult.priceAmount)} / 风险分 {caseResult.riskScore}
            </p>
          </div>
          <div className="rounded-lg bg-slate-950 px-3 py-2 text-xs font-bold text-white">
            {riskText(caseResult.riskLevel)}
          </div>
        </div>

        {caseResult.confidenceLevel === 'low' ? (
          <div className="mt-4 rounded-lg bg-amber-50 p-3 text-sm leading-6 text-amber-800">
            本次结果基于较少信息估算，建议补充价格、使用频率或钱包状态后重新审判。
          </div>
        ) : null}

        <div className="mt-5 rounded-lg bg-slate-50 p-4">
          <h3 className="flex items-center gap-2 text-sm font-bold text-slate-950">
            <ShieldAlert size={16} />
            法官意见
          </h3>
          <ol className="mt-3 space-y-2 text-sm leading-6 text-slate-700">
            {caseResult.reasons.map((reason) => (
              <li key={reason}>{reason}</li>
            ))}
          </ol>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          {caseResult.status === 'judged' ? (
            <>
              <PrimaryButton variant="secondary" onClick={onBuy}>
                <ShoppingBag size={16} />
                仍然购买
              </PrimaryButton>
              <PrimaryButton onClick={onCool}>
                <Clock size={16} />
                加入冷静清单
              </PrimaryButton>
              <PrimaryButton variant="success" onClick={onAbandon}>
                <XCircle size={16} />
                放弃购买
              </PrimaryButton>
            </>
          ) : (
            <div className="rounded-lg bg-slate-50 p-3 text-sm font-semibold text-slate-700 sm:col-span-3">
              当前案件状态：{statusText(caseResult.status)}
            </div>
          )}
        </div>
      </Card>

      <Card>
        <h3 className="text-base font-bold text-slate-950">购买前后影响</h3>
        <div className="mt-4 space-y-5">
          <div>
            <div className="mb-2 flex justify-between text-sm">
              <span>购买前血条</span>
              <span className="font-bold">{caseResult.beforeWalletScore}</span>
            </div>
            <ProgressBar value={caseResult.beforeWalletScore} />
          </div>
          <div>
            <div className="mb-2 flex justify-between text-sm">
              <span>购买后血条</span>
              <span className="font-bold">{caseResult.afterWalletScore}</span>
            </div>
            <ProgressBar value={caseResult.afterWalletScore} />
          </div>
        </div>
        <div className="mt-5 space-y-3 text-sm leading-6">
          <div className="rounded-lg bg-slate-50 p-3">
            安全生存天数变化：{caseResult.beforeSafeSurvivalDays} 天 → {caseResult.afterSafeSurvivalDays} 天
          </div>
          <div className="rounded-lg bg-slate-50 p-3">
            购买后本周安全可用：{formatMoney(caseResult.afterSafeAvailableAmount || 0)}
          </div>
          <div className="rounded-lg bg-emerald-50 p-3 text-emerald-800">
            <CheckCircle2 className="mr-1 inline" size={15} />
            所有结论都是消费决策辅助，不替你做最终决定。
          </div>
        </div>
      </Card>
    </div>
  );
}
