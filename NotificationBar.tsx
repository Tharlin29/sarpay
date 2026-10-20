import React from 'react';
import {
  Coins,
  Clock,
  Send,
  LogOut,
  User as UserIcon,
  Plus,
  Sparkles,
  ShieldAlert,
  Flame,
} from 'lucide-react';
import { User } from '../types';

interface NotificationBarProps {
  currentUser: User;
  onOpenSideMenu: () => void;
  onOpenTransferModal: () => void;
  onOpenBuyTimeModal: () => void;
  onOpenTopupModal: () => void;
  onLogout: () => void;
  onOpenAdminPanel?: () => void;
}

export const NotificationBar: React.FC<NotificationBarProps> = ({
  currentUser,
  onOpenSideMenu,
  onOpenTransferModal,
  onOpenBuyTimeModal,
  onOpenTopupModal,
  onLogout,
  onOpenAdminPanel,
}) => {
  // Format seconds to HH:MM:SS
  const formatTime = (secs: number) => {
    if (secs <= 0) return '00:00:00';
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const isTimeLow = currentUser.remainingSeconds > 0 && currentUser.remainingSeconds < 300;
  const isTimeExpired = currentUser.remainingSeconds <= 0;

  return (
    <header className="sticky top-0 z-40 w-full bg-slate-900/95 backdrop-blur-md border-b border-slate-800 shadow-lg">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2.5 sm:py-3 flex flex-wrap items-center justify-between gap-3">
        {/* Left: Branding & Firebase indicator */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 via-indigo-600 to-violet-500 flex items-center justify-center text-white shadow-md shadow-indigo-500/20 font-black text-lg">
              စာ
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-white text-base tracking-tight">SarPay AI</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-semibold">
                  စာပေ
                </span>
              </div>
              <p className="text-[10px] text-slate-400 hidden sm:block">
                Firebase & AI File Translator (Myanmar)
              </p>
            </div>
          </div>

          {currentUser.role === 'admin' && onOpenAdminPanel && (
            <button
              onClick={onOpenAdminPanel}
              className="hidden md:flex items-center gap-1.5 px-2.5 py-1 bg-amber-500/15 border border-amber-500/30 text-amber-300 rounded-lg text-xs font-bold hover:bg-amber-500/25 transition-colors"
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              Admin Panel
            </button>
          )}
        </div>

        {/* Center / Right: Noti Bar items (Coin Balance, Coin Transfer, Timer, Profile Logo, Logout) */}
        <div className="flex items-center flex-wrap gap-2 sm:gap-3">
          {/* 1. Timer Countdown Display & Buy Time */}
          <div
            className={`flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 rounded-xl border transition-all ${
              isTimeExpired
                ? 'bg-red-500/15 border-red-500/40 text-red-300 animate-pulse'
                : isTimeLow
                ? 'bg-amber-500/15 border-amber-500/40 text-amber-300'
                : 'bg-slate-800/80 border-slate-700 text-slate-200'
            }`}
          >
            <Clock
              className={`w-4 h-4 shrink-0 ${
                isTimeExpired ? 'text-red-400' : isTimeLow ? 'text-amber-400' : 'text-blue-400'
              }`}
            />
            <div className="flex flex-col">
              <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">
                {isTimeExpired ? 'အချိန်ကုန်' : 'အသုံးပြုချိန်'}
              </span>
              <span className="font-mono text-xs sm:text-sm font-bold text-white tracking-wide">
                {formatTime(currentUser.remainingSeconds)}
              </span>
            </div>
            <button
              onClick={onOpenBuyTimeModal}
              title="အချိန် ထပ်ဝယ်မည်"
              className="ml-1 p-1 rounded-lg bg-blue-600/30 hover:bg-blue-600/50 text-blue-300 hover:text-white transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* 2. User Coin Balance */}
          <div className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500/15 to-yellow-500/10 border border-amber-500/30 text-amber-300">
            <Coins className="w-4 h-4 text-amber-400 shrink-0" />
            <div className="flex flex-col">
              <span className="text-[9px] uppercase font-bold text-amber-300/80 tracking-wider">
                Coins
              </span>
              <span className="font-bold text-xs sm:text-sm text-amber-400">
                {currentUser.coins.toLocaleString()}
              </span>
            </div>
            <button
              onClick={onOpenTopupModal}
              title="Admin ထံမှ Coin ဝယ်မည်"
              className="ml-0.5 p-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/40 text-amber-300 hover:text-white transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* 3. Coin Transfer System Button */}
          <button
            onClick={onOpenTransferModal}
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 hover:text-white rounded-xl text-xs font-semibold transition-all shadow-sm"
          >
            <Send className="w-3.5 h-3.5 text-indigo-400" />
            <span className="hidden sm:inline">Coin လွှဲမည်</span>
            <span className="sm:hidden">လွှဲမည်</span>
          </button>

          {/* 4. User Profile Logo Button (Clicking opens Side Menu) */}
          <button
            onClick={onOpenSideMenu}
            title="Profile Side Menu ဖွင့်ရန် နှိပ်ပါ"
            className="group flex items-center gap-2 p-1 pl-1.5 pr-2.5 rounded-xl bg-gradient-to-r from-indigo-600/30 to-violet-600/30 hover:from-indigo-600/50 hover:to-violet-600/50 border border-indigo-500/40 text-white transition-all shadow-md shadow-indigo-600/10"
          >
            <div className="w-7 h-7 rounded-lg bg-indigo-600 group-hover:scale-105 transition-transform flex items-center justify-center font-bold text-xs text-white shadow">
              {currentUser.username.charAt(0).toUpperCase()}
            </div>
            <div className="text-left hidden md:block">
              <div className="text-xs font-bold text-white leading-tight">
                {currentUser.username}
              </div>
              <div className="text-[10px] text-amber-300 font-mono">{currentUser.id}</div>
            </div>
          </button>

          {/* 5. User Logout Button */}
          <button
            onClick={onLogout}
            title="အကောင့်ထွက်ရန် (Log out)"
            className="p-2 rounded-xl bg-slate-800/80 hover:bg-red-500/20 border border-slate-700 hover:border-red-500/40 text-slate-300 hover:text-red-400 transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
