const storageKey = 'buy-or-not-mvp';
const walletDraftKey = 'buy-or-not-wallet-draft';

export const initialState = {
  financialProfile: null,
  cases: [],
  coolingItems: [],
  stats: {
    totalJudgementCount: 0,
    totalCoolingCount: 0,
    totalAbandonedCount: 0,
    totalSavedAmount: 0,
    currentWeekJudgementCount: 0,
    currentWeekSavedAmount: 0,
    title: '理智购物新人',
  },
};

export function loadState() {
  try {
    const raw = localStorage.getItem(storageKey);
    return raw ? { ...initialState, ...JSON.parse(raw) } : initialState;
  } catch {
    return initialState;
  }
}

export function saveState(state) {
  localStorage.setItem(storageKey, JSON.stringify(state));
}

export function loadWalletDraft() {
  try {
    const raw = localStorage.getItem(walletDraftKey);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveWalletDraft(draft) {
  localStorage.setItem(walletDraftKey, JSON.stringify(draft));
}

export function clearWalletDraft() {
  localStorage.removeItem(walletDraftKey);
}

export function createId(prefix) {
  return `${prefix}_${Date.now()}_${Math.random().toString(16).slice(2, 8)}`;
}
