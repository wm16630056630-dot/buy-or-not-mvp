import { useEffect, useState } from 'react';
import { Clock, Gavel, ShieldAlert, Wallet } from 'lucide-react';
import JudgePage from './pages/JudgePage';
import ResultPage from './pages/ResultPage';
import WalletPage from './pages/WalletPage';
import WishlistPage from './pages/WishlistPage';
import { calculateWalletMetrics, getCoolingHours } from './utils/calculations';
import { judgePurchase } from './utils/judgeEngine';
import { createId, initialState, loadState, saveState } from './utils/storage';

const tabs = [
  { key: 'wallet', label: '钱包状态', icon: Wallet },
  { key: 'judge', label: '购物审判', icon: Gavel },
  { key: 'result', label: '审判结果', icon: ShieldAlert },
  { key: 'wishlist', label: '冷静清单', icon: Clock },
];

export default function App() {
  const [activeTab, setActiveTab] = useState('wallet');
  const [appState, setAppState] = useState(initialState);

  useEffect(() => {
    setAppState(loadState());
  }, []);

  function updateAppState(nextState) {
    setAppState(nextState);
    saveState(nextState);
  }

  function saveProfile(profile) {
    updateAppState({ ...appState, financialProfile: profile });
  }

  function goToJudge() {
    setActiveTab('judge');
  }

  function currentCoolingItems() {
    return appState.coolingItems.map((item) => {
      const isExpired = item.status === 'cooling' && new Date(item.coolingEndAt).getTime() <= Date.now();
      return isExpired ? { ...item, status: 'review_pending' } : item;
    });
  }

  function submitJudge(purchaseCase) {
    const judgedCase = judgePurchase(appState.financialProfile, {
      ...purchaseCase,
      id: createId('case'),
    });
    const nextState = {
      ...appState,
      cases: [judgedCase, ...appState.cases],
      stats: {
        ...appState.stats,
        totalJudgementCount: appState.stats.totalJudgementCount + 1,
        currentWeekJudgementCount: appState.stats.currentWeekJudgementCount + 1,
      },
    };

    updateAppState(nextState);
    setActiveTab('result');
  }

  function latestCase() {
    return appState.cases[0] || null;
  }

  function updateCaseStatus(caseId, status) {
    return appState.cases.map((item) =>
      item.id === caseId ? { ...item, status, updatedAt: new Date().toISOString() } : item,
    );
  }

  function spendFromProfile(profile, amount) {
    if (!profile) return profile;
    const nextBalance = Math.max(0, Number(profile.balanceAmount || 0) - Number(amount || 0));
    const nextProfile = {
      ...profile,
      balanceRange: '自定义金额',
      balanceCustomAmount: String(nextBalance),
      balanceAmount: nextBalance,
      updatedAt: new Date().toISOString(),
    };

    return {
      ...nextProfile,
      ...calculateWalletMetrics(nextProfile),
    };
  }

  function decidePurchase() {
    const currentCase = latestCase();
    if (!currentCase) return;
    updateAppState({
      ...appState,
      financialProfile: spendFromProfile(appState.financialProfile, currentCase.priceAmount),
      cases: updateCaseStatus(currentCase.id, 'purchased'),
    });
  }

  function addToCooling() {
    const currentCase = latestCase();
    if (!currentCase) return;
    const coolingHours = getCoolingHours(currentCase.priceAmount);
    const now = new Date();
    const coolingEnd = new Date(now.getTime() + coolingHours * 3600000);
    const coolingItem = {
      id: createId('cooling'),
      purchaseCaseId: currentCase.id,
      productName: currentCase.productName,
      productType: currentCase.productType,
      priceAmount: currentCase.priceAmount,
      resultTitle: currentCase.resultTitle,
      coolingStartAt: now.toISOString(),
      coolingEndAt: coolingEnd.toISOString(),
      status: 'cooling',
      extensionCount: 0,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    };

    updateAppState({
      ...appState,
      cases: updateCaseStatus(currentCase.id, 'cooling'),
      coolingItems: [coolingItem, ...appState.coolingItems],
      stats: {
        ...appState.stats,
        totalCoolingCount: appState.stats.totalCoolingCount + 1,
      },
    });
    setActiveTab('wishlist');
  }

  function abandonPurchase() {
    const currentCase = latestCase();
    if (!currentCase) return;
    updateAppState({
      ...appState,
      cases: updateCaseStatus(currentCase.id, 'abandoned'),
      stats: {
        ...appState.stats,
        totalAbandonedCount: appState.stats.totalAbandonedCount + 1,
        totalSavedAmount: appState.stats.totalSavedAmount + currentCase.priceAmount,
        currentWeekSavedAmount: appState.stats.currentWeekSavedAmount + currentCase.priceAmount,
        title:
          appState.stats.currentWeekSavedAmount + currentCase.priceAmount >= 1000
            ? '钱包守门员'
            : appState.stats.title,
      },
    });
    setActiveTab('wishlist');
  }

  function reviewCoolingItem(itemId, nextStatus) {
    const targetItem = appState.coolingItems.find((item) => item.id === itemId);
    if (!targetItem) return;
    const isAbandoned = nextStatus === 'abandoned_after_cooling';
    const isPurchased = nextStatus === 'purchased_after_cooling';
    const now = new Date().toISOString();

    updateAppState({
      ...appState,
      financialProfile: isPurchased
        ? spendFromProfile(appState.financialProfile, targetItem.priceAmount)
        : appState.financialProfile,
      cases: updateCaseStatus(targetItem.purchaseCaseId, nextStatus),
      coolingItems: appState.coolingItems.map((item) =>
        item.id === itemId
          ? {
              ...item,
              status: nextStatus,
              extensionCount: nextStatus === 'extended' ? item.extensionCount + 1 : item.extensionCount,
              coolingEndAt:
                nextStatus === 'extended'
                  ? new Date(Date.now() + getCoolingHours(item.priceAmount) * 3600000).toISOString()
                  : item.coolingEndAt,
              updatedAt: now,
            }
          : item,
      ),
      stats: isAbandoned
        ? {
            ...appState.stats,
            totalAbandonedCount: appState.stats.totalAbandonedCount + 1,
            totalSavedAmount: appState.stats.totalSavedAmount + targetItem.priceAmount,
            currentWeekSavedAmount: appState.stats.currentWeekSavedAmount + targetItem.priceAmount,
            title:
              appState.stats.currentWeekSavedAmount + targetItem.priceAmount >= 1000
                ? '钱包守门员'
                : appState.stats.title,
          }
        : appState.stats,
    });
  }

  return (
    <main className="min-h-screen bg-[#f6f7fb] px-4 py-5 text-slate-950">
      <section className="mx-auto flex max-w-6xl flex-col gap-4">
        <header className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-950 text-white">
                <Wallet size={22} />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-500">消费前冷静工具</p>
                <h1 className="text-2xl font-bold">买不买事务所</h1>
              </div>
            </div>
            <p className="max-w-xl text-sm leading-6 text-slate-500">
              先更新钱包状态，再把想买的东西交给规则引擎审判。MVP 使用本地存储，不接入真实账户。
            </p>
          </div>
        </header>

        <nav className="grid grid-cols-2 gap-2 md:grid-cols-4">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const selected = activeTab === tab.key;

            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex h-11 items-center justify-center gap-2 rounded-lg border px-3 text-sm font-bold transition ${
                  selected
                    ? 'border-slate-950 bg-slate-950 text-white'
                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Icon size={17} />
                {tab.label}
              </button>
            );
          })}
        </nav>

        <div>
          {activeTab === 'wallet' ? (
            <WalletPage
              profile={appState.financialProfile}
              onSave={saveProfile}
              onStartJudge={goToJudge}
            />
          ) : activeTab === 'judge' ? (
            <JudgePage
              profile={appState.financialProfile}
              onSubmit={submitJudge}
              onNeedProfile={() => setActiveTab('wallet')}
            />
          ) : activeTab === 'result' ? (
            <ResultPage
              caseResult={latestCase()}
              onBuy={decidePurchase}
              onCool={addToCooling}
              onAbandon={abandonPurchase}
              onJudgeAgain={() => setActiveTab('judge')}
            />
          ) : activeTab === 'wishlist' ? (
            <WishlistPage
              items={currentCoolingItems()}
              stats={appState.stats}
              onReview={reviewCoolingItem}
            />
          ) : (
            <div className="rounded-lg border border-slate-200 bg-white p-5 text-sm text-slate-600 shadow-sm">
              该页面将在下一步接入。
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
