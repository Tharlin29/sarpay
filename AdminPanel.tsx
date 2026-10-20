import React, { useState, useEffect } from 'react';
import {
  Users,
  Coins,
  Clock,
  Shield,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ArrowRight,
  LogOut,
  Search,
  Plus,
  RefreshCw,
  Smartphone,
  Eye,
  Sliders,
  Sparkles,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { User, TopupRequest } from '../types';
import {
  getAllUsers,
  getTopupRequests,
  adminTopupUser,
} from '../services/firebase';

interface AdminPanelProps {
  onBackToApp: () => void;
  onLogout: () => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ onBackToApp, onLogout }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [requests, setRequests] = useState<TopupRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Direct Top-up by User ID form state
  const [targetUserId, setTargetUserId] = useState('');
  const [coinsToAdd, setCoinsToAdd] = useState<number | ''>(100);
  const [bonusHoursToAdd, setBonusHoursToAdd] = useState<number | ''>(1);
  const [topupLoading, setTopupLoading] = useState(false);
  const [topupMsg, setTopupMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(
    null
  );

  const loadData = async () => {
    setLoading(true);
    try {
      const [uList, rList] = await Promise.all([getAllUsers(), getTopupRequests()]);
      setUsers(uList);
      setRequests(rList);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filter users
  const filteredUsers = users.filter(
    (u) =>
      u.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.phone.includes(searchQuery)
  );

  // Selected user preview for direct topup
  const targetUserObj = users.find(
    (u) => u.id.toUpperCase() === targetUserId.trim().toUpperCase()
  );

  // Direct Top-up Action
  const handleDirectTopup = async (e: React.FormEvent) => {
    e.preventDefault();
    setTopupMsg(null);

    if (!targetUserId.trim()) {
      setTopupMsg({ type: 'error', text: 'ကျေးဇူးပြု၍ Target User ID ကို ရိုက်ထည့်ပါ သို့မဟုတ် ရွေးချယ်ပါ။' });
      return;
    }

    const coinVal = Number(coinsToAdd) || 0;
    const bonusSecs = (Number(bonusHoursToAdd) || 0) * 3600;

    if (coinVal <= 0 && bonusSecs <= 0) {
      setTopupMsg({ type: 'error', text: 'Coin ပမာဏ သို့မဟုတ် နာရီ အရေအတွက် အနည်းဆုံးတစ်ခု ထည့်သွင်းပါ။' });
      return;
    }

    setTopupLoading(true);
    try {
      const res = await adminTopupUser({
        userId: targetUserId.trim().toUpperCase(),
        coinAmount: coinVal,
        bonusSeconds: bonusSecs,
      });

      if (res.success && res.updatedUser) {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.5 },
        });

        setTopupMsg({
          type: 'success',
          text: `User ID: ${res.updatedUser.id} (${res.updatedUser.username}) သို့ ${coinVal} Coins နှင့် +${bonusHoursToAdd || 0} နာရီ အောင်မြင်စွာ ထည့်သွင်းပြီးပါပြီ! လက်ရှိလက်ကျန်: ${res.updatedUser.coins} Coins`,
        });

        await loadData();
      } else {
        setTopupMsg({ type: 'error', text: res.error || 'Coin ထည့်သွင်းခြင်း မအောင်မြင်ပါ။' });
      }
    } catch (err: any) {
      setTopupMsg({ type: 'error', text: err.message || 'စနစ်ချို့ယွင်းချက် ဖြစ်ပေါ်ခဲ့သည်။' });
    } finally {
      setTopupLoading(false);
    }
  };

  // Approve Topup Request from User
  const handleApproveRequest = async (req: TopupRequest) => {
    setLoading(true);
    try {
      const res = await adminTopupUser({
        userId: req.userId,
        coinAmount: req.requestedCoins,
        requestId: req.id,
      });

      if (res.success) {
        confetti({
          particleCount: 40,
          spread: 60,
          origin: { y: 0.6 },
        });
        await loadData();
      } else {
        alert(res.error || 'Failed to approve');
      }
    } catch (e: any) {
      alert(e.message || 'Error approving request');
    } finally {
      setLoading(false);
    }
  };

  // Quick top-up shortcut from table
  const quickTopup = async (user: User, coinCount: number) => {
    setTargetUserId(user.id);
    setCoinsToAdd(coinCount);
    const res = await adminTopupUser({
      userId: user.id,
      coinAmount: coinCount,
    });
    if (res.success) {
      await loadData();
    }
  };

  const pendingRequests = requests.filter((r) => r.status === 'pending');
  const totalCoinsInSystem = users.reduce((acc, u) => acc + (u.coins || 0), 0);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Admin Top Header */}
      <header className="sticky top-0 z-30 bg-slate-900 border-b border-slate-800 px-4 sm:px-8 py-3.5 flex items-center justify-between shadow-lg">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-red-600 flex items-center justify-center text-white shadow-lg shadow-amber-500/20 font-black">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-extrabold text-base sm:text-lg text-white">SarPay Admin Management Panel</h1>
              <span className="px-2 py-0.5 rounded-md bg-red-500/20 text-red-300 border border-red-500/30 text-[10px] font-bold">
                Master Admin
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Firebase Project: <span className="text-amber-400 font-mono">sarpay-f4547</span> | Database Realtime Sync
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={loadData}
            title="Data ပြန်လည် Refresh လုပ်မည်"
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-amber-400' : ''}`} />
          </button>
          <button
            onClick={onBackToApp}
            className="px-3.5 py-2 rounded-xl bg-indigo-600/30 hover:bg-indigo-600/50 border border-indigo-500/40 text-indigo-200 text-xs font-bold transition-all flex items-center gap-1.5"
          >
            <Eye className="w-4 h-4" />
            <span>App Preview သို့ သွားမည်</span>
          </button>
          <button
            onClick={onLogout}
            className="p-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 transition-colors"
            title="Admin မှ ထွက်မည်"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Admin Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-8 space-y-8">
        {/* Stats Cards Section (Requirement: user registration ပြုလုပ်ထားသူ အရေအတွက်ကို ပြပေးမည်) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* 1. Total Registered Users */}
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-md flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-400 font-medium">အကောင့်ဖွင့်ထားသူ အရေအတွက်</span>
              <div className="text-2xl sm:text-3xl font-black text-white mt-1">
                {users.length} <span className="text-xs font-normal text-slate-400">Users</span>
              </div>
              <span className="text-[11px] text-emerald-400 mt-1 block">
                ● ၁ ဖုန်း ၁ အကောင့် စနစ်ဖြင့် မှတ်ပုံတင်ထားသည်
              </span>
            </div>
            <div className="p-3 rounded-2xl bg-blue-500/10 border border-blue-500/30 text-blue-400">
              <Users className="w-6 h-6" />
            </div>
          </div>

          {/* 2. Pending Top-up Requests */}
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-md flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-400 font-medium">Coin ဝယ်ယူရန် တောင်းဆိုမှုများ</span>
              <div className="text-2xl sm:text-3xl font-black text-amber-400 mt-1">
                {pendingRequests.length} <span className="text-xs font-normal text-slate-400">Pending</span>
              </div>
              <span className="text-[11px] text-amber-300 mt-1 block">
                {pendingRequests.length > 0 ? 'စစ်ဆေးပြီး Coin ထည့်ပေးရန် လိုအပ်သည်' : 'တောင်းဆိုမှု အားလုံးစစ်ပြီး'}
              </span>
            </div>
            <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
              <Coins className="w-6 h-6" />
            </div>
          </div>

          {/* 3. Total Coins Distributed */}
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-md flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-400 font-medium">စုစုပေါင်း လည်ပတ်နေသော Coin</span>
              <div className="text-2xl sm:text-3xl font-black text-yellow-300 mt-1">
                {totalCoinsInSystem.toLocaleString()}
              </div>
              <span className="text-[11px] text-slate-400 mt-1 block">
                Member များထံတွင် လက်ရှိရှိနေသော ပမာဏ
              </span>
            </div>
            <div className="p-3 rounded-2xl bg-yellow-500/10 border border-yellow-500/30 text-yellow-400">
              <Sparkles className="w-6 h-6" />
            </div>
          </div>

          {/* 4. Active Devices Limit Count */}
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-md flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-400 font-medium">ချိတ်ဆက်ထားသော ဖုန်း Devices</span>
              <div className="text-2xl sm:text-3xl font-black text-violet-400 mt-1">
                {users.length} <span className="text-xs font-normal text-slate-400">Devices</span>
              </div>
              <span className="text-[11px] text-slate-400 mt-1 block">
                Device Fingerprint စနစ် သတ်မှတ်ပြီး
              </span>
            </div>
            <div className="p-3 rounded-2xl bg-violet-500/10 border border-violet-500/30 text-violet-400">
              <Smartphone className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* Section: Direct Precise Coin Top-up by User ID (REQUIREMENT) */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-indigo-500/30 rounded-3xl p-6 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
                <Sliders className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">
                  User ID အလိုက် တိကျစွာ Coin Top-up ပြုလုပ်သည့် စနစ်
                </h3>
                <p className="text-xs text-slate-400">
                  မည်သည့် User ID သို့မဆို တိကျသော Coin အရေအတွက်နှင့် အသုံးပြုချိန် တိုက်ရိုက်ဖြည့်သွင်းပေးနိုင်ပါသည်
                </p>
              </div>
            </div>
          </div>

          {topupMsg && (
            <div
              className={`p-3.5 rounded-xl border flex items-start gap-3 text-xs sm:text-sm ${
                topupMsg.type === 'success'
                  ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
                  : 'bg-red-500/15 border-red-500/30 text-red-300'
              }`}
            >
              {topupMsg.type === 'success' ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
              )}
              <span>{topupMsg.text}</span>
            </div>
          )}

          <form onSubmit={handleDirectTopup} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* User ID Input or Selection */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Target User ID (ထည့်သွင်းမည့် User ID)
                </label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="ဥပမာ- SP-10001"
                    value={targetUserId}
                    onChange={(e) => setTargetUserId(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-800/90 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500 uppercase font-mono font-bold"
                  />
                </div>
                {targetUserObj ? (
                  <p className="text-xs text-emerald-400 mt-1 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>{targetUserObj.username}</span> | လက်ကျန်: {targetUserObj.coins} Coins
                  </p>
                ) : targetUserId ? (
                  <p className="text-xs text-amber-400 mt-1">အသစ်ရိုက်ထည့်ထားသော ID</p>
                ) : (
                  <p className="text-[11px] text-slate-400 mt-1">
                    အောက်ပါ User စာရင်းမှလည်း User ID ကို ရွေးချယ်နိုင်ပါသည်
                  </p>
                )}
              </div>

              {/* Coin Amount */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  ဖြည့်သွင်းမည့် Coin ပမာဏ (Coins)
                </label>
                <input
                  type="number"
                  min="1"
                  step="1"
                  placeholder="ဥပမာ- 100"
                  value={coinsToAdd}
                  onChange={(e) => setCoinsToAdd(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 bg-slate-800/90 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500 font-bold"
                />
                <div className="flex gap-1.5 mt-1">
                  {[50, 100, 300, 500].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setCoinsToAdd(amt)}
                      className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-mono border border-slate-700"
                    >
                      +{amt}
                    </button>
                  ))}
                </div>
              </div>

              {/* Bonus Usage Time */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  အပိုဆု အသုံးပြုချိန် (+နာရီ)
                </label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  placeholder="နာရီ အရေအတွက် (ဥပမာ- 2)"
                  value={bonusHoursToAdd}
                  onChange={(e) =>
                    setBonusHoursToAdd(e.target.value === '' ? '' : Number(e.target.value))
                  }
                  className="w-full px-3.5 py-2.5 bg-slate-800/90 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500 font-bold"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  User ထံသို့ အသုံးပြုခွင့် သက်တမ်း တိုးမြှင့်ပေးမည်
                </p>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={topupLoading}
                className="py-3 px-6 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 rounded-xl text-sm font-extrabold shadow-lg shadow-amber-500/25 transition-all flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                {topupLoading ? 'Coin ဖြည့်နေသည်...' : 'User ID သို့ Coin တိကျစွာ Top-up လုပ်မည်'}
              </button>
            </div>
          </form>
        </div>

        {/* Section: Pending Coin Top-up Requests Queue (REQUIREMENT) */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
                <Coins className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">
                  Coin ဝယ်ယူရန် တောင်းဆိုထားသည့် စာရင်းများ (Top-up Requests)
                </h3>
                <p className="text-xs text-slate-400">
                  User များမှ ငွေလွှဲပြေစာဖြင့် တောင်းဆိုထားသည်များကို စစ်ဆေး၍ Approve လုပ်နိုင်ပါသည်
                </p>
              </div>
            </div>
            <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-bold">
              {pendingRequests.length} ခု စစ်ဆေးရန်ကျန်
            </span>
          </div>

          {requests.length === 0 ? (
            <div className="py-10 text-center text-slate-500 text-xs">
              Coin ဝယ်ယူရန် တောင်းဆိုထားမှု မရှိသေးပါ
            </div>
          ) : (
            <div className="space-y-3">
              {requests.map((req) => (
                <div
                  key={req.id}
                  className={`p-4 rounded-2xl border transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                    req.status === 'pending'
                      ? 'bg-slate-800/80 border-amber-500/30 shadow-md'
                      : req.status === 'approved'
                      ? 'bg-slate-800/40 border-slate-800 opacity-75'
                      : 'bg-slate-800/20 border-red-500/20 opacity-60'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-amber-400 text-sm">
                        {req.userId}
                      </span>
                      <span className="text-sm font-semibold text-white">({req.username})</span>
                      <span className="text-xs text-slate-400 font-mono">{req.phone}</span>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                          req.status === 'pending'
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            : req.status === 'approved'
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : 'bg-red-500/20 text-red-300'
                        }`}
                      >
                        {req.status}
                      </span>
                    </div>

                    <div className="text-xs text-slate-300">
                      <span className="text-slate-400">ပေးချေမှု:</span> {req.paymentMethod} |{' '}
                      <span className="text-amber-300 font-semibold">{req.transactionNote}</span>
                    </div>
                    <div className="text-[11px] text-slate-400">
                      တောင်းဆိုချိန်: {new Date(req.createdAt).toLocaleString()}
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className="text-lg font-black text-amber-400 flex items-center gap-1 justify-end">
                        <Coins className="w-4 h-4" />
                        {req.requestedCoins} Coins
                      </div>
                    </div>

                    {req.status === 'pending' ? (
                      <button
                        onClick={() => handleApproveRequest(req)}
                        className="py-2 px-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-emerald-600/20 flex items-center gap-1.5"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        စစ်ဆေးအတည်ပြုပြီး Coin ထည့်မည်
                      </button>
                    ) : (
                      <span className="text-xs text-slate-400 font-medium flex items-center gap-1">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        ပြီးဆုံးပြီး
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Section: Registered Users List (Requirement: user registration လုပ်ထားသူအရေအတွကိုပြပေးမယ်) */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-400">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">
                  မှတ်ပုံတင်ထားသော အသုံးပြုသူများ စာရင်း ({users.length} Users)
                </h3>
                <p className="text-xs text-slate-400">ဖုန်းတစ်လုံးလျှင် အကောင့်တစ်ခုသာ ဖွင့်ခွင့်ပေးထားပါသည်</p>
              </div>
            </div>

            {/* Search */}
            <div className="relative w-full sm:w-64">
              <input
                type="text"
                placeholder="ID, အမည်, ဖုန်းဖြင့် ရှာရန်..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-400" />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-semibold">
                  <th className="py-3 px-3">User ID</th>
                  <th className="py-3 px-3">အသုံးပြုသူ အမည်</th>
                  <th className="py-3 px-3">ဖုန်းနံပါတ်</th>
                  <th className="py-3 px-3">Device (ဖုန်းအမျိုးအစား)</th>
                  <th className="py-3 px-3">လက်ကျန် Coin</th>
                  <th className="py-3 px-3">ကျန်ရှိချိန် (Time)</th>
                  <th className="py-3 px-3">စတင်ရက်</th>
                  <th className="py-3 px-3 text-right">အမြန် Top-up</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-200">
                {filteredUsers.map((user) => {
                  const h = Math.floor((user.remainingSeconds || 0) / 3600);
                  const m = Math.floor(((user.remainingSeconds || 0) % 3600) / 60);

                  return (
                    <tr key={user.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-3 font-mono font-bold text-amber-400">
                        {user.id}
                      </td>
                      <td className="py-3 px-3 font-medium text-white">{user.username}</td>
                      <td className="py-3 px-3 font-mono text-slate-300">{user.phone}</td>
                      <td className="py-3 px-3 text-slate-400">
                        <span className="inline-flex items-center gap-1">
                          <Smartphone className="w-3.5 h-3.5" />
                          {user.deviceLabel}
                        </span>
                      </td>
                      <td className="py-3 px-3 font-bold text-amber-300">
                        {user.coins.toLocaleString()} Coins
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={`font-mono font-bold px-2 py-0.5 rounded ${
                            (user.remainingSeconds || 0) > 300
                              ? 'bg-blue-500/15 text-blue-400'
                              : 'bg-red-500/15 text-red-400'
                          }`}
                        >
                          {h}h {m}m
                        </span>
                      </td>
                      <td className="py-3 px-3 text-slate-400">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              setTargetUserId(user.id);
                              window.scrollTo({ top: 300, behavior: 'smooth' });
                            }}
                            className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-[11px] font-medium"
                          >
                            Select ID
                          </button>
                          <button
                            type="button"
                            onClick={() => quickTopup(user, 100)}
                            className="px-2 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 rounded-lg text-[11px] font-bold"
                          >
                            +100 Coins
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
};
