import React, { useState } from 'react';
import {
  User as UserIcon,
  Lock,
  Phone,
  Shield,
  Smartphone,
  AlertCircle,
  CheckCircle2,
  LogIn,
  UserPlus,
  KeyRound,
  Eye,
  EyeOff,
  Sparkles,
} from 'lucide-react';
import { registerUser, loginUser, loginAdmin } from '../services/firebase';
import { getDeviceInfo } from '../utils/device';
import { User } from '../types';

interface AuthViewProps {
  onSuccess: (user: User, isAdmin: boolean) => void;
}

export const AuthView: React.FC<AuthViewProps> = ({ onSuccess }) => {
  const [tab, setTab] = useState<'login' | 'register' | 'admin'>('login');

  // Form states
  const [username, setUsername] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Admin login state
  const [adminPassword, setAdminPassword] = useState('');

  // Status states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const deviceInfo = getDeviceInfo();

  // Reset errors on tab change
  const handleTabChange = (newTab: 'login' | 'register' | 'admin') => {
    setTab(newTab);
    setError(null);
    setSuccessMsg(null);
  };

  // User Registration
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (!username.trim()) {
      setError('အသုံးပြုသူ အမည် (Username) ရိုက်ထည့်ပါ။');
      return;
    }
    if (!phone.trim()) {
      setError('ဖုန်းနံပါတ် ရိုက်ထည့်ပါ။');
      return;
    }
    if (password.length < 4) {
      setError('စကားဝှက်သည် အနည်းဆုံး ၄ လုံး ရှိရပါမည်။');
      return;
    }
    if (password !== confirmPassword) {
      setError('စကားဝှက် ၂ ကြိမ် ရိုက်ထည့်မှု တူညီမှု မရှိပါ။ ပြန်လည်စစ်ဆေးပါ။');
      return;
    }

    setLoading(true);
    try {
      const result = await registerUser({
        username: username.trim(),
        phone: phone.trim(),
        password,
      });

      if (result.success && result.user) {
        setSuccessMsg(`အကောင့် အောင်မြင်စွာ ဖွင့်ပြီးပါပြီ! သင့် User ID မှာ ${result.user.id} ဖြစ်ပါသည်။`);
        setTimeout(() => {
          onSuccess(result.user!, false);
        }, 1200);
      } else {
        setError(result.error || 'အကောင့်ဖွင့်ခြင်း မအောင်မြင်ပါ။');
      }
    } catch (err: any) {
      setError(err.message || 'စနစ်ချို့ယွင်းချက် ဖြစ်ပေါ်ခဲ့သည်။');
    } finally {
      setLoading(false);
    }
  };

  // User Login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!phone.trim() || !password) {
      setError('ဖုန်းနံပါတ်/User ID နှင့် စကားဝှက်ကို ထည့်သွင်းပါ။');
      return;
    }

    setLoading(true);
    try {
      const result = await loginUser(phone.trim(), password);
      if (result.success && result.user) {
        onSuccess(result.user, false);
      } else {
        setError(result.error || 'အကောင့်ဝင်ရောက်မှု မအောင်မြင်ပါ။');
      }
    } catch (err: any) {
      setError(err.message || 'စနစ်ချို့ယွင်းချက် ဖြစ်ပေါ်ခဲ့သည်။');
    } finally {
      setLoading(false);
    }
  };

  // Admin Login (Password = iam0, kept confidential from ordinary users)
  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!adminPassword) {
      setError('Admin စကားဝှက်ကို ထည့်သွင်းပါ။');
      return;
    }

    setLoading(true);
    const result = loginAdmin(adminPassword);
    if (result.success) {
      const adminUser: User = {
        id: 'ADMIN-01',
        username: 'System Administrator',
        phone: '09000000000',
        deviceId: deviceInfo.deviceId,
        deviceLabel: 'Admin Terminal',
        coins: 999999,
        remainingSeconds: 9999999,
        createdAt: new Date().toISOString(),
        lastLoginAt: new Date().toISOString(),
        role: 'admin',
        status: 'active',
      };
      onSuccess(adminUser, true);
    } else {
      setError(result.error || 'Admin စကားဝှက် မှားယွင်းနေပါသည်။');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-4 sm:p-6 text-slate-100 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-20 right-10 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Main Container */}
      <div className="relative w-full max-w-md bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-3xl shadow-2xl p-6 sm:p-8 space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-tr from-amber-500 via-indigo-600 to-violet-500 flex items-center justify-center text-white font-black text-2xl shadow-xl shadow-indigo-500/25">
            စာ
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">SarPay AI Translator</h1>
          <p className="text-xs text-slate-400">
            Firebase ချိတ်ဆက်ထားသော PDF/Word မြန်မာစာ ဘာသာပြန်စနစ်
          </p>
        </div>

        {/* Navigation Tabs (User Login / Register / Admin Login) */}
        <div className="flex rounded-2xl bg-slate-950 p-1 border border-slate-800/80">
          <button
            type="button"
            onClick={() => handleTabChange('login')}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
              tab === 'login'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>အကောင့်ဝင်</span>
          </button>
          <button
            type="button"
            onClick={() => handleTabChange('register')}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
              tab === 'register'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/25'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>အကောင့်ဖွင့်</span>
          </button>
          <button
            type="button"
            onClick={() => handleTabChange('admin')}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
              tab === 'admin'
                ? 'bg-red-600 text-white shadow-md shadow-red-600/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            <span>Admin</span>
          </button>
        </div>

        {error && (
          <div className="p-3.5 bg-red-500/15 border border-red-500/30 rounded-2xl flex items-start gap-2.5 text-xs text-red-300">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-400" />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-3.5 bg-emerald-500/15 border border-emerald-500/30 rounded-2xl flex items-start gap-2.5 text-xs text-emerald-300">
            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-400" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* 1. USER LOGIN FORM */}
        {tab === 'login' && (
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                ဖုန်းနံပါတ် သို့မဟုတ် User ID (ဥပမာ- SP-10001)
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="09... သို့မဟုတ် SP-XXXXX"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  disabled={loading}
                />
                <Phone className="absolute right-3.5 top-2.5 w-4 h-4 text-slate-500" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                စကားဝှက် (Password)
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-2.5 text-slate-400 hover:text-white"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white rounded-xl text-sm font-bold shadow-lg shadow-indigo-600/25 transition-all flex items-center justify-center gap-2"
            >
              <LogIn className="w-4 h-4" />
              {loading ? 'ဝင်ရောက်နေသည်...' : 'အကောင့်ဝင်မည်'}
            </button>
          </form>
        )}

        {/* 2. USER REGISTER FORM WITH DEVICE RESTRICTION (1 Account per phone) */}
        {tab === 'register' && (
          <form onSubmit={handleRegister} className="space-y-4">
            {/* Device Limitation Notice */}
            <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-start gap-2 text-xs text-amber-300">
              <Smartphone className="w-4 h-4 shrink-0 mt-0.5 text-amber-400" />
              <div>
                <span className="font-semibold">ဖုန်း ၁ လုံးလျှင် အကောင့် ၁ ခုသာ ဖွင့်ခွင့်ရှိပါသည်:</span>
                <p className="text-[11px] text-amber-200/80 mt-0.5">
                  ဤဖုန်း ({deviceInfo.deviceLabel}) အတွက် အကောင့်တစ်ခုတည်းသာ ခွင့်ပြုထားပါသည်။
                </p>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                အသုံးပြုသူ အမည် (Username)
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="ဥပမာ- Ko Min Min"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  disabled={loading}
                />
                <UserIcon className="absolute right-3.5 top-2.5 w-4 h-4 text-slate-500" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                ဖုန်းနံပါတ် (Phone Number)
              </label>
              <div className="relative">
                <input
                  type="tel"
                  placeholder="09..."
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  disabled={loading}
                />
                <Phone className="absolute right-3.5 top-2.5 w-4 h-4 text-slate-500" />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  စကားဝှက်
                </label>
                <input
                  type="password"
                  placeholder="အနည်းဆုံး ၄ လုံး"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  disabled={loading}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  အတည်ပြု စကားဝှက်
                </label>
                <input
                  type="password"
                  placeholder="ပြန်လည် ရိုက်ထည့်ပါ"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  disabled={loading}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 rounded-xl text-sm font-black shadow-lg shadow-amber-500/25 transition-all flex items-center justify-center gap-2"
            >
              <UserPlus className="w-4 h-4" />
              {loading ? 'အကောင့်ဖွင့်နေသည်...' : 'အကောင့်အသစ် ဖွင့်မည် (+50 Coins အခမဲ့)'}
            </button>
          </form>
        )}

        {/* 3. ADMIN LOGIN (Confidential password = iam0) */}
        {tab === 'admin' && (
          <form onSubmit={handleAdminLogin} className="space-y-4">
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-2.5 text-xs text-red-300">
              <Shield className="w-4 h-4 shrink-0 mt-0.5 text-red-400" />
              <div>
                <span className="font-bold">System Administrator Access</span>
                <p className="text-[11px] text-red-200/80 mt-0.5">
                  Admin panel စီမံခန့်ခွဲသူများသာ ဝင်ရောက်ခွင့်ရှိပါသည်။ စကားဝှက်ကို လျှို့ဝှက်ထိန်းသိမ်းထားပါသည်။
                </p>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Admin စကားဝှက် (Password)
              </label>
              <div className="relative">
                <input
                  type="password"
                  placeholder="••••••••"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-red-500"
                  disabled={loading}
                />
                <KeyRound className="absolute right-3.5 top-2.5 w-4 h-4 text-slate-500" />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white rounded-xl text-sm font-bold shadow-lg shadow-red-600/25 transition-all flex items-center justify-center gap-2"
            >
              <Shield className="w-4 h-4" />
              {loading ? 'စစ်ဆေးနေသည်...' : 'Admin Panel သို့ ဝင်မည်'}
            </button>
          </form>
        )}

        {/* Admin Login Switch Footer */}
        <div className="pt-3 border-t border-slate-800 text-center">
          {tab !== 'admin' ? (
            <button
              type="button"
              onClick={() => handleTabChange('admin')}
              className="text-xs text-slate-400 hover:text-amber-400 transition-colors font-medium flex items-center justify-center gap-1.5 mx-auto"
            >
              <Shield className="w-3.5 h-3.5 text-amber-500" />
              <span>Admin စီမံခန့်ခွဲသူ ဝင်ရောက်ရန် &rarr;</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => handleTabChange('login')}
              className="text-xs text-slate-400 hover:text-indigo-400 transition-colors font-medium flex items-center justify-center gap-1.5 mx-auto"
            >
              <LogIn className="w-3.5 h-3.5 text-indigo-400" />
              <span>အသုံးပြုသူ (User) ဝင်ရောက်ရန် ပြန်သွားမည် &rarr;</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
