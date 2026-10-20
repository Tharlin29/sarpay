import React, { useState } from 'react';
import { Coins, CheckCircle2, AlertCircle, X, CreditCard, Send, ShieldCheck } from 'lucide-react';
import { submitTopupRequest } from '../services/firebase';
import { User } from '../types';

interface TopupRequestModalProps {
  currentUser: User;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const COIN_TOPUP_PLANS = [
  { coins: 50, priceMm: '၅,၀၀၀ ကျပ်', desc: 'စတင်အသုံးပြုသူများအတွက်' },
  { coins: 100, priceMm: '၁၀,၀၀၀ ကျပ်', desc: 'လူကြိုက်အများဆုံး', popular: true },
  { coins: 300, priceMm: '၂၈,၀၀၀ ကျပ်', desc: 'စာအုပ်ဖိုင်များစွာအတွက်' },
  { coins: 500, priceMm: '၄၅,၀၀၀ ကျပ်', desc: 'အထူးတန် Package' },
  { coins: 1000, priceMm: '၈၅,၀၀၀ ကျပ်', desc: 'VIP အကန့်အသတ်မဲ့' },
];

export const TopupRequestModal: React.FC<TopupRequestModalProps> = ({
  currentUser,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [selectedPlan, setSelectedPlan] = useState(COIN_TOPUP_PLANS[1]);
  const [paymentMethod, setPaymentMethod] = useState('KBZPay');
  const [transactionNote, setTransactionNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!transactionNote.trim()) {
      setError('ငွေလွှဲပြေစာနံပါတ် (TxID နောက်ဆုံး ၆ လုံး သို့မဟုတ် ငွေလွှဲမှတ်တမ်း) ရိုက်ထည့်ပေးပါ။');
      return;
    }

    setLoading(true);
    try {
      const result = await submitTopupRequest({
        userId: currentUser.id,
        username: currentUser.username,
        phone: currentUser.phone,
        requestedCoins: selectedPlan.coins,
        paymentMethod,
        transactionNote: `ငွေလွှဲမှတ်ချက်: ${transactionNote.trim()} | Package: ${selectedPlan.coins} Coins (${selectedPlan.priceMm})`,
      });

      if (result.success) {
        setSubmitted(true);
        onSuccess();
        setTimeout(() => {
          setSubmitted(false);
          setTransactionNote('');
          onClose();
        }, 2500);
      } else {
        setError(result.error || 'တောင်းဆိုမှု မအောင်မြင်ပါ။');
      }
    } catch (err: any) {
      setError(err.message || 'စနစ်ချို့ယွင်းချက် ဖြစ်ပေါ်ခဲ့သည်။');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden p-6 text-slate-100 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
              <Coins className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Admin ထံမှ Coin ဝယ်ယူရန် တောင်းဆိုခြင်း</h3>
              <p className="text-xs text-slate-400">Admin မှ စစ်ဆေးပြီး သင့် User ID သို့ Coin တိုက်ရိုက်ထည့်ပေးမည်ဖြစ်ပါသည်</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {submitted ? (
          <div className="py-8 text-center space-y-3">
            <div className="w-16 h-16 mx-auto rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
              <CheckCircle2 className="w-9 h-9" />
            </div>
            <h4 className="text-lg font-bold text-white">တောင်းဆိုမှု အောင်မြင်စွာ ပို့ပြီးပါပြီ!</h4>
            <p className="text-xs text-slate-300 max-w-sm mx-auto">
              Admin ထံသို့ သင့် User ID (<span className="text-amber-400 font-mono font-bold">{currentUser.id}</span>) ဖြင့်
              တောင်းဆိုမှု ပေးပို့ထားပါသည်။ ခေတ္တစောင့်ဆိုင်းပြီးနောက် Admin မှ စစ်ဆေးကာ Coin ဖြည့်သွင်းပေးပါမည်။
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 my-4">
            {error && (
              <div className="p-3 bg-red-500/15 border border-red-500/30 rounded-xl flex items-start gap-2.5 text-xs text-red-300">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-400" />
                <span>{error}</span>
              </div>
            )}

            {/* Plan selection */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-2">
                Coin ပမာဏ ရွေးချယ်ပါ
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {COIN_TOPUP_PLANS.map((plan) => {
                  const isSelected = selectedPlan.coins === plan.coins;
                  return (
                    <div
                      key={plan.coins}
                      onClick={() => setSelectedPlan(plan)}
                      className={`cursor-pointer p-3 rounded-xl border text-center transition-all ${
                        isSelected
                          ? 'bg-amber-500/20 border-amber-500 shadow-md shadow-amber-500/10'
                          : 'bg-slate-800/60 border-slate-700/80 hover:bg-slate-800'
                      }`}
                    >
                      <div className="text-base font-bold text-amber-400 flex items-center justify-center gap-1">
                        <Coins className="w-4 h-4" />
                        {plan.coins} Coins
                      </div>
                      <div className="text-xs font-semibold text-white mt-0.5">{plan.priceMm}</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">{plan.desc}</div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Payment Account Details */}
            <div className="p-3.5 bg-slate-800/80 border border-slate-700 rounded-xl space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-amber-400">
                <CreditCard className="w-4 h-4" />
                <span>ငွေလွှဲပေးချေရမည့် Admin အကောင့်များ</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                <div className="p-2.5 bg-slate-900/80 rounded-lg border border-slate-700/60">
                  <div className="font-semibold text-sky-400">KBZPay / KPay</div>
                  <div className="font-mono text-slate-200">09-771234567 (SarPay Official)</div>
                </div>
                <div className="p-2.5 bg-slate-900/80 rounded-lg border border-slate-700/60">
                  <div className="font-semibold text-amber-400">WavePay</div>
                  <div className="font-mono text-slate-200">09-771234567 (SarPay Official)</div>
                </div>
              </div>
            </div>

            {/* Form Inputs */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  ငွေပေးချေသည့် စနစ်
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                >
                  <option value="KBZPay">KBZPay (KPay)</option>
                  <option value="WavePay">WavePay</option>
                  <option value="CB Pay">CB Pay</option>
                  <option value="AYA Pay">AYA Pay</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  သင့် User ID
                </label>
                <input
                  type="text"
                  value={currentUser.id}
                  disabled
                  className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700/50 rounded-xl text-xs text-amber-400 font-mono font-bold"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                ငွေလွှဲပြေစာ TxID / ဖုန်းနံပါတ် / ငွေလွှဲမှတ်ချက်
              </label>
              <input
                type="text"
                placeholder="ဥပမာ- TxID 2938472910 သို့မဟုတ် လွှဲသောဖုန်း 09..."
                value={transactionNote}
                onChange={(e) => setTransactionNote(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                disabled={loading}
              />
              <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                Admin မှ ငွေလွှဲအထောက်အထားကို စစ်ဆေးပြီး User ID သို့ တိကျစွာ Coin ထည့်ပေးပါမည်
              </p>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="w-1/3 py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-sm font-medium transition-colors"
              >
                မလုပ်တော့ပါ
              </button>
              <button
                type="submit"
                disabled={loading}
                className="w-2/3 py-2.5 px-4 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 rounded-xl text-sm font-bold shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center gap-2"
              >
                <Send className="w-4 h-4" />
                {loading ? 'ပေးပို့နေသည်...' : 'Admin ထံသို့ တောင်းဆိုမည်'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
