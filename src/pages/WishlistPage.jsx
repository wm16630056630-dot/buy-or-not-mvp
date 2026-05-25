import { BadgeCheck, Clock, RotateCcw, ShoppingBag, XCircle } from 'lucide-react';
import Card from '../components/Card';
import PrimaryButton from '../components/PrimaryButton';
import { formatMoney } from '../utils/calculations';

function statusLabel(status) {
  return {
    cooling: '冷静中',
    review_pending: '待复审',
    purchased_after_cooling: '冷静后购买',
    abandoned_after_cooling: '冷静后放弃',
    extended: '继续冷静',
  }[status] || '已记录';
}

function getLeftText(item) {
  if (!['cooling', 'extended'].includes(item.status)) return statusLabel(item.status);
  const leftMs = new Date(item.coolingEndAt).getTime() - Date.now();
  if (leftMs <= 0) return '待复审';
  const leftHours = Math.ceil(leftMs / 3600000);
  return leftHours >= 24 ? `剩余 ${Math.ceil(leftHours / 24)} 天` : `剩余 ${leftHours} 小时`;
}

function canReview(status) {
  return ['cooling', 'review_pending', 'extended'].includes(status);
}

export default function WishlistPage({ items, stats, onReview }) {
  const activeItems = items.filter((item) => item.status !== 'removed');

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
      <Card>
        <h2 className="text-xl font-bold text-slate-950">愿望冷静清单</h2>
        <p className="mt-1 text-sm leading-6 text-slate-500">
          把“立刻下单”变成“延迟判断”，冷静期结束后再做决定。
        </p>

        <div className="mt-5 space-y-3">
          {activeItems.length ? (
            activeItems.map((item) => (
              <div key={item.id} className="rounded-lg border border-slate-200 bg-white p-4">
                <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                  <div>
                    <h3 className="font-bold text-slate-950">{item.productName}</h3>
                    <p className="mt-1 text-sm text-slate-500">
                      {formatMoney(item.priceAmount)} / {item.productType} / {getLeftText(item)}
                    </p>
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      原始建议：{item.resultTitle}
                    </p>
                  </div>
                  <span className="inline-flex rounded-lg bg-slate-50 px-3 py-1 text-xs font-bold text-slate-700">
                    {getLeftText(item)}
                  </span>
                </div>

                {canReview(item.status) ? (
                  <div className="mt-4 grid gap-2 sm:grid-cols-3">
                    <PrimaryButton variant="secondary" onClick={() => onReview(item.id, 'purchased_after_cooling')}>
                      <ShoppingBag size={16} />
                      确认购买
                    </PrimaryButton>
                    <PrimaryButton variant="warning" onClick={() => onReview(item.id, 'extended')}>
                      <RotateCcw size={16} />
                      继续冷静
                    </PrimaryButton>
                    <PrimaryButton variant="success" onClick={() => onReview(item.id, 'abandoned_after_cooling')}>
                      <XCircle size={16} />
                      放弃购买
                    </PrimaryButton>
                  </div>
                ) : null}
              </div>
            ))
          ) : (
            <div className="rounded-lg bg-slate-50 p-5 text-sm leading-6 text-slate-600">
              暂时没有冷静中的商品。下一次心动下单前，可以先交给事务所审判一下。
            </div>
          )}
        </div>
      </Card>

      <Card>
        <h3 className="flex items-center gap-2 text-base font-bold text-slate-950">
          <BadgeCheck size={18} />
          本周战绩
        </h3>
        <div className="mt-4 space-y-3 text-sm leading-6">
          <div className="rounded-lg bg-slate-50 p-3">审判次数：{stats.currentWeekJudgementCount}</div>
          <div className="rounded-lg bg-slate-50 p-3">冷静次数：{stats.totalCoolingCount}</div>
          <div className="rounded-lg bg-emerald-50 p-3 text-emerald-800">
            主动放弃金额：{formatMoney(stats.currentWeekSavedAmount)}
          </div>
          <div className="rounded-lg bg-amber-50 p-3 text-amber-800">
            称号：{stats.title}
          </div>
          <div className="rounded-lg bg-slate-50 p-3 text-slate-600">
            <Clock className="mr-1 inline" size={15} />
            冷静期结束后，商品会保留在这里等待复审。
          </div>
        </div>
      </Card>
    </div>
  );
}
