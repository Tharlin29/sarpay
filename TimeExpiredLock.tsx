import React, { useState } from 'react';
import {
  Clock,
  Coins,
  Plus,
  Copy,
  Check,
  LogOut,
  Sparkles,
  AlertCircle,
  Loader2,
  CheckCircle2,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { User } from '../types';
import { buyTimeWithCoins } from '../services/firebase';

interface TimeExpiredLockProps {
  currentUser: User;
  onOpenBuyTime: () => void;
  onOpenTopup: () => void;
  onLogout: () => void;
  onTimePurchased: (updatedUser: User) => void;
}

export const TimeExpiredLock: React.FC<TimeExpiredLockProps> = ({
  currentUser,
  onOpenBuyTime,
  onOpenTopup,
  onLogout,
  onTimePurchased,
}) => {
  const [copied, setCopied] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<{
    id: string;
    title: string;
    seconds: number;
    coins: number;
  }>({
    id: '1h',
    title: '၁ နာရီ အသုံးပြုခွင့်',
    seconds: 3600,
    coins: 10,
  });

  const [buying, setBuying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const copyId = () => {
    navigator.clipboard.writeText(currentUser.id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Direct 1-click buy & unlock
  const handleDirectBuy = async () => {
    setError(null);

    if (currentUser.coins < selectedPlan.coins) {
      setError(
        `သင့်ထံတွင် ${currentUser.coins} Coins သာရှိပြီး ဤ Package အတွက် ${selectedPlan.coins} Coins လိုအပ်ပါသည်။ Admin ထံမှ Coin ဖြည့်သွင်းပါ။`
      );
      return;
    }

    setBuying(true);
    try {
      const result = await buyTimeWithCoins(
        currentUser.id,
        selectedPlan.coins,
        selectedPlan.seconds
      );

      if (result.success && result.user) {
        confetti({
          particleCount: 70,
          spread: 80,
          origin: { y: 0.5 },
        });

        // Immediately update state in App.tsx -> isTimeExpired becomes false -> app unlocks!
        onTimePurchased(result.user);
      } else {
        setError(result.error || 'အချိန်ဝယ်ယူမှု မအောင်မြင်ပါ။');
      }
    } catch (err: any) {
      setError(err.message || 'စနစ်ချို့ယွင်းချက် ဖြစ်ပေါ်ခဲ့သည်။');
    } finally {
      setBuying(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/95 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-lg bg-slate-900 border border-red-500/40 rounded-3xl shadow-2xl p-6 sm:p-8 text-center text-slate-100 overflow-hidden max-h-[95vh] overflow-y-auto">
        {/* Glow */}
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-64 h-64 bg-red-600/20 rounded-full blur-3xl pointer-events-none"></div>

        {/* Lock Icon */}
        <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto rounded-3xl bg-red-500/15 border border-red-500/30 flex items-center justify-center text-red-400 mb-4 shadow-lg shadow-red-500/20 animate-bounce">
          <Clock className="w-8 h-8 sm:w-10 sm:h-10" />
        </div>

        <span className="px-3 py-1 rounded-full bg-red-500/20 text-red-300 text-xs font-bold uppercase tracking-wider border border-red-500/30">
          App Access Expired
        </span>

        <h2 className="text-xl sm:text-2xl font-black text-white mt-2.5 mb-1.5">
          အသုံးပြုခွင့် အချိန်ကုန်ဆုံးသွားပါပြီ
        </h2>
        <p className="text-xs sm:text-sm text-slate-300 max-w-md mx-auto leading-relaxed mb-4">
          သင်၏ App အသုံးပြုခွင့် သက်တမ်း ကုန်ဆုံးသွားပါပြီ။ လက်ကျန် Coin ဖြင့် အချိန်ချက်ချင်းဝယ်ယူ၍ App ကို ချက်ချင်း ဆက်လက်အသုံးပြုနိုင်ပါသည်။
        </p>

        {error && (
          <div className="mb-4 p-3 bg-red-500/15 border border-red-500/30 rounded-xl flex items-start gap-2.5 text-xs text-red-300 text-left">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-400" />
            <div className="space-y-1">
              <span>{error}</span>
              <div>
                <button
                  type="button"
                  onClick={onOpenTopup}
                  className="mt-1 text-amber-400 underline font-semibold"
                >
                  Admin ထံ Coin ဝယ်ယူရန် တောင်းဆိုမည် &rarr;
                </button>
              </div>
            </div>
          </div>
        )}

        {/* User Status Card */}
        <div className="p-3.5 bg-slate-800/80 border border-slate-700 rounded-2xl mb-4 text-left space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400">အသုံးပြုသူ:</span>
            <span className="font-bold text-white">{currentUser.username}</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400">User ID:</span>
            <div className="flex items-center gap-2">
              <span className="font-mono font-bold text-amber-400">{currentUser.id}</span>
              <button
                onClick={copyId}
                className="p-1 text-slate-400 hover:text-white rounded bg-slate-700"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400">လက်ကျန် Coin:</span>
            <span className="font-bold text-amber-400 flex items-center gap-1">
              <Coins className="w-3.5 h-3.5" />
              {currentUser.coins.toLocaleString()} Coins
            </span>
          </div>
        </div>

        {/* Quick Package Selector */}
        <div className="mb-4 text-left">
          <label className="block text-xs font-semibold text-slate-300 mb-2">
            ဝယ်ယူမည့် အချိန်ပမာဏ ရွေးချယ်ပါ:
          </label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: '1h', title: '၁ နာရီ', seconds: 3600, coins: 10 },
              { id: '3h', title: '၃ နာရီ', seconds: 10800, coins: 25, popular: true },
              { id: '24h', title: '၂၄ နာရီ (၁ ရက်)', seconds: 86400, coins: 100 },
            ].map((pkg) => {
              const isSelected = selectedPlan.id === pkg.id;
              const canAfford = currentUser.coins >= pkg.coins;

              return (
                <div
                  key={pkg.id}
                  onClick={() => setSelectedPlan(pkg)}
                  className={`cursor-pointer p-2.5 rounded-xl border text-center transition-all ${
                    isSelected
                      ? 'bg-blue-600/30 border-blue-500 shadow-md shadow-blue-500/20'
                      : 'bg-slate-800/60 border-slate-700 hover:bg-slate-800'
                  }`}
                >
                  <div className="text-xs font-bold text-white">{pkg.title}</div>
                  <div className="text-xs font-extrabold text-amber-400 mt-0.5 flex items-center justify-center gap-1">
                    <Coins className="w-3 h-3" />
                    {pkg.coins} Coins
                  </div>
                  {!canAfford && (
                    <span className="text-[10px] text-red-400 block mt-0.5">မလုံလောက်ပါ</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          {currentUser.coins >= selectedPlan.coins ? (
            <button
              onClick={handleDirectBuy}
              disabled={buying}
              className="w-full py-3.5 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-2xl text-sm font-bold shadow-lg shadow-blue-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99]"
            >
              {buying ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>အချိန်ဝယ်ယူနေသည်...</span>
                </>
              ) : (
                <>
                  <Coins className="w-4 h-4 text-amber-300" />
                  <span>
                    လက်ကျန် Coin ဖြင့် အချိန်ချက်ချင်းဝယ်မည် ({selectedPlan.coins} Coins) &rarr;
                  </span>
                </>
              )}
            </button>
          ) : (
            <button
              onClick={onOpenTopup}
              className="w-full py-3.5 px-4 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 rounded-2xl text-sm font-black shadow-lg shadow-amber-500/30 transition-all flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>Admin ထံမှ Coin ဝယ်ယူရန် တောင်းဆိုမည် &rarr;</span>
            </button>
          )}

          <div className="flex items-center gap-2">
            <button
              onClick={onOpenBuyTime}
              className="flex-1 py-2.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold transition-colors flex items-center justify-center gap-1.5"
            >
              <Clock className="w-3.5 h-3.5 text-blue-400" />
              အခြား Package များ
            </button>

            <button
              onClick={onOpenTopup}
              className="flex-1 py-2.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold transition-colors flex items-center justify-center gap-1.5"
            >
              <Coins className="w-3.5 h-3.5 text-amber-400" />
              Coin ဖြည့်ရန်
            </button>

            <button
              onClick={onLogout}
              className="py-2.5 px-3 bg-slate-800 hover:bg-red-500/20 text-slate-300 hover:text-red-300 border border-slate-700 rounded-xl text-xs font-semibold transition-colors flex items-center justify-center gap-1"
            >
              <LogOut className="w-3.5 h-3.5" />
              ထွက်မည်
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
