import React, { useState } from 'react';
import { Send, X, AlertCircle, CheckCircle2, UserCheck, Coins } from 'lucide-react';
import confetti from 'canvas-confetti';
import { transferCoins } from '../services/firebase';
import { User } from '../types';

interface CoinTransferModalProps {
  currentUser: User;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newBalance: number) => void;
}

export const CoinTransferModal: React.FC<CoinTransferModalProps> = ({
  currentUser,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [toUserId, setToUserId] = useState('');
  const [amount, setAmount] = useState<number | ''>('');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    const transferAmount = Number(amount);
    if (!toUserId.trim()) {
      setError('လက်ခံမည့် User ID (ဥပမာ- SP-10001) ကို ရိုက်ထည့်ပါ။');
      return;
    }
    if (!transferAmount || transferAmount <= 0) {
      setError('လွှဲပြောင်းမည့် Coin ပမာဏ အနည်းဆုံး ၁ Coin ရှိရပါမည်။');
      return;
    }
    if (transferAmount > currentUser.coins) {
      setError(`သင့်လက်ကျန် Coin မလုံလောက်ပါ။ (လက်ကျန်: ${currentUser.coins} Coins)`);
      return;
    }

    setLoading(true);
    try {
      const result = await transferCoins({
        fromUserId: currentUser.id,
        toUserId: toUserId.trim().toUpperCase(),
        amount: transferAmount,
        note: note.trim() || undefined,
      });

      if (result.success && result.newSenderBalance !== undefined) {
        // Trigger celebratory confetti
        confetti({
          particleCount: 60,
          spread: 60,
          origin: { y: 0.6 },
        });

        setSuccessMsg(
          `${toUserId.toUpperCase()} ထံသို့ ${transferAmount} Coins အောင်မြင်စွာ လွှဲပြောင်းပြီးပါပြီ!`
        );
        onSuccess(result.newSenderBalance);
        setTimeout(() => {
          onClose();
          setToUserId('');
          setAmount('');
          setNote('');
          setSuccessMsg(null);
        }, 1800);
      } else {
        setError(result.error || 'Coin လွှဲပြောင်းခြင်း မအောင်မြင်ပါ။');
      }
    } catch (err: any) {
      setError(err.message || 'စနစ်ချို့ယွင်းချက် ဖြစ်ပေါ်ခဲ့သည်။');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden p-6 text-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
              <Coins className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Coin အချင်းချင်း လွှဲပြောင်းရန်</h3>
              <p className="text-xs text-slate-400">User အချင်းချင်း တိုက်ရိုက် Coin လွှဲနိုင်ပါသည်</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current Balance Banner */}
        <div className="my-4 p-3.5 bg-gradient-to-r from-amber-500/15 to-yellow-500/10 border border-amber-500/20 rounded-xl flex items-center justify-between">
          <span className="text-xs text-slate-300 font-medium">သင့်လက်ကျန် Coin:</span>
          <span className="text-base font-bold text-amber-400 flex items-center gap-1.5">
            <Coins className="w-4 h-4" />
            {currentUser.coins.toLocaleString()} Coins
          </span>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-500/15 border border-red-500/30 rounded-xl flex items-start gap-2.5 text-xs text-red-300">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-400" />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="mb-4 p-3 bg-emerald-500/15 border border-emerald-500/30 rounded-xl flex items-start gap-2.5 text-xs text-emerald-300">
            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-400" />
            <span>{successMsg}</span>
          </div>
        )}

        <form onSubmit={handleTransfer} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              လက်ခံမည့် User ID (Receiver User ID)
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder="ဥပမာ- SP-10002"
                value={toUserId}
                onChange={(e) => setToUserId(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 uppercase"
                disabled={loading}
              />
              <UserCheck className="absolute right-3.5 top-2.5 w-4 h-4 text-slate-400" />
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              လွှဲပြောင်းလိုသော မိတ်ဆွေ၏ User ID (ဥပမာ- <span className="text-amber-300 font-mono">SP-XXXXXX</span>) ကို ရိုက်ထည့်ပါ
            </p>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              လွှဲပြောင်းမည့် Coin ပမာဏ (Amount)
            </label>
            <input
              type="number"
              min="1"
              max={currentUser.coins}
              placeholder="Coin အရေအတွက်"
              value={amount}
              onChange={(e) => setAmount(e.target.value === '' ? '' : Number(e.target.value))}
              className="w-full px-3.5 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              မှတ်ချက် / စာတို (ရွေးချယ်ရန်)
            </label>
            <input
              type="text"
              placeholder="ဥပမာ- စာအုပ်ဖိုင် ဘာသာပြန်ရန်အတွက်"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
              disabled={loading}
            />
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="w-1/2 py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-sm font-medium transition-colors"
            >
              မလုပ်တော့ပါ
            </button>
            <button
              type="submit"
              disabled={loading}
              className="w-1/2 py-2.5 px-4 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 rounded-xl text-sm font-bold shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center gap-2"
            >
              <Send className="w-4 h-4" />
              {loading ? 'လွှဲပြောင်းနေသည်...' : 'Coin လွှဲမည်'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
