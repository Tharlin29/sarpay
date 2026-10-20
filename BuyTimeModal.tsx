import React, { useState } from 'react';
import { Clock, Coins, Check, AlertCircle, X, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';
import { buyTimeWithCoins } from '../services/firebase';
import { User, TimePackage } from '../types';

interface BuyTimeModalProps {
  currentUser: User;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (updatedUser: User) => void;
  onRequestTopup: () => void;
}

const TIME_PACKAGES: TimePackage[] = [
  {
    id: 'pkg-1h',
    titleMm: '၁ နာရီ အသုံးပြုခွင့်',
    titleEn: '1 Hour Access',
    seconds: 3600,
    coinPrice: 10,
  },
  {
    id: 'pkg-3h',
    titleMm: '၃ နာရီ အသုံးပြုခွင့်',
    titleEn: '3 Hours Access',
    seconds: 3600 * 3,
    coinPrice: 25,
    badge: 'လူကြိုက်အများဆုံး',
  },
  {
    id: 'pkg-12h',
    titleMm: '၁၂ နာရီ အသုံးပြုခွင့်',
    titleEn: '12 Hours Access',
    seconds: 3600 * 12,
    coinPrice: 60,
  },
  {
    id: 'pkg-24h',
    titleMm: '၂၄ နာရီ (၁ ရက် အပြည့်)',
    titleEn: '24 Hours Full Access',
    seconds: 3600 * 24,
    coinPrice: 100,
    badge: 'တန်သော Package',
  },
  {
    id: 'pkg-7d',
    titleMm: '၇ ရက် (၁ ပတ် အပြည့်)',
    titleEn: '7 Days Unlimited Access',
    seconds: 3600 * 24 * 7,
    coinPrice: 250,
    badge: 'VIP အစီအစဉ်',
  },
];

export const BuyTimeModal: React.FC<BuyTimeModalProps> = ({
  currentUser,
  isOpen,
  onClose,
  onSuccess,
  onRequestTopup,
}) => {
  const [selectedPkg, setSelectedPkg] = useState<TimePackage>(TIME_PACKAGES[1]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handlePurchase = async () => {
    setError(null);
    if (currentUser.coins < selectedPkg.coinPrice) {
      setError(
        `သင့်ထံတွင် ${currentUser.coins} Coins သာရှိပြီး ဤ Package အတွက် ${selectedPkg.coinPrice} Coins လိုအပ်ပါသည်။ Admin ထံမှ Coin ဖြည့်သွင်းပါ။`
      );
      return;
    }

    setLoading(true);
    try {
      const result = await buyTimeWithCoins(
        currentUser.id,
        selectedPkg.coinPrice,
        selectedPkg.seconds
      );

      if (result.success && result.user) {
        confetti({
          particleCount: 50,
          spread: 70,
          origin: { y: 0.6 },
        });
        onSuccess(result.user);
        onClose();
      } else {
        setError(result.error || 'အချိန်ဝယ်ယူမှု မအောင်မြင်ပါ။');
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
            <div className="p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-400">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">အချိန်ဝယ်ယူရန် (Buy Time)</h3>
              <p className="text-xs text-slate-400">Coin ဖြင့် App အသုံးပြုချိန် ထပ်မံဖြည့်နိုင်ပါသည်</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User Balance */}
        <div className="my-4 p-3.5 bg-slate-800/80 border border-slate-700 rounded-xl flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Coins className="w-4 h-4 text-amber-400" />
            <span className="text-xs text-slate-300">သင့်လက်ကျန် Coin:</span>
            <span className="text-sm font-bold text-amber-400">{currentUser.coins} Coins</span>
          </div>
          <button
            type="button"
            onClick={() => {
              onClose();
              onRequestTopup();
            }}
            className="text-xs text-amber-400 hover:text-amber-300 underline font-medium"
          >
            + Coin ထပ်ဝယ်မည်
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-500/15 border border-red-500/30 rounded-xl flex items-start gap-2.5 text-xs text-red-300">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-400" />
            <div className="space-y-1">
              <span>{error}</span>
              <div>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onRequestTopup();
                  }}
                  className="mt-1 text-amber-400 underline font-semibold"
                >
                  Admin ထံ Coin ဝယ်ယူရန် တောင်းဆိုမည် &rarr;
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Package Options */}
        <div className="space-y-2.5 mb-6">
          {TIME_PACKAGES.map((pkg) => {
            const isSelected = selectedPkg.id === pkg.id;
            const canAfford = currentUser.coins >= pkg.coinPrice;

            return (
              <div
                key={pkg.id}
                onClick={() => setSelectedPkg(pkg)}
                className={`cursor-pointer p-3.5 rounded-xl border transition-all flex items-center justify-between ${
                  isSelected
                    ? 'bg-blue-600/20 border-blue-500 shadow-md shadow-blue-500/10'
                    : 'bg-slate-800/60 border-slate-700/80 hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 ${
                      isSelected
                        ? 'border-blue-500 bg-blue-500 text-white'
                        : 'border-slate-600 bg-slate-900'
                    }`}
                  >
                    {isSelected && <Check className="w-3.5 h-3.5" />}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-white">{pkg.titleMm}</span>
                      {pkg.badge && (
                        <span className="px-2 py-0.5 bg-gradient-to-r from-amber-500/20 to-yellow-500/20 border border-amber-500/30 text-amber-300 text-[10px] rounded-full font-medium">
                          {pkg.badge}
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-slate-400">{pkg.titleEn}</span>
                  </div>
                </div>

                <div className="text-right">
                  <div className="flex items-center gap-1.5 justify-end">
                    <Coins className="w-4 h-4 text-amber-400" />
                    <span className="text-sm font-bold text-amber-400">{pkg.coinPrice} Coins</span>
                  </div>
                  {!canAfford && (
                    <span className="text-[10px] text-red-400">Coin မလုံလောက်ပါ</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="w-1/3 py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-sm font-medium transition-colors"
          >
            ပိတ်မည်
          </button>
          <button
            type="button"
            onClick={handlePurchase}
            disabled={loading}
            className="w-2/3 py-2.5 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-sm font-bold shadow-lg shadow-blue-500/25 transition-all flex items-center justify-center gap-2"
          >
            <Sparkles className="w-4 h-4" />
            {loading ? 'ဆောင်ရွက်နေသည်...' : `${selectedPkg.coinPrice} Coins ဖြင့် အချိန်ဖြည့်မည်`}
          </button>
        </div>
      </div>
    </div>
  );
};
